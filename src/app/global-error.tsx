'use client'

import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-[#F9F7F2]">
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-[#1A2119] mb-4 uppercase tracking-tighter">System Error</h1>
            <p className="text-[#1A2119]/60 text-sm font-medium mb-8">
              A catastrophic failure occurred in the application root. Please restart the interface.
            </p>
            <button
              onClick={() => reset()}
              className="px-8 py-4 bg-[#1A2119] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl"
            >
              Restart Engine
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
