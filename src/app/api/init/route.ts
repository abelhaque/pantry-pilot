import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('pantry-pilot-user-id')?.value

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                household: {
                    include: {
                        locations: {
                            include: { zones: { include: { items: true } } }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let householdData;
        
        if ('household' in user) {
            householdData = (user as any).household
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            householdId: user.householdId
        }

        return NextResponse.json({
            user: userResponse,
            household: householdData
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 })
    }
}
