import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) return NextResponse.json([])

    const stores = await prisma.store.findMany({
        where: { householdId },
        include: { _count: { select: { items: true } } },
        orderBy: { name: 'asc' }
    })
    return NextResponse.json(stores)
}

export async function POST(request: Request) {
    try {
        const { name, householdId } = await request.json()
        const store = await prisma.store.create({
            data: { name, householdId }
        })
        return NextResponse.json(store)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
    }
}
