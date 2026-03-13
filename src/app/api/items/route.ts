import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { name, quantity, unit, category, zoneId, householdId } = await request.json()

        // 1. Create the Item
        const item = await prisma.item.create({
            data: {
                name,
                quantity,
                unit,
                category,
                zoneId
            }
        })

        // 2. Smart Memory: Update Library
        // We need householdId to scope the library.
        // If householdId is not passed, we might need to fetch it via zone -> location -> household.
        // Let's assume passed for efficiency, or fetch it.

        let targetHouseholdId = householdId
        if (!targetHouseholdId) {
            const zone = await prisma.zone.findUnique({
                where: { id: zoneId },
                include: { location: true }
            })
            targetHouseholdId = zone?.location.householdId
        }

        if (targetHouseholdId) {
            await prisma.libraryItem.upsert({
                where: {
                    householdId_name: {
                        householdId: targetHouseholdId,
                        name: name
                    }
                },
                update: {
                    lastUsed: new Date(),
                    category, // Update category preference? Maybe.
                    defaultUnit: unit
                },
                create: {
                    householdId: targetHouseholdId,
                    name,
                    category,
                    defaultUnit: unit
                }
            })
        }

        return new NextResponse(JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error('Failed to add item', error)
        return new NextResponse(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, zoneId, quantity, name, unit, category } = await request.json()

        if (!id) {
            return new NextResponse(JSON.stringify({ error: 'Item ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
        }

        const updated = await prisma.item.update({
            where: { id },
            data: {
                zoneId,
                quantity: quantity ? Number(quantity) : undefined,
                name,
                unit,
                category
            },
            include: {
                zone: { include: { location: true } }
            }
        })

        // Replenish Pipeline:
        // If quantity hits 0, add to Shopping List
        if (updated.quantity === 0) {
            const householdId = updated.zone.location.householdId

            // Check if already in list to avoid duplicates?
            // Or just add another entry? Let's check name match.
            const existing = await prisma.shoppingListItem.findFirst({
                where: {
                    householdId,
                    name: updated.name,
                    isPurchased: false
                }
            })

            if (!existing) {
                await prisma.shoppingListItem.create({
                    data: {
                        name: updated.name,
                        householdId,
                        unit: updated.unit,
                        quantity: 1 // Default to 1 to buy
                    }
                })
            }
        }

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Failed to update item', error)
        return NextResponse.json({ error: 'Failed update' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.item.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed delete' }, { status: 500 })
    }
}
