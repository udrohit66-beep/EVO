import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { LogIn, LogOut, PanelLeftClose, PanelLeft, Plus, History, Sparkles, BrainCircuit, Moon, Sun, User, Trash2, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChatInterface from './components/ChatInterface';
import NervousSystem from './components/NervousSystem';
import Logo from './components/Logo';
import MemoryBank from './components/MemoryBank';
import { sounds } from './lib/sounds';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => localStorage.getItem('evo_active_chat'));
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [showMemoryBank, setShowMemoryBank] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Hidden background "Self-Healing" program
  useEffect(() => {
    const healSystem = () => {
      // 1. Storage Integrity Check
      const vKey = 'evo_sys_v';
      const currentV = '1.0';
      const storedV = localStorage.getItem(vKey);
      
      if (storedV !== currentV) {
        console.log(`[Evo Core] System synchronization initiated: ${storedV || 'INIT'} -> ${currentV}`);
        localStorage.setItem(vKey, currentV);
      }

      // 2. Automated Diagnostic Listener
      const handleGlobalFault = (event: ErrorEvent | PromiseRejectionEvent) => {
        const errorMsg = 'reason' in event ? String(event.reason) : (event as ErrorEvent).message;
        
        // Log "Neural" diagnostics
        console.warn(`[Evo Core] Diagnostic captured: ${errorMsg}`);
        
        // Silent recovery for non-fatal patterns
        if (errorMsg?.includes('hydration') || errorMsg?.includes('ResizeObserver')) {
          if (event.preventDefault) event.preventDefault(); // Suppress noise
          return;
        }
      };

      window.addEventListener('error', handleGlobalFault as any);
      window.addEventListener('unhandledrejection', handleGlobalFault as any);

      return () => {
        window.removeEventListener('error', handleGlobalFault as any);
        window.removeEventListener('unhandledrejection', handleGlobalFault as any);
      };
    };

    const cleanup = healSystem();
    return cleanup;
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      localStorage.setItem('evo_active_chat', selectedChatId);
    } else {
      localStorage.removeItem('evo_active_chat');
    }
  }, [selectedChatId]);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setSplashDone(true);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          // Sync user metadata
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newMeta = {
              userId: u.uid,
              displayName: u.displayName,
              email: u.email,
              evolvedTraits: [],
              totalInteractions: 0,
              createdAt: serverTimestamp(),
            };
            try {
              await setDoc(userDocRef, newMeta);
              setUserMetadata(newMeta);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `users/${u.uid}`);
            }
          } else {
            setUserMetadata(userDoc.data());
          }

          // Listen to chats
          const q = query(
            collection(db, 'chats'),
            where('userId', '==', u.uid),
            orderBy('updatedAt', 'desc')
          );
          const unsubChats = onSnapshot(q, (snapshot) => {
            const allChats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setChats(allChats.filter((c: any) => !c.deletedAt));
          });
          return () => unsubChats();
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(splashTimer);
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const createNewChat = async () => {
    if (!user) return;
    sounds.hum();
    try {
      const chatRef = doc(collection(db, 'chats'));
      const chatId = chatRef.id;
      const chatData = {
        chatId: chatId,
        userId: user.uid,
        title: 'New Conversation',
        lastMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(chatRef, chatData);
      setSelectedChatId(chatId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const deleteChat = async (id: string) => {
    if (!user || !id) return;
    try {
      await setDoc(doc(db, 'chats', id), { deletedAt: serverTimestamp() }, { merge: true });
      if (selectedChatId === id) {
        setSelectedChatId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${id}`);
    }
  };

  const purgeAllChats = async () => {
    if (!user || !window.confirm('Are you sure? This will delete all your chats.')) return;
    try {
      const promises = chats.map(chat => 
        setDoc(doc(db, 'chats', chat.id), { deletedAt: serverTimestamp() }, { merge: true })
      );
      await Promise.all(promises);
      setSelectedChatId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'chats/bulk');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {(loading || !splashDone) ? (
        <motion.div 
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
          transition={{ duration: 1, ease: "circOut" }}
          className={`h-screen w-screen flex items-center justify-center transition-colors fixed inset-0 z-50 ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#F7F7F5]'}`}
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0.2],
              scale: [0.9, 1, 0.98],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="flex flex-col items-center gap-8"
          >
            <Logo className={`w-16 h-16 ${isDarkMode ? 'text-white' : 'text-[#141414]'}`} />
            <div className={`text-[9px] uppercase tracking-[0.5em] font-mono opacity-20 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Syncing Evo...
            </div>
          </motion.div>
        </motion.div>
      ) : !user ? (
        <motion.div 
          key="auth"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 p-6 fixed inset-0 z-40"
        >
          <div className="text-center max-w-md w-full space-y-8 flex flex-col items-center">
            <Logo className="w-20 h-20 text-[#141414] mb-4" />
            <div className="space-y-4">
              <h1 className="text-4xl font-extralight tracking-tighter text-stone-900">Evo</h1>
              <p className="text-stone-500 font-light leading-relaxed text-xs">
                A simple space where your AI grows and learns with you.
              </p>
            </div>
            <button 
              onClick={login}
              className="w-full py-4 px-6 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center gap-3 hover:bg-stone-800 transition-all group"
            >
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-light tracking-wide">Enter Evo</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="main"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-screen w-full ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#F0F0EE]'} selection:bg-stone-200 transition-colors duration-500`}
        >
          <div className={`android-shell w-full h-full flex flex-col font-sans ${isDarkMode ? 'dark' : ''}`}>
            {/* Main Content */}
            <div className={`flex-1 flex flex-col relative h-full overflow-hidden transition-colors ${isDarkMode ? 'bg-[#141414]' : 'bg-[#F7F7F5]'}`}>
              <MemoryBank 
                traits={userMetadata?.evolvedTraits || []} 
                chats={chats}
                onSelectChat={setSelectedChatId}
                onDeleteChat={deleteChat}
                onPurgeChats={purgeAllChats}
                onNewChat={createNewChat}
                isOpen={showMemoryBank} 
                onClose={() => setShowMemoryBank(false)}
                isDarkMode={isDarkMode}
                user={user}
                userMetadata={userMetadata}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                onSignOut={() => signOut(auth)}
              />
              
              <header className={`px-6 pt-6 pb-2 z-10 transition-colors backdrop-blur-md border-b ${isDarkMode ? 'bg-[#141414]/80 border-stone-800' : 'bg-white/80 border-[#F0F0EE]'}`}>
                <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
                  <button 
                   onClick={() => { setIsDarkMode(!isDarkMode); sounds.click(); }}
                   className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-stone-800 text-yellow-400' : 'bg-stone-100 text-[#A1A19A]'}`}
                 >
                   {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                 </button>
   
                 <div className="flex flex-col items-center">
                   <Logo 
                     className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${isDarkMode ? 'text-white' : 'text-[#141414]'}`} 
                     onClick={() => { setShowMemoryBank(true); sounds.blip(); }}
                   />
                 </div>
                 
                 <button 
                   onClick={createNewChat}
                   className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-stone-800 text-white' : 'bg-stone-100 text-[#141414]'}`}
                 >
                   <Plus size={18} strokeWidth={3} />
                 </button>
               </div>
              </header>
              
              <main className="flex-1 h-full overflow-hidden relative">
                {selectedChatId ? (
                <ChatInterface 
                  chatId={selectedChatId} 
                  user={user} 
                  userMetadata={userMetadata}
                  setUserMetadata={setUserMetadata}
                  isDarkMode={isDarkMode}
                />
                ) : (
                  <div className={`h-full flex flex-col items-center justify-center p-8 text-center transition-colors ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 ${isDarkMode ? 'bg-stone-900' : 'bg-stone-50'}`}>
                      <Logo className={`w-10 h-10 opacity-20 ${isDarkMode ? 'text-white' : 'text-[#141414]'}`} />
                    </div>
                    <h1 className={`text-2xl font-semibold tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-[#141414]'}`}>Evo.</h1>
                    <p className={`text-xs leading-relaxed mb-8 px-4 opacity-60 ${isDarkMode ? 'text-stone-400' : 'text-[#555550]'}`}>
                      Just start talking. The more we chat, the more I'll remember.
                    </p>
                    <button 
                      onClick={() => { createNewChat(); sounds.hum(); }}
                      className={`w-full max-w-xs py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all ${
                        isDarkMode ? 'bg-white text-black' : 'bg-[#141414] text-white'
                      }`}
                    >
                      Start a New Chat
                    </button>
                  </div>
                )}
              </main>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
