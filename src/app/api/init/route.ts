import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser()

        // If authenticated via Supabase, find user by email
        if (sbUser?.email) {
            const user = await prisma.user.findUnique({
                where: { email: sbUser.email },
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

            if (user && user.household) {
                return new NextResponse(JSON.stringify({
                    user: { id: user.id, name: user.name, householdId: user.householdId },
                    household: user.household
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                })
            }
        }

        // PRO Fallback: If no session but we have users, return the first one (for the transition)
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
            return new NextResponse(JSON.stringify({ error: 'No user found' }), {
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
