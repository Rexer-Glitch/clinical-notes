import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Share2, AlertCircle, Sparkles, LayoutTemplate, Plus, Layers, Stethoscope, FileText, Check } from 'lucide-react';
import { api } from '../services/api';

export default function ReferralNoteFormPage({ noteId, initialTemplateId, setView, onOpenViewModal, onOpenAiModal }) {
  const isEditing = !!noteId;

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId || null);
  const [docxDesigns, setDocxDesigns] = useState([]);
  const [selectedDesignFilename, setSelectedDesignFilename] = useState('');

  const [formData, setFormData] = useState({
    hospital_name: 'Gumare Primary Hospital',
    referring_unit: 'Inpatient Medical / TB Ward',
    receiving_hospital: 'Letsholathebe II Memorial Hospital (Maun)',
    receiving_department: 'Internal Medicine / Pulmonology Specialist',
    urgency: 'Urgent',
    patient_name: 'KAPOI',
    patient_surname: 'SETSHWANE',
    reg_no: 'GPH-2026-09114',
    age: '42',
    gender: 'Male',
    ward: 'Medical Ward',
    diagnosis: 'Severe Community-Acquired Pneumonia with Pleural Effusion for Diagnostic Thoracentesis',
    admission_date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    doctor_name: 'Dr. Gumbo',
    reason_for_referral: 'Diagnostic pleural tap and ultrasound assessment not available at primary hospital level; persistent high grade fevers despite 48h Ceftriaxone.',
    clinical_history: '42 year old male presented with 5-day history of right-sided pleuritic chest pain, productive cough with rust-colored sputum, and rigors. Non-smoker. HIV negative.',
    vital_signs: 'BP 108/68 mmHg, HR 118 bpm, RR 28/min, SpO2 91% on room air (96% on 3L O2 via nasal prongs), Temp 39.1°C',
    examination: 'Decreased chest expansion on right base, stony dull percussion note right lower zone, bronchial breathing right mid-zone, absent breath sounds right base.',
    investigations: 'CXR: dense right lower zone opacity with blunting of costophrenic angle and meniscus sign. WBC 18.4, CRP 142, Creatinine 88.',
    treatment_given: 'IV Ceftriaxone 2g OD (day 2), IV Metronidazole 500mg TDS, IVF Ringers Lactate 1000ml, Paracetamol 1g PO stat.',
    transport_needs: 'Ambulance transfer with continuous supplemental Oxygen (3L/min nasal prongs) and nurse escort.'
  });

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(noteId || null);

  useEffect(() => {
    if (noteId) {
      api.notes.get(noteId).then(res => {
        const n = res.note;
        const raw = n.raw_data || {};
        setFormData({
          hospital_name: n.hospital_name || raw.hospital_name || 'Gumare Primary Hospital',
          referring_unit: raw.referring_unit || 'Ward',
          receiving_hospital: raw.receiving_hospital || 'Referral Hospital',
          receiving_department: raw.receiving_department || 'Specialist Clinic',
          urgency: raw.urgency || 'Urgent',
          patient_name: n.patient_name || '',
          patient_surname: n.patient_surname || '',
          reg_no: n.reg_no || '',
          age: n.age || '',
          gender: n.gender || 'Male',
          ward: n.ward || 'Medical',
          diagnosis: n.diagnosis || '',
          admission_date: n.admission_date || '',
          doctor_name: n.doctor_name || 'Dr. Gumbo',
          reason_for_referral: raw.reason_for_referral || '',
          clinical_history: raw.clinical_history || '',
          vital_signs: raw.vital_signs || '',
          examination: raw.examination || '',
          investigations: raw.investigations || '',
          treatment_given: raw.treatment_given || '',
          transport_needs: raw.transport_needs || ''
        });
      }).catch(err => alert('Failed to load referral note: ' + err.message));
    }
  }, [noteId]);

  // Load referral templates and docx design files
  useEffect(() => {
    Promise.all([
      api.templates.list('referral'),
      api.templates.listDocxFiles('referral').catch(() => ({ files: [] }))
    ]).then(([resTpls, resDesigns]) => {
      const tpls = resTpls.templates || [];
      const designs = resDesigns.files || [];
      setTemplates(tpls);
      setDocxDesigns(designs);

      if (initialTemplateId) {
        const match = tpls.find(t => t.id === Number(initialTemplateId));
        if (match) {
          applyTemplateDefaults(match);
        }
      } else if (!noteId && tpls.length > 0) {
        const def = tpls.find(t => t.is_default) || tpls[0];
        if (def) {
          setSelectedTemplateId(def.id);
          const designFile = (def.default_data && def.default_data.design_filename) || def.filename || 'referral_and_report_form_template.docx';
          setSelectedDesignFilename(designFile);
          setFormData(prev => ({ ...prev, template_id: def.id, template_filename: designFile, design_filename: designFile }));
        }
      }
    }).catch(err => console.warn('Could not load referral templates or docx designs:', err));
  }, [initialTemplateId, noteId]);

  const applyTemplateDefaults = (tpl) => {
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    const d = tpl.default_data || {};
    const designFile = d.design_filename || tpl.filename || 'referral_and_report_form_template.docx';
    setSelectedDesignFilename(designFile);

    // Format examination from object or string
    let examText = d.examination;
    if (typeof d.examination === 'object' && d.examination !== null) {
      examText = Object.entries(d.examination)
        .filter(([_, v]) => v && String(v).trim())
        .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
        .join('\n');
    }

    setFormData(prev => ({
      ...prev,
      template_id: tpl.id,
      template_filename: designFile,
      design_filename: designFile,
      hospital_name: d.hospital_name || prev.hospital_name,
      referring_unit: d.referring_unit || prev.referring_unit,
      receiving_hospital: d.receiving_hospital || prev.receiving_hospital,
      receiving_department: d.receiving_department || prev.receiving_department,
      urgency: d.urgency || prev.urgency,
      diagnosis: d.diagnosis || prev.diagnosis,
      reason_for_referral: d.reason_for_referral || prev.reason_for_referral,
      clinical_history: d.clinical_history || prev.clinical_history,
      examination: examText !== undefined ? examText : prev.examination,
      transport_needs: d.transport_needs || prev.transport_needs
    }));
  };

  const handleSave = async (andPreview = false) => {
    if (!formData.patient_name || !formData.patient_surname) {
      alert('Please enter patient first name and surname');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: 'referral',
        template_id: selectedTemplateId,
        design_filename: selectedDesignFilename || formData.template_filename,
        patient_name: formData.patient_name,
        patient_surname: formData.patient_surname,
        reg_no: formData.reg_no,
        age: formData.age,
        gender: formData.gender,
        ward: formData.ward,
        diagnosis: formData.diagnosis,
        hospital_name: formData.hospital_name,
        doctor_name: formData.doctor_name,
        admission_date: formData.admission_date,
        raw_data: {
          ...formData,
          template_id: selectedTemplateId,
          template_filename: selectedDesignFilename || formData.template_filename,
          design_filename: selectedDesignFilename || formData.template_filename
        }
      };

      let currentId = savedId;
      if (currentId) {
        await api.notes.update(currentId, payload);
      } else {
        const res = await api.notes.create(payload);
        currentId = res.note_id;
        setSavedId(currentId);
      }

      if (andPreview) {
        onOpenViewModal(currentId);
      } else {
        alert('Referral note saved successfully!');
        setView('dashboard');
      }
    } catch (err) {
      alert('Failed to save referral note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (presetName) => {
    if (presetName === 'kebakaone') {
      setFormData({
        hospital_name: 'GPH',
        referring_unit: 'Accident & Emergency / Surgical',
        receiving_hospital: 'NRH',
        receiving_department: 'General Surgery (Dr. Bose)',
        urgency: 'Emergency / Immediate',
        patient_name: 'KEBAKAONE',
        patient_surname: 'NKAPE',
        reg_no: 'GPH-2026-0683',
        age: '31',
        gender: 'M',
        ward: 'Surgical / Holding',
        diagnosis: 'POSSIBLE INTRAABDOMINAL BLEEDING',
        admission_date: '21/03/26',
        doctor_name: 'DR. GUMBO',
        reason_for_referral: 'Blunt abdominal trauma with intraabdominal bleeding (hemoperitoneum) for urgent exploratory laparotomy / general surgery evaluation at referral hospital.',
        clinical_history: `Thank you for accepting our patient 31 year old male, with a history of having been stumped multiple times with a foot on the abdomen at around 0000hrs today, then started experiencing severe abdominal pains. Seen at Etsha 6 clinic – vitals: BP 88/67mm hg pulse 65bpm - given Diclofenac 75mg IM and referred to GPH.

GPH - vitals: BP 111/72 pulse 58, primary survey – unremarkable.
S- survey : Alert, in a forced position, no cardiovascular-pulmonary distress.
Abdo : non distended, generalised tenderness with guarding max on the left quadrates. No rebound tenderness. Other systems . NAD.
E-fast: free fluid in the left frank region, perisplenic and across the para colic gutter measuring a depth of approx. 5.0cm. CXR – no air under the diaphragm. FBC – pending, Xmatch.

Discussed case with Dr Bose (NRH General Surgeon) who accepted the patient.`,
        vital_signs: 'BP 111/72 mmHg, Pulse 58 bpm, SpO2 98% RA, Temp 36.6°C',
        examination: 'Alert, in forced antalgic position. Abdomen: non-distended, generalized tenderness with guarding maximal on left quadrants. No rebound tenderness.',
        investigations: 'E-FAST: free fluid in left flank, perisplenic & left paracolic gutter (~5.0 cm depth). CXR: no air under diaphragm. FBC & Xmatch sent.',
        treatment_given: 'Etsha 6 clinic: Diclofenac 75mg IM. GPH: IVF 1L Normal Saline, NPO maintained, analgesia.',
        transport_needs: 'Immediate ambulance transfer with continuous vital signs monitoring, nurse escort, and wide-bore IV line in situ.'
      });
    } else if (presetName === 'kapoi') {
      setFormData({
        hospital_name: 'Gumare Primary Hospital',
        referring_unit: 'Inpatient Medical / TB Ward',
        receiving_hospital: 'Letsholathebe II Memorial Hospital (Maun)',
        receiving_department: 'Internal Medicine / Pulmonology Specialist',
        urgency: 'Urgent',
        patient_name: 'KAPOI',
        patient_surname: 'SETSHWANE',
        reg_no: 'GPH-2026-09114',
        age: '42',
        gender: 'Male',
        ward: 'Medical Ward',
        diagnosis: 'Severe Community-Acquired Pneumonia with Pleural Effusion for Diagnostic Thoracentesis',
        admission_date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        doctor_name: 'Dr. Gumbo',
        reason_for_referral: 'Diagnostic pleural tap and ultrasound assessment not available at primary hospital level; persistent high grade fevers despite 48h Ceftriaxone.',
        clinical_history: '42 year old male presented with 5-day history of right-sided pleuritic chest pain, productive cough with rust-colored sputum, and rigors. Non-smoker. HIV negative.',
        vital_signs: 'BP 108/68 mmHg, HR 118 bpm, RR 28/min, SpO2 91% on room air (96% on 3L O2 via nasal prongs), Temp 39.1°C',
        examination: 'Decreased chest expansion on right base, stony dull percussion note right lower zone, bronchial breathing right mid-zone, absent breath sounds right base.',
        investigations: 'CXR: dense right lower zone opacity with blunting of costophrenic angle and meniscus sign. WBC 18.4, CRP 142, Creatinine 88.',
        treatment_given: 'IV Ceftriaxone 2g OD (day 2), IV Metronidazole 500mg TDS, IVF Ringers Lactate 1000ml, Paracetamol 1g PO stat.',
        transport_needs: 'Ambulance transfer with continuous supplemental Oxygen (3L/min nasal prongs) and nurse escort.'
      });
    } else if (presetName === 'clear') {
      setFormData({
        hospital_name: 'Gumare Primary Hospital',
        referring_unit: '',
        receiving_hospital: '',
        receiving_department: '',
        urgency: 'Routine',
        patient_name: '',
        patient_surname: '',
        reg_no: '',
        age: '',
        gender: 'Male',
        ward: '',
        diagnosis: '',
        admission_date: new Date().toLocaleDateString('en-GB'),
        doctor_name: 'Dr. Gumbo',
        reason_for_referral: '',
        clinical_history: '',
        vital_signs: '',
        examination: '',
        investigations: '',
        treatment_given: '',
        transport_needs: ''
      });
    }
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('dashboard')}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              {isEditing ? 'Edit Clinical Referral Note' : 'New Clinical Referral Note'}
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                Inter-Facility Transfer
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Standardized hospital referral summary for specialist escalation (REFERRAL AND REPORT FORM)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Eye className="w-4 h-4" />
            Preview & Print
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Referral'}
          </button>
        </div>
      </div>

      {/* Dedicated Template Selector Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Document Template & Structure:
              </label>
              <p className="text-[11px] text-slate-500">
                Select official hospital referral form or your custom referral template
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTemplateId || ''}
              onChange={(e) => {
                const tId = Number(e.target.value);
                const found = templates.find(t => t.id === tId);
                if (found) {
                  if (window.confirm(`Switch to template "${found.name}" and apply its defaults? This will update boilerplate fields while preserving patient details.`)) {
                    applyTemplateDefaults(found);
                  } else {
                    setSelectedTemplateId(found.id);
                    setFormData(prev => ({ ...prev, template_id: found.id, template_filename: found.filename }));
                  }
                }
              }}
              className="text-xs sm:text-sm font-semibold p-2.5 border-2 border-amber-600/60 rounded-xl outline-none bg-white text-slate-900 shadow-xs min-w-[260px]"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.is_default ? `★ ${t.name} (Default)` : `✦ ${t.name} (Custom)`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setView('templates')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              title="Manage or create custom templates"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage Templates</span>
            </button>
          </div>
        </div>

        {/* Word (.docx) Design & Layout Selector */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-slate-700">Word (.docx) Export Design:</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Choose official form or custom layout</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:justify-end max-w-xl">
            <select
              value={selectedDesignFilename || formData.template_filename || 'referral_and_report_form_template.docx'}
              onChange={(e) => {
                const f = e.target.value;
                setSelectedDesignFilename(f);
                setFormData(prev => ({ ...prev, template_filename: f, design_filename: f }));
              }}
              className="w-full sm:w-auto text-xs p-2 border border-slate-300 rounded-xl outline-none bg-slate-50 font-semibold text-slate-800"
            >
              <option value="referral_and_report_form_template.docx">★ Official Hospital REFERRAL form (Default GPH → NRH)</option>
              <option value="clinical_referral_note.docx">★ Clinical Referral & Transfer Summary (Detailed)</option>
              {docxDesigns
                .filter(d => !['referral_and_report_form_template.docx', 'clinical_referral_note.docx'].includes(d.filename))
                .map(d => (
                  <option key={d.filename} value={d.filename}>
                    {d.is_default ? `★ ${d.name}` : `✦ Custom .docx: ${d.name} (${d.filename})`}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Template Preset Selector */}
      <div className="bg-amber-50/80 border border-amber-200 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs max-w-4xl mx-auto shadow-sm">
        <div className="flex items-center gap-2 text-amber-900 font-bold">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Case Presets & Standard Forms:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('kebakaone')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5"
            title="Load authentic case from hospital REFERRAL form.docx"
          >
            ★ Kebakaone Nkape (Official REFERRAL Form: GPH → NRH)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('kapoi')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-medium transition"
          >
            Kapoi Setshwane (Pneumonia Case)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('clear')}
            className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-500 hover:text-red-700 rounded-xl font-medium transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Referral Form Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 max-w-4xl mx-auto">
        
        {/* Transfer Facilities & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Referring Facility & Unit</label>
            <input
              type="text"
              value={formData.hospital_name}
              onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Unit (e.g. TB Ward)"
              value={formData.referring_unit}
              onChange={(e) => setFormData({ ...formData, referring_unit: e.target.value })}
              className="w-full text-xs p-2 mt-1.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Facility & Department</label>
            <input
              type="text"
              value={formData.receiving_hospital}
              onChange={(e) => setFormData({ ...formData, receiving_hospital: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Department / Specialty"
              value={formData.receiving_department}
              onChange={(e) => setFormData({ ...formData, receiving_department: e.target.value })}
              className="w-full text-xs p-2 mt-1.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Status</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 bg-white font-bold text-amber-900"
            >
              <option value="Emergency (Red)">Emergency (Immediate transfer)</option>
              <option value="Urgent (Yellow)">Urgent (Within 24-48 hours)</option>
              <option value="Routine (Green)">Routine Specialist Appointment</option>
            </select>

            <label className="block text-xs font-semibold text-slate-700 mt-2 mb-1">Date & Time</label>
            <input
              type="text"
              value={formData.admission_date}
              onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
              className="w-full text-xs p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100 pb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
              className="w-full text-xs sm:text-sm p-2.5 font-bold uppercase border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Surname</label>
            <input
              type="text"
              value={formData.patient_surname}
              onChange={(e) => setFormData({ ...formData, patient_surname: e.target.value.toUpperCase() })}
              className="w-full text-xs sm:text-sm p-2.5 font-bold uppercase border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reg No</label>
            <input
              type="text"
              value={formData.reg_no}
              onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 font-mono border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Age / Sex</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Age"
                className="w-16 text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none text-center"
              />
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="flex-1 text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Diagnosis & Reason for Referral */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Working / Transfer Diagnosis</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 font-bold text-emerald-950 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Reason for Referral / Specific Question for Receiving Team
            </label>
            <textarea
              rows={3}
              value={formData.reason_for_referral}
              onChange={(e) => setFormData({ ...formData, reason_for_referral: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Summary of Clinical History & Presentation
            </label>
            <textarea
              rows={3}
              value={formData.clinical_history}
              onChange={(e) => setFormData({ ...formData, clinical_history: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">3. Vital Signs</label>
              <textarea
                rows={2}
                value={formData.vital_signs}
                onChange={(e) => setFormData({ ...formData, vital_signs: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Physical Examination Findings</label>
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  {[
                    { label: '+ General', text: '\nGeneral: Alert, no acute distress.' },
                    { label: '+ CVS', text: '\nCVS: S1 S2 normal, no murmur, regular pulse.' },
                    { label: '+ Resp', text: '\nResp: Clear bilaterally, vesicular breath sounds.' },
                    { label: '+ Abdo', text: '\nAbdomen: Soft, non-tender, non-distended.' },
                    { label: '+ CNS', text: '\nCNS: GCS 15/15, pupils reactive, neck supple.' },
                    { label: '+ MSK', text: '\nMSK: Full range of movement, no joint swelling.' }
                  ].map(btn => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        examination: prev.examination ? `${prev.examination}${btn.text}` : btn.text.trim()
                      }))}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded font-semibold text-slate-600 transition"
                      title={`Append ${btn.label}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={3}
                value={formData.examination}
                onChange={(e) => setFormData({ ...formData, examination: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Relevant Investigations Done (Labs, GeneXpert, CXR, ECG)
            </label>
            <textarea
              rows={2}
              value={formData.investigations}
              onChange={(e) => setFormData({ ...formData, investigations: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5. Treatments & Stat Doses Administered Prior to Transfer
            </label>
            <textarea
              rows={2}
              value={formData.treatment_given}
              onChange={(e) => setFormData({ ...formData, treatment_given: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none font-medium text-emerald-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6. Transportation & Escort Requirements
            </label>
            <input
              type="text"
              value={formData.transport_needs}
              onChange={(e) => setFormData({ ...formData, transport_needs: e.target.value })}
              className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none font-medium"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
            <div>
              <label className="font-semibold text-slate-700 block">Referring Medical Officer:</label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition"
            >
              {saving ? 'Saving...' : 'Save & Close'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
