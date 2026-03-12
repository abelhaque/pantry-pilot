import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { email, token } = body

        if (!email || !token) {
            return NextResponse.json({ error: 'Email and valid token are required' }, { status: 400 })
        }

        // 1. Validate the token
        const magicLink = await prisma.magicLink.findUnique({
            where: { token },
            include: { household: true }
        })

        if (!magicLink) {
            return NextResponse.json({ error: 'Invalid or expired invitation link. Please request a new one.' }, { status: 400 })
        }

        if (magicLink.expiresAt < new Date()) {
            await prisma.magicLink.delete({ where: { token } })
            return NextResponse.json({ error: 'Invitation link has expired. Please request a new one.' }, { status: 400 })
        }

        // 2. Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { household: true },
        })

        if (user) {
            // Re-assign them to this household if they existed previously (e.g. they had their own default household)
            user = await prisma.user.update({
                where: { email },
                data: { householdId: magicLink.householdId },
                include: { household: true }
            })
        } else {
            // New invited user logging in for the first time
            user = await prisma.user.create({
                data: {
                    name: email.split('@')[0],
                    email: email,
                    householdId: magicLink.householdId
                },
                include: { household: true }
            })
        }

        // 3. Optional: Delete the magic link if you want it to be single-use. 
        // For WhatsApp shares among family, multi-use within 48 hours is often preferred. 
        // We will leave it active until expiration for flexibility here.

        // 4. Issue persistent cookie session
        const oneYear = 60 * 60 * 24 * 365
        const cookieStr = `pantry-pilot-user-id=${user.id}; Path=/; Max-Age=${oneYear}; SameSite=Lax`

        return new NextResponse(JSON.stringify({
            user: { id: user.id, name: user.name, householdId: user.householdId },
            household: user.household,
            isNewUser: false // Skip the wizard, they are joining an existing household
        }), {
            status: 200,
            headers: { 'Set-Cookie': cookieStr, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to join household' }, { status: 500 })
    }
}
