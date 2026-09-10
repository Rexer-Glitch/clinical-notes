import React, { useState, useEffect } from 'react';
import { 
  Save, ArrowLeft, Plus, Trash2, Sparkles, Eye, Pill, 
  Activity, AlertTriangle, Check, ShieldAlert, Heart, Wind, HelpCircle,
  LayoutTemplate, Layers, X, FileText, Stethoscope, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

const STANDARD_EXAMINATION_SYSTEMS = [
  { id: 'general', label: 'General Exam & JACCOLD', placeholder: 'Alert, no distress. JACCOLD: pallor, jaundice, cyanosis, clubbing, edema, lymphadenopathy' },
  { id: 'cvs', label: 'Cardiovascular (CVS)', placeholder: 'S1 S2 normal, no murmur, regular pulse, normal JVP' },
  { id: 'respiratory', label: 'Respiratory System', placeholder: 'Clear bilaterally, vesicular breath sounds, no added sounds' },
  { id: 'abdomen', label: 'Abdominal System', placeholder: 'Soft, non-tender, non-distended, bowel sounds present' },
  { id: 'cns', label: 'CNS / Neurological', placeholder: 'GCS 15/15, pupils equal & reactive to light, no focal neuro deficit, neck supple' },
  { id: 'msk', label: 'Musculoskeletal (MSK)', placeholder: 'Full range of movement, no joint swelling, peripheral pulses palpable' },
  { id: 'ent', label: 'ENT / Head & Neck', placeholder: 'Pharynx clear, tonsils normal, tympanic membranes intact, no neck masses' },
  { id: 'eye', label: 'Eye & Vision', placeholder: 'Conjunctiva pink, sclera clear, pupils equal & reactive' },
  { id: 'skin', label: 'Dermatological / Skin', placeholder: 'Skin intact, warm, normal turgor, no rashes or lesions' },
  { id: 'gu', label: 'Genitourinary / Pelvic', placeholder: 'External genitalia normal, catheter in situ with clear amber urine' }
];

export default function AdmissionNoteFormPage({ noteId, initialTemplateId, setView, onOpenViewModal, onOpenAiModal }) {
  const isEditing = !!noteId;

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId || null);
  const [docxDesigns, setDocxDesigns] = useState([]);
  const [selectedDesignFilename, setSelectedDesignFilename] = useState('');
  const [activeExamSystems, setActiveExamSystems] = useState(['general', 'cvs', 'respiratory', 'abdomen', 'msk']);
  const [customExamSystems, setCustomExamSystems] = useState([]);

  const [formData, setFormData] = useState({
    hospital_name: 'Gumare Primary Hospital',
    document_title: 'TREATMENT CHART',
    patient_name: '',
    patient_surname: '',
    reg_no: '',
    age: '',
    age_unit: 'years',
    gender: 'Female',
    ward: '',
    diagnosis: '',
    admission_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    doctor_name: 'DR GUMBO',
    signature: 'DR GUMBO',
    rvd_status: '',
    comorbidities: '',
    chief_complaint: '',
    history_present_illness: '',
    today_management_gph: [],
    past_medical_history: '',
    examination: {
      general: '',
      cvs: '',
      respiratory: '',
      abdomen: '',
      msk: '',
      other_systems: ''
    },
    assessment: '',
    ddx: [],
    plan: []
  });

  // Vitals state for quick entry
  const [vitals, setVitals] = useState({
    cwt: '',
    ht: '',
    bp: '',
    hr: '',
    temp: '',
    spo2: '',
    rr: '',
    rbs: ''
  });

  // Coupled Drug Sheet State
  const [medications, setMedications] = useState([]);
  const [statMeds, setStatMeds] = useState([]);
  const [prnMeds, setPrnMeds] = useState([]);
  const [ivFluids, setIvFluids] = useState([]);
  const [monitoringOrders, setMonitoringOrders] = useState({
    vitals_frequency: '4 hourly',
    strict_intake_output: false,
    isolation: ''
  });

  const [specialInstructions, setSpecialInstructions] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(noteId || null);

  // Load existing note if editing
  useEffect(() => {
    if (noteId) {
      api.notes.get(noteId).then(res => {
        const n = res.note;
        const raw = n.raw_data || {};
        const isMonths = raw.age_unit === 'months' || /month/i.test(String(n.age || ''));
        const cleanAge = n.age ? String(n.age).replace(/\s*(years?|months?|yrs?|mos?)\b/gi, '').trim() : '';
        setFormData({
          hospital_name: n.hospital_name || raw.hospital_name || 'Gumare Primary Hospital',
          document_title: raw.document_title || 'TREATMENT CHART',
          patient_name: n.patient_name || '',
          patient_surname: n.patient_surname || '',
          reg_no: n.reg_no || '',
          age: cleanAge || n.age || '',
          age_unit: isMonths ? 'months' : (raw.age_unit || 'years'),
          gender: n.gender || 'Female',
          ward: n.ward || 'TB',
          diagnosis: n.diagnosis || '',
          admission_date: n.admission_date || '',
          doctor_name: n.doctor_name || 'DR GUMBO',
          signature: raw.signature || n.doctor_name || 'DR GUMBO',
          rvd_status: raw.rvd_status || '',
          comorbidities: raw.comorbidities || '',
          chief_complaint: raw.chief_complaint || '',
          history_present_illness: raw.history_present_illness || '',
          today_management_gph: raw.today_management_gph || [],
          past_medical_history: raw.past_medical_history || '',
          examination: raw.examination || {},
          assessment: raw.assessment || '',
          ddx: raw.ddx || [],
          plan: raw.plan || []
        });

        const vSrc = raw.vitals_recorded || raw.vitals || {};
        setVitals({
          cwt: vSrc.cwt || vSrc.weight || '',
          ht: vSrc.ht || vSrc.height || '',
          bp: vSrc.bp || '',
          hr: vSrc.hr || '',
          temp: vSrc.temp || '',
          spo2: vSrc.spo2 || '',
          rr: vSrc.rr || '',
          rbs: vSrc.rbs || ''
        });

        if (Array.isArray(raw.active_exam_systems) && raw.active_exam_systems.length > 0) {
          setActiveExamSystems(raw.active_exam_systems);
        }
        if (Array.isArray(raw.custom_exam_systems)) {
          setCustomExamSystems(raw.custom_exam_systems);
        }
        if (n.template_id || raw.template_id) {
          setSelectedTemplateId(n.template_id || raw.template_id);
        }
        if (raw.design_filename || raw.template_filename) {
          setSelectedDesignFilename(raw.design_filename || raw.template_filename);
        }

        if (res.drugSheet) {
          setMedications(res.drugSheet.medications || []);
          setStatMeds(res.drugSheet.stat_meds || []);
          setPrnMeds(res.drugSheet.prn_meds || []);
          setIvFluids(res.drugSheet.iv_fluids || []);
          if (res.drugSheet.monitoring_orders) {
            setMonitoringOrders(res.drugSheet.monitoring_orders);
          }
          if (res.drugSheet.special_instructions) {
            setSpecialInstructions(res.drugSheet.special_instructions);
          }
        }
      }).catch(err => alert('Failed to load note: ' + err.message));
    }
  }, [noteId]);

  // Load admission templates and docx design files
  useEffect(() => {
    Promise.all([
      api.templates.list('admission'),
      api.templates.listDocxFiles('admission').catch(() => ({ files: [] }))
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
          const designFile = (def.default_data && def.default_data.design_filename) || def.filename || 'admission_template.docx';
          setSelectedDesignFilename(designFile);
          setFormData(prev => ({ ...prev, template_id: def.id, template_filename: designFile, design_filename: designFile }));
        }
      }
    }).catch(err => console.warn('Could not load admission templates or docx designs:', err));
  }, [initialTemplateId, noteId]);

  const applyTemplateDefaults = (tpl) => {
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    const d = tpl.default_data || {};

    const designFile = d.design_filename || tpl.filename || 'admission_template.docx';
    setSelectedDesignFilename(designFile);

    if (d.included_examinations && Array.isArray(d.included_examinations) && d.included_examinations.length > 0) {
      setActiveExamSystems(d.included_examinations);
    } else {
      setActiveExamSystems(['general', 'cvs', 'respiratory', 'abdomen', 'msk']);
    }
    if (d.custom_examinations && Array.isArray(d.custom_examinations)) {
      setCustomExamSystems(d.custom_examinations);
    } else {
      setCustomExamSystems([]);
    }

    // Extract embedded plan from assessment if needed
    let cleanAssessment = d.assessment || '';
    let cleanPlan = (d.plan && (Array.isArray(d.plan) ? d.plan.length > 0 : String(d.plan).trim())) ? d.plan : [];
    if (typeof cleanAssessment === 'string' && /(\n|^)\s*plan\s*[:\n]/i.test(cleanAssessment) && (Array.isArray(cleanPlan) ? cleanPlan.length === 0 : !String(cleanPlan).trim())) {
      const pMatch = cleanAssessment.split(/(\n|^)\s*plan\s*[:\n]/i);
      cleanAssessment = (pMatch[0] || '').trim();
      if (pMatch.length >= 3) {
        cleanPlan = pMatch.slice(2).join('').split('\n').map(s => s.trim().replace(/^[\d+.-]+\s*/, '')).filter(Boolean);
      }
    }

    if (typeof cleanPlan === 'string') {
      cleanPlan = cleanPlan.split('\n').map(s => s.trim().replace(/^[\d+.-]+\s*/, '')).filter(Boolean);
    }

    setFormData(prev => ({
      ...prev,
      template_id: tpl.id,
      template_filename: designFile,
      design_filename: designFile,
      ward: d.ward || '',
      diagnosis: d.diagnosis || '',
      chief_complaint: d.chief_complaint || '',
      history_present_illness: d.history_present_illness || '',
      examination: d.examination || {
        general: '',
        cvs: '',
        respiratory: '',
        abdomen: '',
        msk: '',
        other_systems: ''
      },
      assessment: cleanAssessment,
      ddx: d.ddx || [],
      plan: cleanPlan
    }));

    setMedications(d.medications || []);
    setIvFluids(d.iv_fluids || []);
  };

  useEffect(() => {
    const handleAiApply = (e) => {
      const d = e.detail;
      if (!d) return;
      setFormData(prev => ({
        ...prev,
        patient_name: d.patient_name || prev.patient_name,
        patient_surname: d.patient_surname || prev.patient_surname,
        reg_no: d.reg_no || prev.reg_no,
        age: d.age || prev.age,
        gender: d.gender || prev.gender,
        ward: d.ward || prev.ward,
        diagnosis: d.diagnosis || prev.diagnosis,
        rvd_status: d.rvd_status || prev.rvd_status,
        comorbidities: d.comorbidities || prev.comorbidities,
        chief_complaint: d.chief_complaint || prev.chief_complaint,
        history_present_illness: d.history_present_illness || prev.history_present_illness,
        today_management_gph: d.today_management_gph || prev.today_management_gph,
        past_medical_history: d.past_medical_history || prev.past_medical_history,
        examination: d.examination || prev.examination,
        assessment: d.assessment || prev.assessment,
        ddx: d.ddx || prev.ddx,
        plan: d.plan || prev.plan
      }));

      if (d.vitals || d.vitals_recorded) {
        const v = d.vitals || d.vitals_recorded;
        setVitals(prev => ({
          ...prev,
          ...v
        }));
      }

      if (Array.isArray(d.active_exam_systems) && d.active_exam_systems.length > 0) {
        setActiveExamSystems(d.active_exam_systems);
      }
      if (Array.isArray(d.custom_exam_systems)) {
        setCustomExamSystems(d.custom_exam_systems);
      }

      if (d.drug_sheet) {
        if (d.drug_sheet.medications && d.drug_sheet.medications.length > 0) {
          setMedications(d.drug_sheet.medications);
        }
        if (d.drug_sheet.stat_meds) {
          setStatMeds(d.drug_sheet.stat_meds);
        }
        if (d.drug_sheet.prn_meds) {
          setPrnMeds(d.drug_sheet.prn_meds);
        }
        if (d.drug_sheet.iv_fluids && d.drug_sheet.iv_fluids.length > 0) {
          setIvFluids(d.drug_sheet.iv_fluids);
        }
        if (d.drug_sheet.monitoring_orders) {
          setMonitoringOrders(d.drug_sheet.monitoring_orders);
        }
        if (d.drug_sheet.special_instructions) {
          setSpecialInstructions(d.drug_sheet.special_instructions);
        }
      }
    };

    window.addEventListener('clinical_ai_apply', handleAiApply);
    return () => window.removeEventListener('clinical_ai_apply', handleAiApply);
  }, [noteId]);

  const applyGumareCasePreset = () => {
    setFormData(prev => ({
      ...prev,
      hospital_name: 'Gumare Primary Hospital',
      document_title: 'TREATMENT CHART',
      patient_name: 'SHAROH',
      patient_surname: 'MBAMBI',
      reg_no: 'GPH-2026-08942',
      ward: 'TB',
      diagnosis: 'Pulmonary tuberculosis',
      age: '15',
      gender: 'Female',
      doctor_name: 'DR GUMBO',
      signature: 'DR GUMBO',
      rvd_status: 'RVD unknown',
      comorbidities: 'Nil known comorbidities',
      chief_complaint: 'productive cough > 2/52 associated with night sweats, loss of appetite, palpitations, headache and painful legs.',
      history_present_illness: '10 AUG 2026 – complained of similar symptoms – done geneXpert – undetected.\nToday management in GPH:',
      today_management_gph: [
        'Initial vitals: BP 117/74mm hg P146bpm T39.7 SpO2 99 RA RBS-7.5mmol/l',
        'FBC (31/08/26) – WBC 12.25 RBC 3.91 HB 9.7 PLT 390',
        'Given – IVF 1 L RL, Cefotaxime 1g IV stat',
        'GeneXpert done – very low detected, no resistance, AFB – scanty.',
        'ECG – sinus tachycardia'
      ],
      past_medical_history: 'noted in OPD card, persistent tachycardia of range 120 – 145bpm since Aug 03.\nOther – unremarkable',
      examination: {
        general: 'Alert, no signs of distress. JACCOLD – conjunctival pallor noted',
        cvs: 's1s2 normal, no murmur, regular tachycardiac pulse.',
        respiratory: 'clear bilaterally, no crepitations, no wheezes',
        abdomen: 'non distended, soft non tender',
        msk: 'Painful joints ++ ankles, not swollen, tenderness on the plantar bilaterally.',
        other_systems: 'NAD'
      },
      assessment: '15F | RVD unknown with clinical symptoms suggestive of pulmonary tuberculosis – confirmed by GeneXpert – detected, hemodynamically unstable for safe discharge home.',
      ddx: [
        'Superimposed with bacterial pneumonia'
      ],
      plan: [
        'Admit to TB ward for isolation',
        'Do – FBC – pending, LFT, RFT, CMP – pending.',
        'Medications: START ATT 3 tabs PO OD, Pyridoxime 25mg PO OD, Cefotaxime 1g IV TDS, Paracetamol 1g PO TDS, Ibuprofen 400mg PO TDS',
        'IVF 2 L NS/RL over 24 hours',
        'Monitor vitals 4 hourly'
      ]
    }));

    setVitals({
      bp: '117/74',
      hr: '146',
      temp: '39.7',
      spo2: '99',
      rr: '22',
      rbs: '7.5'
    });

    setMedications([
      { drug: 'START ATT', dose: '3 tabs', route: 'PO', frequency: 'OD', indication: 'Pulmonary TB' },
      { drug: 'Pyridoxime', dose: '25mg', route: 'PO', frequency: 'OD', indication: 'Neuropathy prophylaxis' },
      { drug: 'Cefotaxime', dose: '1g', route: 'IV', frequency: 'TDS', indication: 'Superimposed pneumonia' },
      { drug: 'Paracetamol', dose: '1g', route: 'PO', frequency: 'TDS', indication: 'Pyrexia / Analgesia' },
      { drug: 'Ibuprofen', dose: '400mg', route: 'PO', frequency: 'TDS', indication: 'Joint pain / Analgesia' }
    ]);
  };

  // Quick preset loader
  const loadPreset = (presetName) => {
    if (presetName === 'tb-case') {
      applyGumareCasePreset();
    } else if (presetName === 'sarah-sarefo') {
      setFormData(prev => ({
        ...prev,
        hospital_name: 'Gumare Primary Hospital',
        document_title: 'TREATMENT CHART',
        patient_name: 'SARAH',
        patient_surname: 'SAREFO',
        reg_no: 'MH-005-2024',
        ward: 'General ward',
        diagnosis: 'Post-operative Infection & Fever',
        age: '29',
        gender: 'Female',
        rvd_status: 'HIV negative',
        comorbidities: 'Nil known comorbidities',
        chief_complaint: 'Surgical wound tenderness, fever, generalized malaise',
        history_present_illness: 'Day 3 post-laparotomy. Developed fever and abdominal wound erythema.',
        assessment: '29F post-operative surgical site infection. Started on triple antibiotic coverage and analgesia.',
        ddx: ['Surgical site infection', 'Intra-abdominal collection', 'Nosocomial UTI'],
        plan: ['Wound dressing BD', 'Strict fluid balance', 'Triple antibiotics as on MH 005 Drug Sheet']
      }));
      setMedications([
        { drug: 'Cefotaxime', dose: '1g', route: 'IV', frequency: 'TDS', admin_times: ['6 am', '2 pm', '10 pm'], indication: 'Gram-negative & broad-spectrum' },
        { drug: 'Flagyl', dose: '500mg', route: 'IV', frequency: 'TDS', admin_times: ['6 am', '2 pm', '10 pm'], indication: 'Anaerobic coverage' },
        { drug: 'Gentamycin', dose: '80mg', route: 'IV', frequency: 'OD', admin_times: ['6 am'], indication: 'Synergy' },
        { drug: 'Paracetamol', dose: '500mg', route: 'PO', frequency: 'TDS', admin_times: ['6 am', '2 pm', '10 pm'], indication: 'Analgesia' }
      ]);
    } else if (presetName === 'pneumonia') {
      setFormData(prev => ({
        ...prev,
        patient_name: 'JOHN',
        patient_surname: 'MOAGI',
        reg_no: 'GPH-2026-09411',
        ward: 'Medical Ward',
        diagnosis: 'Community-Acquired Pneumonia (Severe)',
        age: '56',
        gender: 'Male',
        rvd_status: 'HIV negative',
        chief_complaint: '4 days severe pleuritic chest pain, productive cough with rust-colored sputum, fever',
        history_present_illness: 'Acute onset chills and rigors.',
        assessment: '56M with Severe CAP (CURB-65 = 2).',
        ddx: ['Community-Acquired Pneumonia', 'Pulmonary Tuberculosis', 'COVID-19'],
        plan: ['Admit medical ward', 'Supplemental O2', 'IV Ceftriaxone + Azithromycin', 'IVF RL 1L stat']
      }));
      setMedications([
        { drug: 'Ceftriaxone', dose: '2g', route: 'IV', frequency: 'OD', indication: 'Severe CAP' },
        { drug: 'Azithromycin', dose: '500mg', route: 'PO', frequency: 'OD', indication: 'Atypical coverage' },
        { drug: 'Paracetamol', dose: '1g', route: 'PO', frequency: 'TDS', indication: 'Fever' }
      ]);
    } else if (presetName === 'clear') {
      handleFullClear();
    }
  };

  // Full pristine reset of all admission and drug sheet fields
  const handleFullClear = () => {
    setFormData({
      hospital_name: 'Gumare Primary Hospital',
      document_title: 'TREATMENT CHART',
      patient_name: '',
      patient_surname: '',
      reg_no: '',
      age: '',
      gender: 'Female',
      ward: '',
      diagnosis: '',
      admission_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      doctor_name: 'DR GUMBO',
      signature: 'DR GUMBO',
      rvd_status: '',
      comorbidities: '',
      chief_complaint: '',
      history_present_illness: '',
      today_management_gph: [],
      past_medical_history: '',
      examination: {
        general: '',
        cvs: '',
        respiratory: '',
        abdomen: '',
        msk: '',
        other_systems: ''
      },
      assessment: '',
      ddx: [],
      plan: []
    });
    setVitals({
      bp: '',
      hr: '',
      temp: '',
      spo2: '',
      rr: '',
      rbs: ''
    });
    setMedications([]);
    setStatMeds([]);
    setPrnMeds([]);
    setIvFluids([]);
    setMonitoringOrders({
      vitals_frequency: '4 hourly',
      strict_intake_output: false,
      isolation: ''
    });
    setSpecialInstructions('');
    setActiveExamSystems(['general', 'cvs', 'respiratory', 'abdomen', 'msk']);
    setCustomExamSystems([]);
    const defaultTemplate = templates.find(t => t.is_default) || templates[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
      const designFile = (defaultTemplate.default_data && defaultTemplate.default_data.design_filename) || defaultTemplate.filename || 'admission_template.docx';
      setSelectedDesignFilename(designFile);
    }
    setSavedId(null);
  };

  // Medication table helpers
  const handleAddMed = () => {
    setMedications(prev => [
      ...prev,
      { drug: '', dose: '', route: 'PO', frequency: 'OD', indication: '' }
    ]);
  };

  const handleUpdateMed = (index, field, value) => {
    setMedications(prev => {
      const updated = [...prev];
      const cur = { ...updated[index], [field]: value };
      if (field === 'frequency') {
        const f = (value || '').toUpperCase();
        if (f === 'OD' || f === 'MANE') cur.admin_times = ['6 am'];
        else if (f === 'BD') cur.admin_times = ['6 am', '6 pm'];
        else if (f === 'TDS') cur.admin_times = ['6 am', '2 pm', '10 pm'];
        else if (f === 'QID' || f === 'QDS') cur.admin_times = ['6 am', '12 md', '6 pm', '12 mn'];
        else if (f === 'NOCTE') cur.admin_times = ['10 pm'];
      }
      updated[index] = cur;
      return updated;
    });
  };

  const handleToggleMedTime = (index, timeLabel) => {
    setMedications(prev => {
      const updated = [...prev];
      const cur = { ...updated[index] };
      const times = Array.isArray(cur.admin_times) ? [...cur.admin_times] : [];
      const matchIdx = times.findIndex(t => t.toLowerCase().replace(/\s+/g, '') === timeLabel.toLowerCase().replace(/\s+/g, ''));
      if (matchIdx >= 0) {
        times.splice(matchIdx, 1);
      } else {
        times.push(timeLabel);
      }
      cur.admin_times = times;
      updated[index] = cur;
      return updated;
    });
  };

  const handleRemoveMed = (index) => {
    setMedications(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddQuickMed = (drug, dose, route, freq, ind) => {
    setMedications(prev => [...prev, { drug, dose, route, frequency: freq, indication: ind }]);
  };

  // IV fluids helper
  const handleAddFluid = () => {
    setIvFluids(prev => [...prev, { fluid: 'Ringer Lactate (RL)', volume: '1000 ml', rate_hours: 'Over 8 hours', indication: 'Maintenance' }]);
  };

  const handleUpdateFluid = (index, field, value) => {
    setIvFluids(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveFluid = (index) => {
    setIvFluids(prev => prev.filter((_, idx) => idx !== index));
  };

  // Stat Doses helpers
  const handleAddStatMed = (drug = '', dose = '', route = 'IV', givenTime = 'Stat') => {
    setStatMeds(prev => [
      ...prev,
      {
        drug,
        dose,
        route,
        date: formData.admission_date?.split(' ')[0] || new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        given_time: givenTime,
        signature: formData.doctor_name || 'DR GUMBO',
        given_by: ''
      }
    ]);
  };

  const handleUpdateStatMed = (index, field, value) => {
    setStatMeds(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveStatMed = (index) => {
    setStatMeds(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save Note & Coupled Drug Sheet
  const handleSave = async (andPreview = false) => {
    if (!formData.patient_name || !formData.patient_surname) {
      alert('Please enter patient first name and surname');
      return;
    }

    setSaving(true);
    try {
      // Format vitals summary if any vitals are entered
      const vitalsParts = [];
      if (vitals.cwt && String(vitals.cwt).trim()) vitalsParts.push(`Wt ${String(vitals.cwt).trim()}${/kg/i.test(vitals.cwt) ? '' : ' kg'}`);
      if (vitals.ht && String(vitals.ht).trim()) vitalsParts.push(`Ht ${String(vitals.ht).trim()}${/cm|m/i.test(vitals.ht) ? '' : ' cm'}`);
      if (vitals.bp) vitalsParts.push(`BP ${vitals.bp}${/mm\s*hg/i.test(vitals.bp) ? '' : ' mmHg'}`);
      if (vitals.hr) vitalsParts.push(`HR ${vitals.hr}${/bpm/i.test(vitals.hr) ? '' : ' bpm'}`);
      if (vitals.temp) vitalsParts.push(`Temp ${vitals.temp}${/°|c/i.test(vitals.temp) ? '' : '°C'}`);
      if (vitals.spo2) vitalsParts.push(`SpO2 ${vitals.spo2}${/%/.test(vitals.spo2) ? '' : '%'}`);
      if (vitals.rr) vitalsParts.push(`RR ${vitals.rr}${/\/min|bpm/i.test(vitals.rr) ? '' : '/min'}`);
      if (vitals.rbs) vitalsParts.push(`RBS ${vitals.rbs}${/mmol/i.test(vitals.rbs) ? '' : ' mmol/L'}`);
      const vitalsSummary = vitalsParts.join(', ');

      const payload = {
        type: 'admission',
        template_id: selectedTemplateId,
        design_filename: selectedDesignFilename || formData.template_filename,
        patient_name: formData.patient_name,
        patient_surname: formData.patient_surname,
        reg_no: formData.reg_no,
        age: formData.age ? `${String(formData.age).replace(/\s*(years?|months?|yrs?|mos?)\b/gi, '').trim()} ${formData.age_unit || (/month/i.test(String(formData.age)) ? 'months' : 'years')}` : '',
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
          design_filename: selectedDesignFilename || formData.template_filename,
          active_exam_systems: activeExamSystems,
          custom_exam_systems: customExamSystems,
          vitals_recorded: vitals,
          vitals: vitals,
          vitals_summary: vitalsSummary ? `Initial vitals: ${vitalsSummary}` : '',
          vital_signs: vitalsSummary ? `Initial vitals: ${vitalsSummary}` : ''
        },
        drug_sheet: {
          medications,
          stat_meds: statMeds,
          prn_meds: prnMeds,
          iv_fluids: ivFluids,
          monitoring_orders: monitoringOrders,
          special_instructions: specialInstructions
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
        alert('Admission Note & Coupled Drug Sheet saved successfully!');
        setView('dashboard');
      }
    } catch (err) {
      alert('Failed to save note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper to append item to Management Plan without duplicate
  const appendToPlan = (planItem) => {
    if (!planItem) return;
    setFormData(prev => {
      const currentPlan = Array.isArray(prev.plan) 
        ? [...prev.plan] 
        : (typeof prev.plan === 'string' && prev.plan ? prev.plan.split('\n') : []);
      if (currentPlan.some(p => p.trim().toLowerCase() === planItem.trim().toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        plan: [...currentPlan, planItem]
      };
    });
  };

  // Helper to sync all currently prescribed meds & fluids into Management Plan
  const handleSyncPlanWithMedsAndFluids = () => {
    const newItems = [];

    // IV Fluids
    if (ivFluids && ivFluids.length > 0) {
      ivFluids.forEach(f => {
        if (f.fluid) {
          newItems.push(`IVF: ${f.fluid} ${f.volume || ''} ${f.rate_hours ? `(${f.rate_hours})` : ''}`.trim());
        }
      });
    }

    // Stat Meds
    if (statMeds && statMeds.length > 0) {
      statMeds.forEach(sm => {
        if (sm.drug) {
          newItems.push(`Stat: ${sm.drug} ${sm.dose || ''} ${sm.route || ''} ${sm.given_time || 'Stat'}`.trim());
        }
      });
    }

    // Regular Meds
    if (medications && medications.length > 0) {
      medications.forEach(m => {
        if (m.drug) {
          newItems.push(`${m.drug} ${m.dose || ''} ${m.route || ''} ${m.frequency || ''} ${m.indication ? `(${m.indication})` : ''}`.trim());
        }
      });
    }

    if (newItems.length === 0) {
      alert('No medications or fluids currently prescribed to sync into the plan.');
      return;
    }

    setFormData(prev => {
      const currentPlan = Array.isArray(prev.plan) 
        ? [...prev.plan] 
        : (typeof prev.plan === 'string' && prev.plan ? prev.plan.split('\n') : []);
      
      const filteredExisting = currentPlan.filter(p => p && p.trim());
      const additions = newItems.filter(item => 
        !filteredExisting.some(existing => existing.toLowerCase().includes(item.toLowerCase().slice(0, 20)))
      );

      return {
        ...prev,
        plan: [...filteredExisting, ...additions]
      };
    });
  };

  // Pediatric & Anthropometry Evaluation
  const isPediatric = formData.age_unit === 'months' || (formData.age !== '' && !isNaN(Number(formData.age)) && Number(formData.age) < 18);
  const currentWeightKg = parseFloat(vitals.cwt);
  const hasWeight = !isNaN(currentWeightKg) && currentWeightKg > 0;

  // Holliday-Segar Maintenance Fluid Calculation
  // 100 ml/kg for 1st 10kg, 50 ml/kg for 10-20kg, 20 ml/kg thereafter
  let hsDailyMl = 0;
  let hsHourlyRate = 0;
  if (hasWeight) {
    if (currentWeightKg <= 10) {
      hsDailyMl = currentWeightKg * 100;
      hsHourlyRate = currentWeightKg * 4;
    } else if (currentWeightKg <= 20) {
      hsDailyMl = 1000 + (currentWeightKg - 10) * 50;
      hsHourlyRate = 40 + (currentWeightKg - 10) * 2;
    } else {
      hsDailyMl = 1500 + (currentWeightKg - 20) * 20;
      hsHourlyRate = 60 + (currentWeightKg - 20) * 1;
    }
    hsDailyMl = Math.round(hsDailyMl);
    hsHourlyRate = Math.round(hsHourlyRate);
  }

  // Resuscitation Boluses (10 & 20 ml/kg)
  const bolus10Ml = hasWeight ? Math.round(currentWeightKg * 10) : 0;
  const bolus20Ml = hasWeight ? Math.round(currentWeightKg * 20) : 0;

  // Add Pediatric Maintenance Fluid to MAR and Plan
  const handleAddPediatricMaintenanceFluid = () => {
    if (!hasWeight) {
      alert('Please enter current weight (cwt in kg) in the vitals section first.');
      return;
    }
    const fluidName = "Half-strength Darrow's with 5% Dextrose";
    const volumeStr = `${hsDailyMl} ml`;
    const rateStr = `Over 24 hrs (${hsHourlyRate} ml/hr)`;
    const indicationStr = `Maintenance fluids (${currentWeightKg}kg Holliday-Segar)`;

    setIvFluids(prev => [...prev, {
      fluid: fluidName,
      volume: volumeStr,
      rate_hours: rateStr,
      indication: indicationStr
    }]);

    appendToPlan(`IVF: ${fluidName} ${volumeStr} over 24 hrs (${hsHourlyRate} ml/hr) as maintenance [Holliday-Segar: ${currentWeightKg}kg]`);
  };

  // Add Pediatric Bolus to Stat Meds and Plan
  const handleAddPediatricFluidBolus = (mlPerKg = 20) => {
    if (!hasWeight) {
      alert('Please enter current weight (cwt in kg) in the vitals section first.');
      return;
    }
    const bolusVol = Math.round(currentWeightKg * mlPerKg);
    const drugName = '0.9% Normal Saline Bolus';
    const doseStr = `${bolusVol} ml (${mlPerKg} ml/kg)`;
    const givenTimeStr = 'Stat over 30-60 min';

    handleAddStatMed(drugName, doseStr, 'IV', givenTimeStr);
    appendToPlan(`IVF Bolus: 0.9% Normal Saline ${bolusVol}ml (${mlPerKg}ml/kg) IV stat over 30-60 minutes`);
  };

  // Add Pediatric Weight-Based Medication to MAR and Plan
  const handleAddPediatricWeightMed = ({ drug, dosePerKg, unit = 'mg', route = 'PO', frequency = 'TDS', indication = '', maxDose = null, isStat = false }) => {
    if (!hasWeight) {
      alert('Please enter current weight (cwt in kg) in the vitals section first.');
      return;
    }
    let calculatedDose = currentWeightKg * dosePerKg;
    if (maxDose && calculatedDose > maxDose) calculatedDose = maxDose;
    
    const formattedDoseNum = calculatedDose >= 10 ? Math.round(calculatedDose) : Number(calculatedDose.toFixed(1));
    const doseStr = `${formattedDoseNum}${unit}`;
    const formulaStr = `(${dosePerKg}${unit}/kg)`;
    const fullDoseWithFormula = `${doseStr} ${formulaStr}`;

    if (isStat) {
      handleAddStatMed(drug, fullDoseWithFormula, route, 'Stat');
      appendToPlan(`${drug} ${fullDoseWithFormula} ${route} Stat${indication ? ` for ${indication}` : ''}`);
    } else {
      handleAddQuickMed(drug, fullDoseWithFormula, route, frequency, `${indication || 'Pediatric dosing'} (${currentWeightKg}kg)`);
      appendToPlan(`${drug} ${fullDoseWithFormula} ${route} ${frequency}${indication ? ` for ${indication}` : ''}`);
    }
  };

  // Clinical Vitals Alert Evaluation
  const hrNum = parseInt(vitals.hr, 10);
  const tempNum = parseFloat(vitals.temp);
  const spo2Num = parseInt(vitals.spo2, 10);
  const hasTachycardia = !isNaN(hrNum) && hrNum > 100;
  const hasFever = !isNaN(tempNum) && tempNum >= 38.0;
  const hasHypoxia = !isNaN(spo2Num) && spo2Num < 95;

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
              {isEditing ? 'Edit Inpatient Admission Note' : 'New Inpatient Admission Note'}
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                Coupled with Drug Sheet
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Matches Gumare Primary Hospital Treatment Chart & MAR layout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAiModal}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            AI Shorthand
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Eye className="w-4 h-4" />
            View Chart
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>

      {/* Dedicated Template Selector Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Document Template & Clinical Structure:
              </label>
              <p className="text-[11px] text-slate-500">
                Select standard hospital protocol or your custom admission template
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
              className="text-xs sm:text-sm font-semibold p-2.5 border-2 border-emerald-600/60 rounded-xl outline-none bg-white text-slate-900 shadow-xs min-w-[260px]"
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
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-700">Word (.docx) Export Design:</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Select standard hospital layout or custom .docx file</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:justify-end max-w-xl">
            <select
              value={selectedDesignFilename || formData.template_filename || 'admission_template.docx'}
              onChange={(e) => {
                const f = e.target.value;
                setSelectedDesignFilename(f);
                setFormData(prev => ({ ...prev, template_filename: f, design_filename: f }));
              }}
              className="w-full sm:w-auto text-xs p-2 border border-slate-300 rounded-xl outline-none bg-slate-50 font-semibold text-slate-800"
            >
              <option value="admission_template.docx">★ Official Treatment Chart (admission_template.docx)</option>
              <option value="drugsheet_template.docx">★ Official Drug Sheet MH 005 (drugsheet_template.docx)</option>
              {docxDesigns
                .filter(d => d.filename !== 'admission_template.docx' && d.filename !== 'drugsheet_template.docx')
                .map(d => (
                  <option key={d.filename} value={d.filename}>
                    {d.is_default ? `★ ${d.name}` : `✦ Custom .docx: ${d.name} (${d.filename})`}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Clinical Preset Bar */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-semibold">
          <span>Quick Clinical Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => loadPreset('tb-case')}
            className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-medium transition"
          >
            ★ Gumare TB Case (from photo)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('sarah-sarefo')}
            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg font-bold transition shadow-xs"
          >
            ★ Sarah Sarefo (MH 005 Drug Sheet Photo Case)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('pneumonia')}
            className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-medium transition"
          >
            Severe Pneumonia
          </button>
          <button
            type="button"
            onClick={handleFullClear}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-semibold transition flex items-center gap-1 shadow-2xs"
            title="Wipe all fields and reset form to a clean blank admission note"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Form</span>
          </button>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Demographics & Admission Header (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Patient Details Card (Matching Gumare Hospital Top Header) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Hospital & Patient Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital</label>
                <input
                  type="text"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reg. NO.</label>
                <input
                  type="text"
                  placeholder="e.g. GPH-2026-08942"
                  value={formData.reg_no}
                  onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 font-mono border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Date & Time</label>
                <input
                  type="text"
                  value={formData.admission_date}
                  onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="e.g. SHAROH"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
                  className="w-full text-xs sm:text-sm p-2.5 font-semibold uppercase border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Surname</label>
                <input
                  type="text"
                  placeholder="e.g. MBAMBI"
                  value={formData.patient_surname}
                  onChange={(e) => setFormData({ ...formData, patient_surname: e.target.value.toUpperCase() })}
                  className="w-full text-xs sm:text-sm p-2.5 font-semibold uppercase border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward</label>
                <input
                  type="text"
                  placeholder="e.g. TB"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Working Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Pulmonary tuberculosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 font-semibold text-emerald-950 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Age</label>
                  {isPediatric && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      Pediatric
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={formData.age_unit === 'months' ? '18' : '15'}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                  />
                  <select
                    value={formData.age_unit || 'years'}
                    onChange={(e) => setFormData({ ...formData, age_unit: e.target.value })}
                    className="text-xs p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 bg-white font-semibold text-slate-700 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor / Prescriber</label>
                <input
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 font-bold border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Vitals Strip with Anthropometry (cwt, ht) & Clinical Alerts */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                Baseline Vitals & Anthropometry
              </h4>
              <div className="flex items-center gap-1.5">
                {hasTachycardia && (
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Tachycardia
                  </span>
                )}
                {hasFever && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Febrile
                  </span>
                )}
                {hasHypoxia && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Hypoxic
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5 flex items-center justify-between">
                  <span>cwt (kg)</span>
                  {isPediatric && <span className="text-[9px] text-emerald-700 font-bold">Wt</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={vitals.cwt}
                  onChange={(e) => setVitals({ ...vitals, cwt: e.target.value })}
                  placeholder="e.g. 10.5"
                  className={`w-full p-2 border rounded-lg text-center font-mono font-bold ${
                    isPediatric ? 'border-emerald-400 bg-emerald-50/70 text-emerald-950 focus:bg-white' : 'border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                  ht (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={vitals.ht}
                  onChange={(e) => setVitals({ ...vitals, ht: e.target.value })}
                  placeholder="e.g. 75"
                  className="w-full p-2 border border-slate-300 rounded-lg text-center font-mono font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">BP (mmHg)</label>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  placeholder="117/74"
                  className="w-full p-2 border border-slate-300 rounded-lg text-center font-mono font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Pulse (bpm)</label>
                <input
                  type="text"
                  value={vitals.hr}
                  onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                  placeholder="146"
                  className={`w-full p-2 border rounded-lg text-center font-mono font-semibold ${
                    hasTachycardia ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Temp (°C)</label>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  placeholder="39.7"
                  className={`w-full p-2 border rounded-lg text-center font-mono font-semibold ${
                    hasFever ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">SpO2 (%)</label>
                <input
                  type="text"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  placeholder="99"
                  className="w-full p-2 border border-slate-300 rounded-lg text-center font-mono font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Resp Rate</label>
                <input
                  type="text"
                  value={vitals.rr}
                  onChange={(e) => setVitals({ ...vitals, rr: e.target.value })}
                  placeholder="20"
                  className="w-full p-2 border border-slate-300 rounded-lg text-center font-mono font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">RBS (mmol/L)</label>
                <input
                  type="text"
                  value={vitals.rbs}
                  onChange={(e) => setVitals({ ...vitals, rbs: e.target.value })}
                  placeholder="7.5"
                  className="w-full p-2 border border-slate-300 rounded-lg text-center font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Pediatric Weight-Based Fluids & Medication Engine */}
          {isPediatric && (
            <div className="bg-linear-to-br from-emerald-50 via-teal-50 to-blue-50 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/50 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-emerald-950 uppercase tracking-tight flex items-center gap-1.5">
                      Pediatric Dosing & Fluid Calculator
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                        {formData.age ? `${formData.age} ${formData.age_unit || 'years'}` : 'Pediatric'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Populates exact weight-based quantities into MAR Drug Sheet and Management Plan
                    </p>
                  </div>
                </div>
                {hasWeight ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs self-start sm:self-auto">
                    <span>cwt:</span>
                    <span className="font-mono text-sm text-emerald-700">{currentWeightKg} kg</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 self-start sm:self-auto">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Enter weight (cwt) in vitals
                  </div>
                )}
              </div>

              {!hasWeight ? (
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">Weight required for pediatric calculations</p>
                    <p className="text-[11px] text-amber-800">Please enter current weight (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">cwt</code> in kg) in the vitals section above to automatically calculate Holliday-Segar maintenance fluids, resuscitation boluses, and weight-based medication doses.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Holliday-Segar Maintenance Fluids */}
                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                          Holliday-Segar Maintenance IV Fluids ({currentWeightKg} kg)
                        </span>
                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                          24-hr Total: <strong className="text-emerald-900">{hsDailyMl} ml/day</strong> &bull; Rate: <strong className="text-emerald-900">{hsHourlyRate} ml/hr</strong> (4-2-1 rule)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPediatricMaintenanceFluid}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Maintenance Fluid (to MAR & Plan)
                      </button>
                    </div>
                  </div>

                  {/* Resuscitation Fluid Boluses */}
                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Resuscitation Fluid Boluses (0.9% Normal Saline / Ringers Lactate)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddPediatricFluidBolus(10)}
                        className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-700" /> 10 ml/kg Bolus ({bolus10Ml} ml stat)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPediatricFluidBolus(20)}
                        className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-700" /> 20 ml/kg Shock Bolus ({bolus20Ml} ml stat)
                      </button>
                    </div>
                  </div>

                  {/* Weight-Based Common Pediatric Medications */}
                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Weight-Based Medication Presets (Click to add to MAR & Plan)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Based on {currentWeightKg} kg
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Paracetamol',
                          dosePerKg: 15,
                          unit: 'mg',
                          route: 'PO',
                          frequency: 'TDS',
                          indication: 'Analgesia / Fever',
                          maxDose: 1000
                        })}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Paracetamol {Math.round(currentWeightKg * 15)}mg (15mg/kg) PO TDS
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Ceftriaxone',
                          dosePerKg: 50,
                          unit: 'mg',
                          route: 'IV',
                          frequency: 'OD',
                          indication: 'Severe bacterial infection',
                          maxDose: 2000
                        })}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Ceftriaxone {Math.round(currentWeightKg * 50)}mg (50mg/kg) IV OD
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Cefotaxime',
                          dosePerKg: 50,
                          unit: 'mg',
                          route: 'IV',
                          frequency: 'TDS',
                          indication: 'Neonatal/Pediatric sepsis',
                          maxDose: 2000
                        })}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Cefotaxime {Math.round(currentWeightKg * 50)}mg (50mg/kg) IV TDS
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Ampicillin',
                          dosePerKg: 50,
                          unit: 'mg',
                          route: 'IV',
                          frequency: 'QID',
                          indication: 'Bacterial coverage / Listeria',
                          maxDose: 2000
                        })}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Ampicillin {Math.round(currentWeightKg * 50)}mg (50mg/kg) IV QID
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Gentamicin',
                          dosePerKg: 7.5,
                          unit: 'mg',
                          route: 'IV',
                          frequency: 'OD',
                          indication: 'Gram-negative coverage'
                        })}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Gentamicin {Number((currentWeightKg * 7.5).toFixed(1))}mg (7.5mg/kg) IV OD
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Ibuprofen',
                          dosePerKg: 10,
                          unit: 'mg',
                          route: 'PO',
                          frequency: 'TDS',
                          indication: 'Anti-inflammatory / Pain',
                          maxDose: 400
                        })}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Ibuprofen {Math.round(currentWeightKg * 10)}mg (10mg/kg) PO TDS
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddPediatricWeightMed({
                          drug: 'Diazepam',
                          dosePerKg: 0.3,
                          unit: 'mg',
                          route: 'IV',
                          frequency: 'STAT',
                          indication: 'Convulsion / Status epilepticus',
                          maxDose: 10,
                          isStat: true
                        })}
                        className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Diazepam {Number((currentWeightKg * 0.3).toFixed(1))}mg (0.3mg/kg) IV Stat
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const isUnder6Mo = formData.age_unit === 'months' && Number(formData.age) < 6;
                          const zDose = isUnder6Mo ? '10mg' : '20mg';
                          handleAddQuickMed('Zinc Sulfate', zDose, 'PO', 'OD', 'Diarrhea / Gastroenteritis x 14 days');
                          appendToPlan(`Zinc Sulfate ${zDose} PO OD for 14 days`);
                        }}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + Zinc Sulfate {formData.age_unit === 'months' && Number(formData.age) < 6 ? '10mg' : '20mg'} OD
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const orsMl = Math.round(currentWeightKg * 75);
                          handleAddQuickMed('ORS (Plan B)', `${orsMl} ml`, 'PO', 'PRN', 'Dehydration over 4 hours');
                          appendToPlan(`Oral Rehydration Solution (ORS) ${orsMl}ml (75ml/kg) PO over 4 hours`);
                        }}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                      >
                        + ORS Plan B {Math.round(currentWeightKg * 75)}ml (75ml/kg) PO
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clinical History & Complaints */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Clinical Presentation & History
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">RVD / HIV Status</label>
                <input
                  type="text"
                  placeholder="e.g. RVD unknown, HIV Negative, HIV Positive on ART"
                  value={formData.rvd_status}
                  onChange={(e) => setFormData({ ...formData, rvd_status: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comorbidities</label>
                <input
                  type="text"
                  placeholder="e.g. Nil known comorbidities"
                  value={formData.comorbidities}
                  onChange={(e) => setFormData({ ...formData, comorbidities: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chief Complaint (CO)
              </label>
              <textarea
                rows={2}
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                History of Present Illness (HPI)
              </label>
              <textarea
                rows={3}
                value={formData.history_present_illness}
                onChange={(e) => setFormData({ ...formData, history_present_illness: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Past Medical & Surgical History
              </label>
              <textarea
                rows={2}
                value={formData.past_medical_history}
                onChange={(e) => setFormData({ ...formData, past_medical_history: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Physical Examination & Systems */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Physical Examination & Systems
              </h3>
              <span className="text-[11px] text-slate-500">
                {activeExamSystems.length} systems included in this protocol
              </span>
            </div>

            {/* Dynamic Examination System Fields */}
            <div className="space-y-3">
              {activeExamSystems.map(sysId => {
                const sysDef = STANDARD_EXAMINATION_SYSTEMS.find(s => s.id === sysId) || {
                  id: sysId,
                  label: sysId.replace(/_/g, ' ').toUpperCase(),
                  placeholder: 'Clinical findings for this system...'
                };
                return (
                  <div key={sysId} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-800">{sysDef.label}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveExamSystems(prev => prev.filter(id => id !== sysId));
                        }}
                        className="text-slate-400 hover:text-red-600 transition"
                        title="Remove system from note"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={sysDef.placeholder}
                      value={(formData.examination && formData.examination[sysId]) || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        examination: { ...(prev.examination || {}), [sysId]: e.target.value }
                      }))}
                      className="w-full text-xs sm:text-sm p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                );
              })}

              {/* Custom Examination Systems */}
              {customExamSystems.map((cust, cIdx) => (
                <div key={cIdx} className="bg-purple-50/50 p-3 rounded-xl border border-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <input
                      type="text"
                      value={cust.label}
                      onChange={(e) => {
                        const copy = [...customExamSystems];
                        copy[cIdx].label = e.target.value;
                        setCustomExamSystems(copy);
                      }}
                      placeholder="Custom System Name..."
                      className="font-bold text-slate-800 bg-transparent border-b border-purple-300 outline-none text-xs w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomExamSystems(prev => prev.filter((_, i) => i !== cIdx));
                        const copyExam = { ...(formData.examination || {}) };
                        delete copyExam[cust.id];
                        setFormData(prev => ({ ...prev, examination: copyExam }));
                      }}
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Findings for this system..."
                    value={(formData.examination && formData.examination[cust.id]) || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      examination: { ...(prev.examination || {}), [cust.id]: e.target.value }
                    }))}
                    className="w-full text-xs sm:text-sm p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* + Add Examination System Toolbar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                + Include Additional System in Examination:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {STANDARD_EXAMINATION_SYSTEMS.filter(s => !activeExamSystems.includes(s.id)).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveExamSystems(prev => [...prev, s.id])}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>{s.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newId = `custom_${Date.now()}`;
                    setCustomExamSystems(prev => [...prev, { id: newId, label: 'Custom System' }]);
                  }}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-purple-600" />
                  <span>Custom System</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Assessment (Diagnosis / Impression)
              </label>
              <textarea
                rows={2}
                placeholder="Enter diagnostic summary or numbered diagnoses (e.g. 1. Pulmonary TB, 2. Bacterial pneumonia)..."
                value={formData.assessment}
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Management Plan (Numbered Items)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncPlanWithMedsAndFluids}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    title="Populate plan with current weight-based medications & IV fluids"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Sync Plan with Meds & Fluids</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    Each line automatically numbers (1, 2, 3...)
                  </span>
                </div>
              </div>
              <textarea
                rows={4}
                placeholder="1. Admit to ward for isolation&#10;2. Baseline bloods: FBC, LFT, RFT&#10;3. Medications as on MAR Drug Sheet&#10;4. IVF 2L RL over 24 hours&#10;5. Monitor vitals 4 hourly"
                value={Array.isArray(formData.plan) ? formData.plan.join('\n') : (formData.plan || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, plan: val.split('\n') });
                }}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => appendToPlan('Admit to ward as per protocol')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                >
                  + Admit to ward
                </button>
                <button
                  type="button"
                  onClick={() => appendToPlan('Baseline bloods: FBC, LFT, RFT, CMP')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                >
                  + Baseline bloods
                </button>
                <button
                  type="button"
                  onClick={() => appendToPlan('Administer medications as charted on Drug Sheet')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                >
                  + MAR Medications
                </button>
                <button
                  type="button"
                  onClick={() => appendToPlan('Monitor vitals 4 hourly')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                >
                  + Vitals 4-hourly
                </button>
                <button
                  type="button"
                  onClick={() => appendToPlan('Strict fluid balance / Intake & Output')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition cursor-pointer"
                >
                  + Strict fluid balance
                </button>
                {isPediatric && hasWeight && (
                  <button
                    type="button"
                    onClick={handleAddPediatricMaintenanceFluid}
                    className="text-[10px] bg-teal-100 hover:bg-teal-200 text-teal-950 border border-teal-300 px-2 py-0.5 rounded-md font-bold transition cursor-pointer"
                  >
                    + Holliday-Segar IVF ({hsDailyMl}ml/d)
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: COUPLED INPATIENT DRUG SHEET (MAR) */}
        <div className="space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-600/60 shadow-md space-y-4 sticky top-20">
            
            {/* Drug sheet title header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                    Coupled Inpatient Drug Sheet
                  </h3>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Auto-linked with Admission Note & Treatment Chart
                  </p>
                </div>
              </div>
            </div>

            {/* Quick add chips for common medications */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Tap to quick-add medication:
                </span>
                {isPediatric && hasWeight && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                    {currentWeightKg} kg Pediatric Dosing
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {isPediatric && hasWeight ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricWeightMed({
                        drug: 'Paracetamol',
                        dosePerKg: 15,
                        unit: 'mg',
                        route: 'PO',
                        frequency: 'TDS',
                        indication: 'Analgesia / Fever',
                        maxDose: 1000
                      })}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-medium cursor-pointer"
                    >
                      + Paracetamol {Math.round(currentWeightKg * 15)}mg (15mg/kg) TDS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricWeightMed({
                        drug: 'Ceftriaxone',
                        dosePerKg: 50,
                        unit: 'mg',
                        route: 'IV',
                        frequency: 'OD',
                        indication: 'Severe infection',
                        maxDose: 2000
                      })}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-medium cursor-pointer"
                    >
                      + Ceftriaxone {Math.round(currentWeightKg * 50)}mg (50mg/kg) OD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricWeightMed({
                        drug: 'Cefotaxime',
                        dosePerKg: 50,
                        unit: 'mg',
                        route: 'IV',
                        frequency: 'TDS',
                        indication: 'Bacterial coverage',
                        maxDose: 2000
                      })}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-medium cursor-pointer"
                    >
                      + Cefotaxime {Math.round(currentWeightKg * 50)}mg (50mg/kg) TDS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricWeightMed({
                        drug: 'Gentamicin',
                        dosePerKg: 7.5,
                        unit: 'mg',
                        route: 'IV',
                        frequency: 'OD',
                        indication: 'Gram-negative coverage'
                      })}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-medium cursor-pointer"
                    >
                      + Gentamicin {Number((currentWeightKg * 7.5).toFixed(1))}mg (7.5mg/kg) OD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricWeightMed({
                        drug: 'Ampicillin',
                        dosePerKg: 50,
                        unit: 'mg',
                        route: 'IV',
                        frequency: 'QID',
                        indication: 'Bacterial coverage',
                        maxDose: 2000
                      })}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-medium cursor-pointer"
                    >
                      + Ampicillin {Math.round(currentWeightKg * 50)}mg QID
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddQuickMed('START ATT', '3 tabs', 'PO', 'OD', 'Pulmonary TB')}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + ATT 3 tabs OD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickMed('Pyridoxime', '25mg', 'PO', 'OD', 'Prophylaxis')}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + Pyridoxime 25mg OD
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickMed('Cefotaxime', '1g', 'IV', 'TDS', 'Bacterial coverage')}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + Cefotaxime 1g IV TDS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickMed('Paracetamol', '1g', 'PO', 'TDS', 'Analgesia / Fever')}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + Paracetamol 1g TDS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickMed('Ibuprofen', '400mg', 'PO', 'TDS', 'Joint pain')}
                      className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      + Ibuprofen 400mg TDS
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Regular Medications List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Regular Inpatient Meds ({medications.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddMed}
                  className="text-xs text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug Row
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {medications.map((med, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Drug name (e.g. Cefotaxime)"
                        value={med.drug}
                        onChange={(e) => handleUpdateMed(idx, 'drug', e.target.value)}
                        className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        placeholder="Dose (1g)"
                        value={med.dose}
                        onChange={(e) => handleUpdateMed(idx, 'dose', e.target.value)}
                        className="p-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                      <select
                        value={med.route}
                        onChange={(e) => handleUpdateMed(idx, 'route', e.target.value)}
                        className="p-1.5 bg-white border border-slate-300 rounded-lg uppercase"
                      >
                        <option value="PO">PO</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="SC">SC</option>
                        <option value="PR">PR</option>
                        <option value="NEB">NEB</option>
                      </select>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleUpdateMed(idx, 'frequency', e.target.value)}
                        className="p-1.5 bg-white border border-slate-300 rounded-lg uppercase font-semibold text-emerald-800"
                      >
                        <option value="OD">OD</option>
                        <option value="BD">BD</option>
                        <option value="TDS">TDS</option>
                        <option value="QID">QID</option>
                        <option value="NOCTE">NOCTE</option>
                        <option value="PRN">PRN</option>
                        <option value="STAT">STAT</option>
                      </select>
                    </div>

                    {/* MH 005 Standard Administration Times */}
                    <div className="pt-1.5 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                        MH 005 Times (Circled on Drug Sheet):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'].map((t) => {
                          const isSel = (med.admin_times && med.admin_times.includes(t)) ||
                            (!med.admin_times && (
                              (med.frequency === 'OD' && t === '6 am') ||
                              (med.frequency === 'BD' && (t === '6 am' || t === '6 pm')) ||
                              (med.frequency === 'TDS' && (t === '6 am' || t === '2 pm' || t === '10 pm')) ||
                              (med.frequency === 'QID' && (t === '6 am' || t === '12 md' || t === '6 pm' || t === '12 mn')) ||
                              (med.frequency === 'NOCTE' && t === '10 pm')
                            ));
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleToggleMedTime(idx, t)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition border ${
                                isSel
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intravenous Fluids */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  IV Fluids ({ivFluids.length})
                </span>
                <div className="flex items-center gap-1.5">
                  {isPediatric && hasWeight && (
                    <button
                      type="button"
                      onClick={handleAddPediatricMaintenanceFluid}
                      className="text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Add Holliday-Segar pediatric maintenance fluids"
                    >
                      <Plus className="w-3 h-3 text-teal-700" /> Holliday-Segar ({hsHourlyRate} ml/hr)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddFluid}
                    className="text-xs text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Fluid
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {ivFluids.map((fluid, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Fluid (RL, 0.9% NS)"
                        value={fluid.fluid}
                        onChange={(e) => handleUpdateFluid(idx, 'fluid', e.target.value)}
                        className="flex-1 p-1 bg-white border border-slate-300 rounded-md font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFluid(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        placeholder="Volume (1 L)"
                        value={fluid.volume}
                        onChange={(e) => handleUpdateFluid(idx, 'volume', e.target.value)}
                        className="p-1 bg-white border border-slate-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Rate (over 24 hrs)"
                        value={fluid.rate_hours}
                        onChange={(e) => handleUpdateFluid(idx, 'rate_hours', e.target.value)}
                        className="p-1 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat Doses & Single Medication Orders (Table 7 on MH 005) */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Stat / Single Doses ({statMeds.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Bottom Table 7 of Hospital Drug Sheet
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddStatMed()}
                  className="text-xs text-amber-700 font-semibold hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stat Med
                </button>
              </div>

              {/* Quick Stat Med Chips */}
              <div className="flex flex-wrap gap-1">
                {isPediatric && hasWeight ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricFluidBolus(10)}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Bolus 10 ml/kg ({bolus10Ml} ml stat)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricFluidBolus(20)}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Shock Bolus 20 ml/kg ({bolus20Ml} ml stat)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPediatricWeightMed({
                        drug: 'Diazepam',
                        dosePerKg: 0.3,
                        unit: 'mg',
                        route: 'IV',
                        frequency: 'STAT',
                        indication: 'Convulsion',
                        maxDose: 10,
                        isStat: true
                      })}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Diazepam {Number((currentWeightKg * 0.3).toFixed(1))}mg Stat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Paracetamol', `${Math.round(currentWeightKg * 15)}mg (15mg/kg)`, 'PR/PO', 'Stat')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Paracetamol {Math.round(currentWeightKg * 15)}mg Stat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Cefotaxime', `${Math.round(currentWeightKg * 50)}mg (50mg/kg)`, 'IV', 'Stat on arrival')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Cefotaxime {Math.round(currentWeightKg * 50)}mg IV Stat
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Cefotaxime', '1g', 'IV', 'Stat on arrival')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Cefotaxime 1g IV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Ringers Lactate', '1 L', 'IV', 'Stat over 2 hrs')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + RL 1 L IV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Paracetamol', '1g', 'PO', 'Stat')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Paracetamol 1g PO
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Diazepam', '10mg', 'IV', 'Stat')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Diazepam 10mg IV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStatMed('Hydrocortisone', '100mg', 'IV', 'Stat')}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + Hydrocortisone 100mg
                    </button>
                  </>
                )}
              </div>

              {/* Stat Med Rows */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {statMeds.map((sm, idx) => (
                  <div key={idx} className="p-2 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Drug name (e.g. Cefotaxime)"
                        value={sm.drug}
                        onChange={(e) => handleUpdateStatMed(idx, 'drug', e.target.value)}
                        className="flex-1 p-1 bg-white border border-amber-300 rounded font-semibold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStatMed(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Delete Stat Med"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="Dose (1g)"
                        value={sm.dose}
                        onChange={(e) => handleUpdateStatMed(idx, 'dose', e.target.value)}
                        className="p-1 bg-white border border-amber-300 rounded text-xs"
                      />
                      <select
                        value={sm.route}
                        onChange={(e) => handleUpdateStatMed(idx, 'route', e.target.value)}
                        className="p-1 bg-white border border-amber-300 rounded uppercase text-xs"
                      >
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="PO">PO</option>
                        <option value="SC">SC</option>
                        <option value="PR">PR</option>
                        <option value="NEB">NEB</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Given time (15:30)"
                        value={sm.given_time || ''}
                        onChange={(e) => handleUpdateStatMed(idx, 'given_time', e.target.value)}
                        className="p-1 bg-white border border-amber-300 rounded text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-slate-500">Order Date:</span>
                        <input
                          type="text"
                          value={sm.date || ''}
                          onChange={(e) => handleUpdateStatMed(idx, 'date', e.target.value)}
                          placeholder="01/09/26"
                          className="w-full p-1 bg-white border border-amber-300 rounded text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500">Signature:</span>
                        <input
                          type="text"
                          value={sm.signature || ''}
                          onChange={(e) => handleUpdateStatMed(idx, 'signature', e.target.value)}
                          placeholder="DR GUMBO"
                          className="w-full p-1 bg-white border border-amber-300 rounded text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nursing Orders & Special Instructions */}
            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
              <label className="block font-bold text-slate-700 uppercase text-[11px]">
                Vitals Frequency & Nursing Orders
              </label>
              <input
                type="text"
                value={monitoringOrders.vitals_frequency}
                onChange={(e) => setMonitoringOrders({ ...monitoringOrders, vitals_frequency: e.target.value })}
                placeholder="Monitor vitals 4 hourly"
                className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-semibold"
              />

              <label className="block font-bold text-slate-700 uppercase text-[11px] pt-1">
                Ward Precautions & Isolation
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="TB ward airborne isolation, check baseline LFT and RFT..."
                className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick Action Footer in side panel */}
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Eye className="w-4 h-4" />
                Live Preview
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All'}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
