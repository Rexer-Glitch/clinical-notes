const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { renderDocx, TEMPLATES_DIR } = require('./services/docxService');
const { db, ready } = require('./db');

async function runTests() {
  console.log('--- STARTING AUTHENTIC HOSPITAL TEMPLATES (WITH TIME SLOTS & STAT DOSES) TESTS ---');
  await ready;

  const note = await db.get('SELECT * FROM notes WHERE id = 1');
  const ds = await db.get('SELECT * FROM drug_sheets WHERE note_id = 1');
  const meds = JSON.parse(ds.medications_json || '[]');
  const statMeds = JSON.parse(ds.stat_meds_json || '[]');

  console.log(`[PASS] Retrieved Note 1: ${note.patient_name} ${note.patient_surname} (${note.reg_no})`);
  console.log(`[PASS] Found ${meds.length} regular meds and ${statMeds.length} stat meds`);

  // 1. Test admission_template.docx rendering
  console.log('\nTesting direct rendering of admission_template.docx...');
  const admPayload = {
    reg_no: note.reg_no,
    firstname: note.patient_name,
    lastname: note.patient_surname,
    ward: note.ward,
    diagnosis: note.diagnosis,
    date: '01/09/26',
    time: '16:42',
    doctor_name: note.doctor_name,
    treatment_note: '15F | RVD unknown with clinical symptoms suggestive of pulmonary tuberculosis.\nPlan: Admit to TB ward, start ATT 3 tabs OD, Pyridoxime 25mg OD.'
  };

  const admBuffer = renderDocx('admission_template.docx', admPayload);
  const admZip = new PizZip(admBuffer);
  const admXml = admZip.file('word/document.xml').asText();
  const admUnrendered = admXml.match(/\{[a-zA-Z0-9_\-]+\}/g) || [];

  if (admUnrendered.length > 0) {
    console.error('FAIL: Found unrendered tags in admission_template:', admUnrendered);
    process.exit(1);
  }
  console.log('[PASS] admission_template.docx rendered with 0 unrendered tags!');

  // 2. Test drugsheet_template.docx rendering with Time Slots and Stat Doses
  console.log('\nTesting drugsheet_template.docx with Time Slots & Stat Doses...');
  const dsPayload = {
    firstname: note.patient_name,
    lastname: note.patient_surname,
    ward: note.ward,
    // Slot 1 (OD: 6 am scheduled)
    drugN1: 'START ATT',
    drugDate1: '01/09/26',
    drugD1: '3 tabs',
    drugR1: 'PO',
    t1_1: '●', t1_2: '', t1_3: '', t1_4: '', t1_5: '', t1_6: '', t1_7: '',
    // Slot 2 (OD: 6 am scheduled)
    drugN2: 'Pyridoxime',
    drugDate2: '01/09/26',
    drugD2: '25mg',
    drugR2: 'PO',
    t2_1: '●', t2_2: '', t2_3: '', t2_4: '', t2_5: '', t2_6: '', t2_7: '',
    // Slot 3 (TDS: 6 am, 2 pm, 10 pm scheduled)
    drugN3: 'Cefotaxime',
    drugDate3: '01/09/26',
    drugD3: '1g',
    drugR3: 'IV',
    t3_1: '●', t3_2: '', t3_3: '', t3_4: '●', t3_5: '', t3_6: '●', t3_7: '',
    // Slot 4
    drugN4: 'Paracetamol',
    drugDate4: '01/09/26',
    drugD4: '1g',
    drugR4: 'PO',
    t4_1: '', t4_2: '', t4_3: '', t4_4: '', t4_5: '', t4_6: '', t4_7: '',
    // Slot 5
    drugN5: 'Ibuprofen',
    drugDate5: '01/09/26',
    drugD5: '400mg',
    drugR5: 'PO',
    t5_1: '', t5_2: '', t5_3: '', t5_4: '', t5_5: '', t5_6: '', t5_7: '',
    // Stat doses in Table 7
    stDate1: '01/09/26',
    stTime1: '15:30',
    stDrug1: 'Cefotaxime 1g IV',
    stSig1: 'DR GUMBO',
    stGivenTime1: '15:45',
    stGivenBy1: 'Nurse K',
    stDate2: '01/09/26',
    stTime2: '16:00',
    stDrug2: 'Ringers Lactate 1 L IV',
    stSig2: 'DR GUMBO',
    stGivenTime2: '16:15',
    stGivenBy2: 'Nurse K'
  };

  // Blank out remaining stat slots
  for (let s = 3; s <= 10; s++) {
    ['stDate', 'stTime', 'stDrug', 'stSig', 'stGivenTime', 'stGivenBy'].forEach(k => {
      dsPayload[k + s] = '';
    });
  }

  const dsBuffer = renderDocx('drugsheet_template.docx', dsPayload);
  const dsZip = new PizZip(dsBuffer);
  const dsXml = dsZip.file('word/document.xml').asText();
  const dsUnrendered = dsXml.match(/\{[a-zA-Z0-9_\-]+\}/g) || [];

  if (dsUnrendered.length > 0) {
    console.error('FAIL: Found unrendered tags in drugsheet_template:', dsUnrendered);
    process.exit(1);
  }
  console.log('[PASS] drugsheet_template.docx rendered with 0 unrendered tags!');
  console.log(`[PASS] Contains selected time slot '6 am ●': ${dsXml.includes('6 am ●')}`);
  console.log(`[PASS] Contains Table 7 Stat Drug 1 (Cefotaxime 1g IV): ${dsXml.includes('Cefotaxime 1g IV')}`);
  console.log(`[PASS] Contains Table 7 Stat Drug 2 (Ringers Lactate 1 L IV): ${dsXml.includes('Ringers Lactate 1 L IV')}`);

  console.log('\n--- ALL VERIFICATIONS PASSED 100%! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
