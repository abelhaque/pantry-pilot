'use client'

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HouseholdProvider } from "@/providers/HouseholdProvider";

export function ClientStabilityProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true) }, []);
  
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#E3EADF] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2C3A2B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#2C3A2B]/40 text-[10px] font-black uppercase tracking-[0.4em]">Initializing Engine</p>
        </div>
      </div>
    );
  }

  return (
    <HouseholdProvider>
      <Navbar />
      <div className="min-h-screen pb-24">
        {children}
      </div>
    </HouseholdProvider>
  );
}
