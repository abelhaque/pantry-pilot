'use client'

import React, { useState, useEffect } from 'react'
import { Mic, X } from 'lucide-react'

// --- Haptic & Sound Utilities (Ported from Fallback) ---
const playClick = () => {
  try {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05)
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination)
    oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.05)
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch (e) {}
}

const playDoubleDing = () => {
  try {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()
    const playDing = (time: number, freq: number) => {
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, time)
      gainNode.gain.setValueAtTime(0.05, time)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.start(time)
      oscillator.stop(time + 0.1)
    }
    playDing(audioCtx.currentTime, 1200)
    playDing(audioCtx.currentTime + 0.1, 1500)
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch (e) {}
}

const triggerHapticDoubleTap = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 50, 10])
  }
}

interface VoiceInputProps {
  value: string
  onChange: (e: any) => void
  placeholder?: string
  className?: string
  iconLeft?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  name?: string
  disabled?: boolean
}

export const VoiceInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  iconLeft, 
  clearable, 
  onClear, 
  name, 
  disabled 
}: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false)
  const [internalValue, setInternalValue] = useState(value || '')

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const startListening = () => {
    if (disabled) return
    
    setIsListening(true)
    playDoubleDing()
    triggerHapticDoubleTap()
    playClick()
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.")
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInternalValue(transcript)
      if (onChange) {
        onChange({ target: { value: transcript, name } })
      }
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleClear = () => {
    if (disabled) return
    setInternalValue('')
    if (onChange) {
      onChange({ target: { value: '', name } })
    }
    if (onClear) onClear()
  }

  return (
    <div className="relative w-full">
      {iconLeft && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A2119]/30">
          {iconLeft}
        </div>
      )}
      <input
        type="text"
        name={name}
        disabled={disabled}
        value={internalValue || ''}
        onChange={(e) => {
          setInternalValue(e.target.value)
          if (onChange) onChange(e)
        }}
        placeholder={placeholder}
        className={`w-full py-4 rounded-[24px] bg-white border border-[#1A2119]/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-[#1A2119] placeholder:text-[#1A2119]/20 shadow-sm ${clearable && internalValue ? 'pr-24' : 'pr-14'} ${iconLeft ? 'pl-12' : 'px-6'} ${className}`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {clearable && internalValue && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-2 text-[#1A2119]/20 hover:text-[#1A2119] rounded-full transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={startListening}
          disabled={disabled}
          className={`p-2.5 rounded-[18px] transition-all flex items-center justify-center disabled:opacity-50
            ${isListening ? 'bg-emerald-500 text-white animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-[#1A2119]/40 hover:bg-[#1A2119]/5'}
          `}
          title="Voice Input"
        >
          <Mic size={20} />
        </button>
      </div>
    </div>
  )
}
