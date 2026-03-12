import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) return NextResponse.json([])

    const items = await prisma.libraryItem.findMany({
        where: {
            name: {
                contains: q
            }
        },
        take: 5
    })

    return NextResponse.json(items)
}
