import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const date = searchParams.get('date')

    if (!householdId) return new NextResponse(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })

    const where: any = { householdId }
    if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        where.date = { gte: startOfDay, lte: endOfDay }
    }

    const plans = await prisma.mealPlan.findMany({
        where,
        orderBy: { date: 'asc' }
    })
    return new NextResponse(JSON.stringify(plans), { headers: { 'Content-Type': 'application/json' } })
}

export async function POST(request: Request) {
    try {
        const { date, slot, recipeName, notes, householdId } = await request.json()
        const plan = await prisma.mealPlan.create({
            data: { 
                date: new Date(date), 
                slot, 
                recipeName, 
                notes, 
                householdId 
            }
        })
        return new NextResponse(JSON.stringify(plan), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed to save meal plan' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
