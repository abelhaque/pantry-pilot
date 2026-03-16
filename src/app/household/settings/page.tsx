'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'

export default function SettingsPage() {
    const { household, isLoading } = useHousehold()
    const router = useRouter()
    
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleShareInvite = async () => {
        setError('')
        setSuccess('')
        setIsGenerating(true)

        try {
            const res = await fetch('/api/magic-link', {
                method: 'POST',
            })

            const data = await res.json()
            if (res.ok && data.token) {
                const inviteText = `Hey! Join our pantry on Pantry Pilot. Click here to join: ${window.location.origin}/join?code=${data.token}`
                
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Join my Pantry Pilot Household',
                            text: inviteText,
                        })
                        setSuccess('Shared successfully!')
                    } catch (shareErr: any) {
                        // User cancelled the share sheet, ignore
                        if (shareErr.name !== 'AbortError') {
                            console.error('Share failed', shareErr)
                        }
                    }
                } else {
                    // Fallback to clipboard for desktop browsers
                    await navigator.clipboard.writeText(inviteText)
                    setSuccess('Invite link copied to clipboard!')
                }
            } else {
                setError(data.error || 'Failed to generate Magic Link.')
            }
        } catch (err) {
            setError('An unexpected error occurred.')
        } finally {
            setIsGenerating(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground min-h-screen flex items-center justify-center">Loading settings...</div>
    }

    if (!household) {
        return null // Will redirect via provider
    }

    return (
        <main className="container min-h-screen py-8 max-w-2xl mx-auto">
            <header className="mb-8 flex items-center gap-4">
                <button 
                    onClick={() => router.push('/')}
                    className="text-muted-foreground hover:text-foreground text-xl"
                >
                    ←
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Family Management</h1>
            </header>

            <section className="card p-8 mb-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
                    📤
                </div>
                <h2 className="text-xl font-bold mb-3">Share Invite Link</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    Generate a secure Magic Link and share it seamlessly. When they click it, they will instantly join your household.
                </p>

                <button 
                    onClick={handleShareInvite}
                    disabled={isGenerating}
                    className="btn btn-primary w-full sm:w-auto px-8 mx-auto flex items-center justify-center gap-2"
                >
                    {isGenerating ? 'Generating Link...' : 'Share Invite'}
                </button>

                {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
                {success && <div className="mt-4 text-sm text-green-600 font-medium">{success}</div>}
            </section>
        </main>
    )
}
