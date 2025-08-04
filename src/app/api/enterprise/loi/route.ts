import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface LOI {
  id: string
  pilot_id: string
  company_name: string
  status: 'draft' | 'sent_to_company' | 'under_review' | 'negotiation' | 'approved_legal' | 'awaiting_signature' | 'signed' | 'active' | 'completed' | 'terminated'
  created_at: string
  updated_at: string
  template_type: 'standard'
  content: {
    parties: {
      company: {
        name: string
        type: string
        jurisdiction: string
        address: string
      }
      kaldrix: {
        representative: {
          name: string
          title: string
          email: string
          phone: string
        }
      }
    }
    pilot_details: {
      duration: string
      use_cases: string[]
      success_criteria: string[]
      performance_targets: {
        tps: number
        latency: number
        uptime: number
        quantum_score: number
      }
    }
    commercial_terms: {
      pilot_fee: string
      implementation_costs: string[]
      post_pilot_licensing: string
    }
    representatives: {
      company: {
        name: string
        title: string
        email: string
        phone: string
      }
      kaldrix: {
        name: string
        title: string
        email: string
        phone: string
      }
    }
    signatures: {
      company: {
        signatory_name: string
        signatory_title: string
        signed_date?: string
      }
      kaldrix: {
        signatory_name: string
        signatory_title: string
        signed_date?: string
      }
    }
  }
  workflow: {
    current_status: string
    history: Array<{
      status: string
      timestamp: string
      notes?: string
      updated_by: string
    }>
  }
}

const PILOT_DATA_PATH = join(process.cwd(), 'enterprise', 'pilots', 'pilot-tracking.json')
const LOI_TEMPLATES_PATH = join(process.cwd(), 'enterprise', 'loi-management', 'loi-templates.json')
const LOI_DATA_PATH = join(process.cwd(), 'enterprise', 'loi-management', 'loi-data.json')

function loadPilotData() {
  try {
    const data = readFileSync(PILOT_DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading pilot data:', error)
    return { pilots: [] }
  }
}

function loadLOITemplates() {
  try {
    const data = readFileSync(LOI_TEMPLATES_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading LOI templates:', error)
    return { loi_templates: {} }
  }
}

function loadLOIData() {
  try {
    const data = readFileSync(LOI_DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading LOI data:', error)
    return { lois: [] }
  }
}

function saveLOIData(data: any) {
  try {
    writeFileSync(LOI_DATA_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving LOI data:', error)
  }
}

function generateLOIContent(pilot: any, template: any): any {
  return {
    parties: {
      company: {
        name: pilot.company,
        type: "corporation",
        jurisdiction: "United States",
        address: pilot.contact.email // Placeholder - should be company address
      },
      kaldrix: {
        representative: {
          name: "John Smith",
          title: "VP of Business Development",
          email: "john.smith@kaldrix.com",
          phone: "+1-555-0123"
        }
      }
    },
    pilot_details: {
      duration: "90 days",
      use_cases: pilot.use_cases,
      success_criteria: pilot.success_criteria,
      performance_targets: {
        tps: pilot.kpi_targets.transaction_volume || 10000,
        latency: pilot.kpi_targets.latency_ms || 100,
        uptime: 99.9,
        quantum_score: pilot.kpi_targets.security_score || 95
      }
    },
    commercial_terms: {
      pilot_fee: "No cost during pilot period",
      implementation_costs: [
        "Internal resource allocation",
        "Integration expenses",
        "Third-party services"
      ],
      post_pilot_licensing: "To be negotiated based on usage and requirements"
    },
    representatives: {
      company: {
        name: pilot.contact.name,
        title: pilot.contact.title,
        email: pilot.contact.email,
        phone: pilot.contact.phone
      },
      kaldrix: {
        name: "John Smith",
        title: "VP of Business Development",
        email: "john.smith@kaldrix.com",
        phone: "+1-555-0123"
      }
    },
    signatures: {
      company: {
        signatory_name: pilot.contact.name,
        signatory_title: pilot.contact.title
      },
      kaldrix: {
        signatory_name: "John Smith",
        signatory_title: "VP of Business Development"
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const pilotId = searchParams.get('pilot_id')

    if (action === 'templates') {
      const loiTemplatesData = loadLOITemplates()
      return NextResponse.json(loiTemplatesData)
    }

    if (action === 'generate' && pilotId) {
      const pilotData = loadPilotData()
      const pilot = pilotData.pilots.find((p: any) => p.id === pilotId)
      
      if (!pilot) {
        return NextResponse.json(
          { error: 'Pilot not found' },
          { status: 404 }
        )
      }

      const loiTemplatesData = loadLOITemplates()
      const template = loiTemplatesData.loi_templates.standard
      
      const content = generateLOIContent(pilot, template)
      
      return NextResponse.json({
        pilot_id: pilot.id,
        company_name: pilot.company,
        template_type: 'standard',
        content,
        sections: template.sections
      })
    }

    const loiData = loadLOIData()
    
    if (pilotId) {
      const loi = loiData.lois.find((l: LOI) => l.pilot_id === pilotId)
      if (!loi) {
        return NextResponse.json(
          { error: 'LOI not found for this pilot' },
          { status: 404 }
        )
      }
      return NextResponse.json(loi)
    }

    return NextResponse.json(loiData)
  } catch (error) {
    console.error('Error in LOI GET:', error)
    return NextResponse.json(
      { error: 'Failed to get LOI data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, pilot_id, loi_data, status_update } = body

    const loiDataStore = loadLOIData()

    switch (action) {
      case 'create':
        if (!pilot_id) {
          return NextResponse.json(
            { error: 'Pilot ID is required' },
            { status: 400 }
          )
        }

        const pilotData = loadPilotData()
        const pilot = pilotData.pilots.find((p: any) => p.id === pilot_id)
        
        if (!pilot) {
          return NextResponse.json(
            { error: 'Pilot not found' },
            { status: 404 }
          )
        }

        const loiTemplatesData = loadLOITemplates()
        const template = loiTemplatesData.loi_templates.standard
        
        const newLOI: LOI = {
          id: `loi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pilot_id,
          company_name: pilot.company,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          template_type: 'standard',
          content: generateLOIContent(pilot, template),
          workflow: {
            current_status: 'draft',
            history: [
              {
                status: 'draft',
                timestamp: new Date().toISOString(),
                notes: 'LOI created from pilot data',
                updated_by: 'system'
              }
            ]
          }
        }

        loiDataStore.lois.push(newLOI)
        saveLOIData(loiDataStore)

        return NextResponse.json(newLOI, { status: 201 })

      case 'update':
        if (!loi_data || !loi_data.id) {
          return NextResponse.json(
            { error: 'LOI data and ID are required' },
            { status: 400 }
          )
        }

        const loiIndex = loiDataStore.lois.findIndex((l: LOI) => l.id === loi_data.id)
        if (loiIndex === -1) {
          return NextResponse.json(
            { error: 'LOI not found' },
            { status: 404 }
          )
        }

        const updatedLOI = {
          ...loiDataStore.lois[loiIndex],
          ...loi_data,
          updated_at: new Date().toISOString()
        }

        loiDataStore.lois[loiIndex] = updatedLOI
        saveLOIData(loiDataStore)

        return NextResponse.json(updatedLOI)

      case 'update_status':
        if (!status_update || !status_update.loi_id || !status_update.new_status) {
          return NextResponse.json(
            { error: 'LOI ID and new status are required' },
            { status: 400 }
          )
        }

        const statusLoiIndex = loiDataStore.lois.findIndex((l: LOI) => l.id === status_update.loi_id)
        if (statusLoiIndex === -1) {
          return NextResponse.json(
            { error: 'LOI not found' },
            { status: 404 }
          )
        }

        const loi = loiDataStore.lois[statusLoiIndex]
        
        // Validate status transition
        const workflowTemplates = loadLOITemplates()
        const validTransitions = workflowTemplates.loi_workflow.transitions[loi.workflow.current_status] || []
        
        if (!validTransitions.includes(status_update.new_status)) {
          return NextResponse.json(
            { error: `Invalid status transition from ${loi.workflow.current_status} to ${status_update.new_status}` },
            { status: 400 }
          )
        }

        // Update workflow history
        loi.workflow.current_status = status_update.new_status
        loi.workflow.history.push({
          status: status_update.new_status,
          timestamp: new Date().toISOString(),
          notes: status_update.notes || `Status updated to ${status_update.new_status}`,
          updated_by: status_update.updated_by || 'system'
        })

        // Update signature dates if signed
        if (status_update.new_status === 'signed') {
          if (!loi.content.signatures.company.signed_date) {
            loi.content.signatures.company.signed_date = new Date().toISOString()
          }
          if (!loi.content.signatures.kaldrix.signed_date) {
            loi.content.signatures.kaldrix.signed_date = new Date().toISOString()
          }
        }

        loi.updated_at = new Date().toISOString()
        loiDataStore.lois[statusLoiIndex] = loi
        saveLOIData(loiDataStore)

        return NextResponse.json(loi)

      case 'send_to_company':
        if (!pilot_id) {
          return NextResponse.json(
            { error: 'Pilot ID is required' },
            { status: 400 }
          )
        }

        const existingLOI = loiDataStore.lois.find((l: LOI) => l.pilot_id === pilot_id)
        
        if (!existingLOI) {
          // Create LOI if it doesn't exist
          const createResponse = await fetch(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', pilot_id })
          })
          
          if (!createResponse.ok) {
            return createResponse
          }
          
          const createData = await createResponse.json()
          return await updateLOIStatus(createData.id, 'sent_to_company', 'LOI sent to company for review')
        } else {
          return await updateLOIStatus(existingLOI.id, 'sent_to_company', 'LOI sent to company for review')
        }

      case 'mark_signed':
        if (!pilot_id) {
          return NextResponse.json(
            { error: 'Pilot ID is required' },
            { status: 400 }
          )
        }

        const targetLOI = loiDataStore.lois.find((l: LOI) => l.pilot_id === pilot_id)
        if (!targetLOI) {
          return NextResponse.json(
            { error: 'LOI not found for this pilot' },
            { status: 404 }
          )
        }

        return await updateLOIStatus(targetLOI.id, 'signed', 'LOI signed by both parties')

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in LOI POST:', error)
    return NextResponse.json(
      { error: 'Failed to process LOI request' },
      { status: 500 }
    )
  }
}

async function updateLOIStatus(loiId: string, newStatus: string, notes: string) {
  const loiData = loadLOIData()
  const loiIndex = loiData.lois.findIndex((l: LOI) => l.id === loiId)
  
  if (loiIndex === -1) {
    throw new Error('LOI not found')
  }

  const loi = loiData.lois[loiIndex]
  const workflowTemplates = loadLOITemplates()
  const validTransitions = workflowTemplates.loi_workflow.transitions[loi.workflow.current_status] || []
  
  if (!validTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${loi.workflow.current_status} to ${newStatus}`)
  }

  loi.workflow.current_status = newStatus
  loi.workflow.history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    notes,
    updated_by: 'system'
  })

  if (newStatus === 'signed') {
    if (!loi.content.signatures.company.signed_date) {
      loi.content.signatures.company.signed_date = new Date().toISOString()
    }
    if (!loi.content.signatures.kaldrix.signed_date) {
      loi.content.signatures.kaldrix.signed_date = new Date().toISOString()
    }
  }

  loi.updated_at = new Date().toISOString()
  loiData.lois[loiIndex] = loi
  saveLOIData(loiData)

  return loi
}