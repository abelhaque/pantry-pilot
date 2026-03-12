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

        return NextResponse.json(zone)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
    }
}
