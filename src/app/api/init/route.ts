import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser()

        // Emergency Bypass: If unauthenticated, return the first household as "Guest/Owner" session
        if (sbError || !sbUser || !sbUser.email) {
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

            if (defaultUser && defaultUser.household) {
                return new NextResponse(JSON.stringify({
                    user: { id: defaultUser.id, name: defaultUser.name, householdId: defaultUser.householdId },
                    household: defaultUser.household
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            return new NextResponse(JSON.stringify({}), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        let user = await prisma.user.findUnique({
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

        // If user authenticated via Supabase but not in Prisma, create them
        if (!user) {
            const newHousehold = await prisma.household.create({
                data: {
                    name: `${sbUser.email.split('@')[0]}'s Household`,
                    users: {
                        create: {
                            name: sbUser.email.split('@')[0],
                            email: sbUser.email,
                        }
                    },
                    locations: {
                        create: [
                            { name: 'Fridge', type: 'fridge' },
                            { name: 'Cupboard', type: 'pantry' }
                        ]
                    }
                },
                include: {
                    users: true,
                    locations: { include: { zones: { include: { items: true } } } }
                }
            })
            
            const newUser = newHousehold.users[0]
            return new NextResponse(JSON.stringify({
                user: { id: newUser.id, name: newUser.name, householdId: newUser.householdId },
                household: newHousehold
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            householdId: user.householdId
        }

        return new NextResponse(JSON.stringify({
            user: userResponse,
            household: user.household
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('API Error:', error)
        // Graceful fail on server error
        return new NextResponse(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
