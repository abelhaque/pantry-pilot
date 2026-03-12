import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { name, type, householdId } = await request.json()

        if (!name || !householdId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const location = await prisma.location.create({
            data: {
                name,
                type,
                householdId,
                zones: {
                    create: { name: 'Main Zone' }
                }
            },
            include: {
                zones: true
            }
        })

        return NextResponse.json(location)
    } catch (error) {
        console.error('Failed to create location', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
