import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate, Download, Upload, Trash2, FileCheck, Code, ArrowLeft,
  Loader2, Check, Plus, PlusCircle, Sparkles, X, Bed, Share2, Pill,
  Stethoscope, ChevronDown, ChevronUp, Layers, FileText, Palette
} from 'lucide-react';
import { api } from '../services/api';
import OnlineLayoutDesignerModal from '../components/OnlineLayoutDesignerModal';

const STANDARD_EXAMINATIONS = [
  { id: 'general', label: 'General / JACCOLD', placeholder: 'Alert, no distress. JACCOLD: pallor, jaundice, cyanosis, clubbing, edema, lymphadenopathy' },
  { id: 'cvs', label: 'Cardiovascular (CVS)', placeholder: 'S1 S2 normal, no murmur, regular pulse, normal JVP' },
  { id: 'respiratory', label: 'Respiratory System', placeholder: 'Clear bilaterally, vesicular breath sounds, no added sounds' },
  { id: 'abdomen', label: 'Abdominal System', placeholder: 'Soft, non-tender, non-distended, normal bowel sounds' },
  { id: 'cns', label: 'CNS / Neurological', placeholder: 'GCS 15/15, pupils equal & reactive to light, no focal neuro deficit, neck supple' },
  { id: 'msk', label: 'Musculoskeletal (MSK)', placeholder: 'Full range of movement, no joint swelling or deformity, peripheral pulses palpable' },
  { id: 'ent', label: 'ENT / Head & Neck', placeholder: 'Pharynx clear, tonsils normal, tympanic membranes intact, no cervical adenopathy' },
  { id: 'eye', label: 'Eye & Visual', placeholder: 'Conjunctiva pink, sclera clear, pupils equal & reactive, visual acuity intact' },
  { id: 'skin', label: 'Dermatological / Skin', placeholder: 'Skin intact, warm, normal turgor, no rashes or petechiae' },
  { id: 'gu', label: 'Genitourinary / Pelvic', placeholder: 'External genitalia normal, catheter in situ with clear amber urine' }
];

export default function TemplateManagerPage({ setView, onUseTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [docxFiles, setDocxFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'admission', 'referral', 'custom'

  // Creation State
  const [creationTab, setCreationTab] = useState('builder'); // 'builder' or 'upload'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDesignerModal, setShowDesignerModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // In-App Builder Form State
  const [builderForm, setBuilderForm] = useState({
    name: '',
    type: 'admission',
    description: '',
    design_filename: '', // base .docx layout file
    // Common Defaults
    ward: '',
    diagnosis: '',
    // Included Examinations
    included_examinations: ['general', 'cvs', 'respiratory', 'abdomen'],
    examination_defaults: {
      general: '',
      cvs: '',
      respiratory: '',
      abdomen: '',
      cns: '',
      msk: '',
      ent: '',
      eye: '',
      skin: '',
      gu: ''
    },
    custom_examinations: [], // [{ id: 'custom_1', label: 'Vascular Pulses', default_text: '' }]
    // Admission Specific
    chief_complaint: '',
    history_present_illness: '',
    assessment: '',
    plan: '',
    starter_meds: [
      { drug: '', dose: '', route: 'PO', frequency: 'OD' }
    ],
    starter_iv_fluids: '',
    // Referral Specific
    hospital_name: 'Gumare Primary Hospital',
    referring_unit: '',
    receiving_hospital: '',
    receiving_department: '',
    urgency: 'Urgent',
    reason_for_referral: '',
    transport_needs: ''
  });

  // Word .docx Upload State
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('admission');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  // Expanded card state
  const [expandedTplId, setExpandedTplId] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [resTpls, resFiles] = await Promise.all([
        api.templates.list(),
        api.templates.listDocxFiles().catch(() => ({ files: [] }))
      ]);
      setTemplates(resTpls.templates || []);
      setDocxFiles(resFiles.files || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!builderForm.name.trim()) {
      alert('Please provide a template name');
      return;
    }

    setCreating(true);
    setFeedback({ type: '', message: '' });

    try {
      const cleanMeds = builderForm.starter_meds.filter(m => m.drug && m.drug.trim());

      // Build examination object containing all included exams
      const examObject = {};
      builderForm.included_examinations.forEach(examId => {
        examObject[examId] = (builderForm.examination_defaults[examId] || '').trim();
      });
      builderForm.custom_examinations.forEach(custom => {
        if (custom.label && custom.label.trim()) {
          const key = custom.id || custom.label.toLowerCase().replace(/\s+/g, '_');
          examObject[key] = (custom.default_text || '').trim();
        }
      });

      const allIncludedExamIds = [
        ...builderForm.included_examinations,
        ...builderForm.custom_examinations.map(c => c.id || c.label.toLowerCase().replace(/\s+/g, '_'))
      ];

      const defaultData = builderForm.type === 'admission' ? {
        design_filename: builderForm.design_filename || null,
        ward: builderForm.ward.trim(),
        diagnosis: builderForm.diagnosis.trim(),
        chief_complaint: builderForm.chief_complaint.trim(),
        history_present_illness: builderForm.history_present_illness.trim(),
        included_examinations: allIncludedExamIds,
        custom_examinations: builderForm.custom_examinations,
        examination: examObject,
        assessment: builderForm.assessment.trim(),
        plan: builderForm.plan.trim() ? builderForm.plan.split('\n').filter(Boolean) : [],
        medications: cleanMeds,
        iv_fluids: builderForm.starter_iv_fluids.trim() ? [{ fluid: builderForm.starter_iv_fluids.trim(), volume: '1 L', rate_hours: 'Over 12 hours' }] : []
      } : {
        design_filename: builderForm.design_filename || null,
        hospital_name: builderForm.hospital_name.trim() || 'Gumare Primary Hospital',
        referring_unit: builderForm.referring_unit.trim(),
        receiving_hospital: builderForm.receiving_hospital.trim(),
        receiving_department: builderForm.receiving_department.trim(),
        urgency: builderForm.urgency,
        diagnosis: builderForm.diagnosis.trim(),
        reason_for_referral: builderForm.reason_for_referral.trim(),
        clinical_history: builderForm.history_present_illness.trim(),
        included_examinations: allIncludedExamIds,
        custom_examinations: builderForm.custom_examinations,
        examination: examObject,
        transport_needs: builderForm.transport_needs.trim()
      };

      const res = await api.templates.createCustom({
        name: builderForm.name.trim(),
        type: builderForm.type,
        description: builderForm.description.trim(),
        design_filename: builderForm.design_filename || null,
        default_data: defaultData
      });

      setFeedback({ type: 'success', message: `Template "${res.template.name}" created and saved to SQLite!` });
      setShowCreateModal(false);
      fetchTemplates();

      // Reset form
      setBuilderForm({
        name: '',
        type: 'admission',
        description: '',
        design_filename: '',
        ward: '',
        diagnosis: '',
        included_examinations: ['general', 'cvs', 'respiratory', 'abdomen'],
        examination_defaults: {
          general: '',
          cvs: '',
          respiratory: '',
          abdomen: '',
          cns: '',
          msk: '',
          ent: '',
          eye: '',
          skin: '',
          gu: ''
        },
        custom_examinations: [],
        chief_complaint: '',
        history_present_illness: '',
        assessment: '',
        plan: '',
        starter_meds: [{ drug: '', dose: '', route: 'PO', frequency: 'OD' }],
        starter_iv_fluids: '',
        hospital_name: 'Gumare Primary Hospital',
        referring_unit: '',
        receiving_hospital: '',
        receiving_department: '',
        urgency: 'Urgent',
        reason_for_referral: '',
        transport_needs: ''
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create template' });
    } finally {
      setCreating(false);
    }
  };

  const handleUploadWord = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please choose a .docx file to upload');
      return;
    }

    setUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('name', uploadName);
      formData.append('type', uploadType);
      formData.append('description', uploadDesc);
      formData.append('template_file', uploadFile);

      await api.templates.upload(formData);
      setFeedback({ type: 'success', message: 'Word (.docx) template uploaded and registered!' });
      setShowCreateModal(false);
      setUploadName('');
      setUploadDesc('');
      setUploadFile(null);
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to upload Word template' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this custom template?')) {
      try {
        await api.templates.delete(id);
        setFeedback({ type: 'success', message: 'Template removed successfully.' });
        fetchTemplates();
      } catch (err) {
        alert('Failed to delete template: ' + err.message);
      }
    }
  };

  const downloadTemplate = (id) => {
    window.open(api.templates.getDownloadUrl(id), '_blank');
  };

  const handleUse = (tpl) => {
    if (onUseTemplate) {
      onUseTemplate(tpl);
    } else {
      setView(tpl.type === 'referral' ? 'new-referral' : 'new-admission');
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (filterType === 'admission') return t.type === 'admission' || t.type === 'drug_sheet';
    if (filterType === 'referral') return t.type === 'referral';
    if (filterType === 'custom') return !t.is_default;
    return true;
  });

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('dashboard')}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-emerald-700" />
              Document Templates & Custom Builder
            </h2>
            <p className="text-xs text-slate-500">
              Create and manage admission & referral templates compiled for Microsoft Word (.docx)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDesignerModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Palette className="w-4 h-4" />
            <span>In-Depth Layout Designer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setCreationTab('builder');
            }}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Custom Template</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs ${
          feedback.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterType === 'all' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Templates ({templates.length})
          </button>
          <button
            onClick={() => setFilterType('admission')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterType === 'admission' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            Admissions ({templates.filter(t => t.type === 'admission' || t.type === 'drug_sheet').length})
          </button>
          <button
            onClick={() => setFilterType('referral')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterType === 'referral' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Referrals ({templates.filter(t => t.type === 'referral').length})
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterType === 'custom' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            My Custom Templates ({templates.filter(t => !t.is_default).length})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium px-2">
          Select any template below to start a patient record with it
        </span>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading templates from SQLite...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No templates match this filter</p>
          <button
            onClick={() => setFilterType('all')}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Show All Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const hasDefaultData = tpl.default_data && Object.keys(tpl.default_data).length > 0;
            const isExpanded = expandedTplId === tpl.id;
            const includedExams = (tpl.default_data && tpl.default_data.included_examinations) || [];

            return (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {tpl.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {tpl.is_default ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
                            ★ System Default
                          </span>
                        ) : (
                          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-md border border-blue-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            Custom Template
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {tpl.type === 'admission' ? 'Admission Chart' : tpl.type === 'referral' ? 'Referral Note' : tpl.type}
                        </span>
                        {tpl.default_data && tpl.default_data.design_filename && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            DOCX Layout: {tpl.default_data.design_filename}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => downloadTemplate(tpl.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                      title="Download companion .docx template file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tpl.description || 'Pre-configured clinical structure for patient documentation.'}
                  </p>

                  {/* Included Examinations Tags */}
                  {includedExams.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-blue-600" />
                        Exams:
                      </span>
                      {includedExams.map(exId => (
                        <span key={exId} className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-1.5 py-0.5 rounded border border-blue-200">
                          {exId.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pre-filled Defaults Preview (for Custom Templates) */}
                  {hasDefaultData && (
                    <div className="border-t border-slate-100 pt-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setExpandedTplId(isExpanded ? null : tpl.id)}
                        className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition"
                      >
                        <span>Included Preset Fields & Orders</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200/70 font-sans">
                          {tpl.default_data.ward && (
                            <p><strong className="text-slate-700">Ward:</strong> {tpl.default_data.ward}</p>
                          )}
                          {tpl.default_data.diagnosis && (
                            <p><strong className="text-slate-700">Diagnosis:</strong> <span className="text-emerald-800 font-medium">{tpl.default_data.diagnosis}</span></p>
                          )}
                          {tpl.default_data.receiving_hospital && (
                            <p><strong className="text-slate-700">Transfer Destination:</strong> {tpl.default_data.receiving_hospital} ({tpl.default_data.receiving_department || 'Specialist'})</p>
                          )}
                          {tpl.default_data.medications && tpl.default_data.medications.length > 0 && (
                            <p>
                              <strong className="text-slate-700">Starter Meds:</strong>{' '}
                              <span className="text-blue-900 font-serif font-medium">
                                {tpl.default_data.medications.map(m => `${m.drug} ${m.dose} (${m.frequency})`).join('; ')}
                              </span>
                            </p>
                          )}
                          {tpl.default_data.chief_complaint && (
                            <p><strong className="text-slate-700">Complaint Prompt:</strong> {tpl.default_data.chief_complaint}</p>
                          )}
                          {tpl.default_data.examination && typeof tpl.default_data.examination === 'object' && Object.keys(tpl.default_data.examination).length > 0 && (
                            <div className="pt-1">
                              <strong className="text-slate-700 block mb-0.5">Examination Presets:</strong>
                              <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-0.5 pl-1">
                                {Object.entries(tpl.default_data.examination).map(([k, v]) => v ? (
                                  <li key={k}><strong>{k.replace(/_/g, ' ').toUpperCase()}:</strong> {v}</li>
                                ) : null)}
                              </ul>
                            </div>
                          )}
                          {tpl.default_data.transport_needs && (
                            <p><strong className="text-slate-700">Transport:</strong> {tpl.default_data.transport_needs}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-1">
                    <span>File: {tpl.filename || 'generated.docx'}</span>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleUse(tpl)}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Use in New {tpl.type === 'referral' ? 'Referral' : 'Admission'}</span>
                  </button>

                  {!tpl.is_default && (
                    <button
                      type="button"
                      onClick={() => handleDelete(tpl.id)}
                      className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                      title="Delete Custom Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* docxtemplater Merge Reference Drawer */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
            <Code className="w-4 h-4" />
            docxtemplater Merge Reference & OpenXML Engine
          </h3>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            OpenXML (.docx)
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          All templates in the system dynamically compile into standard Word (.docx) documents. You can use standard merge tags in custom Word files or let our in-app builder generate them automatically:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 space-y-1 font-mono text-[11px]">
            <p className="text-amber-300 font-bold font-sans text-xs">Patient Demographics:</p>
            <p><span className="text-emerald-300">{"{patient_name}"}</span> - First name</p>
            <p><span className="text-emerald-300">{"{patient_surname}"}</span> - Surname</p>
            <p><span className="text-emerald-300">{"{age}"}</span> / <span className="text-emerald-300">{"{gender}"}</span></p>
            <p><span className="text-emerald-300">{"{reg_no}"}</span> - Reg Number</p>
            <p><span className="text-emerald-300">{"{ward}"}</span> - Ward</p>
            <p><span className="text-emerald-300">{"{diagnosis}"}</span> - Clinical diagnosis</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 space-y-1 font-mono text-[11px]">
            <p className="text-amber-300 font-bold font-sans text-xs">Clinical & Examination Tags:</p>
            <p><span className="text-emerald-300">{"{doctor_name}"}</span> - Medical officer</p>
            <p><span className="text-emerald-300">{"{admission_date}"}</span> - Timestamp</p>
            <p><span className="text-emerald-300">{"{treatment_text}"}</span> - 3-column note</p>
            <p><span className="text-emerald-300">{"{exam_general}"}</span> / <span className="text-emerald-300">{"{exam_cvs}"}</span></p>
            <p><span className="text-emerald-300">{"{exam_resp}"}</span> / <span className="text-emerald-300">{"{exam_abdo}"}</span></p>
            <p><span className="text-emerald-300">{"{exam_cns}"}</span> / <span className="text-emerald-300">{"{exam_msk}"}</span></p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 space-y-1 font-mono text-[11px]">
            <p className="text-amber-300 font-bold font-sans text-xs">MH 005 Drug Sheet Loops:</p>
            <p><span className="text-emerald-300">{"{d1_name}"}</span> ... <span className="text-emerald-300">{"{d6_name}"}</span></p>
            <p><span className="text-emerald-300">{"{d1_dose}"}</span> | <span className="text-emerald-300">{"{d1_route}"}</span></p>
            <p><span className="text-emerald-300">{"{s1_t0}"}</span> ... <span className="text-emerald-300">{"{s1_t6}"}</span> (Circle Badges)</p>
            <p className="text-slate-400">Repeating: <span className="text-emerald-300">{"{#medications}..{/medications}"}</span></p>
          </div>
        </div>
      </div>

      {/* CREATE CUSTOM TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Create Custom Clinical Template</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Header Mode Switcher */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3">
              <button
                type="button"
                onClick={() => setCreationTab('builder')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  creationTab === 'builder'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Interactive Builder (In-App)
              </button>
              <button
                type="button"
                onClick={() => setCreationTab('upload')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  creationTab === 'upload'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                Upload Word (.docx) File
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">

              {creationTab === 'builder' ? (
                /* INTERACTIVE IN-APP BUILDER */
                <form id="builder-form" onSubmit={handleCreateCustom} className="space-y-4 text-xs">
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pediatric Severe Malnutrition, Surgical Laparotomy Referral"
                        value={builderForm.name}
                        onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                        className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Template Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={builderForm.type}
                        onChange={(e) => setBuilderForm({ ...builderForm, type: e.target.value })}
                        className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-medium"
                      >
                        <option value="admission">Admission & Drug Sheet</option>
                        <option value="referral">Clinical Referral Note</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Description / Clinical Purpose</label>
                    <input
                      type="text"
                      placeholder="Brief note for clinicians on when to use this template..."
                      value={builderForm.description}
                      onChange={(e) => setBuilderForm({ ...builderForm, description: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Word (.docx) Base Design Selection */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Word (.docx) Base Design / Export Layout
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Select standard hospital format or custom uploaded .docx
                      </span>
                    </div>
                    <select
                      value={builderForm.design_filename || ''}
                      onChange={(e) => setBuilderForm({ ...builderForm, design_filename: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-medium"
                    >
                      <option value="">Standard Default Hospital Layout ({builderForm.type === 'admission' ? '3-Column Chart + MH 005 Drug Sheet' : 'Official Hospital REFERRAL Form'})</option>
                      {docxFiles
                        .filter(f => !builderForm.type || f.type === builderForm.type || (builderForm.type === 'admission' && f.type === 'drug_sheet'))
                        .map(f => (
                          <option key={f.filename} value={f.filename}>
                            {f.is_default ? `★ ${f.name} (${f.filename})` : `✦ Custom File: ${f.name} (${f.filename})`}
                          </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Exporting patient notes created with this template will automatically render into this selected .docx document layout.
                    </p>
                  </div>

                  {/* Configurable Examinations to Include Section */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <label className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-blue-700" />
                          Physical Examination: Systems to Include
                        </label>
                        <p className="text-[11px] text-blue-800/80">
                          Select which examination systems are required for this protocol. Checked systems expand below for optional default findings.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setBuilderForm({
                            ...builderForm,
                            included_examinations: STANDARD_EXAMINATIONS.map(s => s.id)
                          })}
                          className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded transition"
                        >
                          Select All (10)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuilderForm({
                            ...builderForm,
                            included_examinations: ['general', 'cvs', 'respiratory', 'abdomen']
                          })}
                          className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2 py-0.5 rounded transition"
                        >
                          Core 4
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Chips for Standard Systems */}
                    <div className="flex flex-wrap gap-1.5">
                      {STANDARD_EXAMINATIONS.map(sys => {
                        const isChecked = builderForm.included_examinations.includes(sys.id);
                        return (
                          <button
                            key={sys.id}
                            type="button"
                            onClick={() => {
                              const exists = builderForm.included_examinations.includes(sys.id);
                              const next = exists
                                ? builderForm.included_examinations.filter(id => id !== sys.id)
                                : [...builderForm.included_examinations, sys.id];
                              setBuilderForm({ ...builderForm, included_examinations: next });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                              isChecked
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {isChecked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                            <span>{sys.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Expandable Default Findings Inputs for Checked Systems */}
                    <div className="space-y-2 pt-2 border-t border-blue-200/70">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Default Findings / Clinical Prompts for Included Examinations:
                      </label>
                      {builderForm.included_examinations.length === 0 && (
                        <p className="text-[11px] text-slate-500 italic">No examination systems selected yet. Click the chips above to include systems.</p>
                      )}
                      {STANDARD_EXAMINATIONS.filter(sys => builderForm.included_examinations.includes(sys.id)).map(sys => (
                        <div key={sys.id} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{sys.label}</span>
                            <button
                              type="button"
                              onClick={() => setBuilderForm({
                                ...builderForm,
                                included_examinations: builderForm.included_examinations.filter(id => id !== sys.id)
                              })}
                              className="text-slate-400 hover:text-red-600 transition"
                              title="Exclude system"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={sys.placeholder}
                            value={builderForm.examination_defaults[sys.id] || ''}
                            onChange={(e) => {
                              setBuilderForm({
                                ...builderForm,
                                examination_defaults: {
                                  ...builderForm.examination_defaults,
                                  [sys.id]: e.target.value
                                }
                              });
                            }}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}

                      {/* Custom Examination Systems */}
                      {builderForm.custom_examinations.map((cust, cIdx) => (
                        <div key={cIdx} className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              placeholder="Custom System Name (e.g. Vascular Pulses, Mental Status Exam)"
                              value={cust.label}
                              onChange={(e) => {
                                const copy = [...builderForm.custom_examinations];
                                copy[cIdx].label = e.target.value;
                                setBuilderForm({ ...builderForm, custom_examinations: copy });
                              }}
                              className="font-bold text-xs p-1 border-b border-purple-300 outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const copy = builderForm.custom_examinations.filter((_, idx) => idx !== cIdx);
                                setBuilderForm({ ...builderForm, custom_examinations: copy });
                              }}
                              className="text-slate-400 hover:text-red-600 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Default findings or instructions..."
                            value={cust.default_text}
                            onChange={(e) => {
                              const copy = [...builderForm.custom_examinations];
                              copy[cIdx].default_text = e.target.value;
                              setBuilderForm({ ...builderForm, custom_examinations: copy });
                            }}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-purple-500"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setBuilderForm({
                          ...builderForm,
                          custom_examinations: [
                            ...builderForm.custom_examinations,
                            { id: `custom_${Date.now()}`, label: '', default_text: '' }
                          ]
                        })}
                        className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Custom Examination System</span>
                      </button>
                    </div>
                  </div>

                  {/* ADMISSION SPECIFIC FIELDS */}
                  {builderForm.type === 'admission' ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <h4 className="font-bold text-emerald-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5" />
                        Pre-Filled Admission & Drug Sheet Defaults
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Default Ward</label>
                          <input
                            type="text"
                            placeholder="e.g. Pediatrics, TB Ward, Female Medical"
                            value={builderForm.ward}
                            onChange={(e) => setBuilderForm({ ...builderForm, ward: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Default Working Diagnosis</label>
                          <input
                            type="text"
                            placeholder="e.g. Severe Acute Malnutrition (SAM)"
                            value={builderForm.diagnosis}
                            onChange={(e) => setBuilderForm({ ...builderForm, diagnosis: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Chief Complaint Boilerplate</label>
                        <input
                          type="text"
                          placeholder="e.g. Failure to thrive, bilateral pitting edema, productive cough"
                          value={builderForm.chief_complaint}
                          onChange={(e) => setBuilderForm({ ...builderForm, chief_complaint: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">History of Present Illness Outline</label>
                        <textarea
                          rows={2}
                          placeholder="Outline key history prompts..."
                          value={builderForm.history_present_illness}
                          onChange={(e) => setBuilderForm({ ...builderForm, history_present_illness: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Clinical Assessment Summary</label>
                        <textarea
                          rows={2}
                          placeholder="Default diagnostic synthesis (e.g. 1. Acute Gastroenteritis, 2. Mild fever)..."
                          value={builderForm.assessment}
                          onChange={(e) => setBuilderForm({ ...builderForm, assessment: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Default Management Plan (Numbered Items)</label>
                        <textarea
                          rows={3}
                          placeholder="Enter default plan items, one per line (auto-numbered):&#10;1. Admit to general ward as per protocol&#10;2. Zinc sulphate 20mg PO OD&#10;3. Replacement of loses with ORS&#10;4. Routine vitals monitoring"
                          value={builderForm.plan}
                          onChange={(e) => setBuilderForm({ ...builderForm, plan: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-mono text-xs"
                        />
                      </div>

                      {/* Starter Medications for MH 005 Drug Sheet */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-emerald-600" />
                            Pre-configured Starter Medications (Coupled Drug Sheet)
                          </label>
                          <button
                            type="button"
                            onClick={() => setBuilderForm({
                              ...builderForm,
                              starter_meds: [...builderForm.starter_meds, { drug: '', dose: '', route: 'PO', frequency: 'OD' }]
                            })}
                            className="text-[11px] text-emerald-700 hover:underline font-bold"
                          >
                            + Add Med
                          </button>
                        </div>

                        {builderForm.starter_meds.map((med, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Drug (e.g. Amoxicillin)"
                              value={med.drug}
                              onChange={(e) => {
                                const copy = [...builderForm.starter_meds];
                                copy[idx].drug = e.target.value;
                                setBuilderForm({ ...builderForm, starter_meds: copy });
                              }}
                              className="col-span-2 p-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Dose (e.g. 250mg)"
                              value={med.dose}
                              onChange={(e) => {
                                const copy = [...builderForm.starter_meds];
                                copy[idx].dose = e.target.value;
                                setBuilderForm({ ...builderForm, starter_meds: copy });
                              }}
                              className="p-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                            <select
                              value={med.frequency}
                              onChange={(e) => {
                                const copy = [...builderForm.starter_meds];
                                copy[idx].frequency = e.target.value;
                                setBuilderForm({ ...builderForm, starter_meds: copy });
                              }}
                              className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                            >
                              <option value="OD">OD (6 am)</option>
                              <option value="BD">BD (6am, 6pm)</option>
                              <option value="TDS">TDS (6am, 2pm, 10pm)</option>
                              <option value="QID">QID (6am, 12md, 6pm, 12mn)</option>
                              <option value="NOCTE">NOCTE (10 pm)</option>
                            </select>
                          </div>
                        ))}

                        <div className="pt-2 border-t border-slate-200">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Starter IV Fluids</label>
                          <input
                            type="text"
                            placeholder="e.g. Ringers Lactate 1000ml or ReSoMal"
                            value={builderForm.starter_iv_fluids}
                            onChange={(e) => setBuilderForm({ ...builderForm, starter_iv_fluids: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* REFERRAL SPECIFIC FIELDS */
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <h4 className="font-bold text-amber-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" />
                        Pre-Filled Referral Form Defaults
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Transferring Unit</label>
                          <input
                            type="text"
                            placeholder="e.g. Accident & Emergency, Surgical Ward"
                            value={builderForm.referring_unit}
                            onChange={(e) => setBuilderForm({ ...builderForm, referring_unit: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Receiving Facility & Specialty</label>
                          <input
                            type="text"
                            placeholder="e.g. NRH - General Surgery"
                            value={builderForm.receiving_hospital}
                            onChange={(e) => setBuilderForm({ ...builderForm, receiving_hospital: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Default Tentative Diagnosis</label>
                        <input
                          type="text"
                          placeholder="e.g. Blunt Abdominal Trauma / Possible Intraabdominal Bleeding"
                          value={builderForm.diagnosis}
                          onChange={(e) => setBuilderForm({ ...builderForm, diagnosis: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Standard Reason for Referral Boilerplate</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. For specialist surgical consultation, ultrasound / CT confirmation, and operative intervention..."
                          value={builderForm.reason_for_referral}
                          onChange={(e) => setBuilderForm({ ...builderForm, reason_for_referral: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Transport & Escort Orders</label>
                        <input
                          type="text"
                          placeholder="e.g. Ambulance transfer with continuous vitals monitoring, oxygen, and nurse escort"
                          value={builderForm.transport_needs}
                          onChange={(e) => setBuilderForm({ ...builderForm, transport_needs: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Template...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Custom Template</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              ) : (
                /* UPLOAD WORD FILE FORM */
                <form id="upload-form" onSubmit={handleUploadWord} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Template Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maternity Discharge Summary, Intensive Care Unit Transfer Layout"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Template Type</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white"
                    >
                      <option value="admission">Admission Note & Treatment Chart</option>
                      <option value="referral">Clinical Referral Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Summary of this template's use case..."
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Choose .docx File *</label>
                    <input
                      type="file"
                      required
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="w-full p-2 border border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Must be a valid Word (.docx) document. You can use standard docxtemplater tags like {"{patient_name}"}, {"{treatment_text}"}, {"{examination}"}, or individual organ tags like {"{exam_cns}"}.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload & Register .docx</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* In-Depth Online Layout Designer Modal */}
      {showDesignerModal && (
        <OnlineLayoutDesignerModal
          initialType="admission"
          onApplyLayout={() => {
            loadTemplates();
            setFeedback({ type: 'success', message: 'Custom online layout saved and ready for clinical use!' });
          }}
          onClose={() => {
            setShowDesignerModal(false);
            loadTemplates();
          }}
        />
      )}

    </div>
  );
}
