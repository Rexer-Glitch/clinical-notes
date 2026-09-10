const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'clinical_notes.db');
const rawDb = new sqlite3.Database(dbPath);

// Promise-based helper wrapper
const db = {
  raw: rawDb,
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      rawDb.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};

async function initDb() {
  await db.exec('PRAGMA foreign_keys = ON;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      hospital_name TEXT NOT NULL,
      designation TEXT DEFAULT 'Medical Officer',
      signature_title TEXT DEFAULT 'DR GUMBO',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'admission', 'referral', 'drug_sheet', 'custom'
      description TEXT,
      filename TEXT,
      schema_fields TEXT,
      default_data_json TEXT DEFAULT '{}',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      template_id INTEGER,
      type TEXT NOT NULL, -- 'admission', 'referral'
      patient_name TEXT NOT NULL,
      patient_surname TEXT NOT NULL,
      reg_no TEXT,
      age TEXT,
      gender TEXT,
      ward TEXT,
      diagnosis TEXT,
      hospital_name TEXT,
      doctor_name TEXT,
      admission_date TEXT,
      raw_data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS drug_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER UNIQUE NOT NULL,
      medications_json TEXT NOT NULL,
      stat_meds_json TEXT DEFAULT '[]',
      prn_meds_json TEXT DEFAULT '[]',
      iv_fluids_json TEXT DEFAULT '[]',
      monitoring_orders_json TEXT DEFAULT '{}',
      special_instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `);

  // Migrate columns if missing from existing database
  const templateCols = await db.all('PRAGMA table_info(templates)');
  if (!templateCols.some(c => c.name === 'default_data_json')) {
    await db.run("ALTER TABLE templates ADD COLUMN default_data_json TEXT DEFAULT '{}'");
  }

  const noteCols = await db.all('PRAGMA table_info(notes)');
  if (!noteCols.some(c => c.name === 'template_id')) {
    await db.run("ALTER TABLE notes ADD COLUMN template_id INTEGER");
  }

  // Ensure authentic hospital templates exist and are marked as default
  const existingAdmission = await db.get("SELECT id FROM templates WHERE filename = 'admission_template.docx'");
  if (!existingAdmission) {
    const legacyAdm = await db.get("SELECT id FROM templates WHERE filename = 'gph_admission_treatment_chart.docx' OR id = 1");
    if (legacyAdm) {
      await db.run(`
        UPDATE templates 
        SET filename = 'admission_template.docx',
            name = 'Official Hospital Treatment Chart',
            description = 'Official Gumare Primary Hospital Treatment Chart (3-column layout: Date, Treatment, Signature)',
            is_default = 1
        WHERE id = ?
      `, [legacyAdm.id]);
    } else {
      await db.run(`
        INSERT INTO templates (name, type, description, filename, schema_fields, is_default)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [
        'Official Hospital Treatment Chart',
        'admission',
        'Official Gumare Primary Hospital Treatment Chart (3-column layout: Date, Treatment, Signature)',
        'admission_template.docx',
        JSON.stringify(['reg_no', 'firstname', 'lastname', 'ward', 'diagnosis', 'date', 'time', 'doctor_name', 'treatment_note'])
      ]);
    }
  } else {
    await db.run("UPDATE templates SET is_default = 1, name = 'Official Hospital Treatment Chart' WHERE id = ?", [existingAdmission.id]);
  }

  const existingDrugSheet = await db.get("SELECT id FROM templates WHERE filename = 'drugsheet_template.docx'");
  if (!existingDrugSheet) {
    const legacyDs = await db.get("SELECT id FROM templates WHERE filename = 'inpatient_drug_sheet.docx' OR id = 2");
    if (legacyDs) {
      await db.run(`
        UPDATE templates 
        SET filename = 'drugsheet_template.docx',
            name = 'Official Hospital Drug Sheet (MH 005)',
            description = 'Official MH 005 Inpatient Medication Administration Record (7-time administration grid)',
            is_default = 1
        WHERE id = ?
      `, [legacyDs.id]);
    } else {
      await db.run(`
        INSERT INTO templates (name, type, description, filename, schema_fields, is_default)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [
        'Official Hospital Drug Sheet (MH 005)',
        'drug_sheet',
        'Official MH 005 Inpatient Medication Administration Record (7-time administration grid)',
        'drugsheet_template.docx',
        JSON.stringify(['firstname', 'lastname', 'ward', 'drugN1', 'drugDate1', 'drugD1', 'drugR1'])
      ]);
    }
  } else {
    await db.run("UPDATE templates SET is_default = 1, name = 'Official Hospital Drug Sheet (MH 005)' WHERE id = ?", [existingDrugSheet.id]);
  }

  // Check if we need to seed
  const userCountRow = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCountRow.count === 0) {
    console.log('Seeding initial database with demo doctor and hospital templates...');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);

    const userResult = await db.run(`
      INSERT INTO users (username, email, password_hash, doctor_name, hospital_name, designation, signature_title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'drgumbo',
      'drgumbo@gph.bw',
      passwordHash,
      'Dr. Gumbo',
      'Gumare Primary Hospital',
      'Senior Medical Officer',
      'DR GUMBO'
    ]);
    const defaultUserId = userResult.lastID;

    // Seed templates
    await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Official Hospital Treatment Chart',
      'admission',
      'Standard 3-column hospital treatment chart (Date, Treatment, Signature) with coupled inpatient drug sheet',
      'admission_template.docx',
      JSON.stringify(['reg_no', 'firstname', 'lastname', 'ward', 'diagnosis', 'date', 'time', 'doctor_name', 'treatment_note']),
      1
    ]);

    await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Official Hospital Drug Sheet (MH 005)',
      'drug_sheet',
      'Coupled inpatient medication administration record with regular, PRN, and IV fluids tracking',
      'drugsheet_template.docx',
      JSON.stringify(['firstname', 'lastname', 'ward', 'drugN1', 'drugDate1', 'drugD1', 'drugR1']),
      1
    ]);

    await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Clinical Referral & Transfer Note',
      'referral',
      'Standard inter-facility and specialist referral letter with clinical summary, vitals, and transport orders',
      'clinical_referral_note.docx',
      JSON.stringify(['referring_hospital', 'receiving_hospital', 'patient_name', 'reg_no', 'reason_for_referral', 'history', 'examination', 'investigations', 'treatment_given', 'doctor_name']),
      0
    ]);

    await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Official Hospital Referral & Report Form (REFERRAL form)',
      'referral',
      'Authentic Botswana hospital two-part referral document (Reporting Officer and Referring Officer sections)',
      'referral_and_report_form_template.docx',
      JSON.stringify(['patient_name', 'patient_surname', 'age', 'gender', 'reg_no', 'doctor_name', 'hospital_name', 'receiving_hospital', 'diagnosis', 'clinical_history', 'admission_date']),
      1
    ]);

    // Seed real example from user's photos (SHAROH MBAMBI)
    const sampleAdmissionData = {
      hospital_name: 'Gumare Primary Hospital',
      document_title: 'TREATMENT CHART',
      patient_name: 'SHAROH',
      patient_surname: 'MBAMBI',
      reg_no: 'GPH-2026-08942',
      ward: 'TB',
      diagnosis: 'Pulmonary tuberculosis',
      admission_date: '01/09/26 16:42',
      doctor_name: 'DR GUMBO',
      age: '15',
      gender: 'Female',
      rvd_status: 'RVD unknown',
      comorbidities: 'Nil known comorbidities',
      chief_complaint: 'Productive cough > 2/52 associated with night sweats, loss of appetite, palpitations, headache and painful legs.',
      history_present_illness: '10 AUG 2026 – complained of similar symptoms – done geneXpert – undetected.\nToday presented with worsening symptoms and fever.',
      today_management_gph: [
        'Initial vitals: BP 117/74mm hg, P 146bpm, T 39.7°C, SpO2 99% RA, RBS 7.5mmol/l',
        'FBC (31/08/26) – WBC 12.25, RBC 3.91, HB 9.7, PLT 390',
        'Given – IVF 1 L RL, Cefotaxime 1g IV stat',
        'GeneXpert done – very low detected, no resistance, AFB – scanty.',
        'ECG – sinus tachycardia'
      ],
      past_medical_history: 'Noted in OPD card, persistent tachycardia of range 120 – 145bpm since Aug 03.\nOther – unremarkable.',
      examination: {
        general: 'Alert, no signs of distress. JACCOLD – conjunctival pallor noted.',
        cvs: 'S1 S2 normal, no murmur, regular tachycardiac pulse.',
        respiratory: 'Clear bilaterally, no crepitations, no wheezes.',
        abdomen: 'Non distended, soft non tender.',
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
        'Medications: START ATT, Pyridoxime, Cefotaxime, Paracetamol, Ibuprofen',
        'IVF 2 L NS/RL over 24 hours',
        'Monitor vitals 4 hourly'
      ]
    };

    const sampleMedications = [
      { drug: 'START ATT', dose: '3 tabs', route: 'PO', frequency: 'OD', indication: 'Pulmonary TB', stat: false, prn: false, time_slots: ['08:00'] },
      { drug: 'Pyridoxime', dose: '25mg', route: 'PO', frequency: 'OD', indication: 'Peripheral neuropathy prophylaxis', stat: false, prn: false, time_slots: ['08:00'] },
      { drug: 'Cefotaxime', dose: '1g', route: 'IV', frequency: 'TDS', indication: 'Superimposed bacterial pneumonia', stat: false, prn: false, time_slots: ['06:00', '14:00', '22:00'] },
      { drug: 'Paracetamol', dose: '1g', route: 'PO', frequency: 'TDS', indication: 'Fever / Analgesia', stat: false, prn: true, time_slots: ['PRN'] },
      { drug: 'Ibuprofen', dose: '400mg', route: 'PO', frequency: 'TDS', indication: 'Joint pain / Analgesia', stat: false, prn: true, time_slots: ['PRN'] }
    ];

    const sampleStatMeds = [
      { drug: 'Cefotaxime', dose: '1g', route: 'IV', frequency: 'STAT', given_time: '01/09/26 15:30', signature: 'DR GUMBO' }
    ];

    const sampleIvFluids = [
      { fluid: 'Ringer Lactate (RL)', volume: '1 L', rate_hours: 'STAT over 2 hours', indication: 'Rehydration / Hemodynamic stabilization' },
      { fluid: 'Normal Saline (0.9% NS) / RL', volume: '2 L', rate_hours: 'Over 24 hours', indication: 'Maintenance' }
    ];

    const sampleMonitoring = {
      vitals_frequency: '4 hourly (BP, Pulse, Temp, SpO2, Resp)',
      strict_intake_output: true,
      isolation_precautions: 'TB Airborne Contact Isolation'
    };

    const noteResult = await db.run(`
      INSERT INTO notes (
        user_id, type, patient_name, patient_surname, reg_no, age, gender, ward, diagnosis, hospital_name, doctor_name, admission_date, raw_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      defaultUserId,
      'admission',
      sampleAdmissionData.patient_name,
      sampleAdmissionData.patient_surname,
      sampleAdmissionData.reg_no,
      sampleAdmissionData.age,
      sampleAdmissionData.gender,
      sampleAdmissionData.ward,
      sampleAdmissionData.diagnosis,
      sampleAdmissionData.hospital_name,
      sampleAdmissionData.doctor_name,
      sampleAdmissionData.admission_date,
      JSON.stringify(sampleAdmissionData)
    ]);

    await db.run(`
      INSERT INTO drug_sheets (note_id, medications_json, stat_meds_json, prn_meds_json, iv_fluids_json, monitoring_orders_json, special_instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      noteResult.lastID,
      JSON.stringify(sampleMedications),
      JSON.stringify(sampleStatMeds),
      JSON.stringify([
        { drug: 'Paracetamol', dose: '1g', route: 'PO', frequency: 'TDS PRN', max_dose: '4g/24h' },
        { drug: 'Ibuprofen', dose: '400mg', route: 'PO', frequency: 'TDS PRN', max_dose: '1200mg/24h' }
      ]),
      JSON.stringify(sampleIvFluids),
      JSON.stringify(sampleMonitoring),
      'Monitor closely for TB medication adverse effects. Check LFT, RFT baseline. TB ward isolation.'
    ]);

    // Also seed a Referral note example
    const sampleReferralData = {
      hospital_name: 'Gumare Primary Hospital',
      referring_unit: 'Female Medical / TB Ward',
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
      admission_date: '03/09/26',
      doctor_name: 'Dr. Gumbo',
      reason_for_referral: 'Diagnostic pleural tap and ultrasound assessment not available at primary hospital level; persistent high grade fevers despite 48h Ceftriaxone.',
      clinical_history: '42 year old male presented with 5-day history of right-sided pleuritic chest pain, productive cough with rust-colored sputum, and rigors. Non-smoker. HIV negative.',
      vital_signs: 'BP 108/68 mmHg, HR 118 bpm, RR 28/min, SpO2 91% on room air (96% on 3L O2 via nasal prongs), Temp 39.1°C',
      examination: 'Decreased chest expansion on right base, stony dull percussion note right lower zone, bronchial breathing right mid-zone, absent breath sounds right base.',
      investigations: 'CXR: dense right lower zone opacity with blunting of costophrenic angle and meniscus sign. WBC 18.4, CRP 142, Creatinine 88.',
      treatment_given: 'IV Ceftriaxone 2g OD (day 2), IV Metronidazole 500mg TDS, IVF Ringers Lactate 1000ml, Paracetamol 1g PO stat.',
      transport_needs: 'Ambulance transfer with continuous supplemental Oxygen (3L/min nasal prongs) and nurse escort.'
    };

    await db.run(`
      INSERT INTO notes (
        user_id, type, patient_name, patient_surname, reg_no, age, gender, ward, diagnosis, hospital_name, doctor_name, admission_date, raw_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      defaultUserId,
      'referral',
      sampleReferralData.patient_name,
      sampleReferralData.patient_surname,
      sampleReferralData.reg_no,
      sampleReferralData.age,
      sampleReferralData.gender,
      sampleReferralData.ward,
      sampleReferralData.diagnosis,
      sampleReferralData.hospital_name,
      sampleReferralData.doctor_name,
      sampleReferralData.admission_date,
      JSON.stringify(sampleReferralData)
    ]);
    console.log('✓ Seeding complete!');
  }
}

// Export db with auto-init promise
const ready = initDb();

module.exports = {
  db,
  ready
};
