import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const date = searchParams.get('date')

    if (!householdId) return NextResponse.json([])

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
    return NextResponse.json(plans)
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
        return NextResponse.json(plan)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save meal plan' }, { status: 500 })
    }
}
