import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { name, locationId } = await request.json()

        const zone = await prisma.zone.create({
            data: {
                name,
                locationId
            }
        })

        return new NextResponse(JSON.stringify(zone), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed to create zone' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
