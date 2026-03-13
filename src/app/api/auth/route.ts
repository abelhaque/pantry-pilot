import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { email } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // 1. Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { household: true },
        })

        // Safety net: if email is abelhaque@gmail.com and no household attached
        if (email === 'abelhaque@gmail.com' && (!user || !user.householdId)) {
            const firstHousehold = await prisma.household.findFirst()
            if (firstHousehold) {
                if (user) {
                    user = await prisma.user.update({
                        where: { email },
                        data: { householdId: firstHousehold.id },
                        include: { household: true }
                    })
                } else {
                    user = await prisma.user.create({
                        data: {
                            name: 'Abel',
                            email: email,
                            householdId: firstHousehold.id
                        },
                        include: { household: true }
                    })
                }
                const safetyCookie = `pantry-pilot-user-id=${user.id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
                return new NextResponse(JSON.stringify({
                    user: { id: user.id, name: user.name, householdId: user.householdId },
                    household: user.household
                }), {
                    status: 200,
                    headers: { 'Set-Cookie': safetyCookie, 'Content-Type': 'application/json' }
                })
            }
        }

        const oneYear = 60 * 60 * 24 * 365

        if (user !== null) {
            const cookieStr = `pantry-pilot-user-id=${user.id}; Path=/; Max-Age=${oneYear}; SameSite=Lax`
            return new NextResponse(JSON.stringify({
                user: { id: user.id, name: user.name, householdId: user.householdId },
                household: user.household
            }), {
                status: 200,
                headers: { 'Set-Cookie': cookieStr, 'Content-Type': 'application/json' }
            })
        }

        // 2. User doesn't exist -> Create new Safety Net Household with Wizard Defaults
        // (Invites are now handled entirely via the /join/[token] portal rather than intercepting raw email logins)
        const newHousehold = await prisma.household.create({
            data: {
                name: `${email.split('@')[0]}'s Household`,
                users: {
                    create: {
                        name: email.split('@')[0],
                        email: email,
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
        const newCookie = `pantry-pilot-user-id=${newUser.id}; Path=/; Max-Age=${oneYear}; SameSite=Lax`
        
        return new NextResponse(JSON.stringify({
            user: { id: newUser.id, name: newUser.name, householdId: newUser.householdId },
            household: newHousehold,
            isNewUser: true
        }), {
            status: 200,
            headers: { 'Set-Cookie': newCookie, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('API Error:', error)
        return new NextResponse(JSON.stringify({ error: 'Failed to login' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
