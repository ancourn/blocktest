import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadPilotData()
    const pilot = data.pilots.find((p: any) => p.id === params.id)

    if (!pilot) {
      return NextResponse.json(
        { error: 'Pilot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pilot)
  } catch (error) {
    console.error('Error fetching pilot:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pilot' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const data = loadPilotData()
    const pilotIndex = data.pilots.findIndex((p: any) => p.id === params.id)

    if (pilotIndex === -1) {
      return NextResponse.json(
        { error: 'Pilot not found' },
        { status: 404 }
      )
    }

    const pilot = data.pilots[pilotIndex]
    
    // Update pilot fields
    const updatedPilot = {
      ...pilot,
      ...body,
      id: params.id, // Prevent ID changes
      last_updated: new Date().toISOString()
    }

    // Add status change note if status changed
    if (body.status && body.status !== pilot.status) {
      updatedPilot.notes = [
        `Status changed from ${pilot.status} to ${body.status}`,
        ...(updatedPilot.notes || [])
      ]
    }

    // Update milestone statuses if provided
    if (body.milestones) {
      updatedPilot.milestones = body.milestones
    }

    data.pilots[pilotIndex] = updatedPilot

    // Update summary
    data.summary = {
      total_pilots: data.pilots.length,
      by_status: {
        prospect: data.pilots.filter((p: any) => p.status === 'prospect').length,
        in_discussion: data.pilots.filter((p: any) => p.status === 'in_discussion').length,
        loi_signed: data.pilots.filter((p: any) => p.status === 'loi_signed').length,
        pilot_active: data.pilots.filter((p: any) => p.status === 'pilot_active').length,
        pilot_completed: data.pilots.filter((p: any) => p.status === 'pilot_completed').length,
        rejected: data.pilots.filter((p: any) => p.status === 'rejected').length
      },
      by_industry: data.pilots.reduce((acc: any, p: any) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1
        return acc
      }, {}),
      by_interest_level: {
        low: data.pilots.filter((p: any) => p.interest_level === 'low').length,
        medium: data.pilots.filter((p: any) => p.interest_level === 'medium').length,
        high: data.pilots.filter((p: any) => p.interest_level === 'high').length
      },
      total_potential_value: data.pilots.reduce((total: number, p: any) => {
        const cost = parseInt(p.business_case.implementation_cost.replace(/[^0-9]/g, ''))
        return total + cost
      }, 0),
      last_updated: new Date().toISOString()
    }

    savePilotData(data)

    return NextResponse.json(updatedPilot)
  } catch (error) {
    console.error('Error updating pilot:', error)
    return NextResponse.json(
      { error: 'Failed to update pilot' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = loadPilotData()
    const pilotIndex = data.pilots.findIndex((p: any) => p.id === params.id)

    if (pilotIndex === -1) {
      return NextResponse.json(
        { error: 'Pilot not found' },
        { status: 404 }
      )
    }

    data.pilots.splice(pilotIndex, 1)

    // Update summary
    data.summary = {
      total_pilots: data.pilots.length,
      by_status: {
        prospect: data.pilots.filter((p: any) => p.status === 'prospect').length,
        in_discussion: data.pilots.filter((p: any) => p.status === 'in_discussion').length,
        loi_signed: data.pilots.filter((p: any) => p.status === 'loi_signed').length,
        pilot_active: data.pilots.filter((p: any) => p.status === 'pilot_active').length,
        pilot_completed: data.pilots.filter((p: any) => p.status === 'pilot_completed').length,
        rejected: data.pilots.filter((p: any) => p.status === 'rejected').length
      },
      by_industry: data.pilots.reduce((acc: any, p: any) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1
        return acc
      }, {}),
      by_interest_level: {
        low: data.pilots.filter((p: any) => p.interest_level === 'low').length,
        medium: data.pilots.filter((p: any) => p.interest_level === 'medium').length,
        high: data.pilots.filter((p: any) => p.interest_level === 'high').length
      },
      total_potential_value: data.pilots.reduce((total: number, p: any) => {
        const cost = parseInt(p.business_case.implementation_cost.replace(/[^0-9]/g, ''))
        return total + cost
      }, 0),
      last_updated: new Date().toISOString()
    }

    savePilotData(data)

    return NextResponse.json({ message: 'Pilot deleted successfully' })
  } catch (error) {
    console.error('Error deleting pilot:', error)
    return NextResponse.json(
      { error: 'Failed to delete pilot' },
      { status: 500 }
    )
  }
}