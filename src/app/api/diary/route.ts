import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) return NextResponse.json([])

    const entries = await prisma.diaryEntry.findMany({
        where: { householdId },
        orderBy: { date: 'desc' }
    })
    return NextResponse.json(entries)
}

export async function POST(request: Request) {
    try {
        const { date, title, content, imageUrl, householdId } = await request.json()
        const entry = await prisma.diaryEntry.create({
            data: { 
                date: new Date(date), 
                title, 
                content, 
                imageUrl, 
                householdId 
            }
        })
        return NextResponse.json(entry)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create diary entry' }, { status: 500 })
    }
}
