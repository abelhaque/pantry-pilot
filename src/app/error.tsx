'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react'
import { motion } from 'motion/react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an analytics service or console for diagnosis
    console.error('Render Error Caught by Boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[44px] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-[#1A2119]/5 text-center"
      >
        <div className="w-20 h-20 bg-rose-500/10 rounded-[32px] flex items-center justify-center text-rose-500 mx-auto mb-8">
          <AlertTriangle size={40} />
        </div>
        
        <h2 className="text-3xl font-black text-[#1A2119] mb-4 tracking-tighter uppercase">Interface Exception</h2>
        <p className="text-[#2C3A2B]/60 font-medium mb-10 leading-relaxed text-sm">
          A client-side exception occurred while processing this view. Our logic engine has safely isolated the failure.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full bg-[#1A2119] text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 text-[11px]"
          >
            <RefreshCcw size={16} />
            Recover Session
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white border border-[#1A2119]/10 text-[#1A2119] py-5 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 text-[11px]"
          >
            <Home size={16} />
            Back to Dashboard
          </button>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-8 pt-8 border-t border-[#1A2119]/5 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A2119]/20 mb-2">Technical Detail</p>
            <div className="bg-[#1A2119]/5 p-4 rounded-xl overflow-auto text-[10px] font-mono text-rose-600 max-h-40">
              {error.message}
              {error.digest && <div className="mt-2 opacity-50">Digest: {error.digest}</div>}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
