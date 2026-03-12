import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) return NextResponse.json([])

    const list = await prisma.shoppingListItem.findMany({
        where: { householdId },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(list)
}

export async function POST(request: Request) {
    try {
        const { name, quantity, unit, householdId } = await request.json()
        const item = await prisma.shoppingListItem.create({
            data: { name, quantity, unit, householdId }
        })
        return NextResponse.json(item)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, isPurchased } = await request.json()
        const updated = await prisma.shoppingListItem.update({
            where: { id },
            data: { isPurchased }
        })
        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (id) {
            await prisma.shoppingListItem.delete({ where: { id } })
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
