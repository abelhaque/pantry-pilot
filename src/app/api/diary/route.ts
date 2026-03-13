import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) return new NextResponse(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })

    const entries = await prisma.diaryEntry.findMany({
        where: { householdId },
        orderBy: { date: 'desc' }
    })
    return new NextResponse(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json' } })
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
        return new NextResponse(JSON.stringify(entry), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: 'Failed to create diary entry' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
