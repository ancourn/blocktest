import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface PilotContact {
  name: string
  title: string
  email: string
  phone: string
}

interface PilotTimeline {
  initial_contact: string
  follow_up: string
  technical_deep_dive: string
  pilot_start: string
  pilot_end: string
}

interface PilotRequirements {
  quantum_security: boolean
  high_tps: boolean
  regulatory_compliance: boolean
  scalability: boolean
  integration_support: boolean
}

interface PilotBusinessCase {
  estimated_roi: string
  implementation_cost: string
  annual_savings: string
  payback_period: string
}

interface PilotMilestone {
  name: string
  target_date: string
  status: 'pending' | 'completed' | 'delayed'
  dependencies: string[]
}

interface Pilot {
  id: string
  company: string
  industry: string
  contact: PilotContact
  status: 'prospect' | 'in_discussion' | 'loi_signed' | 'pilot_active' | 'pilot_completed' | 'rejected'
  interest_level: 'low' | 'medium' | 'high'
  timeline: PilotTimeline
  requirements: PilotRequirements
  use_cases: string[]
  technical_assessment: {
    infrastructure_readiness: 'low' | 'medium' | 'high'
    technical_team_capability: 'low' | 'medium' | 'high'
    integration_complexity: 'low' | 'medium' | 'high'
    security_requirements: 'low' | 'medium' | 'high'
  }
  business_case: PilotBusinessCase
  next_steps: string[]
  notes: string[]
  milestones: PilotMilestone[]
  success_criteria: string[]
  kpi_targets: Record<string, number>
}

const PILOT_DATA_PATH = join(process.cwd(), 'enterprise', 'pilots', 'pilot-tracking.json')

function loadPilotData() {
  try {
    const data = readFileSync(PILOT_DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading pilot data:', error)
    return { pilots: [], summary: {} }
  }
}

function savePilotData(data: any) {
  try {
    writeFileSync(PILOT_DATA_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving pilot data:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const industry = searchParams.get('industry')
    const interest = searchParams.get('interest')

    const data = loadPilotData()
    let pilots = data.pilots

    // Filter pilots based on query parameters
    if (status) {
      pilots = pilots.filter((p: Pilot) => p.status === status)
    }
    if (industry) {
      pilots = pilots.filter((p: Pilot) => p.industry === industry)
    }
    if (interest) {
      pilots = pilots.filter((p: Pilot) => p.interest_level === interest)
    }

    return NextResponse.json({
      pilots,
      summary: data.summary,
      filters: { status, industry, interest }
    })
  } catch (error) {
    console.error('Error fetching pilots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pilots' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company,
      industry,
      contact,
      requirements,
      use_cases,
      business_case
    } = body

    // Validate required fields
    if (!company || !industry || !contact || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const data = loadPilotData()
    
    // Create new pilot
    const newPilot: Pilot = {
      id: `pilot_${Date.now()}`,
      company,
      industry,
      contact,
      status: 'prospect',
      interest_level: 'medium',
      timeline: {
        initial_contact: new Date().toISOString(),
        follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        technical_deep_dive: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        pilot_start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        pilot_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      requirements,
      use_cases: use_cases || [],
      technical_assessment: {
        infrastructure_readiness: 'medium',
        technical_team_capability: 'medium',
        integration_complexity: 'medium',
        security_requirements: 'medium'
      },
      business_case: business_case || {
        estimated_roi: '1.5x',
        implementation_cost: '$250,000',
        annual_savings: '$375,000',
        payback_period: '8 months'
      },
      next_steps: [
        'Schedule initial discovery call',
        'Send technical documentation',
        'Assess technical requirements'
      ],
      notes: [
        'New pilot prospect created',
        `Industry: ${industry}`,
        `Contact: ${contact.name}`
      ],
      milestones: [
        {
          name: 'Initial Call',
          target_date: new Date().toISOString(),
          status: 'pending',
          dependencies: []
        },
        {
          name: 'Technical Assessment',
          target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          dependencies: ['Initial Call']
        },
        {
          name: 'LOI Signed',
          target_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          dependencies: ['Technical Assessment']
        }
      ],
      success_criteria: [
        'Successful pilot deployment',
        'Achieve KPI targets',
        'Positive user feedback'
      ],
      kpi_targets: {
        satisfaction_score: 80,
        adoption_rate: 70,
        performance_score: 85
      }
    }

    data.pilots.push(newPilot)
    
    // Update summary
    data.summary = {
      total_pilots: data.pilots.length,
      by_status: {
        prospect: data.pilots.filter((p: Pilot) => p.status === 'prospect').length,
        in_discussion: data.pilots.filter((p: Pilot) => p.status === 'in_discussion').length,
        loi_signed: data.pilots.filter((p: Pilot) => p.status === 'loi_signed').length,
        pilot_active: data.pilots.filter((p: Pilot) => p.status === 'pilot_active').length,
        pilot_completed: data.pilots.filter((p: Pilot) => p.status === 'pilot_completed').length,
        rejected: data.pilots.filter((p: Pilot) => p.status === 'rejected').length
      },
      by_industry: data.pilots.reduce((acc: any, p: Pilot) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1
        return acc
      }, {}),
      by_interest_level: {
        low: data.pilots.filter((p: Pilot) => p.interest_level === 'low').length,
        medium: data.pilots.filter((p: Pilot) => p.interest_level === 'medium').length,
        high: data.pilots.filter((p: Pilot) => p.interest_level === 'high').length
      },
      total_potential_value: data.pilots.reduce((total: number, p: Pilot) => {
        const cost = parseInt(p.business_case.implementation_cost.replace(/[^0-9]/g, ''))
        return total + cost
      }, 0),
      last_updated: new Date().toISOString()
    }

    savePilotData(data)

    return NextResponse.json(newPilot, { status: 201 })
  } catch (error) {
    console.error('Error creating pilot:', error)
    return NextResponse.json(
      { error: 'Failed to create pilot' },
      { status: 500 }
    )
  }
}