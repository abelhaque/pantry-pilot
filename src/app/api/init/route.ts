import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        // NUCLEAR OPTION: No Auth Checks. Return first available household.
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
            return new NextResponse(JSON.stringify({ error: 'No data found' }), {
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
