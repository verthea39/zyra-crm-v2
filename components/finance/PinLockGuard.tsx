"use client";

import { useState, useEffect } from "react";
import { Lock, Delete } from "lucide-react";

export function PinLockGuard({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const MASTER_PIN = process.env.NEXT_PUBLIC_FINANCE_PIN || "1234";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === MASTER_PIN) {
        setError(false);
        setTimeout(() => setIsUnlocked(true), 300);
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 800);
      }
    }
  }, [pin, MASTER_PIN]);

  useEffect(() => {
    if (isUnlocked || !mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) setPin((prev) => prev + e.key);
      } else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
        setError(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUnlocked, mounted, pin]);

  if (!mounted) return null; // Avoid hydration mismatch

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC]/90 backdrop-blur-md p-4">
      <div className={`bg-white border border-slate-200 shadow-xl rounded-3xl p-8 max-w-sm w-full mx-auto text-center transition-transform ${error ? 'animate-shake' : ''}`}>
        <div className="bg-[#FDF8F0] text-[#98682E] border border-[#EADBC8] p-4 rounded-2xl mx-auto mb-4 w-16 h-16 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Finance Security Lock</h2>
        <p className="text-xs text-slate-500 mb-8">Enter 4-digit master PIN to access ledger & cash flow</p>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                pin.length > index 
                  ? (error ? 'bg-rose-500' : 'bg-[#98682E]') 
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-rose-500 text-xs font-semibold mb-4 -mt-4 animate-pulse">Incorrect PIN. Please try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => {
                if (pin.length < 4) setPin((prev) => prev + num);
                setError(false);
              }}
              className="h-16 w-16 mx-auto text-xl font-semibold text-slate-800 bg-slate-50 hover:bg-[#FDF8F0] hover:text-[#98682E] border border-slate-200 active:scale-95 rounded-2xl transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="h-16 w-16"></div>
          <button
            onClick={() => {
              if (pin.length < 4) setPin((prev) => prev + "0");
              setError(false);
            }}
            className="h-16 w-16 mx-auto text-xl font-semibold text-slate-800 bg-slate-50 hover:bg-[#FDF8F0] hover:text-[#98682E] border border-slate-200 active:scale-95 rounded-2xl transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={() => {
              setPin((prev) => prev.slice(0, -1));
              setError(false);
            }}
            className="h-16 w-16 mx-auto text-xl font-semibold text-slate-800 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 active:scale-95 rounded-2xl transition-all flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Add custom shake animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}
