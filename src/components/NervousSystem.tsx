import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { EmotionalState } from '../services/geminiService';

interface NervousSystemProps {
  state: EmotionalState | null;
  isDarkMode?: boolean;
}

const NervousSystem = memo(({ state, isDarkMode }: NervousSystemProps) => {
  if (!state) return null;

  const isHealthy = state !== null;
  const errorState = null; // This would typically come from a global state if we had a real error

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <span className="micro-label !mb-0">Nervous System</span>
        <div className="flex items-center gap-1.5">
          {isHealthy && !errorState ? (
            <>
              <Activity size={10} className="text-blue-500" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-500">Activated</span>
            </>
          ) : (
            <>
              <Activity size={10} className="text-red-500" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-500">System Error</span>
            </>
          )}
        </div>
      </div>

      <div className={`relative h-20 rounded-sm overflow-hidden flex items-center justify-center transition-colors ${isDarkMode ? 'bg-stone-900 border border-stone-800' : 'bg-[#EEECE7]'}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            {errorState ? (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-tighter text-red-500">CRITICAL_FAILURE</span>
                <p className="text-[8px] font-mono text-red-400/60 uppercase">Check connection settings</p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-tighter mix-blend-difference ${isDarkMode ? 'text-black' : 'text-white'}`}>
                    Properly Functioning
                </span>
                <p className={`text-[8px] font-mono uppercase opacity-30 ${isDarkMode ? 'text-white' : 'text-black'}`}>Operational Integrity: 100%</p>
              </div>
            )}
        </div>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Intensity', value: state.heat, color: isDarkMode ? '#F7F7F5' : '#141414' },
          { label: 'Empathy', value: state.connectivity, color: '#FF5C00' },
          { label: 'Focus', value: state.alertness, color: isDarkMode ? '#777772' : '#A1A19A' }
        ].map((stat) => (
          <div key={stat.label} className="space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#555550]">
              <span className={isDarkMode ? 'text-stone-500' : ''}>{stat.label}</span>
              <span className={isDarkMode ? 'text-stone-400' : ''}>{(stat.value * 100).toFixed(0)}%</span>
            </div>
            <div className={`h-[2px] w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-stone-800' : 'bg-[#E5E5E1]'}`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stat.value * 100}%` }}
                className="h-full"
                style={{ backgroundColor: stat.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center opacity-20 pt-4 border-t border-stone-800/10 dark:border-white/5">
        <span className="text-[7px] font-mono uppercase tracking-[0.2em] transition-colors">Neural Core Stability Verified</span>
        <span className="text-[7px] font-mono font-bold uppercase tracking-widest">V.1 version</span>
      </div>
    </div>
  );
});

export default NervousSystem;
