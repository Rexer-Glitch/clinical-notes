const { ensureDefaultTemplates, renderDocx } = require('./services/docxService');
const { db, ready } = require('./db');

async function runTest() {
  await ready;
  console.log('1. Ensuring default templates exist...');
  await ensureDefaultTemplates();
  console.log('✓ Default templates created successfully');

  console.log('2. Fetching seeded admission note...');
  const note = await db.get('SELECT * FROM notes WHERE id = 1');
  const drugSheet = await db.get('SELECT * FROM drug_sheets WHERE note_id = ?', [note.id]);
  const rawData = JSON.parse(note.raw_data_json);
  const medications = JSON.parse(drugSheet.medications_json);
  const ivFluids = JSON.parse(drugSheet.iv_fluids_json);
  const monitoring = JSON.parse(drugSheet.monitoring_orders_json);

  console.log('3. Preparing docxtemplater payload...');
  const treatmentLines = [
    `${rawData.age} year old ${rawData.gender.toLowerCase()}, ${rawData.rvd_status}`,
    `${rawData.comorbidities}`,
    `CO: ${rawData.chief_complaint}`,
    `${rawData.history_present_illness}`,
    `\nToday management in GPH:`,
    ...rawData.today_management_gph.map((item, idx) => `  ${idx + 1}. ${item}`),
    `\nPast medical history - ${rawData.past_medical_history}`,
    `\nE- ${rawData.examination.general}`,
    `CVS: ${rawData.examination.cvs}`,
    `Resp: ${rawData.examination.respiratory}`,
    `Abdo: ${rawData.examination.abdomen}`,
    `Msk: ${rawData.examination.msk}`,
    `Other systems: ${rawData.examination.other_systems}`,
    `\nAssessment: ${rawData.assessment}`,
    `\nDDX:`,
    ...rawData.ddx.map((item, idx) => `  ${idx + 1}. ${item}`),
    `\nPlan:`,
    ...rawData.plan.map((item, idx) => `  ${idx + 1}. ${item}`)
  ].join('\n');

  const payload = {
    hospital_name: rawData.hospital_name,
    document_title: rawData.document_title || 'TREATMENT CHART',
    reg_no: rawData.reg_no,
    patient_name: rawData.patient_name,
    patient_surname: rawData.patient_surname,
    ward: rawData.ward,
    diagnosis: rawData.diagnosis,
    admission_date: rawData.admission_date,
    doctor_name: rawData.doctor_name,
    signature: rawData.doctor_name,
    bed_no: 'TB-04',
    treatment_text: treatmentLines,
    medications: medications.map(m => ({
      drug: m.drug,
      dose: m.dose,
      route: m.route,
      frequency: m.frequency,
      indication: m.indication || '-',
      signature: rawData.doctor_name
    })),
    iv_fluids: ivFluids.map(f => ({
      fluid: f.fluid,
      volume: f.volume,
      rate_hours: f.rate_hours,
      indication: f.indication || '-'
    })),
    vitals_orders: monitoring.vitals_frequency || '4 hourly',
    special_instructions: drugSheet.special_instructions || 'None'
  };

  console.log('4. Rendering DOCX via docxtemplater...');
  const buffer = renderDocx('gph_admission_treatment_chart.docx', payload);
  console.log(`✓ DOCX rendered successfully! Buffer size: ${buffer.length} bytes`);

  console.log('5. Rendering Referral Note via docxtemplater...');
  const refNote = await db.get('SELECT * FROM notes WHERE type = "referral"');
  const refData = JSON.parse(refNote.raw_data_json);
  const refBuffer = renderDocx('clinical_referral_note.docx', refData);
  console.log(`✓ Referral DOCX rendered successfully! Buffer size: ${refBuffer.length} bytes`);
  console.log('ALL DOCX TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
