import React, { useState } from 'react';
import { useAiChatMutation } from '../../services/api';
import { Send, ShieldAlert, AlertTriangle, Bot } from 'lucide-react';

interface AiTabProps {
  role: string;
}

export default function AiTab({ role }: AiTabProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Welcome to the AI Assistant Hub! Ask me anything about our expense policy limits, category tagging guidelines, or audit compliance rules.' }
  ]);
  const [loading, setLoading] = useState(false);

  const [aiChat] = useAiChatMutation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userText = message;
    setMessage('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const result = await aiChat({ message: userText }).unwrap();
      if (result.status === 200) {
        setChatHistory((prev) => [...prev, { sender: 'bot', text: result.data.reply }]);
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'bot', text: 'Error: Could not retrieve response from AI assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-glass-border pb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white">AI Assistant Hub</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">Interact with our AI chatbot to query policies or audit anomalies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Chatbot Interface */}
        <div className="md:col-span-2 glass-card rounded-xl flex flex-col h-[500px] border border-glass-border">
          <div className="p-4 border-b border-glass-border flex items-center gap-2 bg-white/2">
            <div className="w-2.5 h-2.5 rounded-full bg-electric-blue animate-pulse" />
            <span className="font-semibold text-xs text-white font-mono uppercase tracking-wider">Policy Assistant Chatbot</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3.5 rounded-lg border leading-relaxed ${
                  chat.sender === 'user'
                    ? 'bg-primary-container/20 border-primary-container/40 text-white'
                    : 'bg-surface-bright/30 border-glass-border text-on-surface'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 p-3 rounded-lg bg-surface-bright/20 border border-glass-border text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-glass-border flex gap-3">
            <input
              type="text"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 glass-input rounded-lg px-4 py-3 text-xs text-white focus:outline-none"
              placeholder="Ask about meals, travel limits, or audit events..."
            />
            <button
              type="submit"
              className="px-4 bg-primary text-slate-900 rounded-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Statistical Outliers Anomalies */}
        <div className="glass-card rounded-xl p-6 flex flex-col h-[500px] border border-glass-border">
          <h4 className="font-semibold text-sm text-white mb-2 flex items-center gap-2 uppercase font-mono tracking-wider">
            <ShieldAlert size={18} className="text-ruby-violation" /> AI Anomalies Feed
          </h4>
          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
            Real-time statistical outliers, suspicious duplicate patterns, or off-hours claims flags.
          </p>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="p-4 border border-glass-border rounded-lg bg-ruby-violation/5 hover:bg-ruby-violation/10 transition-all">
              <div className="flex justify-between items-center text-xs font-semibold text-ruby-violation mb-2">
                <span className="font-bold">Off-hours claim</span>
                <span className="px-2 py-0.5 rounded bg-ruby-violation/10 font-mono text-[9px]">MEDIUM</span>
              </div>
              <p className="text-xs text-white">Expense claimed at 2:00 AM on Sunday morning.</p>
              <span className="block text-xs font-mono font-bold text-white mt-2">$85.00 USD</span>
            </div>

            <div className="p-4 border border-glass-border rounded-lg bg-ruby-violation/5 hover:bg-ruby-violation/10 transition-all">
              <div className="flex justify-between items-center text-xs font-semibold text-ruby-violation mb-2">
                <span className="font-bold">Duplicate Vendor</span>
                <span className="px-2 py-0.5 rounded bg-ruby-violation/10 font-mono text-[9px]">HIGH</span>
              </div>
              <p className="text-xs text-white">Three duplicate transactions at "Uber" within 1 hour interval.</p>
              <span className="block text-xs font-mono font-bold text-white mt-2">$45.00 USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
