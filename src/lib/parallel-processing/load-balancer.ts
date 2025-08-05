import { EventEmitter } from 'events'

interface WorkerNode {
  id: string
  address: string
  port: number
  status: 'active' | 'inactive' | 'overloaded'
  currentLoad: number
  maxCapacity: number
  responseTime: number
  lastHealthCheck: number
  region: string
  quantumReady: boolean
}

interface LoadBalancingConfig {
  healthCheckInterval: number
  maxResponseTime: number
  loadThreshold: number
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'region-aware'
  enableQuantumAwareness: boolean
}

interface LoadBalancingStats {
  totalRequests: number
  distributedRequests: number
  failedRequests: number
  averageResponseTime: number
  activeNodes: number
  totalNodes: number
  quantumNodes: number
}

export class LoadBalancer extends EventEmitter {
  private nodes: Map<string, WorkerNode>
  private config: LoadBalancingConfig
  private stats: LoadBalancingStats
  private currentIndex: number
  private healthCheckTimer: NodeJS.Timeout
  private isShuttingDown: boolean

  constructor(config: Partial<LoadBalancingConfig> = {}) {
    super()
    
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      maxResponseTime: config.maxResponseTime || 5000, // 5 seconds
      loadThreshold: config.loadThreshold || 0.8, // 80% capacity
      strategy: config.strategy || 'least-connections',
      enableQuantumAwareness: config.enableQuantumAwareness || true
    }

    this.nodes = new Map()
    this.currentIndex = 0
    this.isShuttingDown = false

    this.stats = {
      totalRequests: 0,
      distributedRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeNodes: 0,
      totalNodes: 0,
      quantumNodes: 0
    }

    this.startHealthChecks()
  }

  public addNode(node: Omit<WorkerNode, 'lastHealthCheck'>): void {
    const fullNode: WorkerNode = {
      ...node,
      lastHealthCheck: Date.now()
    }

    this.nodes.set(node.id, fullNode)
    this.updateStats()
    
    this.emit('node_added', fullNode)
    console.log(`Node ${node.id} added to load balancer`)
  }

  public removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      this.nodes.delete(nodeId)
      this.updateStats()
      this.emit('node_removed', node)
      console.log(`Node ${nodeId} removed from load balancer`)
    }
  }

  public async distributeRequest(request: any, options: {
    requiresQuantum?: boolean
    preferredRegion?: string
    priority?: number
  } = {}): Promise<{ nodeId: string; result: any }> {
    this.stats.totalRequests++

    try {
      const selectedNode = this.selectNode(options)
      
      if (!selectedNode) {
        throw new Error('No available nodes')
      }

      const startTime = Date.now()
      
      // Update node load
      selectedNode.currentLoad += 1

      try {
        // Simulate request processing
        const result = await this.processRequest(selectedNode, request)
        
        const responseTime = Date.now() - startTime
        selectedNode.responseTime = responseTime
        selectedNode.currentLoad -= 1

        // Update stats
        this.stats.distributedRequests++
        this.stats.averageResponseTime = 
          (this.stats.averageResponseTime * (this.stats.distributedRequests - 1) + responseTime) / 
          this.stats.distributedRequests

        this.emit('request_completed', selectedNode.id, request, result, responseTime)
        
        return { nodeId: selectedNode.id, result }

      } catch (error) {
        selectedNode.currentLoad -= 1
        selectedNode.status = 'inactive'
        
        this.stats.failedRequests++
        this.emit('request_failed', selectedNode.id, request, error)
        
        throw error
      }

    } catch (error) {
      this.stats.failedRequests++
      throw error
    }
  }

  private selectNode(options: {
    requiresQuantum?: boolean
    preferredRegion?: string
    priority?: number
  } = {}): WorkerNode | null {
    const availableNodes = Array.from(this.nodes.values()).filter(node => 
      node.status === 'active' && 
      node.currentLoad < node.maxCapacity * this.config.loadThreshold
    )

    // Filter by quantum requirements if needed
    let quantumFilteredNodes = availableNodes
    if (options.requiresQuantum && this.config.enableQuantumAwareness) {
      quantumFilteredNodes = availableNodes.filter(node => node.quantumReady)
    }

    // Filter by region preference if specified
    let regionFilteredNodes = quantumFilteredNodes
    if (options.preferredRegion) {
      regionFilteredNodes = quantumFilteredNodes.filter(node => 
        node.region === options.preferredRegion
      )
      
      // If no nodes in preferred region, fall back to any available
      if (regionFilteredNodes.length === 0) {
        regionFilteredNodes = quantumFilteredNodes
      }
    }

    if (regionFilteredNodes.length === 0) {
      return null
    }

    // Apply load balancing strategy
    switch (this.config.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(regionFilteredNodes)
      
      case 'least-connections':
        return this.selectLeastConnections(regionFilteredNodes)
      
      case 'weighted':
        return this.selectWeighted(regionFilteredNodes)
      
      case 'region-aware':
        return this.selectRegionAware(regionFilteredNodes, options.preferredRegion)
      
      default:
        return this.selectLeastConnections(regionFilteredNodes)
    }
  }

  private selectRoundRobin(nodes: WorkerNode[]): WorkerNode {
    const node = nodes[this.currentIndex % nodes.length]
    this.currentIndex++
    return node
  }

  private selectLeastConnections(nodes: WorkerNode[]): WorkerNode {
    return nodes.reduce((least, current) => 
      current.currentLoad < least.currentLoad ? current : least
    )
  }

  private selectWeighted(nodes: WorkerNode[]): WorkerNode {
    // Calculate weights based on capacity and current load
    const weightedNodes = nodes.map(node => ({
      node,
      weight: (node.maxCapacity - node.currentLoad) / node.maxCapacity
    }))

    // Select node with highest weight
    return weightedNodes.reduce((highest, current) => 
      current.weight > highest.weight ? current : highest
    ).node
  }

  private selectRegionAware(nodes: WorkerNode[], preferredRegion?: string): WorkerNode {
    if (preferredRegion) {
      const preferredNodes = nodes.filter(node => node.region === preferredRegion)
      if (preferredNodes.length > 0) {
        return this.selectLeastConnections(preferredNodes)
      }
    }
    
    return this.selectLeastConnections(nodes)
  }

  private async processRequest(node: WorkerNode, request: any): Promise<any> {
    // Simulate network latency
    const baseLatency = 10 + Math.random() * 20
    await new Promise(resolve => setTimeout(resolve, baseLatency))

    // Simulate processing time based on node load
    const loadFactor = node.currentLoad / node.maxCapacity
    const processingTime = (20 + Math.random() * 30) * (1 + loadFactor)
    await new Promise(resolve => setTimeout(resolve, processingTime))

    // Simulate quantum processing if required
    if (request.requiresQuantum && node.quantumReady) {
      await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10))
    }

    // Return simulated result
    return {
      success: true,
      nodeId: node.id,
      processedAt: Date.now(),
      processingTime: baseLatency + processingTime,
      quantumProcessed: request.requiresQuantum && node.quantumReady
    }
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks()
    }, this.config.healthCheckInterval)
  }

  private async performHealthChecks(): Promise<void> {
    if (this.isShuttingDown) return

    const healthCheckPromises = Array.from(this.nodes.values()).map(async (node) => {
      try {
        const isHealthy = await this.checkNodeHealth(node)
        
        if (isHealthy) {
          if (node.status === 'inactive') {
            node.status = 'active'
            this.emit('node_recovered', node)
          }
        } else {
          node.status = 'inactive'
          this.emit('node_unhealthy', node)
        }

        node.lastHealthCheck = Date.now()
      } catch (error) {
        node.status = 'inactive'
        this.emit('node_health_check_failed', node, error)
      }
    })

    await Promise.all(healthCheckPromises)
    this.updateStats()
  }

  private async checkNodeHealth(node: WorkerNode): Promise<boolean> {
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15))
    
    // Simulate health check failure based on response time
    if (node.responseTime > this.config.maxResponseTime) {
      return false
    }

    // Simulate occasional random failures
    if (Math.random() < 0.05) { // 5% chance of failure
      return false
    }

    return true
  }

  private updateStats(): void {
    const nodes = Array.from(this.nodes.values())
    
    this.stats.totalNodes = nodes.length
    this.stats.activeNodes = nodes.filter(n => n.status === 'active').length
    this.stats.quantumNodes = nodes.filter(n => n.quantumReady).length
  }

  public getStats(): LoadBalancingStats {
    return { ...this.stats }
  }

  public getNodeStatus(nodeId: string): WorkerNode | undefined {
    return this.nodes.get(nodeId)
  }

  public getAllNodes(): WorkerNode[] {
    return Array.from(this.nodes.values())
  }

  public async shutdown(): Promise<void> {
    this.isShuttingDown = true
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // Wait for health checks to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    this.removeAllListeners()
  }
}

export default LoadBalancer