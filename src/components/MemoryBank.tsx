import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Database, Brain, Trash2, Plus, History, Cpu, LogOut, Sun, Moon } from 'lucide-react';
import Logo from './Logo';
import NervousSystem from './NervousSystem';
import { sounds } from '../lib/sounds';

interface MemoryBankProps {
  traits: string[];
  chats: any[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onPurgeChats: () => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  user: any;
  userMetadata: any;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
}

const MemoryBank = memo(({ 
  traits, 
  chats, 
  onSelectChat, 
  onDeleteChat, 
  onPurgeChats, 
  onNewChat,
  isOpen, 
  onClose, 
  isDarkMode, 
  user,
  userMetadata,
  onToggleDarkMode,
  onSignOut
}: MemoryBankProps) => {
  const [activeTab, setActiveTab] = React.useState<'memories' | 'history' | 'system'>('memories');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className={`absolute inset-0 z-50 transition-colors flex flex-col p-8 ${isDarkMode ? 'bg-[#0A0A0A]/98 text-white' : 'bg-[#F7F7F5]/98 text-[#141414]'}`}
        >
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
            <div className="flex items-center mb-10">
              <button 
                onClick={() => { onClose(); sounds.click(); }}
                className={`flex items-center gap-3 group transition-all ${isDarkMode ? 'text-white' : 'text-[#141414]'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-stone-900 group-hover:bg-stone-800' : 'bg-white group-hover:bg-stone-100 shadow-sm'}`}>
                  <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <Logo className="w-8 h-8" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              {[
                { id: 'memories', icon: Brain, label: 'Memories' },
                { id: 'history', icon: History, label: 'Chat History' },
                { id: 'system', icon: Cpu, label: 'Nervous System' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); sounds.click(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') 
                      : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <tab.icon size={12} />
                  <span className="text-[9px]">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
              <AnimatePresence mode="wait">
                {activeTab === 'memories' && (
                  <motion.div
                    key="memories"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid gap-4"
                  >
                    {traits.length > 0 ? (
                      traits.map((trait, i) => (
                        <div
                          key={i}
                          className={`p-4 border rounded-lg group transition-all ${isDarkMode ? 'bg-stone-900/50 border-stone-800 hover:border-stone-600' : 'bg-white border-[#E5E5E1] hover:border-[#141414]'}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'bg-stone-800 group-hover:bg-white' : 'bg-[#F7F7F5] group-hover:bg-[#141414]'}`}>
                              <Brain size={12} className={`transition-colors ${isDarkMode ? 'text-stone-500 group-hover:text-[#141414]' : 'text-[#A1A19A] group-hover:text-white'}`} />
                            </div>
                            <div className="space-y-1">
                              <div className="text-[8px] font-mono text-[#A1A19A] uppercase tracking-widest">Entry #{i + 1}</div>
                              <p className={`text-[12px] font-medium leading-relaxed ${isDarkMode ? 'text-stone-300' : 'text-[#141414]'}`}>{trait}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <Database size={40} className={isDarkMode ? 'text-stone-700' : 'text-stone-300'} />
                        <p className="text-sm font-mono uppercase tracking-widest">No memories stored yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    <button 
                      onClick={() => { onNewChat(); onClose(); sounds.hum(); }}
                      className={`w-full py-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-[10px] transition-all mb-6 ${
                        isDarkMode ? 'border-white bg-white text-black hover:bg-transparent hover:text-white' : 'border-black bg-black text-white hover:bg-transparent hover:text-black'
                      }`}
                    >
                      <Plus size={16} strokeWidth={3} />
                      <span>Start a New Chat</span>
                    </button>

                    {chats.length > 0 ? (
                      chats.map((chat) => (
                        <div 
                          key={chat.id}
                          onClick={() => { onSelectChat(chat.id); onClose(); sounds.blip(); }}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group/chat ${
                            isDarkMode 
                              ? 'bg-stone-900 border-stone-800 hover:border-stone-600 hover:bg-stone-800/80' 
                              : 'bg-white border-[#E5E5E1] hover:border-[#141414] hover:shadow-sm'
                          }`}
                        >
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="block truncate text-[11px] font-bold uppercase tracking-tight">
                                {chat.title || 'Untitled Chat'}
                              </span>
                              <span className="shrink-0 text-[8px] opacity-30 font-mono">
                                {chat.updatedAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                              </span>
                            </div>
                            {chat.lastMessage && (
                              <p className={`text-[10px] truncate opacity-40 line-clamp-1`}>
                                {chat.lastMessage}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onDeleteChat(chat.id); 
                              sounds.click(); 
                            }}
                            className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-500/5 transition-all opacity-0 group-hover/chat:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
                        <History size={40} className="mb-4" />
                        <p className="text-xs font-mono uppercase tracking-widest">No previous chats</p>
                      </div>
                    )}

                    {chats.length > 0 && (
                      <button 
                        onClick={onPurgeChats}
                        className="w-full mt-8 py-3 text-[9px] font-mono font-bold uppercase tracking-widest text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/5 transition-all"
                      >
                        Delete All Chats
                      </button>
                    )}
                  </motion.div>
                )}

                {activeTab === 'system' && (
                  <motion.div
                    key="system"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-12"
                  >
                    <NervousSystem state={userMetadata?.emotionalState || null} isDarkMode={isDarkMode} />
                    
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'}`}>
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-[#A1A19A]">
                          <span>Neural Privacy</span>
                          <span className="text-[#FF5C00]">Secured</span>
                        </div>
                        <p className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                          Your conversations are private. Memories are encrypted and stored solely to help your AI companion understand you better. Delete your data at any time from the History tab.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => { onToggleDarkMode(); sounds.click(); }}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                            isDarkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                          <span className="text-[9px] font-bold uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
                        </button>
                        <button 
                          onClick={() => { onSignOut(); sounds.hum(); }}
                          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-500/10 text-red-500 hover:bg-red-500/5 transition-all"
                        >
                          <LogOut size={20} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default MemoryBank;
