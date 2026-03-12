import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('pantry-pilot-user-id')?.value

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user || !user.householdId) {
            return NextResponse.json({ error: 'User does not belong to a household' }, { status: 403 })
        }

        // Generate a new Magic Link token valid for 48 hours
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 48)

        const magicLink = await prisma.magicLink.create({
            data: {
                householdId: user.householdId,
                expiresAt
            }
        })

        return NextResponse.json({ success: true, token: magicLink.token })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to generate Magic Link' }, { status: 500 })
    }
}
