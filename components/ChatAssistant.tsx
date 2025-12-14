import React, { useState, useRef, useEffect } from 'react';
import { getChatResponseStream } from '../services/geminiService';
import { ChatMessage } from '../types';
import { IconMessageCircle, IconZap } from './Icons';
import { GenerateContentResponse } from "@google/genai";

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hi! I'm Volt. Ask me anything about foam cutting, wire temperatures, or CNC setups.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Format history for the API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const streamResponse = await getChatResponseStream(history, userMsg.text);
      
      let fullText = "";
      const modelMsgId = (Date.now() + 1).toString();
      
      // Initial empty message for streaming
      setMessages(prev => [...prev, {
          id: modelMsgId,
          role: 'model',
          text: '',
          timestamp: Date.now()
      }]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || "";
        fullText += textChunk;
        
        setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullText } : msg
        ));
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I sparked out. Could you try asking that again?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full h-[calc(100vh-8rem)] flex flex-col bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mt-4">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-hot-wire-900/50 flex items-center justify-center border border-hot-wire-700">
           <IconZap className="text-hot-wire-500 w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white">Volt Assistant</h3>
          <p className="text-xs text-hot-wire-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-hot-wire-500 animate-pulse"></span>
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-md
                  ${isUser 
                    ? 'bg-hot-wire-600 text-white rounded-br-sm' 
                    : 'bg-slate-700 text-slate-200 rounded-bl-sm border border-slate-600'
                  }`}
              >
                {msg.text || <span className="animate-pulse">...</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 border border-slate-700 focus:border-hot-wire-500 focus:ring-1 focus:ring-hot-wire-500 outline-none transition-all"
            placeholder="Ask about wire thickness, amps..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-hot-wire-500 hover:bg-hot-wire-400 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-hot-wire-900/20"
          >
            <IconMessageCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;