import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { askChatbot } from '@/services/chatService';
import { cn } from '@/lib/utils';

export default function ChatWidget({ topic }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const res = await askChatbot(text, topic);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: "I couldn't process that — please try again." }]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-orange text-white shadow-dialog transition-all duration-200 hover:bg-orange-hover hover:scale-105 active:scale-95"
        aria-label="Open AI mentor chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="animate-slide-fade-in fixed bottom-6 right-6 z-30 flex h-[28rem] w-80 flex-col overflow-hidden rounded-dialog border border-border bg-card shadow-dialog">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-orange" />
          <span className="font-heading font-semibold text-sm text-text-primary">NeuroCode Mentor</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-xs text-text-muted">
            Ask me for a hint about this problem — I won't give you the direct answer, but I'll help you think
            it through.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'animate-slide-fade-in max-w-[85%] rounded-input px-3 py-2 text-xs leading-relaxed',
              m.role === 'user'
                ? 'self-end bg-elevated text-text-primary'
                : 'self-start border-l-2 border-orange bg-card text-text-secondary'
            )}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 self-start text-xs text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for a hint..."
          className="flex-1 rounded-input border border-border bg-elevated px-3 py-2 text-xs text-text-primary outline-none transition-colors duration-200 focus:border-orange"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-input bg-orange text-white transition-all duration-200 hover:bg-orange-hover active:scale-90 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}