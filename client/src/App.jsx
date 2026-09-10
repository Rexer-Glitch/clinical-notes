import React, { useState, useEffect } from 'react';
import { api } from './services/api';

import AppNavbar from './components/AppNavbar';
import MobileBottomNav from './components/MobileBottomNav';
import TreatmentChartModal from './components/TreatmentChartModal';
import AIAssistModal from './components/AIAssistModal';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdmissionNoteFormPage from './pages/AdmissionNoteFormPage';
import ReferralNoteFormPage from './pages/ReferralNoteFormPage';
import TemplateManagerPage from './pages/TemplateManagerPage';

export default function App() {
  const [user, setUser] = useState(() => api.auth.getCurrentUser());
  const [token, setToken] = useState(() => api.auth.getToken());

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Modal State
  const [viewModalNote, setViewModalNote] = useState(null);
  const [viewModalDrugSheet, setViewModalDrugSheet] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // On initial mount, verify current user
  useEffect(() => {
    if (token) {
      api.auth.me().then(res => {
        if (res && res.user) {
          setUser(res.user);
        }
      }).catch(err => {
        console.warn('Session expired:', err.message);
        handleLogout();
      });
    }
  }, [token]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setToken(api.auth.getToken());
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setToken('');
    setCurrentView('dashboard');
  };

  const handleOpenViewModal = async (noteId) => {
    try {
      const res = await api.notes.get(noteId);
      setViewModalNote(res.note);
      setViewModalDrugSheet(res.drugSheet);
    } catch (err) {
      alert('Failed to load chart view: ' + err.message);
    }
  };

  // If not logged in, display login page
  if (!user || !token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <AppNavbar
        currentView={currentView}
        setView={(view) => {
          setSelectedTemplateId(null);
          setCurrentView(view);
        }}
        user={user}
        onLogout={handleLogout}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <DashboardPage
            setView={(view) => {
              setSelectedTemplateId(null);
              setCurrentView(view);
            }}
            setSelectedNoteId={setSelectedNoteId}
            onOpenViewModal={handleOpenViewModal}
          />
        )}

        {currentView === 'new-admission' && (
          <AdmissionNoteFormPage
            noteId={null}
            initialTemplateId={selectedTemplateId}
            setView={(view) => {
              setSelectedTemplateId(null);
              setCurrentView(view);
            }}
            onOpenViewModal={handleOpenViewModal}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {currentView === 'edit-admission' && (
          <AdmissionNoteFormPage
            noteId={selectedNoteId}
            initialTemplateId={null}
            setView={(view) => {
              setSelectedTemplateId(null);
              setCurrentView(view);
            }}
            onOpenViewModal={handleOpenViewModal}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {currentView === 'new-referral' && (
          <ReferralNoteFormPage
            noteId={null}
            initialTemplateId={selectedTemplateId}
            setView={(view) => {
              setSelectedTemplateId(null);
              setCurrentView(view);
            }}
            onOpenViewModal={handleOpenViewModal}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {currentView === 'edit-referral' && (
          <ReferralNoteFormPage
            noteId={selectedNoteId}
            initialTemplateId={null}
            setView={(view) => {
              setSelectedTemplateId(null);
              setCurrentView(view);
            }}
            onOpenViewModal={handleOpenViewModal}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {currentView === 'templates' && (
          <TemplateManagerPage
            setView={setCurrentView}
            onUseTemplate={(template) => {
              setSelectedTemplateId(template.id);
              setCurrentView(template.type === 'referral' ? 'new-referral' : 'new-admission');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        setView={setCurrentView}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* High Fidelity Treatment Chart & Drug Sheet Modal */}
      {viewModalNote && (
        <TreatmentChartModal
          note={viewModalNote}
          drugSheet={viewModalDrugSheet}
          onClose={() => {
            setViewModalNote(null);
            setViewModalDrugSheet(null);
          }}
        />
      )}

      {/* AI Clinical Note & Drug Sheet Assist Modal */}
      <AIAssistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyData={(aiData) => {
          // When AI data is applied, navigate to admission note creation
          setCurrentView('new-admission');
          // Wait a tick for component mount
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('clinical_ai_apply', { detail: aiData }));
          }, 100);
        }}
      />

    </div>
  );
}
