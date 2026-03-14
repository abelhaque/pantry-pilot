import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// AUTH BYPASS: Skip all Supabase token/session checks. Return first household directly.
export async function GET(request: Request) {
    try {
        const defaultUser = await prisma.user.findFirst({
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

        if (!defaultUser || !defaultUser.household) {
            return new NextResponse(JSON.stringify({ error: 'No user found in database' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        return new NextResponse(JSON.stringify({
            user: { id: defaultUser.id, name: defaultUser.name, householdId: defaultUser.householdId },
            household: defaultUser.household
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('API Error:', error)
        return new NextResponse(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
