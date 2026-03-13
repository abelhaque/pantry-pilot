'use client'

import { useState } from 'react'
import { redirect } from 'next/navigation'

export default function LoginPage() {
    redirect('/')
    return null // unreachable but satisfies TS
/*
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
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            
            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (authError) {
                setError(authError.message)
            } else {
                alert('Check your email for the login link!')
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
                        className={`btn btn-primary w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : 'Continue'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Identity-First Login helps us safely connect you to your shared household without an invite code.
                </p>
            </div>
        </div>
    )
}
