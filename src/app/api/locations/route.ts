import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { name, icon, type, householdId } = await request.json()

        if (!name || !householdId) {
            return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }

        const location = await prisma.location.create({
            data: {
                name,
                icon,
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

        return new NextResponse(JSON.stringify(location), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error('Failed to create location', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
