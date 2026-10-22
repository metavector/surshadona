import React from 'react';
import { Mic, MicOff, Sparkles, BookOpen } from 'lucide-react';

interface HeaderProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAICoach: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMicActive,
  onToggleMic,
  activeTab,
  onSelectTab,
  onOpenAICoach,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-sm">সু</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-100 whitespace-nowrap shrink-0">
            সুরসাধনা
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => onSelectTab('studio')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'studio'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            লাইভ স্টুডিও
          </button>
          <button
            onClick={() => onSelectTab('harmonium')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'harmonium'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            হারমোনিয়াম
          </button>
          <button
            onClick={() => onSelectTab('guitar-beats')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'guitar-beats'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            গিটার ও বাদ্যযন্ত্র
          </button>
          <button
            onClick={() => onSelectTab('mixer')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'mixer'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            রেকর্ডার ও মিক্সার
          </button>
          <button
            onClick={() => onSelectTab('institute')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'institute'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            ভার্চুয়াল একাডেমি
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAICoach}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-md hover:bg-amber-900/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI ওস্তাদ
          </button>
          <button
            onClick={onToggleMic}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm ${
              isMicActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold'
            }`}
          >
            {isMicActive ? (
              <>
                <MicOff className="w-4 h-4" />
                মাইক বন্ধ
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                গান শুরু করুন
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
