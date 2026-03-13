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
        const { name, quantity, unit, householdId, storeId, category } = await request.json()
        if (!name || !householdId) {
            return new NextResponse(JSON.stringify({ error: 'Missing name or householdId' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }
        
        // Use any cast if types are lagging, but schema is correct
        const item = await (prisma.shoppingListItem as any).create({
            data: { 
                name, 
                quantity: parseFloat(quantity as string) || 1, 
                unit: unit || 'item', 
                householdId,
                storeId,
                category: category || 'General'
            }
        })
        return new NextResponse(JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error('POST Error:', error)
        return new NextResponse(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, isPurchased, name, quantity, unit, category } = await request.json()
        const updated = await (prisma.shoppingListItem as any).update({
            where: { id },
            data: { 
                isPurchased,
                name,
                quantity: quantity ? parseFloat(quantity as string) : undefined,
                unit,
                category
            }
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
