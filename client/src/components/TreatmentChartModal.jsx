import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, Copy, X, Check, FileCheck, Layers, FileText, Pill, 
  Palette, ChevronDown, CheckCircle2, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import OnlineLayoutDesignerModal from './OnlineLayoutDesignerModal';

const TIME_LABELS = ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'];

export default function TreatmentChartModal({ note, drugSheet, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'treatment', 'drugsheet'

  if (!note) return null;
  const raw = note.raw_data || {};
  const isReferral = note.type === 'referral';

  // Available Word (.docx) & Online Layout Designs
  const [designs, setDesigns] = useState([]);
  const [selectedDesignFilename, setSelectedDesignFilename] = useState(() => {
    return raw.design_filename || raw.template_filename || (isReferral ? 'referral_and_report_form_template.docx' : 'admission_template.docx');
  });
  const [layoutConfig, setLayoutConfig] = useState(() => raw.layout_config || null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isDesignDropdownOpen, setIsDesignDropdownOpen] = useState(false);
  const [designFeedback, setDesignFeedback] = useState('');

  // Fetch available designs on mount
  useEffect(() => {
    api.templates.listDocxFiles(note.type).then(res => {
      if (res && res.files) {
        setDesigns(res.files);
        // If current design has layout config, load it
        const matched = res.files.find(f => f.filename === selectedDesignFilename);
        if (matched?.layout_config && !layoutConfig) {
          setLayoutConfig(matched.layout_config);
        }
      }
    }).catch(err => console.warn('Could not load docx designs:', err));
  }, [note.type]);

  const handleSelectDesign = async (design) => {
    setSelectedDesignFilename(design.filename);
    setIsDesignDropdownOpen(false);
    if (design.layout_config) {
      setLayoutConfig(design.layout_config);
    }
    try {
      await api.notes.updateDesign(note.id, {
        design_filename: design.filename,
        layout_config: design.layout_config || layoutConfig,
        template_id: design.template_id || note.template_id
      });
      setDesignFeedback(`Applied: ${design.name}`);
      setTimeout(() => setDesignFeedback(''), 3000);
    } catch (err) {
      console.warn('Could not persist design update:', err);
    }
  };

  const downloadDocx = (overrideFilename = null, docType = null) => {
    let tpl = overrideFilename || selectedDesignFilename;
    let url = api.notes.getExportDocxUrl(note.id, tpl);
    if (docType) {
      url += (url.includes('?') ? '&' : '?') + `type=${encodeURIComponent(docType)}`;
    }
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const copyText = () => {
    const textToCopy = formatPlainText(note, raw, drugSheet);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Resolve dynamic styling from layout config
  const accentColor = layoutConfig?.styling?.accentColor || (isReferral ? '#1e3a8a' : '#059669');
  const fontClass = layoutConfig?.styling?.fontFamily === 'serif' ? 'font-serif' : (layoutConfig?.styling?.fontFamily === 'mono' ? 'font-mono' : 'font-sans');
  const badgeStyle = layoutConfig?.styling?.timeBadgeStyle || 'circle';
  const slotCount = Math.min(10, Math.max(2, parseInt(layoutConfig?.styling?.drugSlots || 5, 10)));

  // Helper to check if a specific time is scheduled for a medication
  const isTimeScheduled = (med, timeLabel) => {
    if (!med) return false;
    if (Array.isArray(med.admin_times) && med.admin_times.length > 0) {
      return med.admin_times.some(t => t.toLowerCase().replace(/\s+/g, '') === timeLabel.toLowerCase().replace(/\s+/g, ''));
    }
    const freq = (med.frequency || '').toUpperCase();
    if ((freq === 'OD' || freq === 'MANE') && timeLabel === '6 am') return true;
    if (freq === 'BD' && (timeLabel === '6 am' || timeLabel === '6 pm')) return true;
    if (freq === 'TDS' && (timeLabel === '6 am' || timeLabel === '2 pm' || timeLabel === '10 pm')) return true;
    if ((freq === 'QID' || freq === 'QDS') && (timeLabel === '6 am' || timeLabel === '12 md' || timeLabel === '6 pm' || timeLabel === '12 mn')) return true;
    if (freq === 'NOCTE' && timeLabel === '10 pm') return true;
    return false;
  };

  // Prepare medication slots for the MH 005 sheet
  const rawMeds = drugSheet?.medications || [];
  const drugSlots = Array.from({ length: slotCount }).map((_, idx) => rawMeds[idx] || null);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="bg-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isReferral ? 'Clinical Referral Summary' : 'Gumare Primary Hospital - Medical Records'}
              </h3>
              <span className="text-[11px] text-slate-300">
                {note.patient_name} {note.patient_surname} • Ward: {note.ward || 'General'}
              </span>
            </div>
          </div>

          {/* Tab Selector (for Inpatient Admission) */}
          {!isReferral && (
            <div className="flex items-center bg-slate-700/80 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Both (Print All)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('treatment')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'treatment' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Treatment Chart
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('drugsheet')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'drugsheet' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                Drug Sheet (MH 005)
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyText}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1.5 transition"
              title="Copy Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {isReferral ? (
              <button
                onClick={() => downloadDocx('referral_and_report_form_template.docx')}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition shadow-sm"
                title="Download Official Referral Form (.docx)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export .docx</span>
              </button>
            ) : activeTab === 'treatment' ? (
              <button
                onClick={() => downloadDocx('admission_template.docx', 'admission')}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition shadow-sm"
                title="Download Authentic Treatment Chart (.docx)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Chart (.docx)</span>
              </button>
            ) : activeTab === 'drugsheet' ? (
              <button
                onClick={() => downloadDocx('drugsheet_template.docx', 'drug_sheet')}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition shadow-sm"
                title="Download Authentic Drug Sheet MH 005 (.docx)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Drug Sheet (.docx)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => downloadDocx('admission_template.docx', 'admission')}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition shadow-sm"
                  title="Download Authentic Treatment Chart (.docx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chart (.docx)</span>
                </button>
                <button
                  onClick={() => downloadDocx('drugsheet_template.docx', 'drug_sheet')}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition shadow-sm"
                  title="Download Authentic Drug Sheet MH 005 (.docx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Drug Sheet (.docx)</span>
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-sm"
              title="Print or Save PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Design Selected Bar & In-Depth Designer Trigger (No-Print) */}
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-white no-print">
          <div className="flex items-center gap-2 relative">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              Current Design Selected:
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDesignDropdownOpen(!isDesignDropdownOpen)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-semibold text-emerald-400 flex items-center gap-1.5 shadow-sm transition"
              >
                <span className="truncate max-w-[200px] sm:max-w-[320px]">
                  {designs.find(d => d.filename === selectedDesignFilename)?.name || selectedDesignFilename}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {isDesignDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-700 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Available Word (.docx) & Online Layouts
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-700/50">
                    {designs.map(d => (
                      <button
                        key={d.template_id || d.filename}
                        type="button"
                        onClick={() => handleSelectDesign(d)}
                        className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2 hover:bg-slate-700/70 transition ${
                          selectedDesignFilename === d.filename ? 'bg-emerald-950/40 text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold text-xs truncate">{d.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{d.filename}</p>
                        </div>
                        {selectedDesignFilename === d.filename && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {designFeedback && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3" />
                {designFeedback}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDesignerOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>In-Depth Layout Designer</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex-1 print:p-0 print:bg-white">
          
          <div className="space-y-8 max-w-4xl mx-auto">

            {isReferral ? (
              /* REFERRAL AND REPORT FORM - BOTSWANA HOSPITAL STANDARD LAYOUT */
              <div className="bg-white p-6 sm:p-10 rounded-xl shadow-md border border-black print:shadow-none print:border-none print:p-0 text-black space-y-6 font-sans">
                
                {/* Document Main Title */}
                <div className="text-center border-b-2 border-black pb-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-wider uppercase">
                    REFERRAL AND REPORT FORM
                  </h2>
                </div>

                {/* UPPER BOX: REPORT FORM - TO BE COMPLETED BY REPORTING OFFICER* */}
                <div className="border border-black p-4 space-y-3 bg-slate-50/50 print:bg-transparent">
                  <div className="flex justify-between items-center border-b border-black pb-1 font-bold text-xs uppercase tracking-wide">
                    <span>REPORT FORM: TO BE COMPLETED BY REPORTING OFFICER*</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold">REPORTING OFFICER:</span>
                      <span className="ml-2 font-mono text-slate-400">___________________________</span>
                    </div>
                    <div>
                      <span className="font-semibold">HEALTH UNIT:</span>
                      <span className="ml-2 font-mono text-slate-400">___________________________</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs border-t border-slate-300 pt-2">
                    <div className="col-span-2">
                      <span className="font-semibold">PATIENT'S NAME:</span>
                      <span className="ml-2 uppercase font-bold text-slate-700">{note.patient_name} {note.patient_surname}</span>
                    </div>
                    <div>
                      <span className="font-semibold">AGE:</span> <span className="font-bold">{note.age ? `${String(note.age).replace(/\s*(years?|months?|yrs?|mos?)\b/gi, '').trim()} ${raw.age_unit || (/month/i.test(String(note.age)) ? 'months' : 'years')}` : '___'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">SEX:</span> <span className="font-bold">{note.gender || '___'}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-2 pt-1">
                    <div>
                      <span className="font-semibold">FINAL DIAGNOSIS:</span>
                      <span className="block border-b border-dashed border-slate-400 min-h-[22px] mt-0.5"></span>
                    </div>
                    <div>
                      <span className="font-semibold">OPERATION AND PROCEDURES:</span>
                      <span className="block border-b border-dashed border-slate-400 min-h-[22px] mt-0.5"></span>
                    </div>
                    <div>
                      <span className="font-semibold">FOLLOW-UP CARE INSTRUCTIONS:</span>
                      <span className="block border-b border-dashed border-slate-400 min-h-[22px] mt-0.5"></span>
                      <span className="block border-b border-dashed border-slate-400 min-h-[22px] mt-1"></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200">
                    <div>
                      <span className="font-semibold">DATE:</span>
                      <span className="ml-2 font-mono text-slate-400">____________________</span>
                    </div>
                    <div>
                      <span className="font-semibold">SIGNATURE:</span>
                      <span className="ml-2 font-mono text-slate-400">___________________________</span>
                    </div>
                  </div>
                </div>

                {/* LOWER BOX: REPORT FORM - TO BE COMPLETED BY THE REFERRING OFFICER* */}
                <div className="border-2 border-black p-4 space-y-4">
                  <div className="border-b border-black pb-1 font-bold text-xs uppercase tracking-wide flex justify-between items-center">
                    <span>REPORT FORM: TO BE COMPLETED BY THE REFERRING OFFICER*</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                      Transferring Health Unit
                    </span>
                  </div>

                  {/* Patient Demographics & Officer Header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pb-2 border-b border-black">
                    <div className="sm:col-span-2">
                      <span className="font-bold">PATIENT'S NAME: </span>
                      <span className="font-bold uppercase text-blue-950 font-serif text-sm">
                        {note.patient_name} {note.patient_surname}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold">AGE: </span>
                      <span className="font-serif font-bold text-blue-950">{note.age || '31'}</span>
                    </div>
                    <div>
                      <span className="font-bold">SEX: </span>
                      <span className="font-serif font-bold text-blue-950">{note.gender || 'M'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-bold">REFERRING OFFICER: </span>
                      <span className="font-serif font-bold text-blue-950">{note.doctor_name || 'DR. GUMBO'}</span>
                    </div>
                    <div>
                      <span className="font-bold">HEALTH UNIT: </span>
                      <span className="font-serif font-bold text-blue-950">{raw.hospital_name || note.hospital_name || 'GPH'}</span>
                    </div>
                    <div>
                      <span className="font-bold">ADM. NO: </span>
                      <span className="font-serif font-bold text-blue-950">{note.reg_no || 'GPH-2026-0683'}</span>
                    </div>
                  </div>

                  {/* Tentative Diagnosis / Reason for Referral */}
                  <div className="text-xs">
                    <div className="font-bold uppercase tracking-tight text-slate-900">
                      TENTATIVE DIAGNOSIS / REASON FOR REFERRAL:
                    </div>
                    <div className="mt-1 p-2 bg-amber-50/50 border border-amber-200 rounded font-serif font-bold text-sm text-red-950">
                      {note.diagnosis || raw.reason_for_referral || 'POSSIBLE INTRAABDOMINAL BLEEDING'}
                    </div>
                  </div>

                  {/* Significant History, Current Treatment, Known Allergies */}
                  <div className="text-xs space-y-1.5">
                    <div className="font-bold uppercase tracking-tight text-slate-900">
                      SIGNIFICANT HISTORY, CURRENT TREATMENT, KNOWN ALLERGIES:
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-300 rounded font-serif text-xs sm:text-[13px] leading-relaxed text-slate-950 whitespace-pre-wrap">
                      {raw.clinical_history || 'No detailed history recorded.'}
                    </div>
                  </div>

                  {/* Optional Breakdown: Vitals & Investigations (if separated) */}
                  {(raw.vital_signs || raw.investigations || raw.treatment_given) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs border border-slate-300 p-2.5 rounded bg-slate-50/70">
                      {raw.vital_signs && (
                        <div>
                          <strong className="block text-slate-700">Vitals:</strong>
                          <span className="font-serif">{raw.vital_signs}</span>
                        </div>
                      )}
                      {raw.investigations && (
                        <div>
                          <strong className="block text-slate-700">Investigations:</strong>
                          <span className="font-serif">{raw.investigations}</span>
                        </div>
                      )}
                      {raw.treatment_given && (
                        <div>
                          <strong className="block text-slate-700">Treatment:</strong>
                          <span className="font-serif">{raw.treatment_given}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Line: Referral To, Date, Signature */}
                  <div className="pt-3 border-t-2 border-black grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                    <div>
                      <span>REFERRAL TO: </span>
                      <span className="font-serif font-bold text-blue-950 text-sm ml-1">
                        {raw.receiving_hospital || 'NRH'}
                      </span>
                    </div>
                    <div>
                      <span>DATE: </span>
                      <span className="font-serif font-bold text-blue-950 ml-1">
                        {note.admission_date || '21/03/26'}
                      </span>
                    </div>
                    <div>
                      <span>SIGNATURE: </span>
                      <span className="font-serif font-bold italic text-blue-950 text-sm ml-1 underline decoration-dotted">
                        {note.doctor_name || 'DR. GUMBO'}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <>
                {/* PAGE 1: 3-COLUMN TREATMENT CHART (Visible if tab is 'all' or 'treatment') */}
                {(activeTab === 'all' || activeTab === 'treatment') && (
                  <div className="bg-white p-6 sm:p-10 rounded-xl shadow-md border border-slate-300 print:shadow-none print:border-none print:p-0 text-slate-900 space-y-5">
                    
                    {/* Header matching Photo 1 */}
                    <div className="text-sm border-b-2 border-slate-800 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs sm:text-sm">Hospital: <span className="font-semibold">{raw.hospital_name || note.hospital_name || 'Gumare Primary Hospital'}</span></p>
                          <h2 className="text-lg sm:text-xl font-bold tracking-tight uppercase mt-1">
                            {raw.document_title || 'TREATMENT CHART'}
                          </h2>
                        </div>
                        <div className="border border-slate-400 p-2 min-w-[140px] text-right bg-slate-50">
                          <span className="text-[11px] uppercase font-bold text-slate-600 block">Reg. NO.</span>
                          <span className="font-mono text-sm font-bold">{note.reg_no || '___________'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-200 text-xs sm:text-sm">
                        <div>
                          <span className="text-slate-500">First name:</span> <strong className="uppercase">{note.patient_name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Surname:</span> <strong className="uppercase">{note.patient_surname}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Ward:</span> <strong>{note.ward || 'TB'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Diagnosis:</span> <strong className="text-emerald-900">{note.diagnosis || 'TB'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3-Column Treatment Chart Table (Exact reproduction of Photo 1) */}
                    <table className="treatment-table text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-100 font-bold uppercase text-[11px] sm:text-xs">
                          <th className="w-[18%] text-center py-2">DATE</th>
                          <th className="w-[64%] text-center py-2">TREATMENT</th>
                          <th className="w-[18%] text-center py-2">SIGNATURE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="align-top">
                          <td className="text-center font-mono py-3 px-2 text-xs">
                            {note.admission_date || '01/09/26 16:42'}
                          </td>

                          <td className="py-3 px-3 sm:px-4 space-y-3 leading-relaxed">
                            <div className="font-bold uppercase text-xs tracking-wide text-slate-800 border-b border-slate-200 pb-1">
                              ADMISSION NOTES - {note.doctor_name || 'DR GUMBO'}
                            </div>

                            <div>
                              <p>{(() => {
                                if (!note.age) return '';
                                const isMonths = (raw.age_unit || '').toLowerCase() === 'months' || /month/i.test(String(note.age));
                                const ageUnit = isMonths ? 'month' : 'year';
                                const cleanAge = String(note.age).replace(/\s*(years?|months?|yrs?|mos?)\b/gi, '').trim() || note.age;
                                return `${cleanAge} ${ageUnit} old ${note.gender ? note.gender.toLowerCase() : 'patient'}`;
                              })()}{raw.rvd_status ? `, ${raw.rvd_status}` : ''}</p>
                              <p>{raw.comorbidities || 'Nil known comorbidities'}</p>
                            </div>

                            {raw.chief_complaint && (
                              <p><strong>CO:</strong> {raw.chief_complaint}</p>
                            )}

                            {raw.history_present_illness && (
                              <p className="whitespace-pre-line">{raw.history_present_illness}</p>
                            )}

                            {/* Vital Signs & Today Management */}
                            {/* Vital Signs & Clinical Examination */}
                            {(() => {
                              const v = raw.vitals_recorded || raw.vitals;
                              const vParts = [];
                              if (v && typeof v === 'object') {
                                if (v.cwt && String(v.cwt).trim()) vParts.push(`Wt ${String(v.cwt).trim()}${/kg/i.test(v.cwt) ? '' : ' kg'}`);
                                else if (v.weight && String(v.weight).trim()) vParts.push(`Wt ${String(v.weight).trim()}${/kg/i.test(v.weight) ? '' : ' kg'}`);
                                if (v.ht && String(v.ht).trim()) vParts.push(`Ht ${String(v.ht).trim()}${/cm|m/i.test(v.ht) ? '' : ' cm'}`);
                                else if (v.height && String(v.height).trim()) vParts.push(`Ht ${String(v.height).trim()}${/cm|m/i.test(v.height) ? '' : ' cm'}`);
                                if (v.bp) vParts.push(`BP ${v.bp}${/mm\s*hg/i.test(v.bp) ? '' : ' mmHg'}`);
                                if (v.hr) vParts.push(`HR ${v.hr}${/bpm/i.test(v.hr) ? '' : ' bpm'}`);
                                if (v.temp) vParts.push(`Temp ${v.temp}${/°|c/i.test(v.temp) ? '' : '°C'}`);
                                if (v.spo2) vParts.push(`SpO2 ${v.spo2}${/%/.test(v.spo2) ? '' : '%'}`);
                                if (v.rr) vParts.push(`RR ${v.rr}${/\/min|bpm/i.test(v.rr) ? '' : '/min'}`);
                                if (v.rbs) vParts.push(`RBS ${v.rbs}${/mmol/i.test(v.rbs) ? '' : ' mmol/L'}`);
                              }
                              const vitalsStr = vParts.join(', ') || raw.vitals_summary || raw.vital_signs || '';
                              const hasTodayMgmt = raw.today_management_gph && raw.today_management_gph.length > 0;
                              const vitalsInMgmt = hasTodayMgmt && raw.today_management_gph.some(item => /vitals|bp\s*\d|p\d+bpm/i.test(item));

                              return (
                                <>
                                  {hasTodayMgmt && (
                                    <div>
                                      <p className="font-bold underline text-[11px] uppercase text-slate-700">Today management in GPH</p>
                                      <ol className="list-decimal list-inside pl-1 space-y-0.5 mt-1">
                                        {raw.today_management_gph.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}

                                  {raw.past_medical_history && (
                                    <div>
                                      <p><strong>Past medical history</strong> – {raw.past_medical_history}</p>
                                    </div>
                                  )}

                                  {/* Physical Examination & Systems with Initial Vitals IMMEDIATELY after General Exam */}
                                  {(() => {
                                    const exam = raw.examination;
                                    if (!exam && !vitalsStr) return null;
                                    if (typeof exam === 'string' && exam.trim()) {
                                      return (
                                        <div className="pt-1 space-y-1">
                                          <p className="whitespace-pre-line"><strong>E-</strong> {exam.replace(/^E-?\s*/i, '')}</p>
                                          {vitalsStr && !vitalsInMgmt && (
                                            <div className="pl-4 text-xs text-slate-700 space-y-0.5">
                                              <p><strong>Initial vitals:</strong> {vitalsStr}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    if (typeof exam === 'object' || (!exam && vitalsStr)) {
                                      const eObj = exam || {};
                                      const customDefs = Array.isArray(raw.custom_exam_systems) ? raw.custom_exam_systems : [];
                                      const standardKeys = ['general', 'cvs', 'respiratory', 'resp', 'abdomen', 'abdo', 'cns', 'neuro', 'msk', 'ent', 'eye', 'skin', 'gu', 'other_systems'];

                                      const hasSystems = standardKeys.slice(1).some(k => eObj[k] && String(eObj[k]).trim()) ||
                                        Object.keys(eObj).some(k => !standardKeys.includes(k) && eObj[k] && String(eObj[k]).trim());
                                      const hasVitals = vitalsStr && !vitalsInMgmt;
                                      const hasGeneral = eObj.general && String(eObj.general).trim();

                                      if (!hasGeneral && !hasSystems && !hasVitals) return null;

                                      return (
                                        <div className="space-y-1 pt-1">
                                          {hasGeneral ? (
                                            <p><strong>E-</strong> {String(eObj.general).replace(/^E-?\s*/i, '')}</p>
                                          ) : (
                                            <p><strong>E-</strong></p>
                                          )}

                                          {(hasVitals || hasSystems) && (
                                            <div className="pl-4 text-xs text-slate-700 space-y-0.5">
                                              {/* Initial vitals immediately after General Exam */}
                                              {hasVitals && (
                                                <p><strong>Initial vitals:</strong> {vitalsStr}</p>
                                              )}

                                              {eObj.cvs && <p><strong>CVS:</strong> {eObj.cvs}</p>}
                                              {(eObj.respiratory || eObj.resp) && <p><strong>Resp:</strong> {eObj.respiratory || eObj.resp}</p>}
                                              {(eObj.abdomen || eObj.abdo) && <p><strong>Abdo:</strong> {eObj.abdomen || eObj.abdo}</p>}
                                              {(eObj.cns || eObj.neuro) && <p><strong>CNS / Neuro:</strong> {eObj.cns || eObj.neuro}</p>}
                                              {eObj.msk && <p><strong>Msk:</strong> {eObj.msk}</p>}
                                              {eObj.ent && <p><strong>ENT:</strong> {eObj.ent}</p>}
                                              {eObj.eye && <p><strong>Eye:</strong> {eObj.eye}</p>}
                                              {eObj.skin && <p><strong>Skin:</strong> {eObj.skin}</p>}
                                              {eObj.gu && <p><strong>GU / Pelvic:</strong> {eObj.gu}</p>}

                                              {/* Custom systems */}
                                              {Object.keys(eObj).filter(k => !standardKeys.includes(k) && eObj[k]).map(k => {
                                                const customDef = customDefs.find(c => c.id === k);
                                                const label = customDef && customDef.label ? customDef.label : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                return <p key={k}><strong>{label}:</strong> {eObj[k]}</p>;
                                              })}

                                              {eObj.other_systems && <p><strong>Other systems:</strong> {eObj.other_systems}</p>}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              );
                            })()}

                            {/* Assessment, DDX & Plan Numbered Formatting */}
                            {(() => {
                              let assText = raw.assessment || '';
                              let extPlan = [];
                              if (typeof assText === 'string' && /(\n|^)\s*plan\s*[:\n]/i.test(assText) && (!raw.plan || (Array.isArray(raw.plan) ? raw.plan.length === 0 : !String(raw.plan).trim()))) {
                                const pMatch = assText.split(/(\n|^)\s*plan\s*[:\n]/i);
                                assText = (pMatch[0] || '').trim();
                                if (pMatch.length >= 3) {
                                  extPlan = pMatch.slice(2).join('').split('\n').map(s => s.trim()).filter(Boolean);
                                }
                              }

                              let assItems = [];
                              if (Array.isArray(assText)) {
                                assItems = assText.map(s => String(s).trim()).filter(Boolean);
                              } else if (typeof assText === 'string' && assText.trim()) {
                                assItems = assText.split('\n').map(s => s.trim()).filter(Boolean);
                              }

                              const pSrc = (raw.plan && (Array.isArray(raw.plan) ? raw.plan.length > 0 : String(raw.plan).trim())) ? raw.plan : extPlan;
                              let pItems = [];
                              if (Array.isArray(pSrc)) {
                                pItems = pSrc.map(s => String(s).trim()).filter(Boolean);
                              } else if (typeof pSrc === 'string' && pSrc.trim()) {
                                pItems = pSrc.split('\n').map(s => s.trim()).filter(Boolean);
                              }

                              return (
                                <>
                                  {assItems.length > 1 ? (
                                    <div className="pt-2 border-t border-slate-100">
                                      <p className="font-bold text-[11px] uppercase text-slate-800">Assessment</p>
                                      <ol className="list-decimal list-inside pl-1 space-y-0.5">
                                        {assItems.map((item, idx) => (
                                          <li key={idx}>{item.replace(/^[\d+.-]+\s*/, '')}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  ) : assItems.length === 1 ? (
                                    <div className="pt-2 border-t border-slate-100">
                                      <p><strong>Assessment:</strong> {assItems[0]}</p>
                                    </div>
                                  ) : null}

                                  {raw.ddx && (Array.isArray(raw.ddx) ? raw.ddx.length > 0 : String(raw.ddx).trim()) && (
                                    <div className="pt-1">
                                      <p className="font-bold text-[11px] uppercase text-slate-800">DDX</p>
                                      <ol className="list-decimal list-inside pl-1 space-y-0.5">
                                        {(Array.isArray(raw.ddx) ? raw.ddx : String(raw.ddx).split('\n')).map(s => String(s).trim()).filter(Boolean).map((item, idx) => (
                                          <li key={idx}>{item.replace(/^[\d+.-]+\s*/, '')}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}

                                  {pItems.length > 0 && (
                                    <div className="pt-1">
                                      <p className="font-bold text-[11px] uppercase text-slate-800">Plan</p>
                                      <ol className="list-decimal list-inside pl-1 space-y-0.5">
                                        {pItems.map((item, idx) => {
                                          const isSub = /^([a-z]\)|\*|-|•)\s*/i.test(item) || /^\s{2,}/.test(item);
                                          if (isSub) {
                                            return <div key={idx} className="pl-5 text-slate-700 text-[11px]">{item}</div>;
                                          }
                                          return <li key={idx}>{item.replace(/^[\d+.-]+\s*/, '')}</li>;
                                        })}
                                      </ol>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </td>

                          <td className="text-center font-bold text-xs py-3">
                            <div className="h-16 flex items-center justify-center italic text-slate-700 border-b border-dashed border-slate-300 font-serif">
                              {note.doctor_name || 'DR GUMBO'}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1 uppercase">Prescriber</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Print Page Break between Admission Note and Drug Sheet */}
                {activeTab === 'all' && <div className="print-page-break"></div>}

                {/* PAGE 2: EXACT STANDARD HOSPITAL DRUG SHEET (MH 005) (Visible if tab is 'all' or 'drugsheet') */}
                {(activeTab === 'all' || activeTab === 'drugsheet') && (
                  <div className="bg-white p-6 sm:p-10 rounded-xl shadow-md border border-slate-300 print:shadow-none print:border-none print:p-0 text-slate-900 space-y-4">
                    
                    {/* Exact Title matching Photo */}
                    <div className="text-center">
                      <h1 className="text-3xl font-bold tracking-tight text-black font-sans">
                        Drug Sheet
                      </h1>
                    </div>

                    {/* Metadata Header with Surname, Forename, MH 005, WARD */}
                    <div className="flex justify-between items-end text-sm pt-2 pb-1 font-sans">
                      <div className="space-y-1.5">
                        <div>
                          <span className="font-semibold text-slate-800 inline-block w-24">Surname</span>
                          <span className="border-b border-black font-serif italic text-base text-blue-900 px-3 py-0.5 inline-block min-w-[180px]">
                            {note.patient_surname || 'Sarefo'}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 inline-block w-24">Forename</span>
                          <span className="border-b border-black font-serif italic text-base text-blue-900 px-3 py-0.5 inline-block min-w-[180px]">
                            {note.patient_name || 'Sarah'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-1.5">
                        <div className="font-bold text-xs text-slate-800 pr-2">
                          MH 005
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 mr-2 uppercase">WARD</span>
                          <span className="border-b border-black font-serif italic text-base text-blue-900 px-3 py-0.5 inline-block min-w-[150px]">
                            {note.ward || 'General ward'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Exact MH 005 Inpatient Medication Table with 7 Time Rows and 14 Date Columns */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border-2 border-black text-[11px] font-sans">
                        <thead>
                          <tr className="border-b border-black bg-slate-50 text-slate-700">
                            <th className="w-[34%] border-r border-black p-1 text-left font-normal italic text-[10px]">
                              DRUG DETAILS
                            </th>
                            <th className="w-[8%] border-r border-black p-1 text-center font-bold text-[10px]">
                              Time
                            </th>
                            <th className="w-[6%] border-r border-black p-1 text-center font-bold text-[10px]">
                              Alt.
                            </th>
                            <th colSpan={14} className="border-b border-black p-0.5 text-center font-bold text-[10px]">
                              Date
                            </th>
                          </tr>
                          <tr className="border-b-2 border-black bg-slate-50 text-slate-600 text-[9px]">
                            <th className="border-r border-black"></th>
                            <th className="border-r border-black"></th>
                            <th className="border-r border-black"></th>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(dayNum => (
                              <th key={dayNum} className="border-r border-black p-0.5 text-center min-w-[20px] font-mono">
                                {dayNum}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {drugSlots.map((med, slotIdx) => (
                            <React.Fragment key={slotIdx}>
                              {TIME_LABELS.map((timeLabel, timeIdx) => {
                                const isScheduled = isTimeScheduled(med, timeLabel);
                                
                                return (
                                  <tr 
                                    key={timeIdx} 
                                    className={`${timeIdx === 6 ? 'border-b-2 border-black' : 'border-b border-slate-300'}`}
                                  >
                                    {/* Left Prescription Box (Rendered only on row 0, spans all 7 time rows) */}
                                    {timeIdx === 0 && (
                                      <td 
                                        rowSpan={7} 
                                        className="w-[34%] border-r-2 border-black p-2 align-top bg-white space-y-1.5 select-none"
                                      >
                                        <div className="flex items-start gap-1">
                                          <span className="font-bold text-[11px] text-slate-900 tracking-wider">DRUG</span>
                                          {med ? (
                                            <span className="font-serif italic font-bold text-base text-blue-900 ml-2">
                                              {med.drug}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300 italic text-xs ml-2">Empty Slot</span>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-3 border-t border-b border-black text-[10px] py-1 my-1">
                                          <div className="border-r border-black pr-1">
                                            <span className="block text-slate-600">Date</span>
                                            <span className="font-serif italic text-blue-900 font-semibold text-xs">
                                              {med ? (med.start_date || note.admission_date?.split(' ')[0] || '18/04/24') : ''}
                                            </span>
                                          </div>
                                          <div className="border-r border-black px-1">
                                            <span className="block text-slate-600">Dose</span>
                                            <span className="font-serif italic text-blue-900 font-semibold text-xs">
                                              {med ? med.dose : ''}
                                            </span>
                                          </div>
                                          <div className="pl-1">
                                            <span className="block text-slate-600">Route</span>
                                            <span className="font-serif italic text-blue-900 font-semibold text-xs uppercase">
                                              {med ? med.route : ''}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="pt-0.5 text-[10px]">
                                          <span className="text-slate-700">Drs. Signature</span>
                                          {med && (
                                            <div className="font-serif italic text-blue-900 font-bold text-xs pl-2 -mt-0.5">
                                              {med.signature || note.doctor_name || 'Dr. Gumbo'}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    )}

                                    {/* Standard Time Cell (With blue circle if scheduled, exactly like the photo!) */}
                                    <td className="w-[8%] border-r border-black px-1 py-1 text-center font-sans text-[11px] whitespace-nowrap">
                                      {isScheduled ? (
                                        <span className="inline-block border-2 border-blue-600 text-blue-900 font-serif font-bold text-xs px-1.5 py-0.5 rounded-full shadow-sm bg-blue-50/50">
                                          {timeLabel}
                                        </span>
                                      ) : (
                                        <span className="text-slate-700">{timeLabel}</span>
                                      )}
                                    </td>

                                    {/* Alt. Column */}
                                    <td className="w-[6%] border-r border-black px-1 py-1 text-center text-slate-300">
                                      &nbsp;
                                    </td>

                                    {/* 14 Date Administration Grid Cells */}
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(dayNum => (
                                      <td 
                                        key={dayNum} 
                                        className="border-r border-slate-300 p-0 text-center hover:bg-emerald-50/40 transition cursor-crosshair"
                                      >
                                        &nbsp;
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* IV Fluids & Special Instructions Footer Box */}
                    {((drugSheet?.iv_fluids && drugSheet.iv_fluids.length > 0) || drugSheet?.special_instructions) && (
                      <div className="mt-3 p-3 border border-black rounded-lg bg-slate-50 text-xs font-sans space-y-1">
                        {drugSheet?.iv_fluids && drugSheet.iv_fluids.length > 0 && (
                          <div>
                            <strong>Intravenous Fluids: </strong>
                            {drugSheet.iv_fluids.map((f, i) => (
                              <span key={i} className="font-serif italic text-blue-950 mr-3">
                                {f.fluid} ({f.volume}) - {f.rate_hours};
                              </span>
                            ))}
                          </div>
                        )}
                        {drugSheet?.special_instructions && (
                          <div>
                            <strong>Nursing Orders: </strong>
                            <span className="text-slate-800">{drugSheet.special_instructions}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Table 7: STAT / SINGLE DOSE MEDICATION ORDERS (Exact MH 005 Bottom Table) */}
                    <div className="mt-4 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                          Stat / Single Dose Medication Orders (Table 7)
                        </span>
                        <span className="text-[10px] text-slate-500 italic">
                          Immediate / Stat doses prescribed on admission
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border-2 border-black text-[10px] font-sans">
                          <thead>
                            <tr className="border-b-2 border-black bg-slate-100 font-bold text-slate-800">
                              <th className="border-r border-black p-1 text-center w-[8%]">Date</th>
                              <th className="border-r border-black p-1 text-center w-[6%]">Time</th>
                              <th className="border-r border-black p-1 text-left w-[20%]">Drug</th>
                              <th className="border-r border-black p-1 text-center w-[7%]">Signature</th>
                              <th className="border-r border-black p-1 text-center w-[6%]">Time Given</th>
                              <th className="border-r-2 border-black p-1 text-center w-[7%]">Given by</th>
                              <th className="border-r border-black p-1 text-center w-[8%]">Date</th>
                              <th className="border-r border-black p-1 text-center w-[6%]">Time</th>
                              <th className="border-r border-black p-1 text-left w-[20%]">Drug</th>
                              <th className="border-r border-black p-1 text-center w-[7%]">Signature</th>
                              <th className="border-r border-black p-1 text-center w-[6%]">Time given</th>
                              <th className="p-1 text-center w-[7%]">Given by</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[0, 1, 2, 3, 4].map(rowIdx => {
                              const leftMed = drugSheet?.stat_meds ? drugSheet.stat_meds[rowIdx * 2] : null;
                              const rightMed = drugSheet?.stat_meds ? drugSheet.stat_meds[rowIdx * 2 + 1] : null;

                              return (
                                <tr key={rowIdx} className="border-b border-black h-7 text-[10px]">
                                  {/* Left Column */}
                                  <td className="border-r border-black text-center font-mono">
                                    {leftMed?.date || (leftMed ? note.admission_date?.split(' ')[0] : '')}
                                  </td>
                                  <td className="border-r border-black text-center font-mono">
                                    {leftMed?.time || (leftMed ? note.admission_date?.split(' ')[1] : '')}
                                  </td>
                                  <td className="border-r border-black px-1 font-serif font-bold text-blue-900">
                                    {leftMed ? [leftMed.drug, leftMed.dose, leftMed.route].filter(Boolean).join(' ') : ''}
                                  </td>
                                  <td className="border-r border-black text-center font-serif italic text-[9px]">
                                    {leftMed?.signature || (leftMed ? note.doctor_name : '')}
                                  </td>
                                  <td className="border-r border-black text-center font-mono">
                                    {leftMed?.given_time || ''}
                                  </td>
                                  <td className="border-r-2 border-black text-center font-serif italic text-[9px]">
                                    {leftMed?.given_by || ''}
                                  </td>

                                  {/* Right Column */}
                                  <td className="border-r border-black text-center font-mono">
                                    {rightMed?.date || (rightMed ? note.admission_date?.split(' ')[0] : '')}
                                  </td>
                                  <td className="border-r border-black text-center font-mono">
                                    {rightMed?.time || (rightMed ? note.admission_date?.split(' ')[1] : '')}
                                  </td>
                                  <td className="border-r border-black px-1 font-serif font-bold text-blue-900">
                                    {rightMed ? [rightMed.drug, rightMed.dose, rightMed.route].filter(Boolean).join(' ') : ''}
                                  </td>
                                  <td className="border-r border-black text-center font-serif italic text-[9px]">
                                    {rightMed?.signature || (rightMed ? note.doctor_name : '')}
                                  </td>
                                  <td className="border-r border-black text-center font-mono">
                                    {rightMed?.given_time || ''}
                                  </td>
                                  <td className="text-center font-serif italic text-[9px]">
                                    {rightMed?.given_by || ''}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </>
            )}

          </div>

        </div>

      </div>

      {/* In-Depth Online Layout Designer Modal */}
      {isDesignerOpen && (
        <OnlineLayoutDesignerModal
          initialType={note.type}
          activeNote={note}
          activeDrugSheet={drugSheet}
          initialLayoutConfig={layoutConfig}
          onApplyLayout={async (newConfig) => {
            setLayoutConfig(newConfig);
            if (newConfig.design_filename) {
              setSelectedDesignFilename(newConfig.design_filename);
            }
            try {
              await api.notes.updateDesign(note.id, {
                design_filename: newConfig.design_filename || selectedDesignFilename,
                layout_config: newConfig,
                template_id: newConfig.template_id || note.template_id
              });
              setDesignFeedback('Custom layout applied to note');
              setTimeout(() => setDesignFeedback(''), 3000);
            } catch (e) {
              console.warn('Error saving note design:', e);
            }
          }}
          onClose={() => setIsDesignerOpen(false)}
        />
      )}
    </div>
  );
}

function formatPlainText(note, raw, drugSheet) {
  if (note.type === 'referral') {
    return `REFERRAL NOTE: ${raw.hospital_name || 'Gumare Primary Hospital'}
Patient: ${note.patient_name} ${note.patient_surname} | Reg: ${note.reg_no}
Diagnosis: ${note.diagnosis}
From: ${raw.hospital_name} (${raw.referring_unit}) To: ${raw.receiving_hospital} (${raw.receiving_department})
Reason: ${raw.reason_for_referral}
Clinical: ${raw.clinical_history}
Vitals: ${raw.vital_signs}
Tx Given: ${raw.treatment_given}
Dr: ${note.doctor_name}`;
  }

  return `GUMARE PRIMARY HOSPITAL - MEDICAL RECORDS
DRUG SHEET (MH 005)
Surname: ${note.patient_surname}
Forename: ${note.patient_name}
Ward: ${note.ward}
Diagnosis: ${note.diagnosis}

PRESCRIBED MEDICATIONS:
${drugSheet?.medications?.map((m, idx) => `Slot ${idx + 1}: ${m.drug} ${m.dose} ${m.route} (Scheduled: ${m.admin_times?.join(', ') || m.frequency})`).join('\n') || 'None'}

IV FLUIDS:
${drugSheet?.iv_fluids?.map(f => `- ${f.fluid} ${f.volume} (${f.rate_hours})`).join('\n') || 'None'}`;
}
