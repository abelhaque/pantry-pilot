import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) return new NextResponse(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })

    const list = await prisma.shoppingListItem.findMany({
        where: { householdId },
        orderBy: { createdAt: 'desc' }
    })
    return new NextResponse(JSON.stringify(list), { headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: Request) {
    try {
        const { name, quantity, unit, householdId } = await request.json()
        const item = await prisma.shoppingListItem.create({
            data: { name, quantity, unit, householdId }
        })
        return new NextResponse(JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, isPurchased } = await request.json()
        const updated = await prisma.shoppingListItem.update({
            where: { id },
            data: { isPurchased }
        })
        return new NextResponse(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (id) {
            await prisma.shoppingListItem.delete({ where: { id } })
        }
        return new NextResponse(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
