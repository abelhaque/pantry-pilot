import { type NextRequest, NextResponse } from 'next/server'

// AUTH BYPASS: Middleware is a passthrough. No redirects to /login ever.
export async function middleware(request: NextRequest) {
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
