import React from 'react';
import { FileText, PlusCircle, Share2, LayoutTemplate, Sparkles } from 'lucide-react';

export default function MobileBottomNav({ currentView, setView, onOpenAiModal }) {
  const navItems = [
    { id: 'dashboard', label: 'Patients', icon: FileText },
    { id: 'new-admission', label: '+ Admission', icon: PlusCircle },
    { id: 'new-referral', label: '+ Referral', icon: Share2 },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'ai-assist', label: 'AI Assist', icon: Sparkles, action: onOpenAiModal },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl py-1 px-2 no-print safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setView(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-1 rounded-xl transition ${
                isActive
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100' : ''}`}>
                <Icon className={`w-5 h-5 ${item.id === 'ai-assist' ? 'text-amber-500' : ''}`} />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
