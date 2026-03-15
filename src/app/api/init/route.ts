import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// AUTH BYPASS: Return household data unconditionally.
// Strategy: Try user→household first, then fallback to household directly.
export async function GET(request: Request) {
    try {
        // --- Attempt 1: Find via User (local dev DB may seed this way) ---
        const defaultUser = await prisma.user.findFirst({
            where: { householdId: { not: null } },
            include: {
                household: {
                    include: {
                        locations: {
                            include: { zones: { include: { items: true } } }
                        },
                        shoppingList: true
                    }
                }
            }
        })

        if (defaultUser?.household) {
            return NextResponse.json({
                user: { id: defaultUser.id, name: defaultUser.name, householdId: defaultUser.householdId },
                household: defaultUser.household
            })
        }

        // --- Attempt 2: Find household directly (Render DB may have no User rows) ---
        const directHousehold = await prisma.household.findFirst({
            include: {
                locations: {
                    include: { zones: { include: { items: true } } }
                },
                shoppingList: true
            }
        })

        if (directHousehold) {
            return NextResponse.json({
                user: { id: 'bypass', name: 'Owner', householdId: directHousehold.id },
                household: directHousehold
            })
        }

        // --- No data at all ---
        console.error('[/api/init] No household found in database — DB may be empty')
        return NextResponse.json({ error: 'No household found in database' })

    } catch (error) {
        console.error('[/api/init] Prisma error:', error)
        return NextResponse.json({ error: 'Database error', detail: String(error) })
    }
}
