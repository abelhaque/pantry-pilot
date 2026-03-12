'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const { refresh } = useHousehold()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (res.ok && data.user) {
                await refresh()
                if (data.isNewUser) {
                    router.push('/welcome')
                } else {
                    router.push('/')
                }
            } else {
                setError(data.error || 'Failed to login.')
            }
        } catch (err) {
            setError('An unexpected error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-8 animate-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Pantry Pilot</h1>
                    <p className="text-muted-foreground">Log in to your household</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="btn btn-primary w-full"
                    >
                        {isLoading ? 'Logging in...' : 'Continue'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Identity-First Login helps us safely connect you to your shared household without an invite code.
                </p>
            </div>
        </div>
    )
}
