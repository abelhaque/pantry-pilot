import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success
            if (navigator.vibrate) {
              navigator.vibrate(200); // Strong haptic vibration
            }
            // Play click sound using Web Audio API
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
              gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.1); // 100ms beep
            } catch (e) {
              console.error("Audio play failed", e);
            }
            
            scanner.stop().then(() => {
              onScan(decodedText);
            });
          },
          (errorMessage) => {
            // Ignore scan errors as they happen constantly while scanning
          }
        );
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError("Camera access blocked by browser. Please type the barcode below.");
      }
    };

    startScanner();

    return () => {
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {});
        }
      } catch (e) {
        // Ignore
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-off-white rounded-[20px] overflow-hidden shadow-2xl relative"
      >
        <div className="p-4 flex items-center justify-between bg-primary text-white">
          <div className="flex items-center gap-2">
            <Camera size={20} />
            <h3 className="font-serif font-bold text-lg">Scan Barcode</h3>
          </div>
          <button onClick={() => {
            try {
              scannerRef.current?.stop().then(onClose).catch(() => onClose());
            } catch (e) {
              onClose();
            }
          }} className="text-white/80 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          {error ? (
            <div className="text-red-500 text-center p-4 bg-red-50 rounded-xl mb-4 font-medium">
              {error}
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black mb-4">
              <div id="reader" className="w-full" style={{ minHeight: '300px' }}></div>
              {/* Scanner overlay styling */}
              <div className="absolute inset-0 border-2 border-primary/30 pointer-events-none z-10"></div>
            </div>
          )}
          
          {!error && (
            <p className="text-center text-sm text-zinc-500 mt-4 font-medium">
              Position the barcode within the frame to scan.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
