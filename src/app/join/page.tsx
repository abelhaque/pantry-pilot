'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'
import { Suspense } from 'react'

function JoinForm() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refresh } = useHousehold()

    const token = searchParams.get('code')

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing invitation code in the URL.')
        }
    }, [token])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        
        if (!token) {
            setError('Missing invitation code.')
            return
        }

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/magic-link/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token }),
            })

            const data = await res.json()

            if (res.ok && data.user) {
                await refresh()
                router.push('/')
            } else {
                setError(data.error || 'Failed to join household.')
            }
        } catch (err) {
            setError('An unexpected error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/20">
            <div className="card w-full max-w-md p-8 animate-in slide-in-from-bottom-4 zoom-in-95">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
                        🤝
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">You've been invited!</h1>
                    <p className="text-muted-foreground">Enter an email to connect to this household.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input w-full"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-medium">{error}</div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading || !token}
                        className="btn btn-primary w-full"
                    >
                        {isLoading ? 'Joining Household...' : 'Accept Invite'}
                    </button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    This magic link ensures you bypass the regular login flow.
                </p>
            </div>
        </div>
    )
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <JoinForm />
        </Suspense>
    )
}
