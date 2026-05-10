import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Send, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateEvoResponse, reflectOnChat, analyzeEmotionalImpact } from '../services/geminiService';
import Logo from './Logo';
import { sounds } from '../lib/sounds';

interface ChatInterfaceProps {
  chatId: string;
  user: any;
  userMetadata: any;
  setUserMetadata: (data: any) => void;
  isDarkMode?: boolean;
}

const MessageItem = memo(({ message, isDarkMode, user, isNewestAI }: { message: any, isDarkMode: boolean, user: any, isNewestAI: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: message.sender === 'user' ? 20 : -20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ 
        type: 'spring', 
        stiffness: 100, 
        damping: 20,
        duration: 0.6
      }}
      className="group"
    >
      <div className="flex items-center gap-2 mb-2">
       {message.sender === 'user' && <div className="bg-[#FF5C00] w-1.5 h-1.5 rounded-full" />}
       <span className="micro-label !mb-0 !text-[8px]">{message.sender === 'user' ? user.displayName : 'Evo'}</span>
      </div>
      
      <div className={`text-[15px] font-medium leading-[1.6] transition-colors ${
        message.sender === 'user' 
          ? (isDarkMode ? 'text-[#F7F7F5] opacity-40' : 'text-[#141414] opacity-50') 
          : (isDarkMode ? 'text-[#F7F7F5]' : 'text-[#141414]')
      }`}>
        {isNewestAI ? (
          message.content.split(' ').map((word: string, wordIdx: number) => (
            <motion.span
              key={wordIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: wordIdx * 0.02 }}
              className="inline-block mr-1"
            >
              {word}
            </motion.span>
          ))
        ) : (
          message.content
        )}
      </div>
    </motion.div>
  );
});

export default function ChatInterface({ chatId, user, userMetadata, setUserMetadata, isDarkMode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    sounds.hum();

    try {
      // 1. Analyze emotional impact first
      const newEmotionalState = await analyzeEmotionalImpact(currentInput, userMetadata?.emotionalState || null);
      if (newEmotionalState) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { emotionalState: newEmotionalState });
        setUserMetadata({ ...userMetadata, emotionalState: newEmotionalState });
      }

      // 2. Save user message
      const userMessagePath = `chats/${chatId}/messages`;
      try {
        const messageRef = doc(collection(db, userMessagePath));
        const messageId = messageRef.id;
        await setDoc(messageRef, {
          messageId: messageId,
          chatId: chatId,
          sender: 'user',
          content: currentInput,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, userMessagePath);
      }

      // 3. Prepare context for Gemini
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // 4. Generate response
      const aiResponse = await generateEvoResponse(
        currentInput, 
        history as any, 
        userMetadata?.evolvedTraits || [],
        newEmotionalState || userMetadata?.emotionalState || null
      );

      // 5. Save AI message
      const aiMessagePath = `chats/${chatId}/messages`;
      try {
        const aiMessageRef = doc(collection(db, aiMessagePath));
        const aiMessageId = aiMessageRef.id;
        await setDoc(aiMessageRef, {
          messageId: aiMessageId,
          chatId: chatId,
          sender: 'ai',
          content: aiResponse,
          timestamp: serverTimestamp(),
        });
        sounds.blip();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, aiMessagePath);
      }

      // 5. Update chat title/last message if it's the first message
      const chatDocPath = `chats/${chatId}`;
      try {
        await updateDoc(doc(db, chatDocPath), {
          lastMessage: currentInput,
          updatedAt: serverTimestamp(),
          ...(messages.length === 0 ? { title: currentInput.slice(0, 30) + '...' } : {})
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, chatDocPath);
      }

      // 6. Every 5 messages, trigger a reflection to evolve the user
      if ((messages.length + 2) % 10 === 0) {
        const newTraits = await reflectOnChat([...messages, { sender: 'user', content: currentInput }, { sender: 'ai', content: aiResponse }]);
        if (newTraits.length > 0) {
          const userRef = doc(db, 'users', user.uid);
          const currentTraits = userMetadata?.evolvedTraits || [];
          // Merge and deduplicate
          const combinedTraits = Array.from(new Set([...currentTraits, ...newTraits])).slice(0, 50);
          try {
            await updateDoc(userRef, { evolvedTraits: combinedTraits });
            setUserMetadata({ ...userMetadata, evolvedTraits: combinedTraits });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
          }
        }
      }

    } catch (error) {
      console.error("Chat flow error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`h-full flex flex-col transition-colors ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}>
      {/* Header Info */}
      <div className={`px-6 pt-6 mb-4 flex items-center justify-between max-w-2xl mx-auto w-full`}>
        <div>
          <span className="micro-label !text-[8px] !mb-1">Active Chat</span>
          <h1 className={`text-lg font-semibold tracking-tighter truncate leading-tight flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#141414]'}`}>
            <span className="w-1.2 h-1.2 rounded-full bg-[#FF5C00] animate-pulse" />
            {messages.length > 0 ? messages[0].content.slice(0, 24) + '...' : 'New Session'}
          </h1>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-2 pb-24 custom-scrollbar scroll-smooth"
      >
        <div className="max-w-2xl mx-auto w-full px-6 space-y-12">
          {messages.length === 0 && !isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <Logo className={`w-8 h-8 ${isDarkMode ? 'text-stone-800' : 'text-stone-200'}`} />
              <div className="text-[10px] font-mono tracking-tighter text-[#A1A19A] uppercase">Inducing synaptic stream...</div>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <MessageItem 
              key={m.id || i}
              message={m}
              isDarkMode={isDarkMode || false}
              user={user}
              isNewestAI={m.sender === 'ai' && i === messages.length - 1}
            />
          ))}

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-2"
            >
              <div className="flex gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isDarkMode ? 'bg-[#F7F7F5]' : 'bg-[#141414]'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isDarkMode ? 'bg-[#F7F7F5]' : 'bg-[#141414]'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-[#F7F7F5]' : 'bg-[#141414]'}`}></div>
              </div>
              <span className={`mono-label text-[8px] ${isDarkMode ? 'text-stone-500' : ''}`}>Thinking...</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-colors backdrop-blur-sm border-t ${isDarkMode ? 'bg-[#141414]/95 border-stone-800' : 'bg-white/95 border-[#F0F0EE]'}`}>
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-2 max-w-2xl mx-auto w-full"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              sounds.tap();
            }}
            placeholder="Say something..."
            className={`flex-1 transition-all border-[1.5px] rounded-full py-2.5 px-5 text-[13px] font-medium outline-none ${
              isDarkMode 
                ? 'bg-stone-900 border-stone-800 text-[#F7F7F5] focus:border-stone-600 focus:ring-1 focus:ring-stone-800 placeholder:text-stone-700' 
                : 'bg-[#F7F7F5] border-[#141414] text-[#141414] focus:ring-2 focus:ring-stone-100 placeholder:text-[#A1A19A]'
            }`}
            disabled={isTyping}
          />
          <button 
            type="submit"
            onClick={() => sounds.click()}
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-full transition-all ${
              inputValue.trim() && !isTyping 
                ? (isDarkMode ? 'bg-[#F7F7F5] text-[#141414]' : 'bg-[#141414] text-white') 
                : (isDarkMode ? 'bg-stone-900 text-stone-700' : 'bg-[#E5E5E1] text-[#A1A19A]')
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
