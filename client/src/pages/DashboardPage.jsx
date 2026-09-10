import React, { useState, useEffect } from 'react';
import { 
  FileText, PlusCircle, Share2, Search, Download, Eye, 
  Trash2, Edit3, Pill, Bed, ArrowUpRight, Activity, Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardPage({ setView, setSelectedNoteId, onOpenViewModal }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState(''); // '' for all, 'admission', 'referral'

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.notes.list({ type: activeType, search });
      setNotes(res.notes || []);
    } catch (err) {
      setError(err.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeType, search]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this clinical record and its coupled drug sheet?')) {
      try {
        await api.notes.delete(id);
        fetchNotes();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  const handleDownload = (id, e) => {
    e.stopPropagation();
    window.open(api.notes.getExportDocxUrl(id), '_blank');
  };

  // Stats calculation
  const totalRecords = notes.length;
  const admissionsCount = notes.filter(n => n.type === 'admission').length;
  const referralsCount = notes.filter(n => n.type === 'referral').length;
  const totalMeds = notes.reduce((acc, n) => acc + (n.medication_count || 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Records & Inpatient Charts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admission Notes, Coupled Drug Sheets (MAR), and Referral Transfers in SQLite
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('new-admission')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            + New Admission & Drug Sheet
          </button>
          
          <button
            onClick={() => setView('new-referral')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            + New Referral Note
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Records</p>
            <p className="text-lg font-bold text-slate-900">{totalRecords}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Admissions & Charts</p>
            <p className="text-lg font-bold text-slate-900">{admissionsCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Referrals</p>
            <p className="text-lg font-bold text-slate-900">{referralsCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Coupled Meds</p>
            <p className="text-lg font-bold text-slate-900">{totalMeds}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, reg number, ward, or diagnosis..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border border-slate-200 p-1 rounded-xl bg-slate-50">
          <button
            onClick={() => setActiveType('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeType === '' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalRecords})
          </button>
          <button
            onClick={() => setActiveType('admission')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeType === 'admission' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admissions ({admissionsCount})
          </button>
          <button
            onClick={() => setActiveType('referral')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeType === 'referral' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Referrals ({referralsCount})
          </button>
        </div>
      </div>

      {/* Notes List / Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading clinical records...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">No clinical notes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first admission note (coupled with drug sheet) or inter-facility referral note.
          </p>
          <button
            onClick={() => setView('new-admission')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            + Create Admission Note
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* Responsive Cards for Mobile & Desktop */}
          <div className="grid grid-cols-1 gap-3">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => onOpenViewModal(note.id)}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Patient Info & Diagnosis */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base sm:text-lg text-slate-900 uppercase">
                      {note.patient_name} {note.patient_surname}
                    </span>
                    
                    {note.type === 'admission' ? (
                      <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <Bed className="w-3 h-3" />
                        Inpatient Chart
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        Referral Note
                      </span>
                    )}

                    {note.ward && (
                      <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Ward: {note.ward}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-emerald-950">
                    <strong>Diagnosis:</strong> {note.diagnosis || 'Clinical evaluation'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Reg: <strong>{note.reg_no || 'N/A'}</strong></span>
                    {note.age && <span>Age: {note.age} yrs ({note.gender || '-'})</span>}
                    <span>Doctor: {note.doctor_name || 'MO'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {note.admission_date || note.created_at}
                    </span>
                    {note.type === 'admission' && (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5" />
                        {note.medication_count} Prescribed Meds
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenViewModal(note.id);
                    }}
                    className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    title="View 3-Column Chart & Drug Sheet"
                  >
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">View Chart</span>
                  </button>

                  <button
                    onClick={(e) => handleDownload(note.id, e)}
                    className="p-2 sm:px-3 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Download Word (.docx)"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">DOCX</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNoteId(note.id);
                      setView(note.type === 'admission' ? 'edit-admission' : 'edit-referral');
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    title="Edit Record"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(note.id, e)}
                    className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl text-xs font-semibold transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
