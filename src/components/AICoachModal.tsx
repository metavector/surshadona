import React, { useState } from 'react';
import { X, Sparkles, Send, Music2, Loader2, BookOpen } from 'lucide-react';
import { NoteName } from '../types';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocalKey: NoteName;
  initialSongQuery?: string;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  vocalKey,
  initialSongQuery = '',
}) => {
  const [prompt, setPrompt] = useState(initialSongQuery || '');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (userQuery?: string) => {
    const q = userQuery || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          vocalKey,
          language: 'bn',
        }),
      });

      const data = await res.json();
      if (data.success && data.feedback) {
        setResponse(data.feedback);
      } else {
        setError(data.error || 'পরামর্শ তৈরি করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      setError(err.message || 'সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'আমার গলার স্কেল নির্ধারণ ও রেওয়াজের সঠিক নিয়ম কী?',
    'হারমোনিয়ামে আঙুল দ্রুত চালানোর সঠিক টেকনিক কী?',
    'গানের সময় দম/শ্বাস নিয়ন্ত্রণ কীভাবে বাড়াব?',
    'গিটার আর হারমোনিয়াম একসাথে কীভাবে সুর মেলাব?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-100 text-base">
                AI সঙ্গীত ওস্তাদ ও ভোকাল কোচ
              </h3>
              <p className="text-xs text-neutral-400">
                সা-রে-গা-মা রেওয়াজ, হারমোনিয়াম স্বরলিপি ও সুরের শুদ্ধতা গাইড
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Preset Chips */}
          <div>
            <span className="text-xs text-neutral-400 block mb-2 font-medium">
              দ্রুত প্রশ্নসমূহ:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(sq);
                    handleAsk(sq);
                  }}
                  className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-xs text-neutral-300 rounded-lg border border-neutral-800 transition-colors text-left"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Display */}
          {loading && (
            <div className="p-6 text-center flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">
                AI ওস্তাদ আপনার জন্য সঙ্গীত বিশ্লেষণ করছেন...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {response && !loading && (
            <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold border-b border-neutral-800/80 pb-2">
                <Music2 className="w-4 h-4" />
                <span>ওস্তাদের পরামর্শ ও গাইডলাইন:</span>
              </div>
              <div className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="আপনার গানের প্রশ্ন বা গানের নাম লিখুন..."
            className="flex-1 bg-neutral-900 text-neutral-100 text-xs px-3.5 py-2.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            জিজ্ঞাসা
          </button>
        </div>
      </div>
    </div>
  );
};
