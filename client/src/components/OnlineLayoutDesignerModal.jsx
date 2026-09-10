import React, { useState } from 'react';
import { 
  Palette, Layout, Columns, Tag, Upload, Save, Check, RefreshCw, X, 
  Eye, ArrowUp, ArrowDown, Sparkles, FileText, Pill, Shield, Sliders, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

const COLOR_PRESETS = [
  { name: 'Hospital Emerald', hex: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-600' },
  { name: 'Clinical Navy', hex: '#1e3a8a', bg: 'bg-blue-900', text: 'text-blue-900', border: 'border-blue-900' },
  { name: 'Classic Slate', hex: '#0f172a', bg: 'bg-slate-900', text: 'text-slate-900', border: 'border-slate-900' },
  { name: 'Burgundy Red', hex: '#991b1b', bg: 'bg-red-800', text: 'text-red-800', border: 'border-red-800' },
  { name: 'Medical Teal', hex: '#0d9488', bg: 'bg-teal-700', text: 'text-teal-700', border: 'border-teal-700' },
  { name: 'Royal Indigo', hex: '#4338ca', bg: 'bg-indigo-700', text: 'text-indigo-700', border: 'border-indigo-700' },
];

const DEFAULT_SECTIONS_ADMISSION = [
  { id: 'header', name: 'Hospital Header & Document Title', enabled: true, locked: true },
  { id: 'demographics', name: 'Patient Demographics & Ward Summary', enabled: true },
  { id: 'treatment_chart', name: '3-Column Treatment Chart (Date | Treatment | Signature)', enabled: true },
  { id: 'examinations', name: 'Physical Examination & Systems Review', enabled: true },
  { id: 'assessment_plan', name: 'Assessment, DDX & Management Plan', enabled: true },
  { id: 'drug_sheet', name: 'MH 005 Inpatient Drug Administration Sheet (MAR)', enabled: true },
  { id: 'iv_fluids', name: 'Intravenous Fluids & Infusion Schedule', enabled: true },
  { id: 'signatures', name: 'Prescriber & Clinician Signatures', enabled: true }
];

const DEFAULT_SECTIONS_REFERRAL = [
  { id: 'header', name: 'Hospital Header & Referral Main Title', enabled: true, locked: true },
  { id: 'demographics', name: 'Patient Demographics & Adm. No', enabled: true },
  { id: 'referral_body', name: 'Transfer Reason, Clinical Summary & Treatments', enabled: true },
  { id: 'examinations', name: 'Physical Examination Findings', enabled: true },
  { id: 'transport_logistics', name: 'Transport, Receiving Facility & Escort Orders', enabled: true },
  { id: 'signatures', name: 'Referring Doctor Signature & Stamp', enabled: true }
];

const SAMPLE_NOTE_ADMISSION = {
  patient_name: 'SHAROH',
  patient_surname: 'MBAMBI',
  reg_no: 'GPH-2026-0842',
  ward: 'TB Ward',
  diagnosis: 'Pulmonary tuberculosis',
  age: '15',
  gender: 'Female',
  doctor_name: 'Dr. Gumbo',
  admission_date: '01/09/2026 16:42',
  hospital_name: 'Gumare Primary Hospital',
  chief_complaint: 'Cough x 3 weeks, evening fevers, weight loss',
  treatment_text: 'Admit to TB ward for isolation. Sputum AFB sent. Start intensive phase ATT.',
  vitals: { bp: '110/70', hr: '88', temp: '37.8', rr: '20', spo2: '97%' },
  examination: {
    general: 'Moderate pallor, no jaundice, no peripheral oedema',
    cvs: 'S1 S2 present, no murmurs',
    respiratory: 'Right middle lobe bronchial breathing with coarse crackles',
    abdomen: 'Soft, non-tender, no hepatosplenomegaly',
    cns: 'Alert, GCS 15/15, cranial nerves intact'
  },
  medications: [
    { drug: 'ATT (Rifampicin/INH/PZA/EMB)', dose: '3 tabs', route: 'PO', admin_times: ['6 am'], frequency: 'OD MANE' },
    { drug: 'Pyridoxine', dose: '25 mg', route: 'PO', admin_times: ['6 am'], frequency: 'OD MANE' },
    { drug: 'Cefotaxime', dose: '1 g', route: 'IV', admin_times: ['6 am', '2 pm', '10 pm'], frequency: 'TDS' },
    { drug: 'Paracetamol', dose: '1 g', route: 'PO', admin_times: ['6 am', '2 pm', '10 pm'], frequency: 'TDS PRN' }
  ],
  iv_fluids: [
    { fluid: 'Ringer Lactate', volume: '1000 mL', rate_hours: 'over 8 hours' }
  ],
  special_instructions: '4-hourly vital signs monitoring. Sputum for GeneXpert pending.'
};

export default function OnlineLayoutDesignerModal({ 
  initialType = 'admission', 
  activeNote = null, 
  activeDrugSheet = null,
  initialLayoutConfig = null,
  onApplyLayout, 
  onClose 
}) {
  const noteType = initialType || (activeNote?.type === 'referral' ? 'referral' : 'admission');
  
  // Active Studio Tab: 'sections', 'styling', 'grid', 'tags'
  const [activeTab, setActiveTab] = useState('styling');
  const [activeMobileView, setActiveMobileView] = useState('controls'); // 'controls' or 'preview'
  
  // Designer State
  const [docType, setDocType] = useState(noteType);
  const [hospitalName, setHospitalName] = useState(
    initialLayoutConfig?.hospitalName || activeNote?.hospital_name || 'Gumare Primary Hospital'
  );
  const [documentTitle, setDocumentTitle] = useState(
    initialLayoutConfig?.documentTitle || (noteType === 'referral' ? 'REFERRAL AND REPORT FORM' : 'TREATMENT CHART & DRUG SHEET')
  );

  const [sections, setSections] = useState(() => {
    if (initialLayoutConfig?.sections && Array.isArray(initialLayoutConfig.sections) && initialLayoutConfig.sections.length > 0) {
      return initialLayoutConfig.sections;
    }
    return noteType === 'referral' ? DEFAULT_SECTIONS_REFERRAL : DEFAULT_SECTIONS_ADMISSION;
  });

  const [styling, setStyling] = useState(() => ({
    accentColor: initialLayoutConfig?.styling?.accentColor || (noteType === 'referral' ? '#1e3a8a' : '#059669'),
    fontFamily: initialLayoutConfig?.styling?.fontFamily || 'sans', // 'sans', 'serif', 'mono'
    borderStyle: initialLayoutConfig?.styling?.borderStyle || 'double', // 'double', 'single', 'soft'
    headerStyle: initialLayoutConfig?.styling?.headerStyle || 'boxed', // 'boxed', 'centered', 'banner'
    chartColumns: initialLayoutConfig?.styling?.chartColumns || '3-column', // '3-column', '2-column'
    dateColumnWidth: initialLayoutConfig?.styling?.dateColumnWidth || '18%',
    drugSlots: initialLayoutConfig?.styling?.drugSlots || 6,
    adminTimes: initialLayoutConfig?.styling?.adminTimes || ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'],
    timeBadgeStyle: initialLayoutConfig?.styling?.timeBadgeStyle || 'circle', // 'circle', 'pill', 'outline'
    dateGridDays: initialLayoutConfig?.styling?.dateGridDays || 14,
    watermark: initialLayoutConfig?.styling?.watermark || 'NONE',
  }));

  // File Upload & Analysis state
  const [uploadingDocx, setUploadingDocx] = useState(false);
  const [inspectedMeta, setInspectedMeta] = useState(null);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedTag, setCopiedTag] = useState('');

  // Handle Premade DOCX File Upload
  const handleDocxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingDocx(true);
      const formData = new FormData();
      formData.append('template_file', file);
      
      const res = await api.templates.inspectDocx(formData);
      setInspectedMeta(res);

      // Auto-populate designer properties from inspected DOCX
      if (res.documentTitle) setDocumentTitle(res.documentTitle);
      if (res.hospitalName) setHospitalName(res.hospitalName);
      if (res.inferredType) setDocType(res.inferredType);
      if (res.sections && Array.isArray(res.sections)) setSections(res.sections);
      if (res.styling) {
        setStyling(prev => ({
          ...prev,
          accentColor: res.styling.accentColor || prev.accentColor,
          fontFamily: res.styling.fontFamily || prev.fontFamily,
          borderStyle: res.styling.borderStyle || prev.borderStyle,
          headerStyle: res.styling.headerStyle || prev.headerStyle,
          chartColumns: res.styling.chartColumns || prev.chartColumns,
          drugSlots: res.styling.drugSlots || prev.drugSlots
        }));
      }

      alert(`✓ Successfully imported "${file.name}"! Analyzed ${res.stats?.tableCount || 0} tables and ${res.mergeTags?.length || 0} merge tags.`);
    } catch (err) {
      alert('Failed to inspect DOCX file: ' + err.message);
    } finally {
      setUploadingDocx(false);
    }
  };

  // Move Section Up/Down
  const moveSection = (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const newSections = [...sections];
    const temp = newSections[idx];
    newSections[idx] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    setSections(newSections);
  };

  // Toggle Section Visibility
  const toggleSection = (id) => {
    setSections(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  // Compile Complete Layout Configuration Object
  const getCompiledLayoutConfig = () => ({
    hospitalName,
    documentTitle,
    docType,
    sections,
    styling
  });

  // Apply to Active Note
  const handleApplyToNote = () => {
    const config = getCompiledLayoutConfig();
    if (onApplyLayout) {
      onApplyLayout(config);
    }
    onClose();
  };

  // Save as Reusable Template in SQLite & DOCX
  const handleSaveAsTemplate = async () => {
    const name = saveTemplateName.trim() || `${hospitalName} - ${styling.accentColor.replace('#', '')} Layout`;
    try {
      setIsSavingTemplate(true);
      const config = getCompiledLayoutConfig();
      const res = await api.templates.createOnlineLayout({
        name,
        type: docType,
        description: `Online-designed ${styling.fontFamily} layout (${docType}) with ${styling.drugSlots} MAR slots`,
        layout_config: config
      });

      setSaveSuccessMsg(`Saved as template "${name}"!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);

      if (onApplyLayout) {
        onApplyLayout({
          ...config,
          design_filename: res.template.filename,
          template_id: res.template.id,
          template_name: res.template.name
        });
      }
    } catch (err) {
      alert('Failed to save template: ' + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Resolve display data
  const data = activeNote || SAMPLE_NOTE_ADMISSION;
  const raw = data.raw_data || data;
  const meds = activeDrugSheet?.medications || SAMPLE_NOTE_ADMISSION.medications;
  const fontClass = styling.fontFamily === 'serif' ? 'font-serif' : (styling.fontFamily === 'mono' ? 'font-mono' : 'font-sans');

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-slate-950/80 backdrop-blur-md flex flex-col">
      
      {/* Studio Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-md">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base tracking-tight">
                In-Depth Online Layout Designer
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Word (.docx) Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Upload premade Word documents, customize sections & typography, preview in real time
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Upload Premade DOCX */}
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Upload Premade .docx</span>
            <span className="sm:hidden">Upload</span>
            <input 
              type="file" 
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              className="hidden" 
              onChange={handleDocxUpload}
              disabled={uploadingDocx}
            />
          </label>

          {/* Apply to Active Note Button */}
          <button
            type="button"
            onClick={handleApplyToNote}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Note</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Toggle Bar (Controls vs Preview) */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 px-4 py-2 gap-2 text-xs font-semibold shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileView('controls')}
          className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 ${
            activeMobileView === 'controls' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Designer Controls
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileView('preview')}
          className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 ${
            activeMobileView === 'preview' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Live Preview
        </button>
      </div>

      {/* Main Studio Body: 2 Columns on Desktop */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Studio Controls Panel */}
        <div className={`w-full lg:w-[460px] xl:w-[500px] border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden ${
          activeMobileView === 'preview' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Studio Tabs Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/90 text-xs font-semibold overflow-x-auto p-1.5 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('styling')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'styling' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Branding & Theme
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'sections' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Sections ({sections.filter(s => s.enabled).length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'grid' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Chart & MAR Slots
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tags')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'tags' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Merge Tags
            </button>
          </div>

          {/* Inspected DOCX Banner (if file was uploaded) */}
          {inspectedMeta && (
            <div className="bg-blue-950/60 border-b border-blue-800/60 px-4 py-2 flex items-center justify-between text-xs text-blue-200 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Imported: <strong>{inspectedMeta.filename}</strong></span>
              </div>
              <span className="text-[10px] text-blue-300">
                {inspectedMeta.stats?.tableCount} tables • {inspectedMeta.mergeTags?.length} tags
              </span>
            </div>
          )}

          {/* Tab Content Panels (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200 text-xs">
            
            {/* TAB 1: BRANDING & THEME STUDIO */}
            {activeTab === 'styling' && (
              <div className="space-y-5">
                
                {/* Accent Color Selection */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Primary Accent Color</span>
                    <span className="font-mono text-emerald-400">{styling.accentColor}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setStyling({ ...styling, accentColor: preset.hex })}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                          styling.accentColor.toLowerCase() === preset.hex.toLowerCase()
                            ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/50'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${preset.bg} shrink-0 shadow-sm`} />
                        <span className="truncate font-medium">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-slate-400">Custom Hex:</span>
                    <input
                      type="color"
                      value={styling.accentColor}
                      onChange={(e) => setStyling({ ...styling, accentColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.accentColor}
                      onChange={(e) => setStyling({ ...styling, accentColor: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Typography Selection */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Typography / Font Family</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, fontFamily: 'sans' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        styling.fontFamily === 'sans' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-sans font-bold text-sm">Clean Sans</span>
                      <span className="text-[10px] text-slate-400">Arial / Inter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, fontFamily: 'serif' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        styling.fontFamily === 'serif' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-serif font-bold text-sm">Medical Serif</span>
                      <span className="text-[10px] text-slate-400">Times / Georgia</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, fontFamily: 'mono' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        styling.fontFamily === 'mono' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-mono font-bold text-sm">Monospace</span>
                      <span className="text-[10px] text-slate-400">Clinical Type</span>
                    </button>
                  </div>
                </div>

                {/* Table Border & Frame Style */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Table & Border Styling</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, borderStyle: 'double' })}
                      className={`p-2 rounded-xl border text-center transition ${
                        styling.borderStyle === 'double' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Hospital Double</span>
                      <span className="text-[10px] text-slate-400">Authentic Chart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, borderStyle: 'single' })}
                      className={`p-2 rounded-xl border text-center transition ${
                        styling.borderStyle === 'single' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Crisp Single</span>
                      <span className="text-[10px] text-slate-400">Solid Lines</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, borderStyle: 'soft' })}
                      className={`p-2 rounded-xl border text-center transition ${
                        styling.borderStyle === 'soft' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Modern Soft</span>
                      <span className="text-[10px] text-slate-400">Subtle Shading</span>
                    </button>
                  </div>
                </div>

                {/* Header Style */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Header Branding Layout</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, headerStyle: 'boxed' })}
                      className={`p-2 rounded-xl border text-center transition ${
                        styling.headerStyle === 'boxed' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Boxed Header</span>
                      <span className="text-[10px] text-slate-400">Reg. NO. Box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, headerStyle: 'centered' })}
                      className={`p-2 rounded-xl border text-center transition ${
                        styling.headerStyle === 'centered' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Centered</span>
                      <span className="text-[10px] text-slate-400">Classic Clean</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, headerStyle: 'banner' })}
                      className={`p-2 rounded-xl border text-center transition ${
                        styling.headerStyle === 'banner' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Solid Banner</span>
                      <span className="text-[10px] text-slate-400">Accent Fill</span>
                    </button>
                  </div>
                </div>

                {/* Header & Hospital Name Override */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Facility / Hospital Name</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      placeholder="e.g. Gumare Primary Hospital"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Document Title</label>
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      placeholder="e.g. TREATMENT CHART & DRUG SHEET"
                    />
                  </div>
                </div>

                {/* Watermark Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Document Watermark / Security Stamp</span>
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                  </label>
                  <select
                    value={styling.watermark}
                    onChange={(e) => setStyling({ ...styling, watermark: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="NONE">None (Clean Hospital Chart)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL MEDICAL RECORD</option>
                    <option value="URGENT">URGENT CLINICAL TRANSFER</option>
                    <option value="DRAFT">DRAFT - PENDING VERIFICATION</option>
                  </select>
                </div>

              </div>
            )}

            {/* TAB 2: MODULAR SECTIONS (REORDER & TOGGLE) */}
            {activeTab === 'sections' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs">
                    Reorder and toggle sections to construct your bespoke chart layout:
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sections.filter(s => s.enabled).length}/{sections.length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                        section.enabled
                          ? 'bg-slate-800/80 border-slate-700 text-white'
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => toggleSection(section.id)}
                          disabled={section.locked}
                          className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                        />
                        <div className="truncate">
                          <span className="font-semibold block truncate">{section.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{section.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sections.length - 1}
                          className="p-1 rounded bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TABLE & MAR GRID SETTINGS */}
            {activeTab === 'grid' && (
              <div className="space-y-5">
                
                {/* 3-Column vs 2-Column Treatment Chart */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Treatment Chart Columns</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, chartColumns: '3-column' })}
                      className={`p-3 rounded-xl border text-center transition ${
                        styling.chartColumns === '3-column' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-bold">3-Column Hospital Standard</span>
                      <span className="text-[10px] text-slate-400">DATE | TREATMENT | SIGNATURE</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, chartColumns: '2-column' })}
                      className={`p-3 rounded-xl border text-center transition ${
                        styling.chartColumns === '2-column' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span className="block font-bold">2-Column Streamlined</span>
                      <span className="text-[10px] text-slate-400">DATE & CLINICIAN | ORDERS</span>
                    </button>
                  </div>
                </div>

                {/* Date Column Width */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Date Column Width</span>
                    <span className="font-mono text-emerald-400">{styling.dateColumnWidth}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['15%', '18%', '22%'].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setStyling({ ...styling, dateColumnWidth: w })}
                        className={`py-1.5 rounded-lg border text-center font-mono ${
                          styling.dateColumnWidth === w ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MAR Drug Sheet Slots Count */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>MH 005 Medication Slots</span>
                    <span className="text-emerald-400 font-bold">{styling.drugSlots} Slots</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[4, 6, 8, 10].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setStyling({ ...styling, drugSlots: cnt })}
                        className={`py-2 rounded-xl border text-center transition ${
                          styling.drugSlots === cnt ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold' : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {cnt} Slots
                        <span className="block text-[9px] text-slate-400">
                          {cnt === 6 ? 'MH 005 Std' : cnt === 8 ? 'ICU Regimen' : cnt === 4 ? 'Brief' : 'Complex'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled Time Badge Style */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Scheduled Time Badge Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, timeBadgeStyle: 'circle' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        styling.timeBadgeStyle === 'circle' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Pen Circle Stamp</span>
                      <span className="text-[10px] text-slate-400">Authentic Chart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, timeBadgeStyle: 'pill' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        styling.timeBadgeStyle === 'pill' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Solid Pill</span>
                      <span className="text-[10px] text-slate-400">Modern High-Vis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, timeBadgeStyle: 'outline' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        styling.timeBadgeStyle === 'outline' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="block font-semibold">Outlined Box</span>
                      <span className="text-[10px] text-slate-400">Minimalist</span>
                    </button>
                  </div>
                </div>

                {/* Date Grid Columns */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Administration Date Grid</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, dateGridDays: 14 })}
                      className={`p-2 rounded-xl border text-center ${
                        styling.dateGridDays === 14 ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      14 Days (Two-Week Inpatient)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyling({ ...styling, dateGridDays: 7 })}
                      className={`p-2 rounded-xl border text-center ${
                        styling.dateGridDays === 7 ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold' : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      7 Days (Weekly Round)
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MERGE TAGS INSPECTOR */}
            {activeTab === 'tags' && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs">
                  Supported docxtemplater tags automatically resolved upon export:
                </p>
                <div className="space-y-2">
                  {[
                    { tag: '{patient_name}', desc: "Patient's first name" },
                    { tag: '{patient_surname}', desc: "Patient's surname" },
                    { tag: '{reg_no}', desc: 'Hospital Registration / IP number' },
                    { tag: '{ward}', desc: 'Hospital Ward' },
                    { tag: '{diagnosis}', desc: 'Admission / Tentative Diagnosis' },
                    { tag: '{admission_date}', desc: 'Date and time of admission/transfer' },
                    { tag: '{doctor_name}', desc: 'Attending clinician / prescriber' },
                    { tag: '{hospital_name}', desc: 'Transferring or admission hospital' },
                    { tag: '{treatment_text}', desc: 'Formatted clinical note and orders' },
                    { tag: '{exam_general}', desc: 'General & JACCOLD findings' },
                    { tag: '{exam_cvs}', desc: 'Cardiovascular system exam' },
                    { tag: '{exam_resp}', desc: 'Respiratory system exam' },
                    { tag: '{exam_abdomen}', desc: 'Abdominal exam' },
                    { tag: '{exam_cns}', desc: 'Central Nervous System / Neuro exam' },
                    { tag: '{iv_fluids}', desc: 'Prescribed infusions and rates' }
                  ].map((item) => (
                    <div
                      key={item.tag}
                      onClick={() => {
                        navigator.clipboard.writeText(item.tag);
                        setCopiedTag(item.tag);
                        setTimeout(() => setCopiedTag(''), 2000);
                      }}
                      className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between border border-slate-700/60 transition group"
                    >
                      <div>
                        <span className="font-mono text-emerald-400 font-bold block">{item.tag}</span>
                        <span className="text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 opacity-0 group-hover:opacity-100 transition">
                        {copiedTag === item.tag ? 'Copied!' : 'Click to Copy'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Save as Reusable Template Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2 shrink-0">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Save as Reusable Hospital Layout Template
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveTemplateName}
                onChange={(e) => setSaveTemplateName(e.target.value)}
                placeholder="e.g. Pediatric Ward Layout"
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingTemplate ? 'Saving...' : 'Save Template'}</span>
              </button>
            </div>
            {saveSuccessMsg && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {saveSuccessMsg}
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Live Document Preview */}
        <div className={`flex-1 bg-slate-800/80 p-4 sm:p-6 overflow-y-auto ${
          activeMobileView === 'controls' ? 'hidden lg:block' : 'block'
        }`}>
          
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Live Preview Document Container */}
            <div className={`bg-white rounded-xl shadow-2xl p-6 sm:p-10 text-slate-900 space-y-6 ${fontClass} border-2 border-slate-300 relative overflow-hidden`}>
              
              {/* Optional Watermark */}
              {styling.watermark !== 'NONE' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-5">
                  <span className="text-6xl sm:text-8xl font-black uppercase -rotate-45 tracking-widest text-black">
                    {styling.watermark}
                  </span>
                </div>
              )}

              {/* 1. Header Section */}
              {sections.find(s => s.id === 'header')?.enabled !== false && (
                <div className={`pb-4 border-b-2 ${styling.borderStyle === 'double' ? 'border-double border-b-4 border-black' : 'border-slate-800'}`}>
                  {styling.headerStyle === 'banner' ? (
                    <div className="p-3 rounded-lg text-white mb-3 shadow-sm" style={{ backgroundColor: styling.accentColor }}>
                      <p className="text-xs uppercase font-medium opacity-90">{hospitalName}</p>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight">{documentTitle}</h1>
                    </div>
                  ) : styling.headerStyle === 'centered' ? (
                    <div className="text-center space-y-1 mb-2">
                      <p className="text-xs uppercase font-semibold text-slate-600 tracking-wider">{hospitalName}</p>
                      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ color: styling.accentColor }}>
                        {documentTitle}
                      </h1>
                    </div>
                  ) : (
                    /* Boxed Header (Gumare Hospital Standard) */
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs sm:text-sm">Hospital: <strong className="font-bold">{hospitalName}</strong></p>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase mt-0.5" style={{ color: styling.accentColor }}>
                          {documentTitle}
                        </h1>
                      </div>
                      <div className="border border-slate-500 p-2 min-w-[140px] text-right bg-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">Reg. NO.</span>
                        <span className="font-mono text-sm font-bold">{data.reg_no || 'GPH-2026-0842'}</span>
                      </div>
                    </div>
                  )}

                  {/* Demographics Bar */}
                  {sections.find(s => s.id === 'demographics')?.enabled !== false && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-200 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-500">First name:</span> <strong className="uppercase">{data.patient_name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Surname:</span> <strong className="uppercase">{data.patient_surname}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Ward:</span> <strong>{data.ward || 'TB Ward'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Diagnosis:</span> <strong style={{ color: styling.accentColor }}>{data.diagnosis || 'TB'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Inpatient Treatment Chart Table */}
              {docType === 'admission' && sections.find(s => s.id === 'treatment_chart')?.enabled !== false && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-800 text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 font-bold uppercase text-[11px] border-b border-slate-800">
                        <th className="p-2 text-center border-r border-slate-800" style={{ width: styling.dateColumnWidth }}>
                          {styling.chartColumns === '2-column' ? 'DATE & CLINICIAN' : 'DATE'}
                        </th>
                        <th className="p-2 text-center border-r border-slate-800">
                          TREATMENT & CLINICAL ORDERS
                        </th>
                        {styling.chartColumns !== '2-column' && (
                          <th className="p-2 text-center w-[18%]">
                            SIGNATURE
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="align-top border-b border-slate-300">
                        <td className="p-2.5 text-center font-mono text-xs border-r border-slate-800">
                          <div>{data.admission_date}</div>
                          {styling.chartColumns === '2-column' && (
                            <div className="mt-2 font-serif italic font-bold" style={{ color: styling.accentColor }}>
                              {data.doctor_name}
                            </div>
                          )}
                        </td>
                        <td className="p-3 space-y-2 border-r border-slate-800 leading-relaxed">
                          <div className="font-bold uppercase text-xs pb-1 border-b border-slate-200" style={{ color: styling.accentColor }}>
                            ADMISSION NOTES - {data.doctor_name}
                          </div>
                          <p>
                            {data.age} year old {data.gender?.toLowerCase() || 'patient'}, nil known comorbidities.
                          </p>
                          <p><strong>CO:</strong> {raw.chief_complaint || 'Cough and evening fever'}</p>
                          <p>{raw.treatment_text}</p>
                        </td>
                        {styling.chartColumns !== '2-column' && (
                          <td className="p-2 text-center border-slate-800">
                            <div className="h-16 flex items-center justify-center font-serif italic text-sm font-bold" style={{ color: styling.accentColor }}>
                              {data.doctor_name}
                            </div>
                            <span className="text-[10px] text-slate-400 block uppercase">Prescriber</span>
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Physical Examination Section */}
              {sections.find(s => s.id === 'examinations')?.enabled !== false && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold uppercase tracking-wider text-[11px]" style={{ color: styling.accentColor }}>
                    Physical Examination & Systems Review
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-800">
                    <div><strong>General:</strong> {raw.examination?.general || 'No pallor, no jaundice'}</div>
                    <div><strong>CVS:</strong> {raw.examination?.cvs || 'S1 S2 present, regular'}</div>
                    <div><strong>Respiratory:</strong> {raw.examination?.respiratory || 'Right mid zone crackles'}</div>
                    <div><strong>Abdomen:</strong> {raw.examination?.abdomen || 'Soft, non-tender'}</div>
                    <div><strong>CNS / Neuro:</strong> {raw.examination?.cns || 'Alert, GCS 15/15'}</div>
                  </div>
                </div>
              )}

              {/* 4. Assessment, DDX & Plan */}
              {docType === 'admission' && sections.find(s => s.id === 'assessment_plan')?.enabled !== false && (
                <div className="text-xs space-y-1 pt-1 border-t border-slate-200">
                  <p><strong>Assessment:</strong> {data.diagnosis} with secondary pneumonia</p>
                  <p><strong>Plan:</strong> 1. Admit to TB Ward • 2. 4-hourly vitals • 3. IV Ceftriaxone & Stat fluids</p>
                </div>
              )}

              {/* 5. MH 005 Inpatient Drug Sheet (MAR) */}
              {docType === 'admission' && sections.find(s => s.id === 'drug_sheet')?.enabled !== false && (
                <div className="pt-4 border-t-2 border-slate-300 space-y-3">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: styling.accentColor }}>
                      Drug Sheet (MH 005)
                    </h2>
                  </div>

                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 mr-2">Surname:</span>
                      <strong className="underline underline-offset-4">{data.patient_surname}</strong>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 mr-2">Forename:</span>
                      <strong className="underline underline-offset-4">{data.patient_name}</strong>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 mr-2">WARD:</span>
                      <strong className="underline underline-offset-4">{data.ward}</strong>
                    </div>
                  </div>

                  {/* Interactive Slots Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border-2 border-black text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black">
                          <th className="w-[36%] border-r border-black p-1 text-left font-bold">DRUG DETAILS</th>
                          <th className="w-[10%] border-r border-black p-1 text-center font-bold">Time</th>
                          <th className="w-[6%] border-r border-black p-1 text-center font-bold">Alt.</th>
                          <th colSpan={styling.dateGridDays || 14} className="border-b border-black p-0.5 text-center font-bold">
                            Date ({styling.dateGridDays || 14} Days Grid)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: styling.drugSlots || 6 }).map((_, slotIdx) => {
                          const med = meds[slotIdx];
                          const times = styling.adminTimes;
                          
                          return (
                            <React.Fragment key={slotIdx}>
                              {times.slice(0, 3).map((timeLabel, timeIdx) => (
                                <tr key={timeIdx} className="border-b border-slate-300">
                                  {timeIdx === 0 && (
                                    <td rowSpan={3} className="border-r-2 border-black p-2 align-top bg-white space-y-1">
                                      <div className="font-bold text-xs" style={{ color: styling.accentColor }}>
                                        {med ? med.drug : `<Slot ${slotIdx + 1} Empty>`}
                                      </div>
                                      {med && (
                                        <div className="text-[9px] text-slate-600">
                                          {med.dose} • {med.route} • {med.frequency}
                                        </div>
                                      )}
                                    </td>
                                  )}
                                  <td className="border-r border-black p-1 text-center whitespace-nowrap">
                                    {med && timeIdx === 0 ? (
                                      styling.timeBadgeStyle === 'pill' ? (
                                        <span className="px-1.5 py-0.5 rounded text-white font-bold text-[9px]" style={{ backgroundColor: styling.accentColor }}>
                                          {timeLabel}
                                        </span>
                                      ) : styling.timeBadgeStyle === 'outline' ? (
                                        <span className="px-1 py-0.5 border font-bold text-[9px]" style={{ borderColor: styling.accentColor, color: styling.accentColor }}>
                                          {timeLabel}
                                        </span>
                                      ) : (
                                        <span className="inline-block border-2 border-blue-600 text-blue-900 font-serif font-bold text-xs px-1.5 py-0.5 rounded-full bg-blue-50/50">
                                          {timeLabel}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-600">{timeLabel}</span>
                                    )}
                                  </td>
                                  <td className="border-r border-black p-0.5 text-center text-slate-300">&nbsp;</td>
                                  {Array.from({ length: styling.dateGridDays || 14 }).map((_, d) => (
                                    <td key={d} className="border-r border-slate-200 p-0 text-center">&nbsp;</td>
                                  ))}
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* 6. IV Fluids & Special Orders */}
              {docType === 'admission' && sections.find(s => s.id === 'iv_fluids')?.enabled !== false && (
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1">
                  <div><strong>Intravenous Fluids:</strong> Ringer Lactate 1000 mL (over 8 hours)</div>
                  <div><strong>Nursing Monitoring Orders:</strong> 4-hourly vitals, record intake & output</div>
                </div>
              )}

              {/* 7. Signatures */}
              {sections.find(s => s.id === 'signatures')?.enabled !== false && (
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Prescribing Clinician:</span>{' '}
                    <strong className="font-serif italic text-sm ml-1" style={{ color: styling.accentColor }}>
                      {data.doctor_name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span> <strong>{data.admission_date}</strong>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
