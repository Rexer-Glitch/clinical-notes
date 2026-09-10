import React from 'react';
import { Stethoscope, FileText, Share2, PlusCircle, LayoutTemplate, Sparkles, LogOut, User } from 'lucide-react';

export default function AppNavbar({ currentView, setView, user, onLogout, onOpenAiModal }) {
  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setView('dashboard')}
          >
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-inner flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-tight">
                Gumare Clinical Notes
              </h1>
              <p className="text-xs text-emerald-200/90 font-medium">
                {user ? `${user.hospital_name || 'Gumare Primary Hospital'}` : 'Inpatient & Referral System'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                currentView === 'dashboard' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Patient Records
            </button>

            <button
              onClick={() => setView('new-admission')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                currentView === 'new-admission' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              Admission Note & Drug Sheet
            </button>

            <button
              onClick={() => setView('new-referral')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                currentView === 'new-referral' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <Share2 className="w-4 h-4 text-emerald-300" />
              Referral Note
            </button>

            <button
              onClick={() => setView('templates')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                currentView === 'templates' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </button>

            <button
              onClick={onOpenAiModal}
              className="ml-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 transition flex items-center gap-1.5 shadow-sm"
              title="Transform shorthand into Admission Note + Drug Sheet"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              AI Clinical Assist
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-emerald-700/60">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-emerald-100 font-semibold text-xs border border-emerald-500/40">
                  <User className="w-4 h-4 text-emerald-200" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {user.doctor_name}
                  </span>
                  <span className="text-[11px] text-emerald-200">
                    {user.designation || 'Medical Officer'}
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/60 transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
