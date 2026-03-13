import { NextResponse } from 'next/server'
import { GET as initGET } from '../init/route'

export async function GET(request: Request) {
    return initGET(request)
}
