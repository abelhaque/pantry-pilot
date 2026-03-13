import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) return new NextResponse(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })

    const stores = await prisma.store.findMany({
        where: { householdId },
        include: { _count: { select: { items: true } } },
        orderBy: { name: 'asc' }
    })
    return new NextResponse(JSON.stringify(stores), { headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: Request) {
    try {
        const { name, householdId } = await request.json()
        const store = await prisma.store.create({
            data: { name, householdId }
        })
        return new NextResponse(JSON.stringify(store), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed to create store' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
