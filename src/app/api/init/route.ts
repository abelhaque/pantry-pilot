import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser()

        if (sbError || !sbUser || !sbUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
            return NextResponse.json({
                user: { id: newUser.id, name: newUser.name, householdId: newUser.householdId },
                household: newHousehold
            })
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            householdId: user.householdId
        }

        return NextResponse.json({
            user: userResponse,
            household: user.household
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 })
    }
}
