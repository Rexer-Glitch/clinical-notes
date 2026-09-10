import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Loader2, Key, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function AIAssistModal({ isOpen, onClose, onApplyData }) {
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_user_api_key') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);

  if (!isOpen) return null;

  const sampleShortcuts = [
    {
      title: 'Gumare TB Case (from photo)',
      text: '15 yo female RVD unknown, nil comorbidities. CO: productive cough > 2/52 with night sweats, loss of appetite, palpitations, headache, leg pain. Today vitals BP 117/74, P146, T39.7, SpO2 99, RBS 7.5. GeneXpert detected very low, AFB scanty. ECG sinus tachycardia. JACCOLD pallor. Ankles painful. Plan: admit TB ward for isolation, ATT 3 tabs PO OD, Pyridoxime 25mg PO OD, Cefotaxime 1g IV TDS, Paracetamol 1g PO TDS, Ibuprofen 400mg PO TDS, IVF 2L NS/RL over 24h, 4hrly vitals.'
    },
    {
      title: 'Severe Pneumonia Case',
      text: '54 year old male, known diabetic on Metformin. Presents with 4 days pleuritic right chest pain, rust-colored sputum, shortness of breath. Vitals: BP 105/65, P118, T39.2, SpO2 91% on RA. Chest: right basal crackles and bronchial breathing. CXR: right lower lobe consolidation. Plan: Admit medical ward, Ceftriaxone 2g IV OD, Azithromycin 500mg PO OD, Paracetamol 1g PO TDS, IVF 1L Ringers Lactate stat over 2h, O2 3L/min nasal prongs, 4 hourly vitals.'
    },
    {
      title: 'Hypertensive Urgency',
      text: '62 year old female, known hypertensive default meds 3 weeks. Presents with severe occipital headache and dizziness. Vitals: BP 195/115 mmHg, P88, T36.8, SpO2 98%. Fundoscopy grade 2 changes. Plan: Amlodipine 10mg PO OD, Hydrochlorothiazide 25mg PO OD, Enalapril 10mg PO BD, strict BP monitoring 2 hourly.'
    }
  ];

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('Please provide clinical notes or select a sample preset.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (apiKey) {
        localStorage.setItem('gemini_user_api_key', apiKey.trim());
      }
      const response = await api.ai.formatNote(inputText, apiKey.trim());
      setParsedResult(response);
    } catch (err) {
      setError(err.message || 'Failed to process note');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (parsedResult && parsedResult.data) {
      onApplyData(parsedResult.data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-400 text-slate-900 p-1.5 rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">AI Clinical Note & Drug Sheet Assist</h3>
              <p className="text-xs text-emerald-200">
                Transform rough doctor shorthand into structured Admission Notes & Coupled Drug Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Shortcuts */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Select Quick Clinical Preset or type below:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sampleShortcuts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(s.text)}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-lg transition"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Clinician Shorthand / Dictation / Clinical Notes:
            </label>
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 15F TB ward admission, productive cough 2 wks, vitals BP 117/74, P146, T39.7, SpO2 99. GeneXpert detected. Plan: ATT 3 tabs OD, Pyridoxime 25mg OD, Cefotaxime 1g IV TDS, Paracetamol 1g TDS, IVF 2L NS over 24h, 4hrly vitals..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none leading-relaxed"
            />
          </div>

          {/* Optional Gemini API Key */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Gemini API Key (Optional)
              </span>
              <span className="text-[11px] text-slate-400">
                {apiKey ? 'Configured' : 'Offline engine active'}
              </span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to use built-in offline clinical engine)"
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              The built-in offline parser works 100% without an API key. Supplying a Gemini API key adds advanced generative structuring.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Result Preview if parsed */}
          {parsedResult && parsedResult.data && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully Structured! (Source: {parsedResult.source})
                </span>
                <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-medium">
                  {parsedResult.data.diagnosis || 'Clinical Admission'}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-800">
                <p><strong>Patient / Ward:</strong> {parsedResult.data.patient_name} {parsedResult.data.patient_surname} | Ward: {parsedResult.data.ward}</p>
                <p><strong>Demographics:</strong> {parsedResult.data.age} yrs • {parsedResult.data.gender} • {parsedResult.data.rvd_status}</p>
                <p><strong>Medications Parsed:</strong> {parsedResult.data.drug_sheet?.medications?.map(m => `${m.drug} ${m.dose} (${m.frequency})`).join(', ') || 'None'}</p>
                <p><strong>IV Fluids:</strong> {parsedResult.data.drug_sheet?.iv_fluids?.map(f => f.fluid).join(', ') || 'None'}</p>
                <p><strong>Monitoring:</strong> {parsedResult.data.drug_sheet?.monitoring_orders?.vitals_frequency || '4 hourly'}</p>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
              >
                Apply to Admission Note & Coupled Drug Sheet
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={loading}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Clinical Notes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Format with AI Assist
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
