'use client'

import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useState } from 'react'

export default function WelcomePage() {
    const { household } = useHousehold()
    const router = useRouter()
    const [step, setStep] = useState(1)

    const finishWizard = () => {
        router.push('/')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary/20 p-4">
            <div className="card w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500">
                {/* Progress Bar */}
                <div className="w-full bg-secondary h-2 relative">
                    <div 
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                        style={{ width: `${(step / 2) * 100}%` }}
                    />
                </div>

                <div className="p-8 sm:p-12">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">
                                👋
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Welcome to Pantry Pilot!</h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                We're excited to have you on board. We've automatically created a brand new household just for you: <strong className="text-foreground">{household?.name || 'Your Household'}</strong>.
                            </p>
                            <button 
                                onClick={() => setStep(2)}
                                className="btn btn-primary w-full text-lg h-12 mt-8"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">
                                🏠
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Your Initial Setup</h2>
                            <p className="text-lg text-muted-foreground">
                                To get you started immediately, we've pre-configured two essential storage units for you. You can rename or customize them later!
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 my-6">
                                <div className="card p-4 border border-primary/20 bg-primary/5 relative overflow-hidden group">
                                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">❄️</div>
                                    <div className="font-semibold">Fridge</div>
                                    <div className="text-xs text-muted-foreground mt-1">Ready for perishables</div>
                                </div>
                                <div className="card p-4 border border-primary/20 bg-primary/5 relative overflow-hidden group">
                                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🥫</div>
                                    <div className="font-semibold">Cupboard</div>
                                    <div className="text-xs text-muted-foreground mt-1">Ready for dry goods</div>
                                </div>
                            </div>

                            <button 
                                onClick={finishWizard}
                                className="btn btn-primary w-full text-lg h-12 shadow-md hover:shadow-lg transition-all"
                            >
                                Bring me to my Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
