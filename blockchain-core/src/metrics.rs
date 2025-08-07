//! Metrics collection for the KALDRIX blockchain core

use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use parking_lot::Mutex;

/// Core metrics for the blockchain
#[derive(Clone)]
pub struct CoreMetrics {
    /// Transaction metrics
    transactions: Arc<TransactionMetrics>,
    /// Block metrics
    blocks: Arc<BlockMetrics>,
    /// DAG metrics
    dag: Arc<DAGMetrics>,
    /// Consensus metrics
    consensus: Arc<ConsensusMetrics>,
    /// Network metrics
    network: Arc<NetworkMetrics>,
    /// Crypto metrics
    crypto: Arc<CryptoMetrics>,
    /// Performance metrics
    performance: Arc<PerformanceMetrics>,
}

/// Transaction-related metrics
#[derive(Default)]
struct TransactionMetrics {
    /// Total transactions submitted
    submitted: AtomicU64,
    /// Total transactions confirmed
    confirmed: AtomicU64,
    /// Total transactions failed
    failed: AtomicU64,
    /// Current transaction pool size
    pool_size: AtomicUsize,
    /// Average transaction fee
    avg_fee: Mutex<f64>,
    /// Average transaction size
    avg_size: Mutex<f64>,
    /// Transactions per second
    tps: Mutex<f64>,
    /// TPS calculation start time
    tps_start: Mutex<Instant>,
    /// TPS transaction count
    tps_count: AtomicU64,
}

/// Block-related metrics
#[derive(Default)]
struct BlockMetrics {
    /// Total blocks created
    created: AtomicU64,
    /// Total blocks confirmed
    confirmed: AtomicU64,
    /// Total blocks orphaned
    orphaned: AtomicU64,
    /// Average block size
    avg_size: Mutex<f64>,
    /// Average block time
    avg_time: Mutex<Duration>,
    /// Average transactions per block
    avg_transactions: Mutex<f64>,
    /// Current block height
    current_height: AtomicU64,
}

/// DAG-related metrics
#[derive(Default)]
struct DAGMetrics {
    /// Total nodes in DAG
    total_nodes: AtomicU64,
    /// Total edges in DAG
    total_edges: AtomicU64,
    /// Average DAG depth
    avg_depth: Mutex<f64>,
    /// Average DAG width
    avg_width: Mutex<f64>,
    /// DAG validation time
    validation_time: Mutex<Duration>,
    /// DAG traversal time
    traversal_time: Mutex<Duration>,
    /// Cache hit rate
    cache_hit_rate: Mutex<f64>,
    /// DAG growth rate (nodes per second)
    growth_rate: Mutex<f64>,
    /// Tip divergence measure
    tip_divergence: Mutex<f64>,
    /// Total checkpoints marked
    checkpoint_count: AtomicU64,
    /// Last growth rate calculation
    last_growth_calc: Mutex<Instant>,
    /// Last node count for growth calculation
    last_node_count: AtomicU64,
}

/// Consensus-related metrics
#[derive(Default)]
struct ConsensusMetrics {
    /// Total consensus rounds
    total_rounds: AtomicU64,
    /// Successful consensus rounds
    successful_rounds: AtomicU64,
    /// Failed consensus rounds
    failed_rounds: AtomicU64,
    /// Average consensus time
    avg_time: Mutex<Duration>,
    /// View changes
    view_changes: AtomicU64,
    /// Validator participation rate
    participation_rate: Mutex<f64>,
    /// Average proposal time
    avg_proposal_time: Mutex<Duration>,
    /// Average voting time
    avg_voting_time: Mutex<Duration>,
}

/// Network-related metrics
#[derive(Default)]
struct NetworkMetrics {
    /// Connected peers
    connected_peers: AtomicUsize,
    /// Total peers discovered
    total_peers: AtomicU64,
    /// Messages sent
    messages_sent: AtomicU64,
    /// Messages received
    messages_received: AtomicU64,
    /// Bytes sent
    bytes_sent: AtomicU64,
    /// Bytes received
    bytes_received: AtomicU64,
    /// Average latency
    avg_latency: Mutex<Duration>,
    /// Connection failures
    connection_failures: AtomicU64,
    /// Message failures
    message_failures: AtomicU64,
}

/// Crypto-related metrics
#[derive(Default)]
struct CryptoMetrics {
    /// Total signatures created
    signatures_created: AtomicU64,
    /// Total signatures verified
    signatures_verified: AtomicU64,
    /// Failed signatures
    failed_signatures: AtomicU64,
    /// Failed verifications
    failed_verifications: AtomicU64,
    /// Average signing time
    avg_signing_time: Mutex<Duration>,
    /// Average verification time
    avg_verification_time: Mutex<Duration>,
    /// Hash operations
    hash_operations: AtomicU64,
    /// Key generation operations
    key_gen_operations: AtomicU64,
}

/// Performance-related metrics
#[derive(Default)]
struct PerformanceMetrics {
    /// Memory usage in bytes
    memory_usage: AtomicUsize,
    /// CPU usage percentage
    cpu_usage: Mutex<f64>,
    /// Disk usage in bytes
    disk_usage: AtomicUsize,
    /// Disk I/O operations
    disk_io: AtomicU64,
    /// Network I/O operations
    network_io: AtomicU64,
    /// Uptime in seconds
    uptime: Mutex<Duration>,
    /// GC pauses
    gc_pauses: AtomicU64,
    /// Average GC pause time
    avg_gc_pause: Mutex<Duration>,
}

impl CoreMetrics {
    /// Create a new metrics instance
    pub fn new() -> Self {
        Self {
            transactions: Arc::new(TransactionMetrics::default()),
            blocks: Arc::new(BlockMetrics::default()),
            dag: Arc::new(DAGMetrics::default()),
            consensus: Arc::new(ConsensusMetrics::default()),
            network: Arc::new(NetworkMetrics::default()),
            crypto: Arc::new(CryptoMetrics::default()),
            performance: Arc::new(PerformanceMetrics::default()),
        }
    }

    // Transaction metrics
    pub fn inc_transactions_submitted(&self) {
        self.transactions.submitted.fetch_add(1, Ordering::Relaxed);
        self.update_tps();
    }

    pub fn inc_transactions_confirmed(&self) {
        self.transactions.confirmed.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_transactions_failed(&self) {
        self.transactions.failed.fetch_add(1, Ordering::Relaxed);
    }

    pub fn set_transaction_pool_size(&self, size: usize) {
        self.transactions.pool_size.store(size, Ordering::Relaxed);
    }

    pub fn update_avg_transaction_fee(&self, fee: f64) {
        let mut avg_fee = self.transactions.avg_fee.lock();
        *avg_fee = (*avg_fee * 0.9) + (fee * 0.1); // Exponential moving average
    }

    pub fn update_avg_transaction_size(&self, size: f64) {
        let mut avg_size = self.transactions.avg_size.lock();
        *avg_size = (*avg_size * 0.9) + (size * 0.1);
    }

    pub fn get_tps(&self) -> f64 {
        let tps = self.transactions.tps.lock();
        *tps
    }

    fn update_tps(&self) {
        let mut tps_start = self.transactions.tps_start.lock();
        let count = self.transactions.tps_count.fetch_add(1, Ordering::Relaxed);
        
        if count == 0 {
            *tps_start = Instant::now();
        } else {
            let elapsed = tps_start.elapsed();
            if elapsed >= Duration::from_secs(1) {
                let mut tps = self.transactions.tps.lock();
                *tps = count as f64 / elapsed.as_secs_f64();
                self.transactions.tps_count.store(0, Ordering::Relaxed);
                *tps_start = Instant::now();
            }
        }
    }

    // Block metrics
    pub fn inc_blocks_created(&self) {
        self.blocks.created.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_blocks_confirmed(&self) {
        self.blocks.confirmed.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_blocks_orphaned(&self) {
        self.blocks.orphaned.fetch_add(1, Ordering::Relaxed);
    }

    pub fn set_current_block_height(&self, height: u64) {
        self.blocks.current_height.store(height, Ordering::Relaxed);
    }

    pub fn update_avg_block_size(&self, size: f64) {
        let mut avg_size = self.blocks.avg_size.lock();
        *avg_size = (*avg_size * 0.9) + (size * 0.1);
    }

    pub fn update_avg_block_time(&self, time: Duration) {
        let mut avg_time = self.blocks.avg_time.lock();
        *avg_time = Duration::from_millis(
            (avg_time.as_millis() as f64 * 0.9 + time.as_millis() as f64 * 0.1) as u64
        );
    }

    pub fn update_avg_transactions_per_block(&self, count: f64) {
        let mut avg_tx = self.blocks.avg_transactions.lock();
        *avg_tx = (*avg_tx * 0.9) + (count * 0.1);
    }

    // DAG metrics
    pub fn inc_dag_nodes(&self) {
        self.dag.total_nodes.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_dag_edges(&self) {
        self.dag.total_edges.fetch_add(1, Ordering::Relaxed);
    }

    pub fn update_avg_dag_depth(&self, depth: f64) {
        let mut avg_depth = self.dag.avg_depth.lock();
        *avg_depth = (*avg_depth * 0.9) + (depth * 0.1);
    }

    pub fn update_avg_dag_width(&self, width: f64) {
        let mut avg_width = self.dag.avg_width.lock();
        *avg_width = (*avg_width * 0.9) + (width * 0.1);
    }

    pub fn update_dag_validation_time(&self, time: Duration) {
        let mut val_time = self.dag.validation_time.lock();
        *val_time = Duration::from_millis(
            (val_time.as_millis() as f64 * 0.9 + time.as_millis() as f64 * 0.1) as u64
        );
    }

    pub fn update_dag_traversal_time(&self, time: Duration) {
        let mut trav_time = self.dag.traversal_time.lock();
        *trav_time = Duration::from_millis(
            (trav_time.as_millis() as f64 * 0.9 + time.as_millis() as f64 * 0.1) as u64
        );
    }

    pub fn update_cache_hit_rate(&self, hit_rate: f64) {
        let mut cache_rate = self.dag.cache_hit_rate.lock();
        *cache_rate = (*cache_rate * 0.9) + (hit_rate * 0.1);
    }

    pub fn inc_dag_checkpoints(&self) {
        self.dag.checkpoint_count.fetch_add(1, Ordering::Relaxed);
    }

    pub fn update_dag_growth_rate(&self) {
        let current_nodes = self.dag.total_nodes.load(Ordering::Relaxed);
        let mut last_calc = self.dag.last_growth_calc.lock();
        let mut last_count = self.dag.last_node_count.load(Ordering::Relaxed);
        let mut growth_rate = self.dag.growth_rate.lock();

        let elapsed = last_calc.elapsed();
        if elapsed >= Duration::from_secs(1) {
            let node_diff = current_nodes.saturating_sub(last_count);
            let rate = node_diff as f64 / elapsed.as_secs_f64();
            *growth_rate = (*growth_rate * 0.9) + (rate * 0.1); // Exponential moving average
            *last_calc = Instant::now();
            self.dag.last_node_count.store(current_nodes, Ordering::Relaxed);
        }
    }

    pub fn update_tip_divergence(&self, divergence: f64) {
        let mut tip_div = self.dag.tip_divergence.lock();
        *tip_div = (*tip_div * 0.9) + (divergence * 0.1);
    }

    pub fn get_dag_growth_rate(&self) -> f64 {
        *self.dag.growth_rate.lock()
    }

    pub fn get_tip_divergence(&self) -> f64 {
        *self.dag.tip_divergence.lock()
    }

    pub fn get_checkpoint_count(&self) -> u64 {
        self.dag.checkpoint_count.load(Ordering::Relaxed)
    }

    // Consensus metrics
    pub fn inc_consensus_rounds(&self) {
        self.consensus.total_rounds.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_successful_consensus_rounds(&self) {
        self.consensus.successful_rounds.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_failed_consensus_rounds(&self) {
        self.consensus.failed_rounds.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_view_changes(&self) {
        self.consensus.view_changes.fetch_add(1, Ordering::Relaxed);
    }

    pub fn update_avg_consensus_time(&self, time: Duration) {
        let mut avg_time = self.consensus.avg_time.lock();
        *avg_time = Duration::from_millis(
            (avg_time.as_millis() as f64 * 0.9 + time.as_millis() as f64 * 0.1) as u64
        );
    }

    pub fn update_participation_rate(&self, rate: f64) {
        let mut participation = self.consensus.participation_rate.lock();
        *participation = (*participation * 0.9) + (rate * 0.1);
    }

    pub fn update_avg_proposal_time(&self, time: Duration) {
        let mut avg_time = self.consensus.avg_proposal_time.lock();
        *avg_time = Duration::from_millis(
            (avg_time.as_millis() as f64 * 0.9 + time.as_millis() as f64 * 0.1) as u64
        );
    }

    pub fn update_avg_voting_time(&self, time: Duration) {
        let mut avg_time = self.consensus.avg_voting_time.lock();
        *avg_time = Duration::from_millis(
            (avg_time.as_millis() as f64 * 0.9 + time.as_millis() as f64 * 0.1) as u64
        );
    }

    // Network metrics
    pub fn set_connected_peers(&self, count: usize) {
        self.network.connected_peers.store(count, Ordering::Relaxed);
    }

    pub fn inc_total_peers(&self) {
        self.network.total_peers.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_messages_sent(&self) {
        self.network.messages_sent.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_messages_received(&self) {
        self.network.messages_received.fetch_add(1, Ordering::Relaxed);
    }

    pub fn add_bytes_sent(&self, bytes: u64) {
        self.network.bytes_sent.fetch_add(bytes, Ordering::Relaxed);
    }

    pub fn add_bytes_received(&self, bytes: u64) {
        self.network.bytes_received.fetch_add(bytes, Ordering::Relaxed);
    }

    pub fn update_avg_latency(&self, latency: Duration) {
        let mut avg_latency = self.network.avg_latency.lock();
        *avg_latency = Duration::from_millis(
            (avg_latency.as_millis() as f64 * 0.9 + latency.as_millis() as f64 * 0.1) as u64
        );
    }

    pub fn inc_connection_failures(&self) {
        self.network.connection_failures.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_message_failures(&self) {
        self.network.message_failures.fetch_add(1, Ordering::Relaxed);
    }

    // Crypto metrics
    pub fn inc_signatures_created(&self) {
        self.crypto.signatures_created.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_signatures_verified(&self) {
        self.crypto.signatures_verified.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_failed_signatures(&self) {
        self.crypto.failed_signatures.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_failed_verifications(&self) {
        self.crypto.failed_verifications.fetch_add(1, Ordering::Relaxed);
    }

    pub fn update_avg_signing_time(&self, time: Duration) {
        let mut avg_time = self.crypto.avg_signing_time.lock();
        *avg_time = Duration::from_micros(
            (avg_time.as_micros() as f64 * 0.9 + time.as_micros() as f64 * 0.1) as u64
        );
    }

    pub fn update_avg_verification_time(&self, time: Duration) {
        let mut avg_time = self.crypto.avg_verification_time.lock();
        *avg_time = Duration::from_micros(
            (avg_time.as_micros() as f64 * 0.9 + time.as_micros() as f64 * 0.1) as u64
        );
    }

    pub fn inc_hash_operations(&self) {
        self.crypto.hash_operations.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_key_gen_operations(&self) {
        self.crypto.key_gen_operations.fetch_add(1, Ordering::Relaxed);
    }

    // Performance metrics
    pub fn set_memory_usage(&self, bytes: usize) {
        self.performance.memory_usage.store(bytes, Ordering::Relaxed);
    }

    pub fn update_cpu_usage(&self, usage: f64) {
        let mut cpu_usage = self.performance.cpu_usage.lock();
        *cpu_usage = (*cpu_usage * 0.9) + (usage * 0.1);
    }

    pub fn set_disk_usage(&self, bytes: usize) {
        self.performance.disk_usage.store(bytes, Ordering::Relaxed);
    }

    pub fn inc_disk_io(&self) {
        self.performance.disk_io.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_network_io(&self) {
        self.performance.network_io.fetch_add(1, Ordering::Relaxed);
    }

    pub fn update_uptime(&self, start_time: Instant) {
        let mut uptime = self.performance.uptime.lock();
        *uptime = start_time.elapsed();
    }

    pub fn inc_gc_pauses(&self) {
        self.performance.gc_pauses.fetch_add(1, Ordering::Relaxed);
    }

    pub fn update_avg_gc_pause(&self, pause_time: Duration) {
        let mut avg_pause = self.performance.avg_gc_pause.lock();
        *avg_pause = Duration::from_micros(
            (avg_pause.as_micros() as f64 * 0.9 + pause_time.as_micros() as f64 * 0.1) as u64
        );
    }

    /// Get all metrics as a structured object
    pub fn get_all_metrics(&self) -> MetricsSnapshot {
        MetricsSnapshot {
            transactions: TransactionMetricsSnapshot {
                submitted: self.transactions.submitted.load(Ordering::Relaxed),
                confirmed: self.transactions.confirmed.load(Ordering::Relaxed),
                failed: self.transactions.failed.load(Ordering::Relaxed),
                pool_size: self.transactions.pool_size.load(Ordering::Relaxed),
                avg_fee: *self.transactions.avg_fee.lock(),
                avg_size: *self.transactions.avg_size.lock(),
                tps: *self.transactions.tps.lock(),
            },
            blocks: BlockMetricsSnapshot {
                created: self.blocks.created.load(Ordering::Relaxed),
                confirmed: self.blocks.confirmed.load(Ordering::Relaxed),
                orphaned: self.blocks.orphaned.load(Ordering::Relaxed),
                avg_size: *self.blocks.avg_size.lock(),
                avg_time_ms: self.blocks.avg_time.lock().as_millis() as u64,
                avg_transactions: *self.blocks.avg_transactions.lock(),
                current_height: self.blocks.current_height.load(Ordering::Relaxed),
            },
            dag: DAGMetricsSnapshot {
                total_nodes: self.dag.total_nodes.load(Ordering::Relaxed),
                total_edges: self.dag.total_edges.load(Ordering::Relaxed),
                avg_depth: *self.dag.avg_depth.lock(),
                avg_width: *self.dag.avg_width.lock(),
                validation_time_ms: self.dag.validation_time.lock().as_millis() as u64,
                traversal_time_ms: self.dag.traversal_time.lock().as_millis() as u64,
                cache_hit_rate: *self.dag.cache_hit_rate.lock(),
                growth_rate: *self.dag.growth_rate.lock(),
                tip_divergence: *self.dag.tip_divergence.lock(),
                checkpoint_count: self.dag.checkpoint_count.load(Ordering::Relaxed),
            },
            consensus: ConsensusMetricsSnapshot {
                total_rounds: self.consensus.total_rounds.load(Ordering::Relaxed),
                successful_rounds: self.consensus.successful_rounds.load(Ordering::Relaxed),
                failed_rounds: self.consensus.failed_rounds.load(Ordering::Relaxed),
                avg_time_ms: self.consensus.avg_time.lock().as_millis() as u64,
                view_changes: self.consensus.view_changes.load(Ordering::Relaxed),
                participation_rate: *self.consensus.participation_rate.lock(),
                avg_proposal_time_ms: self.consensus.avg_proposal_time.lock().as_millis() as u64,
                avg_voting_time_ms: self.consensus.avg_voting_time.lock().as_millis() as u64,
            },
            network: NetworkMetricsSnapshot {
                connected_peers: self.network.connected_peers.load(Ordering::Relaxed),
                total_peers: self.network.total_peers.load(Ordering::Relaxed),
                messages_sent: self.network.messages_sent.load(Ordering::Relaxed),
                messages_received: self.network.messages_received.load(Ordering::Relaxed),
                bytes_sent: self.network.bytes_sent.load(Ordering::Relaxed),
                bytes_received: self.network.bytes_received.load(Ordering::Relaxed),
                avg_latency_ms: self.network.avg_latency.lock().as_millis() as u64,
                connection_failures: self.network.connection_failures.load(Ordering::Relaxed),
                message_failures: self.network.message_failures.load(Ordering::Relaxed),
            },
            crypto: CryptoMetricsSnapshot {
                signatures_created: self.crypto.signatures_created.load(Ordering::Relaxed),
                signatures_verified: self.crypto.signatures_verified.load(Ordering::Relaxed),
                failed_signatures: self.crypto.failed_signatures.load(Ordering::Relaxed),
                failed_verifications: self.crypto.failed_verifications.load(Ordering::Relaxed),
                avg_signing_time_us: self.crypto.avg_signing_time.lock().as_micros() as u64,
                avg_verification_time_us: self.crypto.avg_verification_time.lock().as_micros() as u64,
                hash_operations: self.crypto.hash_operations.load(Ordering::Relaxed),
                key_gen_operations: self.crypto.key_gen_operations.load(Ordering::Relaxed),
            },
            performance: PerformanceMetricsSnapshot {
                memory_usage_bytes: self.performance.memory_usage.load(Ordering::Relaxed),
                cpu_usage_percent: *self.performance.cpu_usage.lock(),
                disk_usage_bytes: self.performance.disk_usage.load(Ordering::Relaxed),
                disk_io: self.performance.disk_io.load(Ordering::Relaxed),
                network_io: self.performance.network_io.load(Ordering::Relaxed),
                uptime_secs: self.performance.uptime.lock().as_secs(),
                gc_pauses: self.performance.gc_pauses.load(Ordering::Relaxed),
                avg_gc_pause_us: self.performance.avg_gc_pause.lock().as_micros() as u64,
            },
        }
    }
}

/// Snapshot of all metrics
#[derive(Debug, Clone, Serialize)]
pub struct MetricsSnapshot {
    pub transactions: TransactionMetricsSnapshot,
    pub blocks: BlockMetricsSnapshot,
    pub dag: DAGMetricsSnapshot,
    pub consensus: ConsensusMetricsSnapshot,
    pub network: NetworkMetricsSnapshot,
    pub crypto: CryptoMetricsSnapshot,
    pub performance: PerformanceMetricsSnapshot,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransactionMetricsSnapshot {
    pub submitted: u64,
    pub confirmed: u64,
    pub failed: u64,
    pub pool_size: usize,
    pub avg_fee: f64,
    pub avg_size: f64,
    pub tps: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct BlockMetricsSnapshot {
    pub created: u64,
    pub confirmed: u64,
    pub orphaned: u64,
    pub avg_size: f64,
    pub avg_time_ms: u64,
    pub avg_transactions: f64,
    pub current_height: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DAGMetricsSnapshot {
    pub total_nodes: u64,
    pub total_edges: u64,
    pub avg_depth: f64,
    pub avg_width: f64,
    pub validation_time_ms: u64,
    pub traversal_time_ms: u64,
    pub cache_hit_rate: f64,
    pub growth_rate: f64,
    pub tip_divergence: f64,
    pub checkpoint_count: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConsensusMetricsSnapshot {
    pub total_rounds: u64,
    pub successful_rounds: u64,
    pub failed_rounds: u64,
    pub avg_time_ms: u64,
    pub view_changes: u64,
    pub participation_rate: f64,
    pub avg_proposal_time_ms: u64,
    pub avg_voting_time_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct NetworkMetricsSnapshot {
    pub connected_peers: usize,
    pub total_peers: u64,
    pub messages_sent: u64,
    pub messages_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub avg_latency_ms: u64,
    pub connection_failures: u64,
    pub message_failures: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CryptoMetricsSnapshot {
    pub signatures_created: u64,
    pub signatures_verified: u64,
    pub failed_signatures: u64,
    pub failed_verifications: u64,
    pub avg_signing_time_us: u64,
    pub avg_verification_time_us: u64,
    pub hash_operations: u64,
    pub key_gen_operations: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PerformanceMetricsSnapshot {
    pub memory_usage_bytes: usize,
    pub cpu_usage_percent: f64,
    pub disk_usage_bytes: usize,
    pub disk_io: u64,
    pub network_io: u64,
    pub uptime_secs: u64,
    pub gc_pauses: u64,
    pub avg_gc_pause_us: u64,
}