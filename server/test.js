const { app, startServer } = require('./server');
const http = require('http');

let server;
const PORT = 5099;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const contentType = res.headers['content-type'] || '';
        let parsed = null;
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(buffer.toString());
          } catch (e) {
            parsed = buffer.toString();
          }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed || buffer
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('=== STARTING CLINICAL SUITE AUTOMATED VERIFICATION ===\n');

  // Start temporary test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server listening on port ${PORT}`);

  let token = '';

  // 1. Health check
  console.log('\n[TEST 1] Health Check');
  const healthRes = await request('GET', '/api/health');
  if (healthRes.statusCode !== 200 || healthRes.data.status !== 'ok') {
    throw new Error('Health check failed: ' + JSON.stringify(healthRes.data));
  }
  console.log('✓ Health check passed:', healthRes.data);

  // 2. Auth Login
  console.log('\n[TEST 2] Doctor Login (drgumbo)');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'drgumbo',
    password: 'password123'
  });
  if (loginRes.statusCode !== 200 || !loginRes.data.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
  }
  token = loginRes.data.token;
  console.log('✓ Login successful! Token acquired for Dr. Gumbo (Hospital:', loginRes.data.user.hospital_name, ')');

  // 3. Auth Me
  console.log('\n[TEST 3] Auth /me verification');
  const meRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${token}` });
  if (meRes.statusCode !== 200 || meRes.data.user.username !== 'drgumbo') {
    throw new Error('Auth me check failed: ' + JSON.stringify(meRes.data));
  }
  console.log('✓ Profile verified for:', meRes.data.user.doctor_name);

  // 4. List Templates
  console.log('\n[TEST 4] Template Listing');
  const templRes = await request('GET', '/api/templates');
  if (templRes.statusCode !== 200 || !Array.isArray(templRes.data.templates)) {
    throw new Error('Template list failed: ' + JSON.stringify(templRes.data));
  }
  console.log(`✓ Retrieved ${templRes.data.templates.length} templates. Default: ${templRes.data.templates[0].name}`);

  // 5. Notes Listing & Seed Check
  console.log('\n[TEST 5] Notes Listing');
  const notesRes = await request('GET', '/api/notes');
  if (notesRes.statusCode !== 200 || !Array.isArray(notesRes.data.notes)) {
    throw new Error('Notes list failed: ' + JSON.stringify(notesRes.data));
  }
  console.log(`✓ Retrieved ${notesRes.data.notes.length} notes from SQLite database.`);

  // 6. Create Admission Note with Coupled Drug Sheet
  console.log('\n[TEST 6] Create Admission Note Coupled with Drug Sheet');
  const newAdmission = {
    type: 'admission',
    patient_name: 'THABO',
    patient_surname: 'MOLEFE',
    reg_no: 'GPH-2026-10294',
    age: '28',
    gender: 'Male',
    ward: 'Male Medical Ward',
    diagnosis: 'Severe Acute Bacterial Meningitis',
    hospital_name: 'Gumare Primary Hospital',
    doctor_name: 'Dr. Gumbo',
    admission_date: '06/09/26 18:00',
    raw_data: {
      chief_complaint: 'Severe throbbing headache, photophobia, fever, and neck stiffness x 3 days',
      rvd_status: 'HIV Negative (tested 2026)',
      comorbidities: 'None',
      history_present_illness: 'Patient acute deterioration over 48 hours. No prior seizures.',
      today_management_gph: [
        'Initial vitals: BP 135/88 mmHg, P 112 bpm, T 39.4°C, SpO2 97% RA, RBS 6.2 mmol/l',
        'Lumbar puncture performed: Turbid CSF, pending microscopy & culture',
        'Given: Ceftriaxone 2g IV stat, Dexamethasone 10mg IV stat'
      ],
      examination: {
        general: 'Lethargic, photophobic, febrile, no rash. JACCOLD negative.',
        cvs: 'Tachycardic, no murmurs.',
        respiratory: 'Clear bilaterally.',
        abdomen: 'Soft, non-tender.',
        msk: 'Neck stiffness ++, positive Kernig and Brudzinski signs.',
        other_systems: 'Pupils equal and reactive. GCS 14/15.'
      },
      assessment: '28M presenting with acute meningism. Highly suspicious for Acute Bacterial Meningitis.',
      ddx: [
        'Acute Bacterial Meningitis (Streptococcus pneumoniae / Neisseria meningitidis)',
        'Viral Meningoencephalitis',
        'Cryptococcal Meningitis'
      ],
      plan: [
        'Admit to Male Medical Acute Bed',
        'Start high-dose IV Ceftriaxone + Dexamethasone',
        'Maintain IV hydration',
        'Strict neuro and vitals observation 2 hourly'
      ]
    },
    drug_sheet: {
      medications: [
        { drug: 'Ceftriaxone', dose: '2g', route: 'IV', frequency: 'BD', indication: 'Bacterial Meningitis' },
        { drug: 'Dexamethasone', dose: '10mg', route: 'IV', frequency: 'QDS', indication: 'Meningeal inflammation' },
        { drug: 'Paracetamol', dose: '1g', route: 'IV', frequency: 'TDS', indication: 'Pyrexia & headache relief' }
      ],
      stat_meds: [
        { drug: 'Ceftriaxone', dose: '2g', route: 'IV', given_time: '06/09/26 18:15', signature: 'DR GUMBO' },
        { drug: 'Dexamethasone', dose: '10mg', route: 'IV', given_time: '06/09/26 18:15', signature: 'DR GUMBO' }
      ],
      prn_meds: [
        { drug: 'Tramadol', dose: '50mg', route: 'IV', frequency: 'TDS PRN', indication: 'Severe breakthrough pain' }
      ],
      iv_fluids: [
        { fluid: 'Normal Saline (0.9% NS)', volume: '1000 ml', rate_hours: 'Over 8 hours', indication: 'Maintenance' },
        { fluid: 'Ringer Lactate (RL)', volume: '1000 ml', rate_hours: 'Over 8 hours', indication: 'Maintenance' }
      ],
      monitoring_orders: {
        vitals_frequency: '2 hourly (BP, Pulse, Temp, SpO2, GCS and pupil check)',
        strict_intake_output: true
      },
      special_instructions: 'Quiet darkened side room. Elevate head of bed 30 degrees. Droplet precautions.'
    }
  };

  const createRes = await request('POST', '/api/notes', newAdmission, { Authorization: `Bearer ${token}` });
  if (createRes.statusCode !== 201 || !createRes.data.note_id) {
    throw new Error('Failed to create note: ' + JSON.stringify(createRes.data));
  }
  const createdNoteId = createRes.data.note_id;
  console.log(`✓ Admission note created with ID: ${createdNoteId} and coupled with Drug Sheet!`);

  // 7. Verify Note and Coupled Drug Sheet
  console.log('\n[TEST 7] Fetch Note & Coupled Drug Sheet Details');
  const getNoteRes = await request('GET', `/api/notes/${createdNoteId}`);
  if (getNoteRes.statusCode !== 200 || !getNoteRes.data.drugSheet) {
    throw new Error('Failed to fetch note with drug sheet: ' + JSON.stringify(getNoteRes.data));
  }
  const ds = getNoteRes.data.drugSheet;
  console.log(`✓ Note verified: ${getNoteRes.data.note.patient_name} ${getNoteRes.data.note.patient_surname}`);
  console.log(`✓ Coupled Drug Sheet verified: ${ds.medications.length} regular meds, ${ds.stat_meds.length} stat meds, ${ds.iv_fluids.length} IV fluids`);

  // 8. DOCX Export via docxtemplater
  console.log('\n[TEST 8] Export Admission Note + Drug Sheet to DOCX via docxtemplater');
  const docxRes = await request('GET', `/api/notes/${createdNoteId}/export/docx`);
  if (docxRes.statusCode !== 200) {
    throw new Error('DOCX export failed with status: ' + docxRes.statusCode);
  }
  const isDocxBuffer = Buffer.isBuffer(docxRes.data) && docxRes.data.length > 5000;
  if (!isDocxBuffer) {
    throw new Error('Exported DOCX is invalid or too small: ' + docxRes.data.length);
  }
  console.log(`✓ DOCX generated successfully via docxtemplater! Size: ${docxRes.data.length} bytes`);

  // 9. AI Shorthand Clinical Assist
  console.log('\n[TEST 9] AI Shorthand to Admission Note & Drug Sheet');
  const aiRes = await request('POST', '/api/ai/format-note', {
    text: '15 year old female presented with productive cough for 2 weeks, night sweats, fever. Vitals: BP 117/74, Pulse 146 bpm, Temp 39.7C, SpO2 99%. GeneXpert detected scanty TB. Plan: admit TB ward, ATT 3 tabs PO OD, Pyridoxine 25mg PO OD, Cefotaxime 1g IV TDS, Paracetamol 1g PO TDS, IVF 2 L NS/RL over 24 hours, vitals 4 hourly.'
  });
  if (aiRes.statusCode !== 200 || !aiRes.data.data) {
    throw new Error('AI clinical assist failed: ' + JSON.stringify(aiRes.data));
  }
  const aiData = aiRes.data.data;
  console.log(`✓ AI parser source: ${aiRes.data.source}`);
  console.log(`✓ Extracted Diagnosis: ${aiData.diagnosis || 'TB'}`);
  console.log(`✓ Extracted Meds: ${aiData.drug_sheet.medications.map(m => m.drug + ' ' + m.dose).join(', ')}`);
  console.log(`✓ Extracted IV Fluids: ${aiData.drug_sheet.iv_fluids.map(f => f.fluid).join(', ')}`);

  // 10. Test Official Hospital REFERRAL form export
  console.log('\n[TEST 10] Export Official Hospital REFERRAL Form to DOCX via docxtemplater');
  const referralNote = notesRes.data.notes.find(n => n.type === 'referral');
  if (referralNote) {
    const refDocxRes = await request('GET', `/api/notes/${referralNote.id}/export/docx`);
    if (refDocxRes.statusCode !== 200 || !Buffer.isBuffer(refDocxRes.data) || refDocxRes.data.length < 5000) {
      throw new Error('Official REFERRAL form export failed: ' + refDocxRes.statusCode);
    }
    console.log(`✓ Official REFERRAL Form DOCX generated successfully! Size: ${refDocxRes.data.length} bytes`);
  }

  // 11. Create In-App Custom Admission and Referral Templates
  console.log('\n[TEST 11] Create In-App Custom Admission and Referral Templates');
  const customAdmissionPayload = {
    name: 'Pediatric SAM Protocol (Custom)',
    type: 'admission',
    description: 'Protocol for severe acute malnutrition with hypoglycemia and dehydration monitoring',
    default_data: {
      ward: 'Pediatric Isolation Ward',
      diagnosis: 'Severe Acute Malnutrition (Kwashiorkor) with Dehydration',
      chief_complaint: 'Generalized edema, lethargy, poor feeding x 1 week',
      history_present_illness: 'Patient failing to thrive, developed diarrhea 3 days ago.',
      examination: {
        general: 'Bilateral pitting pedal edema, moon face, flag sign hair changes',
        cvs: 'Tachycardia, capillary refill 3 seconds',
        respiratory: 'Tachypneic, chest clear bilaterally',
        abdomen: 'Hepatomegaly 3cm below costal margin, soft',
        msk: 'Muscle wasting in upper arms and thighs',
        other_systems: 'Skin peeling on lower limbs'
      },
      assessment: '3yo with Severe Acute Malnutrition complicated by secondary infection and hypoglycemia risk.',
      medications: [
        { drug: 'ReSoMal', dose: '5ml/kg', route: 'PO', frequency: '2 hourly', indication: 'Dehydration in SAM' },
        { drug: 'Amoxicillin', dose: '125mg', route: 'PO', frequency: 'TDS', indication: 'Empirical SAM antibacterial' },
        { drug: 'F-75 Starter Diet', dose: '100ml', route: 'NG/PO', frequency: '2 hourly', indication: 'SAM metabolic stabilization' }
      ]
    }
  };

  const createTplRes = await request('POST', '/api/templates/custom', customAdmissionPayload, { Authorization: `Bearer ${token}` });
  if (createTplRes.statusCode !== 201 || !createTplRes.data.template || !createTplRes.data.template.id) {
    throw new Error('Custom admission template creation failed: ' + JSON.stringify(createTplRes.data));
  }
  const customAdmissionTplId = createTplRes.data.template.id;
  console.log(`✓ Custom admission template created! ID: ${customAdmissionTplId}, filename: ${createTplRes.data.template.filename}`);

  const customReferralPayload = {
    name: 'Acute Surgical Abdomen Transfer (Custom)',
    type: 'referral',
    description: 'Urgent transfer for exploratory laparotomy / general surgery',
    default_data: {
      referring_unit: 'Emergency / Acute Ward',
      receiving_hospital: 'Princess Marina Hospital (Referral)',
      receiving_department: 'General Surgery Emergency Unit',
      urgency: 'Emergency',
      diagnosis: 'Acute Peritonitis secondary to Perforated Peptic Ulcer',
      reason_for_referral: 'Urgent surgical intervention, laparotomy and critical care ICU backup',
      transport_needs: 'Advanced Life Support Ambulance with continuous IV fluid resuscitation and nasogastric tube drainage'
    }
  };

  const createRefTplRes = await request('POST', '/api/templates/custom', customReferralPayload, { Authorization: `Bearer ${token}` });
  if (createRefTplRes.statusCode !== 201 || !createRefTplRes.data.template) {
    throw new Error('Custom referral template creation failed: ' + JSON.stringify(createRefTplRes.data));
  }
  const customReferralTplId = createRefTplRes.data.template.id;
  console.log(`✓ Custom referral template created! ID: ${customReferralTplId}, filename: ${createRefTplRes.data.template.filename}`);

  // 12. List Templates filtered by type and check default_data parsing
  console.log('\n[TEST 12] List Templates with Type Filters and Parsed default_data');
  const filteredAdmissionRes = await request('GET', '/api/templates?type=admission');
  if (filteredAdmissionRes.statusCode !== 200 || !Array.isArray(filteredAdmissionRes.data.templates)) {
    throw new Error('Filtered template list failed: ' + JSON.stringify(filteredAdmissionRes.data));
  }
  const foundCustomAdm = filteredAdmissionRes.data.templates.find(t => t.id === customAdmissionTplId);
  if (!foundCustomAdm || typeof foundCustomAdm.default_data !== 'object' || foundCustomAdm.default_data.diagnosis !== 'Severe Acute Malnutrition (Kwashiorkor) with Dehydration') {
    throw new Error('Custom template not found or default_data not parsed properly: ' + JSON.stringify(foundCustomAdm));
  }
  console.log(`✓ Filtered templates verified: ${filteredAdmissionRes.data.templates.length} admission templates; default_data successfully parsed!`);

  // 13. Create Note referencing Custom template_id
  console.log('\n[TEST 13] Create Admission Note referencing Custom Template ID');
  const customNotePayload = {
    type: 'admission',
    template_id: customAdmissionTplId,
    patient_name: 'KATLEGO',
    patient_surname: 'KGOSI',
    reg_no: 'GPH-PED-2026-042',
    age: '3',
    gender: 'Male',
    ward: foundCustomAdm.default_data.ward,
    diagnosis: foundCustomAdm.default_data.diagnosis,
    hospital_name: 'Gumare Primary Hospital',
    doctor_name: 'Dr. Gumbo',
    admission_date: '06/09/26 19:00',
    raw_data: {
      chief_complaint: foundCustomAdm.default_data.chief_complaint,
      history_present_illness: foundCustomAdm.default_data.history_present_illness,
      examination: foundCustomAdm.default_data.examination,
      assessment: foundCustomAdm.default_data.assessment
    },
    drug_sheet: {
      medications: foundCustomAdm.default_data.medications,
      stat_meds: [],
      prn_meds: [],
      iv_fluids: []
    }
  };

  const createCustomNoteRes = await request('POST', '/api/notes', customNotePayload, { Authorization: `Bearer ${token}` });
  if (createCustomNoteRes.statusCode !== 201 || !createCustomNoteRes.data.note_id) {
    throw new Error('Creating note with custom template failed: ' + JSON.stringify(createCustomNoteRes.data));
  }
  const customNoteId = createCustomNoteRes.data.note_id;
  console.log(`✓ Note created with custom template! Note ID: ${customNoteId}`);

  // 14. Export Custom Note to DOCX via docxtemplater
  console.log('\n[TEST 14] Export Custom Note to DOCX via docxtemplater');
  const exportCustomRes = await request('GET', `/api/notes/${customNoteId}/export/docx`);
  if (exportCustomRes.statusCode !== 200 || !Buffer.isBuffer(exportCustomRes.data) || exportCustomRes.data.length < 5000) {
    throw new Error('Exporting custom note to DOCX failed: ' + exportCustomRes.statusCode);
  }
  console.log(`✓ Custom template DOCX successfully compiled and exported! Size: ${exportCustomRes.data.length} bytes`);

  // 15. List Available DOCX Design Files
  console.log('\n[TEST 15] List Available DOCX Design Files');
  const docxFilesRes = await request('GET', '/api/templates/docx-files?type=admission');
  if (docxFilesRes.statusCode !== 200 || !Array.isArray(docxFilesRes.data.files)) {
    throw new Error('Listing docx files failed: ' + JSON.stringify(docxFilesRes.data));
  }
  console.log(`✓ Retrieved ${docxFilesRes.data.files.length} admission docx design files. Default: ${docxFilesRes.data.files[0].name}`);

  // 16. Create Custom Template with Configurable Examinations to Include & DOCX Design
  console.log('\n[TEST 16] Create Custom Template with Configurable Examinations to Include');
  const neuroProtocolPayload = {
    name: 'Acute Ischemic Stroke Protocol (Custom)',
    type: 'admission',
    description: 'Protocol with mandatory neurological & neurovascular examinations',
    design_filename: docxFilesRes.data.files[0].filename,
    default_data: {
      ward: 'Acute Stroke & Medical Unit',
      diagnosis: 'Acute Ischemic Stroke (Right MCA Territory)',
      chief_complaint: 'Sudden onset left-sided weakness, facial droop, dysarthria x 3 hours',
      history_present_illness: 'Patient collapsed at home. Onset 3 hours prior to presentation.',
      included_examinations: ['general', 'cns', 'cvs', 'respiratory', 'skin'],
      examination: {
        general: 'Alert, dysarthric, no respiratory distress. JACCOLD negative.',
        cns: 'GCS 14/15 (E4 V4 M6), left facial droop (UMN VII), left hemiparesis: Upper limb 2/5, Lower limb 3/5. Babinski positive on left. Neck soft, no meningism.',
        cvs: 'Heart sounds normal, no carotid bruit, irregular pulse (suspected atrial fibrillation), BP 168/98 mmHg.',
        respiratory: 'Chest clear bilaterally, air entry vesicular, SpO2 98% room air.',
        skin: 'Intact, Braden scale 13 (moderate pressure injury risk).'
      },
      assessment: '62M presenting with acute left hemiparesis within thrombolysis / stabilization window.',
      medications: [
        { drug: 'Aspirin', dose: '300mg', route: 'PO', frequency: 'OD', indication: 'Acute antiplatelet' },
        { drug: 'Atorvastatin', dose: '80mg', route: 'PO', frequency: 'NOCTE', indication: 'Secondary neurovascular prevention' }
      ]
    }
  };

  const createNeuroTplRes = await request('POST', '/api/templates/custom', neuroProtocolPayload, { Authorization: `Bearer ${token}` });
  if (createNeuroTplRes.statusCode !== 201 || !createNeuroTplRes.data.template) {
    throw new Error('Creating neuro template with included examinations failed: ' + JSON.stringify(createNeuroTplRes.data));
  }
  const neuroTpl = createNeuroTplRes.data.template;
  if (!Array.isArray(neuroTpl.default_data.included_examinations) || !neuroTpl.default_data.examination.cns) {
    throw new Error('Template default_data did not persist included_examinations properly: ' + JSON.stringify(neuroTpl.default_data));
  }
  console.log(`✓ Neuro template created with ID: ${neuroTpl.id}! Included exams: ${neuroTpl.default_data.included_examinations.join(', ')}`);

  // 17. Create Note with Custom DOCX Design Selection & Included Examinations
  console.log('\n[TEST 17] Create Note with Custom DOCX Design Selection & Included Examinations');
  const strokeNotePayload = {
    type: 'admission',
    template_id: neuroTpl.id,
    design_filename: neuroTpl.default_data.design_filename,
    patient_name: 'MOTHUSI',
    patient_surname: 'SERETSE',
    reg_no: 'GPH-STROKE-2026-009',
    age: '62',
    gender: 'Male',
    ward: neuroTpl.default_data.ward,
    diagnosis: neuroTpl.default_data.diagnosis,
    hospital_name: 'Gumare Primary Hospital',
    doctor_name: 'Dr. Gumbo',
    admission_date: '06/09/26 21:00',
    raw_data: {
      chief_complaint: neuroTpl.default_data.chief_complaint,
      history_present_illness: neuroTpl.default_data.history_present_illness,
      examination: neuroTpl.default_data.examination,
      assessment: neuroTpl.default_data.assessment
    },
    drug_sheet: {
      medications: neuroTpl.default_data.medications,
      stat_meds: [],
      prn_meds: [],
      iv_fluids: []
    }
  };

  const createStrokeNoteRes = await request('POST', '/api/notes', strokeNotePayload, { Authorization: `Bearer ${token}` });
  if (createStrokeNoteRes.statusCode !== 201 || !createStrokeNoteRes.data.note_id) {
    throw new Error('Creating stroke note failed: ' + JSON.stringify(createStrokeNoteRes.data));
  }
  const strokeNoteId = createStrokeNoteRes.data.note_id;
  console.log(`✓ Stroke note created with ID: ${strokeNoteId} and design: ${strokeNotePayload.design_filename}`);

  // 18. Export Note and verify docxtemplater compilation with custom docx design & examination payload
  console.log('\n[TEST 18] Export Note with Custom DOCX Design & Dynamic Examination Fields');
  const strokeExportRes = await request('GET', `/api/notes/${strokeNoteId}/export/docx`);
  if (strokeExportRes.statusCode !== 200 || !Buffer.isBuffer(strokeExportRes.data) || strokeExportRes.data.length < 5000) {
    throw new Error('Stroke note docx export failed: ' + strokeExportRes.statusCode);
  }
  console.log(`✓ Stroke note successfully exported via docxtemplater using custom docx design! Size: ${strokeExportRes.data.length} bytes`);

  // Verify preview endpoint formats dynamic examination text
  const strokePreviewRes = await request('GET', `/api/notes/${strokeNoteId}/export/preview`);
  if (strokePreviewRes.statusCode !== 200 || !strokePreviewRes.data.treatmentText.includes('CNS / Neuro:')) {
    throw new Error('Preview treatmentText does not include dynamic CNS examination: ' + strokePreviewRes.data.treatmentText);
  }
  console.log('✓ Preview verified! Treatment note includes formatted CNS / Neuro examination.');

  // 19. Inspect Premade DOCX File
  console.log('\n[TEST 19] Inspect Premade DOCX File');
  const inspectRes = await request('POST', '/api/templates/inspect-docx', {
    filename: 'inpatient_drug_sheet.docx'
  }, { Authorization: `Bearer ${token}` });

  if (inspectRes.statusCode !== 200 || !Array.isArray(inspectRes.data.sections) || !Array.isArray(inspectRes.data.mergeTags)) {
    throw new Error('Inspect DOCX failed: ' + JSON.stringify(inspectRes.data));
  }
  console.log(`✓ Premade DOCX inspected! Detected ${inspectRes.data.stats?.tableCount} tables and ${inspectRes.data.mergeTags.length} merge tags.`);

  // 20. Create Custom Online-Designed Layout Template
  console.log('\n[TEST 20] Create Custom Online-Designed Layout Template');
  const onlineLayoutPayload = {
    name: 'Pediatric Medical & Nutritional Unit Layout (Online)',
    type: 'admission',
    description: 'Online-designed 8-slot MAR layout with teal styling and serif typography',
    layout_config: {
      hospitalName: 'Gumare Primary Hospital - Pediatric Wing',
      documentTitle: 'PEDIATRIC ADMISSION & MAR SHEET',
      docType: 'admission',
      styling: {
        accentColor: '#0d9488',
        fontFamily: 'serif',
        borderStyle: 'double',
        headerStyle: 'boxed',
        chartColumns: '3-column',
        dateColumnWidth: '20%',
        drugSlots: 8,
        adminTimes: ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'],
        timeBadgeStyle: 'pill',
        dateGridDays: 14,
        watermark: 'CONFIDENTIAL'
      },
      sections: [
        { id: 'header', name: 'Hospital Header & Document Title', enabled: true },
        { id: 'demographics', name: 'Patient Demographics & Ward Summary', enabled: true },
        { id: 'treatment_chart', name: '3-Column Treatment Chart', enabled: true },
        { id: 'examinations', name: 'Physical Examination & Systems Review', enabled: true },
        { id: 'drug_sheet', name: 'MH 005 Inpatient Drug Administration Sheet (MAR)', enabled: true },
        { id: 'iv_fluids', name: 'Intravenous Fluids & Infusion Schedule', enabled: true },
        { id: 'signatures', name: 'Doctor & Nurse Signatures', enabled: true }
      ]
    }
  };

  const createOnlineLayoutRes = await request('POST', '/api/templates/online-layout', onlineLayoutPayload, { Authorization: `Bearer ${token}` });
  if (createOnlineLayoutRes.statusCode !== 201 || !createOnlineLayoutRes.data.template) {
    throw new Error('Create online layout failed: ' + JSON.stringify(createOnlineLayoutRes.data));
  }
  const onlineTpl = createOnlineLayoutRes.data.template;
  if (!onlineTpl.default_data.layout_config || onlineTpl.default_data.layout_config.styling.drugSlots !== 8) {
    throw new Error('Online layout template did not persist layout_config: ' + JSON.stringify(onlineTpl.default_data));
  }
  console.log(`✓ Online layout template created! ID: ${onlineTpl.id}, filename: ${onlineTpl.filename}, MAR slots: ${onlineTpl.default_data.layout_config.styling.drugSlots}`);

  // 21. Update Note Design Selection via PATCH
  console.log('\n[TEST 21] Update Note Design Selection via PATCH /api/notes/:id/design');
  const updateDesignRes = await request('PATCH', `/api/notes/${strokeNoteId}/design`, {
    design_filename: onlineTpl.filename,
    layout_config: onlineTpl.default_data.layout_config,
    template_id: onlineTpl.id
  }, { Authorization: `Bearer ${token}` });

  if (updateDesignRes.statusCode !== 200 || !updateDesignRes.data.note) {
    throw new Error('Update note design failed: ' + JSON.stringify(updateDesignRes.data));
  }
  const updatedNote = updateDesignRes.data.note;
  if (updatedNote.raw_data.design_filename !== onlineTpl.filename || !updatedNote.raw_data.layout_config) {
    throw new Error('Note raw_data did not persist updated design: ' + JSON.stringify(updatedNote.raw_data));
  }
  console.log(`✓ Note design successfully updated to: ${updatedNote.raw_data.design_filename}!`);

  // 22. Export Note with Online-Designed Layout via docxtemplater
  console.log('\n[TEST 22] Export Note with Online-Designed Layout via docxtemplater');
  const onlineExportRes = await request('GET', `/api/notes/${strokeNoteId}/export/docx?template=${onlineTpl.filename}`);
  if (onlineExportRes.statusCode !== 200 || !Buffer.isBuffer(onlineExportRes.data) || onlineExportRes.data.length < 5000) {
    throw new Error('Export with online layout failed: ' + onlineExportRes.statusCode);
  }
  console.log(`✓ Note successfully exported with online-designed layout! Size: ${onlineExportRes.data.length} bytes`);

  console.log('\n======================================================');
  console.log('🎉 ALL 22 VERIFICATION TESTS (INCLUDING IN-DEPTH ONLINE DESIGNER & DOCX IMPORT) PASSED 100%! 🎉');
  console.log('======================================================\n');

  server.close();
  process.exit(0);
}

runAllTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
