import { useEffect, useRef, useState } from 'react';
import { getDiseaseSummary, sendChatMessage } from '../api';

const INITIAL_MESSAGE = {
  role: 'model',
  text: "Hello! I'm Sentinel, your public-health assistant. Ask me about alerts, disease trends, or environmental risks. This demo uses synthetic data and is not medical advice.",
};

const CATEGORY_STYLES = {
  red: 'border-red-500/40 bg-red-500/10 text-red-300',
  yellow: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  ND: 'border-slate-600 bg-slate-800 text-slate-400',
};

function CategoryBadge({ category }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${CATEGORY_STYLES[category] || CATEGORY_STYLES.ND}`}>
      {category}
    </span>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      getDiseaseSummary()
        .then((response) => setSummary(response.data))
        .catch((error) => console.error('Failed to fetch disease summary:', error));
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setLoading(true);
    try {
      const response = await sendChatMessage(text, history, summary);
      const reply = response.data.reply;
      setMessages((current) => [...current, { role: 'model', text: reply }]);
      setHistory((current) => [
        ...current,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: reply }] },
      ]);
    } catch (error) {
      console.error('Chat request failed:', error);
      setMessages((current) => [
        ...current,
        { role: 'model', text: 'I could not reach the assistant right now. Please make sure the API server is running.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setHistory([]);
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <section className="flex h-[min(600px,80vh)] w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-950 shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-100">🤖 Sentinel AI</p>
              <p className="text-[10px] text-gray-500">Public health assistant · Demo</p>
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="rounded border border-slate-600 px-2 py-0.5 text-[10px] text-gray-400">Reset</button>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-lg text-gray-400">×</button>
            </div>
          </header>
          <div className="flex-shrink-0 border-b border-slate-700 bg-slate-900/80 px-3 py-2">
            {summary ? (
              <>
                <div className="mb-1.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-200">Disease intelligence</p>
                    <p className="text-[9px] text-slate-500">{summary.city}, {summary.state} · {summary.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-100">{summary.total.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500">aggregated reports</p>
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {summary.diseaseTotals.slice(0, 4).map((disease) => (
                    <div key={disease.name} className="flex items-center gap-1 whitespace-nowrap rounded bg-slate-800 px-1.5 py-1">
                      <span className="text-[9px] text-slate-300">{disease.name}</span>
                      <span className="text-[9px] font-semibold text-slate-100">{disease.count}</span>
                      <CategoryBadge category={disease.category} />
                    </div>
                  ))}
                </div>
                <div className="mt-1 max-h-20 space-y-0.5 overflow-y-auto pr-1">
                  {summary.wards.map((ward) => (
                    <div key={ward.wardId} className="flex items-center justify-between text-[9px]">
                      <span className="truncate text-slate-400">{ward.wardName}</span>
                      <span className="ml-2 flex items-center gap-1.5">
                        <span className="text-slate-300">{ward.total ? ward.total.toLocaleString() : '—'}</span>
                        <CategoryBadge category={ward.category} />
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[8px] leading-tight text-amber-400/70">{summary.dataNote}</p>
              </>
            ) : (
              <p className="text-[10px] text-slate-500">Loading ward, state and city disease intelligence…</p>
            )}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950 p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-sm bg-sky-600 font-medium text-white' : 'rounded-bl-sm border border-sky-400/30 bg-slate-800 text-slate-50'}`}>
                  {message.role !== 'user' && <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">Sentinel AI</p>}
                  {message.text}
                </div>
              </div>
            ))}
            {loading && <p className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm italic text-slate-300">Sentinel is thinking…</p>}
            <div ref={bottomRef} />
          </div>
          <p className="border-t border-amber-500/20 bg-amber-900/20 px-3 py-1 text-center text-[9px] text-amber-400/80">Synthetic demo data · Not clinical advice</p>
          <div className="flex gap-2 border-t border-slate-700 bg-slate-800/60 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              placeholder="Ask Sentinel…"
              className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-700/60 px-3 py-1.5 text-xs text-gray-100 outline-none focus:border-sky-500"
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Send</button>
          </div>
        </section>
      )}
      <button onClick={() => setOpen((current) => !current)} className="rounded-full bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-sky-500" aria-label="Toggle Sentinel chatbot">
        🤖 Ask Sentinel
      </button>
    </div>
  );
}
