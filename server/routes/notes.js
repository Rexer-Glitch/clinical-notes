const express = require('express');
const { db, ready } = require('../db');
const { renderDocx } = require('../services/docxService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Format structured note data into readable clinical text matching Gumare Primary Hospital chart layout
 */
function formatTreatmentNoteText(data) {
  const parts = [];

  // Demographics line
  const demo = [];
  if (data.age) demo.push(`${data.age} year old ${data.gender ? data.gender.toLowerCase() : 'patient'}`);
  if (data.rvd_status) demo.push(data.rvd_status);
  if (demo.length > 0) parts.push(demo.join(', '));

  if (data.comorbidities) parts.push(data.comorbidities);

  // Chief Complaint
  if (data.chief_complaint) parts.push(`CO: ${data.chief_complaint}`);

  // History
  if (data.history_present_illness) parts.push(data.history_present_illness);

  // Extract and format Vital Signs
  const vitalsObj = data.vitals_recorded || data.vitals || {};
  const vParts = [];
  if (vitalsObj && typeof vitalsObj === 'object') {
    if (vitalsObj.bp && String(vitalsObj.bp).trim()) vParts.push(`BP ${String(vitalsObj.bp).trim()}${/mm\s*hg/i.test(vitalsObj.bp) ? '' : ' mmHg'}`);
    if (vitalsObj.hr && String(vitalsObj.hr).trim()) vParts.push(`HR ${String(vitalsObj.hr).trim()}${/bpm/i.test(vitalsObj.hr) ? '' : ' bpm'}`);
    if (vitalsObj.temp && String(vitalsObj.temp).trim()) vParts.push(`Temp ${String(vitalsObj.temp).trim()}${/°|c/i.test(vitalsObj.temp) ? '' : '°C'}`);
    if (vitalsObj.spo2 && String(vitalsObj.spo2).trim()) vParts.push(`SpO2 ${String(vitalsObj.spo2).trim()}${/%/.test(vitalsObj.spo2) ? '' : '%'}`);
    if (vitalsObj.rr && String(vitalsObj.rr).trim()) vParts.push(`RR ${String(vitalsObj.rr).trim()}${/\/min|bpm/i.test(vitalsObj.rr) ? '' : '/min'}`);
    if (vitalsObj.rbs && String(vitalsObj.rbs).trim()) vParts.push(`RBS ${String(vitalsObj.rbs).trim()}${/mmol/i.test(vitalsObj.rbs) ? '' : ' mmol/L'}`);
  }
  const formattedVitals = vParts.join(', ') || data.vitals_summary || data.vital_signs || '';

  // Today management in GPH
  const hasTodayMgmt = data.today_management_gph && Array.isArray(data.today_management_gph) && data.today_management_gph.length > 0;
  const vitalsInMgmt = hasTodayMgmt && data.today_management_gph.some(item => /vitals|bp\s*\d|p\d+bpm/i.test(item));

  if (hasTodayMgmt) {
    parts.push('\nToday management in GPH:');
    data.today_management_gph.forEach((item, idx) => {
      parts.push(`  ${idx + 1}. ${item}`);
    });
  }

  // Past medical history
  if (data.past_medical_history) {
    parts.push(`\nPast medical history – ${data.past_medical_history}`);
  }

  // Examination (Physical Exam & Organ Systems) - Initial vitals immediately after general exam
  if (data.examination || (formattedVitals && !vitalsInMgmt)) {
    const exam = data.examination;
    if (typeof exam === 'string' && exam.trim()) {
      const cleanExam = exam.trim().replace(/^E-?\s*/i, '');
      const examLines = [`E- ${cleanExam}`];
      if (formattedVitals && !vitalsInMgmt) {
        examLines.push(`Initial vitals: ${formattedVitals}`);
      }
      parts.push('\n' + examLines.join('\n'));
    } else if (typeof exam === 'object' && exam !== null) {
      const examLines = [];
      const customDefs = Array.isArray(data.custom_exam_systems) ? data.custom_exam_systems : [];
      const standardExamKeys = ['general', 'cvs', 'respiratory', 'resp', 'abdomen', 'abdo', 'cns', 'neuro', 'msk', 'ent', 'eye', 'skin', 'gu', 'other_systems'];
      const hasSystems = standardExamKeys.slice(1).some(k => exam[k] && String(exam[k]).trim()) ||
        Object.keys(exam).some(k => !standardExamKeys.includes(k) && exam[k] && String(exam[k]).trim());
      const hasVitals = formattedVitals && !vitalsInMgmt;
      const hasGeneral = exam.general && String(exam.general).trim();

      if (hasGeneral || hasSystems || hasVitals) {
        // General examination / JACCOLD
        if (hasGeneral) {
          examLines.push(`E- ${String(exam.general).trim().replace(/^E-?\s*/i, '')}`);
        } else {
          examLines.push(`E-`);
        }

        // Initial Vitals: IMMEDIATELY after General Exam (indented under E-)
        if (hasVitals) {
          examLines.push(`  Initial vitals: ${formattedVitals}`);
        }

        // Organ Systems (indented under E-)
        if (exam.cvs && String(exam.cvs).trim()) examLines.push(`  CVS: ${String(exam.cvs).trim()}`);
        if ((exam.respiratory || exam.resp) && String(exam.respiratory || exam.resp).trim()) {
          examLines.push(`  Resp: ${String(exam.respiratory || exam.resp).trim()}`);
        }
        if ((exam.abdomen || exam.abdo) && String(exam.abdomen || exam.abdo).trim()) {
          examLines.push(`  Abdo: ${String(exam.abdomen || exam.abdo).trim()}`);
        }
        if ((exam.cns || exam.neuro) && String(exam.cns || exam.neuro).trim()) {
          examLines.push(`  CNS / Neuro: ${String(exam.cns || exam.neuro).trim()}`);
        }
        if (exam.msk && String(exam.msk).trim()) examLines.push(`  Msk: ${String(exam.msk).trim()}`);
        if (exam.ent && String(exam.ent).trim()) examLines.push(`  ENT: ${String(exam.ent).trim()}`);
        if (exam.eye && String(exam.eye).trim()) examLines.push(`  Eye: ${String(exam.eye).trim()}`);
        if (exam.skin && String(exam.skin).trim()) examLines.push(`  Skin: ${String(exam.skin).trim()}`);
        if (exam.gu && String(exam.gu).trim()) examLines.push(`  GU / Pelvic: ${String(exam.gu).trim()}`);

        // Dynamic custom examination systems
        Object.keys(exam).forEach(k => {
          if (!standardExamKeys.includes(k) && exam[k] && String(exam[k]).trim()) {
            const customDef = customDefs.find(c => c.id === k);
            const label = customDef && customDef.label ? customDef.label : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            examLines.push(`  ${label}: ${String(exam[k]).trim()}`);
          }
        });

        if (exam.other_systems && String(exam.other_systems).trim()) {
          examLines.push(`  Other systems: ${String(exam.other_systems).trim()}`);
        }

        if (examLines.length > 0) {
          parts.push('\n' + examLines.join('\n'));
        }
      }
    } else if (formattedVitals && !vitalsInMgmt) {
      parts.push(`\nE-\n  Initial vitals: ${formattedVitals}`);
    }
  }

  // Extract or normalize Assessment and Plan
  let assessmentText = data.assessment || '';
  let extractedPlan = [];

  // Check if Plan is embedded in assessment text (e.g. "A - ... \n\nPlan\n 1. ...")
  if (typeof assessmentText === 'string' && /(\n|^)\s*plan\s*[:\n]/i.test(assessmentText) && (!data.plan || (Array.isArray(data.plan) && data.plan.length === 0))) {
    const planMatch = assessmentText.split(/(\n|^)\s*plan\s*[:\n]/i);
    assessmentText = (planMatch[0] || '').trim();
    if (planMatch.length >= 3) {
      extractedPlan = planMatch.slice(2).join('').split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  // Assessment (numbered list if multiple lines/items)
  let assessmentList = [];
  if (Array.isArray(assessmentText)) {
    assessmentList = assessmentText.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof assessmentText === 'string' && assessmentText.trim()) {
    assessmentList = assessmentText.split('\n').map(s => s.trim()).filter(Boolean);
  }

  if (assessmentList.length > 1) {
    parts.push('\nAssessment:');
    let aNum = 1;
    assessmentList.forEach((item) => {
      if (/^([a-z]\)|\*|-|•)\s*/i.test(item) || /^\s{2,}/.test(item)) {
        parts.push(`     ${item}`);
      } else {
        const clean = item.replace(/^[\d+.-]+\s*/, '');
        parts.push(`  ${aNum}. ${clean}`);
        aNum++;
      }
    });
  } else if (assessmentList.length === 1) {
    const single = assessmentList[0];
    if (/^\d+[\.\)]\s*/.test(single)) {
      parts.push(`\nAssessment:\n  ${single}`);
    } else {
      parts.push(`\nAssessment: ${single}`);
    }
  }

  // DDX
  let ddxList = [];
  if (Array.isArray(data.ddx)) {
    ddxList = data.ddx.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof data.ddx === 'string' && data.ddx.trim()) {
    ddxList = data.ddx.split('\n').map(s => s.trim()).filter(Boolean);
  }
  if (ddxList.length > 0) {
    parts.push('\nDDX');
    let dNum = 1;
    ddxList.forEach((item) => {
      const clean = item.replace(/^[\d+.-]+\s*/, '');
      parts.push(`  ${dNum}. ${clean}`);
      dNum++;
    });
  }

  // Plan (numbered list)
  let planSource = (data.plan && (Array.isArray(data.plan) ? data.plan.length > 0 : String(data.plan).trim())) ? data.plan : extractedPlan;
  let planList = [];
  if (Array.isArray(planSource)) {
    planList = planSource.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof planSource === 'string' && planSource.trim()) {
    planList = planSource.split('\n').map(s => s.trim()).filter(Boolean);
  }

  if (planList.length > 0) {
    parts.push('\nPlan');
    let pNum = 1;
    planList.forEach((item) => {
      // Sub-bullet check (e.g. a), b), -, •)
      if (/^([a-z]\)|\*|-|•)\s*/i.test(item) || /^\s{2,}/.test(item)) {
        parts.push(`     ${item}`);
      } else {
        const clean = item.replace(/^[\d+.-]+\s*/, '');
        parts.push(`  ${pNum}. ${clean}`);
        pNum++;
      }
    });
  }

  return parts.join('\n');
}

/**
 * Format Treatment Note as OpenXML Word paragraphs with bold subheadings and spaced layout
 */
function formatTreatmentNoteXml(data) {
  const pList = [];

  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function makeP(runs, spacingBefore = 0, spacingAfter = 40, indentLeft = 0, szVal = 22) {
    const indXml = indentLeft > 0 ? `<w:ind w:left="${indentLeft}"/>` : '';
    let xml = `<w:p><w:pPr>${indXml}<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${szVal}"/><w:szCs w:val="${szVal}"/></w:rPr></w:pPr>`;
    for (const r of runs) {
      if (!r || r.text === undefined || r.text === null) continue;
      const isBold = r.bold ? '<w:b/><w:bCs/>' : '';
      const isItalic = r.italic ? '<w:i/><w:iCs/>' : '';
      const runSzVal = r.szVal || szVal;
      const safe = escapeXml(r.text);
      xml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${isBold}${isItalic}<w:sz w:val="${runSzVal}"/><w:szCs w:val="${runSzVal}"/></w:rPr><w:t xml:space="preserve">${safe}</w:t></w:r>`;
    }
    xml += '</w:p>';
    return xml;
  }

  // 1. Demographics
  const demo = [];
  if (data.age) demo.push(`${data.age} year old ${data.gender ? data.gender.toLowerCase() : 'patient'}`);
  if (data.rvd_status) demo.push(data.rvd_status);
  if (demo.length > 0) {
    pList.push(makeP([{ text: demo.join(', ') }], 0, 30));
  }

  if (data.comorbidities) {
    pList.push(makeP([{ text: data.comorbidities }], 0, 80));
  }

  // 2. Chief Complaint (bold "CO:")
  if (data.chief_complaint) {
    pList.push(makeP([
      { text: 'CO: ', bold: true },
      { text: data.chief_complaint }
    ], 0, 80));
  }

  // 3. History of present illness
  if (data.history_present_illness) {
    const hpiLines = String(data.history_present_illness).split('\n').filter(Boolean);
    hpiLines.forEach((line, idx) => {
      pList.push(makeP([
        { text: line }
      ], 0, idx === hpiLines.length - 1 ? 80 : 30));
    });
  }

  // 4. Extract and format Vital Signs
  const vitalsObj = data.vitals_recorded || data.vitals || {};
  const vParts = [];
  if (vitalsObj && typeof vitalsObj === 'object') {
    if (vitalsObj.bp && String(vitalsObj.bp).trim()) vParts.push(`BP ${String(vitalsObj.bp).trim()}${/mm\s*hg/i.test(vitalsObj.bp) ? '' : ' mmHg'}`);
    if (vitalsObj.hr && String(vitalsObj.hr).trim()) vParts.push(`HR ${String(vitalsObj.hr).trim()}${/bpm/i.test(vitalsObj.hr) ? '' : ' bpm'}`);
    if (vitalsObj.temp && String(vitalsObj.temp).trim()) vParts.push(`Temp ${String(vitalsObj.temp).trim()}${/°|c/i.test(vitalsObj.temp) ? '' : '°C'}`);
    if (vitalsObj.spo2 && String(vitalsObj.spo2).trim()) vParts.push(`SpO2 ${String(vitalsObj.spo2).trim()}${/%/.test(vitalsObj.spo2) ? '' : '%'}`);
    if (vitalsObj.rr && String(vitalsObj.rr).trim()) vParts.push(`RR ${String(vitalsObj.rr).trim()}${/\/min|bpm/i.test(vitalsObj.rr) ? '' : '/min'}`);
    if (vitalsObj.rbs && String(vitalsObj.rbs).trim()) vParts.push(`RBS ${String(vitalsObj.rbs).trim()}${/mmol/i.test(vitalsObj.rbs) ? '' : ' mmol/L'}`);
  }
  const formattedVitals = vParts.join(', ') || data.vitals_summary || data.vital_signs || '';

  // 5. Today management in GPH
  const hasTodayMgmt = data.today_management_gph && Array.isArray(data.today_management_gph) && data.today_management_gph.length > 0;
  const vitalsInMgmt = hasTodayMgmt && data.today_management_gph.some(item => /vitals|bp\s*\d|p\d+bpm/i.test(item));

  if (hasTodayMgmt) {
    pList.push(makeP([
      { text: 'Today management in GPH:', bold: true }
    ], 40, 30));
    data.today_management_gph.forEach((item, idx) => {
      pList.push(makeP([
        { text: `  ${idx + 1}. ${item}` }
      ], 0, idx === data.today_management_gph.length - 1 ? 80 : 20));
    });
  }

  // 6. Past medical history
  if (data.past_medical_history) {
    pList.push(makeP([
      { text: 'Past medical history – ', bold: true },
      { text: data.past_medical_history }
    ], 0, 80));
  }

  // 7. Examination: General Exam, then Initial Vitals IMMEDIATELY after, then Organ Systems
  const exam = data.examination;
  if (exam || (formattedVitals && !vitalsInMgmt)) {
    if (typeof exam === 'string' && exam.trim()) {
      const cleanExam = exam.trim().replace(/^E-?\s*/i, '');
      pList.push(makeP([
        { text: 'E- ', bold: true },
        { text: cleanExam }
      ], 0, 30));

      // Initial vitals immediately after General Exam (indented & smaller font)
      if (formattedVitals && !vitalsInMgmt) {
        pList.push(makeP([
          { text: 'Initial vitals: ', bold: true },
          { text: formattedVitals }
        ], 0, 40, 360, 20));
      }
    } else if (typeof exam === 'object' && exam !== null) {
      const customDefs = Array.isArray(data.custom_exam_systems) ? data.custom_exam_systems : [];
      const standardExamKeys = ['general', 'cvs', 'respiratory', 'resp', 'abdomen', 'abdo', 'cns', 'neuro', 'msk', 'ent', 'eye', 'skin', 'gu', 'other_systems'];
      const hasSystems = standardExamKeys.slice(1).some(k => exam[k] && String(exam[k]).trim()) ||
        Object.keys(exam).some(k => !standardExamKeys.includes(k) && exam[k] && String(exam[k]).trim());
      const hasVitals = formattedVitals && !vitalsInMgmt;
      const hasGeneral = exam.general && String(exam.general).trim();

      if (hasGeneral || hasSystems || hasVitals) {
        // General examination / JACCOLD
        if (hasGeneral) {
          pList.push(makeP([
            { text: 'E- ', bold: true },
            { text: String(exam.general).trim().replace(/^E-?\s*/i, '') }
          ], 0, 30));
        } else {
          pList.push(makeP([
            { text: 'E-', bold: true }
          ], 0, 20));
        }

        // Initial Vitals: IMMEDIATELY after general exam area! (indented & smaller font)
        if (hasVitals) {
          pList.push(makeP([
            { text: 'Initial vitals: ', bold: true },
            { text: formattedVitals }
          ], 0, 20, 360, 20));
        }

        // Organ Systems (indented & smaller font)
        if (exam.cvs && String(exam.cvs).trim()) {
          pList.push(makeP([
            { text: 'CVS: ', bold: true },
            { text: String(exam.cvs).trim() }
          ], 0, 20, 360, 20));
        }
        if ((exam.respiratory || exam.resp) && String(exam.respiratory || exam.resp).trim()) {
          pList.push(makeP([
            { text: 'Resp: ', bold: true },
            { text: String(exam.respiratory || exam.resp).trim() }
          ], 0, 20, 360, 20));
        }
        if ((exam.abdomen || exam.abdo) && String(exam.abdomen || exam.abdo).trim()) {
          pList.push(makeP([
            { text: 'Abdo: ', bold: true },
            { text: String(exam.abdomen || exam.abdo).trim() }
          ], 0, 20, 360, 20));
        }
        if ((exam.cns || exam.neuro) && String(exam.cns || exam.neuro).trim()) {
          pList.push(makeP([
            { text: 'CNS / Neuro: ', bold: true },
            { text: String(exam.cns || exam.neuro).trim() }
          ], 0, 20, 360, 20));
        }
        if (exam.msk && String(exam.msk).trim()) {
          pList.push(makeP([
            { text: 'Msk: ', bold: true },
            { text: String(exam.msk).trim() }
          ], 0, 20, 360, 20));
        }
        if (exam.ent && String(exam.ent).trim()) {
          pList.push(makeP([
            { text: 'ENT: ', bold: true },
            { text: String(exam.ent).trim() }
          ], 0, 20, 360, 20));
        }
        if (exam.eye && String(exam.eye).trim()) {
          pList.push(makeP([
            { text: 'Eye: ', bold: true },
            { text: String(exam.eye).trim() }
          ], 0, 20, 360, 20));
        }
        if (exam.skin && String(exam.skin).trim()) {
          pList.push(makeP([
            { text: 'Skin: ', bold: true },
            { text: String(exam.skin).trim() }
          ], 0, 20, 360, 20));
        }
        if (exam.gu && String(exam.gu).trim()) {
          pList.push(makeP([
            { text: 'GU / Pelvic: ', bold: true },
            { text: String(exam.gu).trim() }
          ], 0, 20, 360, 20));
        }

        // Dynamic custom examination systems (indented & smaller font)
        Object.keys(exam).forEach(k => {
          if (!standardExamKeys.includes(k) && exam[k] && String(exam[k]).trim()) {
            const customDef = customDefs.find(c => c.id === k);
            const label = customDef && customDef.label ? customDef.label : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            pList.push(makeP([
              { text: `${label}: `, bold: true },
              { text: String(exam[k]).trim() }
            ], 0, 20, 360, 20));
          }
        });

        if (exam.other_systems && String(exam.other_systems).trim()) {
          pList.push(makeP([
            { text: 'Other systems: ', bold: true },
            { text: String(exam.other_systems).trim() }
          ], 0, 60, 360, 20));
        }
      }
    } else if (formattedVitals && !vitalsInMgmt) {
      pList.push(makeP([
        { text: 'E-', bold: true }
      ], 0, 20));
      pList.push(makeP([
        { text: 'Initial vitals: ', bold: true },
        { text: formattedVitals }
      ], 0, 60, 360, 20));
    }
  }

  // 8. Assessment & Plan
  let assessmentText = data.assessment || '';
  let extractedPlan = [];

  if (typeof assessmentText === 'string' && /(\n|^)\s*plan\s*[:\n]/i.test(assessmentText) && (!data.plan || (Array.isArray(data.plan) && data.plan.length === 0))) {
    const planMatch = assessmentText.split(/(\n|^)\s*plan\s*[:\n]/i);
    assessmentText = (planMatch[0] || '').trim();
    if (planMatch.length >= 3) {
      extractedPlan = planMatch.slice(2).join('').split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  let assessmentList = [];
  if (Array.isArray(assessmentText)) {
    assessmentList = assessmentText.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof assessmentText === 'string' && assessmentText.trim()) {
    assessmentList = assessmentText.split('\n').map(s => s.trim()).filter(Boolean);
  }

  if (assessmentList.length > 1) {
    pList.push(makeP([
      { text: 'Assessment:', bold: true }
    ], 40, 20));
    let aNum = 1;
    assessmentList.forEach((item, idx) => {
      if (/^([a-z]\)|\*|-|•)\s*/i.test(item) || /^\s{2,}/.test(item)) {
        pList.push(makeP([
          { text: `     ${item}` }
        ], 0, idx === assessmentList.length - 1 ? 80 : 20));
      } else {
        const clean = item.replace(/^[\d+.-]+\s*/, '');
        pList.push(makeP([
          { text: `  ${aNum}. ${clean}` }
        ], 0, idx === assessmentList.length - 1 ? 80 : 20));
        aNum++;
      }
    });
  } else if (assessmentList.length === 1) {
    const single = assessmentList[0];
    if (/^\d+[\.\)]\s*/.test(single)) {
      pList.push(makeP([
        { text: 'Assessment:', bold: true }
      ], 40, 20));
      pList.push(makeP([
        { text: `  ${single}` }
      ], 0, 80));
    } else {
      pList.push(makeP([
        { text: 'Assessment: ', bold: true },
        { text: single }
      ], 40, 80));
    }
  }

  // DDx
  if (data.ddx && Array.isArray(data.ddx) && data.ddx.length > 0) {
    pList.push(makeP([
      { text: 'DDx:', bold: true }
    ], 30, 20));
    data.ddx.forEach((item, idx) => {
      pList.push(makeP([
        { text: `  ${idx + 1}. ${item}` }
      ], 0, idx === data.ddx.length - 1 ? 80 : 20));
    });
  }

  // Plan
  let planSource = (data.plan && (Array.isArray(data.plan) ? data.plan.length > 0 : String(data.plan).trim())) ? data.plan : extractedPlan;
  let planList = [];
  if (Array.isArray(planSource)) {
    planList = planSource.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof planSource === 'string' && planSource.trim()) {
    planList = planSource.split('\n').map(s => s.trim()).filter(Boolean);
  }

  if (planList.length > 0) {
    pList.push(makeP([
      { text: 'Plan', bold: true }
    ], 40, 20));
    let pNum = 1;
    planList.forEach((item, idx) => {
      if (/^([a-z]\)|\*|-|•)\s*/i.test(item) || /^\s{2,}/.test(item)) {
        pList.push(makeP([
          { text: `     ${item}` }
        ], 0, idx === planList.length - 1 ? 40 : 20));
      } else {
        const clean = item.replace(/^[\d+.-]+\s*/, '');
        pList.push(makeP([
          { text: `  ${pNum}. ${clean}` }
        ], 0, idx === planList.length - 1 ? 40 : 20));
        pNum++;
      }
    });
  }

  return pList.join('');
}

/**
 * Map up to 6 medication items into standard MH 005 drug sheet slots
 */
function mapMedicationsToMH005Slots(medications, admissionDate, doctorName) {
  const timeLabels = ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'];
  const slotData = {};

  for (let slot = 1; slot <= 6; slot++) {
    const med = medications[slot - 1];
    if (med) {
      const drugDate = med.start_date || (admissionDate ? admissionDate.split(/\s+/)[0] : '') || '';
      const drugName = med.drug || '';
      const drugDose = med.dose || '';
      const drugRoute = med.route || '';
      const drugSig = med.signature || doctorName || 'DR';

      // Standard / legacy tags
      slotData[`d${slot}_name`] = drugName;
      slotData[`d${slot}_date`] = drugDate;
      slotData[`d${slot}_dose`] = drugDose;
      slotData[`d${slot}_route`] = drugRoute;
      slotData[`d${slot}_signature`] = drugSig;

      // Authentic hospital drugsheet_template.docx tags
      slotData[`drugN${slot}`] = drugName;
      slotData[`drugDate${slot}`] = drugDate;
      slotData[`drugD${slot}`] = drugDose;
      slotData[`drugR${slot}`] = drugRoute;
      slotData[`drugSig${slot}`] = drugSig;

      // Determine active times
      let activeTimes = [];
      if (Array.isArray(med.admin_times) && med.admin_times.length > 0) {
        activeTimes = med.admin_times;
      } else if (med.frequency) {
        const f = med.frequency.toUpperCase();
        if (f === 'OD' || f === 'MANE') activeTimes = ['6 am'];
        else if (f === 'BD') activeTimes = ['6 am', '6 pm'];
        else if (f === 'TDS') activeTimes = ['6 am', '2 pm', '10 pm'];
        else if (f === 'QID' || f === 'QDS') activeTimes = ['6 am', '12 md', '6 pm', '12 mn'];
        else if (f === 'NOCTE') activeTimes = ['10 pm'];
      }

      timeLabels.forEach((t, tIdx) => {
        const isScheduled = activeTimes.some(at => at.toLowerCase().replace(/\s+/g, '') === t.toLowerCase().replace(/\s+/g, ''));
        slotData[`s${slot}_t${tIdx}`] = isScheduled ? '●' : '';
        slotData[`t${slot}_${tIdx + 1}`] = isScheduled ? '●' : '';
      });
    } else {
      slotData[`d${slot}_name`] = '';
      slotData[`d${slot}_date`] = '';
      slotData[`d${slot}_dose`] = '';
      slotData[`d${slot}_route`] = '';
      slotData[`d${slot}_signature`] = '';

      slotData[`drugN${slot}`] = '';
      slotData[`drugDate${slot}`] = '';
      slotData[`drugD${slot}`] = '';
      slotData[`drugR${slot}`] = '';
      slotData[`drugSig${slot}`] = '';

      timeLabels.forEach((t, tIdx) => {
        slotData[`s${slot}_t${tIdx}`] = '';
        slotData[`t${slot}_${tIdx + 1}`] = '';
      });
    }
  }

  return slotData;
}

/**
 * Map up to 10 stat / single dose medication orders into Table 7 slots of MH 005
 */
function mapStatMedsToTable7Slots(statMeds = [], defaultDate = '', doctorName = '') {
  const statData = {};
  const dateOnly = defaultDate ? defaultDate.split(/\s+/)[0] : new Date().toLocaleDateString('en-GB');

  for (let s = 1; s <= 10; s++) {
    const sm = statMeds[s - 1];
    if (sm) {
      const drugStr = [sm.drug, sm.dose, sm.route].filter(Boolean).join(' ');
      statData[`stDate${s}`] = sm.date || dateOnly;
      statData[`stTime${s}`] = sm.time || sm.order_time || '';
      statData[`stDrug${s}`] = drugStr || sm.drug || '';
      statData[`stSig${s}`] = sm.signature || doctorName || 'DR';
      statData[`stGivenTime${s}`] = sm.given_time || '';
      statData[`stGivenBy${s}`] = sm.given_by || '';

      statData[`statDrug${s}`] = drugStr || sm.drug || '';
      statData[`statDate${s}`] = sm.date || dateOnly;
      statData[`statTime${s}`] = sm.time || sm.order_time || '';
      statData[`statSig${s}`] = sm.signature || doctorName || 'DR';
      statData[`statGivenTime${s}`] = sm.given_time || '';
      statData[`statGivenBy${s}`] = sm.given_by || '';
    } else {
      statData[`stDate${s}`] = '';
      statData[`stTime${s}`] = '';
      statData[`stDrug${s}`] = '';
      statData[`stSig${s}`] = '';
      statData[`stGivenTime${s}`] = '';
      statData[`stGivenBy${s}`] = '';

      statData[`statDrug${s}`] = '';
      statData[`statDate${s}`] = '';
      statData[`statTime${s}`] = '';
      statData[`statSig${s}`] = '';
      statData[`statGivenTime${s}`] = '';
      statData[`statGivenBy${s}`] = '';
    }
  }

  return statData;
}

// List notes
router.get('/', optionalAuth, async (req, res) => {
  try {
    await ready;
    const { type, search, ward } = req.query;

    let query = `
      SELECT n.*, 
        d.id as drug_sheet_id,
        d.medications_json,
        d.iv_fluids_json
      FROM notes n
      LEFT JOIN drug_sheets d ON n.id = d.note_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND n.type = ?`;
      params.push(type);
    }
    if (ward) {
      query += ` AND n.ward LIKE ?`;
      params.push(`%${ward}%`);
    }
    if (search) {
      query += ` AND (n.patient_name LIKE ? OR n.patient_surname LIKE ? OR n.reg_no LIKE ? OR n.diagnosis LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY n.updated_at DESC, n.id DESC`;

    const notes = await db.all(query, params);

    const formatted = notes.map(n => {
      let raw = {};
      try { raw = JSON.parse(n.raw_data_json); } catch (e) {}

      let meds = [];
      try { if (n.medications_json) meds = JSON.parse(n.medications_json); } catch (e) {}

      return {
        id: n.id,
        user_id: n.user_id,
        type: n.type,
        patient_name: n.patient_name,
        patient_surname: n.patient_surname,
        reg_no: n.reg_no,
        age: n.age,
        gender: n.gender,
        ward: n.ward,
        diagnosis: n.diagnosis,
        hospital_name: n.hospital_name,
        doctor_name: n.doctor_name,
        admission_date: n.admission_date,
        created_at: n.created_at,
        updated_at: n.updated_at,
        medication_count: meds.length,
        has_drug_sheet: !!n.drug_sheet_id,
        raw_data: raw
      };
    });

    res.json({ notes: formatted });
  } catch (err) {
    console.error('List notes error:', err);
    res.status(500).json({ error: 'Failed to fetch clinical notes' });
  }
});

// Get single note with coupled drug sheet
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    await ready;
    const note = await db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    let drugSheet = null;
    if (note.type === 'admission') {
      const ds = await db.get('SELECT * FROM drug_sheets WHERE note_id = ?', [note.id]);
      if (ds) {
        drugSheet = {
          id: ds.id,
          medications: JSON.parse(ds.medications_json || '[]'),
          stat_meds: JSON.parse(ds.stat_meds_json || '[]'),
          prn_meds: JSON.parse(ds.prn_meds_json || '[]'),
          iv_fluids: JSON.parse(ds.iv_fluids_json || '[]'),
          monitoring_orders: JSON.parse(ds.monitoring_orders_json || '{}'),
          special_instructions: ds.special_instructions || ''
        };
      }
    }

    res.json({
      note: {
        ...note,
        raw_data: JSON.parse(note.raw_data_json || '{}')
      },
      drugSheet
    });
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create note (and coupled drug sheet if admission)
router.post('/', optionalAuth, async (req, res) => {
  try {
    await ready;
    const {
      type = 'admission',
      template_id,
      patient_name,
      patient_surname,
      reg_no,
      age,
      gender,
      ward,
      diagnosis,
      hospital_name,
      doctor_name,
      admission_date,
      raw_data = {},
      drug_sheet = null
    } = req.body;

    if (!patient_name || !patient_surname) {
      return res.status(400).json({ error: 'Patient name and surname are required' });
    }

    const userId = req.user ? req.user.id : 1;
    const effectiveHospital = hospital_name || (req.user ? req.user.hospital_name : 'Gumare Primary Hospital');
    const effectiveDoctor = doctor_name || (req.user ? req.user.doctor_name : 'Dr. Gumbo');
    const effectiveDate = admission_date || new Date().toLocaleString();
    const effectiveTemplateId = template_id || (raw_data && raw_data.template_id) || null;

    // Ensure raw_data carries essential keys
    const completeRawData = {
      ...raw_data,
      template_id: effectiveTemplateId,
      hospital_name: effectiveHospital,
      doctor_name: effectiveDoctor,
      patient_name: patient_name.trim(),
      patient_surname: patient_surname.trim(),
      reg_no: reg_no ? reg_no.trim() : '',
      age: age || '',
      gender: gender || '',
      ward: ward || '',
      diagnosis: diagnosis || '',
      admission_date: effectiveDate
    };

    const noteResult = await db.run(`
      INSERT INTO notes (
        user_id, template_id, type, patient_name, patient_surname, reg_no, age, gender, ward, diagnosis, hospital_name, doctor_name, admission_date, raw_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      effectiveTemplateId,
      type,
      patient_name.trim(),
      patient_surname.trim(),
      reg_no ? reg_no.trim() : '',
      age ? String(age) : '',
      gender || '',
      ward || '',
      diagnosis || '',
      effectiveHospital,
      effectiveDoctor,
      effectiveDate,
      JSON.stringify(completeRawData)
    ]);

    const noteId = noteResult.lastID;

    // Couple drug sheet if admission note
    if (type === 'admission') {
      const medications = drug_sheet && drug_sheet.medications ? drug_sheet.medications : [];
      const statMeds = drug_sheet && drug_sheet.stat_meds ? drug_sheet.stat_meds : [];
      const prnMeds = drug_sheet && drug_sheet.prn_meds ? drug_sheet.prn_meds : [];
      const ivFluids = drug_sheet && drug_sheet.iv_fluids ? drug_sheet.iv_fluids : [];
      const monitoringOrders = drug_sheet && drug_sheet.monitoring_orders ? drug_sheet.monitoring_orders : { vitals_frequency: '4 hourly' };
      const specialInstructions = drug_sheet && drug_sheet.special_instructions ? drug_sheet.special_instructions : '';

      await db.run(`
        INSERT INTO drug_sheets (note_id, medications_json, stat_meds_json, prn_meds_json, iv_fluids_json, monitoring_orders_json, special_instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        noteId,
        JSON.stringify(medications),
        JSON.stringify(statMeds),
        JSON.stringify(prnMeds),
        JSON.stringify(ivFluids),
        JSON.stringify(monitoringOrders),
        specialInstructions
      ]);
    }

    res.status(201).json({
      message: 'Note created successfully',
      note_id: noteId
    });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note and coupled drug sheet
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    await ready;
    const noteId = req.params.id;
    const existing = await db.get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const {
      template_id,
      patient_name,
      patient_surname,
      reg_no,
      age,
      gender,
      ward,
      diagnosis,
      hospital_name,
      doctor_name,
      admission_date,
      raw_data = {},
      drug_sheet = null
    } = req.body;

    const effectiveTemplateId = template_id !== undefined ? template_id : ((raw_data && raw_data.template_id) !== undefined ? raw_data.template_id : existing.template_id);

    const completeRawData = {
      ...raw_data,
      template_id: effectiveTemplateId,
      hospital_name: hospital_name || existing.hospital_name,
      doctor_name: doctor_name || existing.doctor_name,
      patient_name: patient_name || existing.patient_name,
      patient_surname: patient_surname || existing.patient_surname,
      reg_no: reg_no !== undefined ? reg_no : existing.reg_no,
      age: age !== undefined ? age : existing.age,
      gender: gender !== undefined ? gender : existing.gender,
      ward: ward !== undefined ? ward : existing.ward,
      diagnosis: diagnosis !== undefined ? diagnosis : existing.diagnosis,
      admission_date: admission_date || existing.admission_date
    };

    await db.run(`
      UPDATE notes
      SET template_id = ?, patient_name = ?, patient_surname = ?, reg_no = ?, age = ?, gender = ?, ward = ?, diagnosis = ?, hospital_name = ?, doctor_name = ?, admission_date = ?, raw_data_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      effectiveTemplateId,
      completeRawData.patient_name,
      completeRawData.patient_surname,
      completeRawData.reg_no,
      completeRawData.age,
      completeRawData.gender,
      completeRawData.ward,
      completeRawData.diagnosis,
      completeRawData.hospital_name,
      completeRawData.doctor_name,
      completeRawData.admission_date,
      JSON.stringify(completeRawData),
      noteId
    ]);

    if (drug_sheet && existing.type === 'admission') {
      const medications = drug_sheet.medications || [];
      const statMeds = drug_sheet.stat_meds || [];
      const prnMeds = drug_sheet.prn_meds || [];
      const ivFluids = drug_sheet.iv_fluids || [];
      const monitoringOrders = drug_sheet.monitoring_orders || { vitals_frequency: '4 hourly' };
      const specialInstructions = drug_sheet.special_instructions || '';

      const dsExists = await db.get('SELECT id FROM drug_sheets WHERE note_id = ?', [noteId]);
      if (dsExists) {
        await db.run(`
          UPDATE drug_sheets
          SET medications_json = ?, stat_meds_json = ?, prn_meds_json = ?, iv_fluids_json = ?, monitoring_orders_json = ?, special_instructions = ?, updated_at = CURRENT_TIMESTAMP
          WHERE note_id = ?
        `, [
          JSON.stringify(medications),
          JSON.stringify(statMeds),
          JSON.stringify(prnMeds),
          JSON.stringify(ivFluids),
          JSON.stringify(monitoringOrders),
          specialInstructions,
          noteId
        ]);
      } else {
        await db.run(`
          INSERT INTO drug_sheets (note_id, medications_json, stat_meds_json, prn_meds_json, iv_fluids_json, monitoring_orders_json, special_instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          noteId,
          JSON.stringify(medications),
          JSON.stringify(statMeds),
          JSON.stringify(prnMeds),
          JSON.stringify(ivFluids),
          JSON.stringify(monitoringOrders),
          specialInstructions
        ]);
      }
    }

    res.json({ message: 'Note updated successfully' });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Update note design selection and layout configuration directly from view chart / designer
router.patch('/:id/design', optionalAuth, async (req, res) => {
  try {
    await ready;
    const noteId = req.params.id;
    const note = await db.get('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { design_filename, layout_config, template_id } = req.body;
    let raw = {};
    try { raw = JSON.parse(note.raw_data_json || '{}'); } catch (e) {}

    if (design_filename !== undefined) raw.design_filename = design_filename;
    if (layout_config !== undefined) raw.layout_config = layout_config;
    if (template_id !== undefined) raw.template_id = template_id;

    const newTemplateId = template_id !== undefined ? template_id : note.template_id;

    await db.run(`
      UPDATE notes 
      SET template_id = ?, raw_data_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newTemplateId, JSON.stringify(raw), noteId]);

    const updated = await db.get('SELECT * FROM notes WHERE id = ?', [noteId]);
    res.json({
      message: 'Note design updated successfully',
      note: {
        ...updated,
        raw_data: JSON.parse(updated.raw_data_json || '{}')
      }
    });
  } catch (err) {
    console.error('Update note design error:', err);
    res.status(500).json({ error: 'Failed to update note design' });
  }
});

// Delete note
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    await ready;
    const note = await db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await db.run('DELETE FROM drug_sheets WHERE note_id = ?', [req.params.id]);
    await db.run('DELETE FROM notes WHERE id = ?', [req.params.id]);

    res.json({ message: 'Note and coupled drug sheet deleted successfully' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Export Note to DOCX via docxtemplater
router.get('/:id/export/docx', async (req, res) => {
  try {
    await ready;
    const note = await db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const rawData = JSON.parse(note.raw_data_json || '{}');
    const exportType = (req.query.type || req.query.doc_type || '').toLowerCase();
    let templateFile = req.query.template;

    if (!templateFile) {
      if (exportType === 'drug_sheet' || exportType === 'drugsheet') {
        templateFile = 'drugsheet_template.docx';
      } else if (rawData.design_filename) {
        templateFile = rawData.design_filename;
      } else if (rawData.template_filename) {
        templateFile = rawData.template_filename;
      } else if (note.template_id) {
        const tmpl = await db.get('SELECT filename FROM templates WHERE id = ?', [note.template_id]);
        if (tmpl && tmpl.filename) {
          templateFile = tmpl.filename;
        }
      }
    }

    if (!templateFile) {
      templateFile = note.type === 'referral' ? 'referral_and_report_form_template.docx' : 'admission_template.docx';
    }

    // Alias legacy or programmatic template filenames to authentic hospital files
    if (templateFile === 'gph_admission_treatment_chart.docx') {
      templateFile = 'admission_template.docx';
    } else if (templateFile === 'inpatient_drug_sheet.docx' || exportType === 'drug_sheet' || exportType === 'drugsheet') {
      templateFile = 'drugsheet_template.docx';
    }

    // Separate date and time for templates requiring {date} and {time}
    let datePart = '';
    let timePart = '';
    const rawDateStr = rawData.admission_date || note.admission_date || '';
    if (rawDateStr) {
      const parts = rawDateStr.trim().split(/\s+/);
      datePart = parts[0] || '';
      timePart = parts.slice(1).join(' ') || '';
    }
    if (!datePart) datePart = new Date().toLocaleDateString('en-GB');
    if (!timePart) timePart = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const examObj = typeof rawData.examination === 'object' && rawData.examination !== null ? rawData.examination : {};
    const examSummary = typeof rawData.examination === 'string'
      ? rawData.examination
      : Object.entries(examObj)
          .filter(([_, v]) => v && String(v).trim())
          .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
          .join('\n');

    let payload = {};

    if (note.type === 'admission') {
      const ds = await db.get('SELECT * FROM drug_sheets WHERE note_id = ?', [note.id]);
      const medications = ds ? JSON.parse(ds.medications_json || '[]') : [];
      const statMeds = ds ? JSON.parse(ds.stat_meds_json || '[]') : [];
      const ivFluids = ds ? JSON.parse(ds.iv_fluids_json || '[]') : [];
      const monitoring = ds ? JSON.parse(ds.monitoring_orders_json || '{}') : {};

      const treatmentText = formatTreatmentNoteText(rawData);
      const treatmentXml = formatTreatmentNoteXml(rawData);

      const vitalsObj = rawData.vitals_recorded || rawData.vitals || {};
      const vParts = [];
      if (vitalsObj && typeof vitalsObj === 'object') {
        if (vitalsObj.bp) vParts.push(`BP ${vitalsObj.bp}${/mm\s*hg/i.test(vitalsObj.bp) ? '' : ' mmHg'}`);
        if (vitalsObj.hr) vParts.push(`HR ${vitalsObj.hr}${/bpm/i.test(vitalsObj.hr) ? '' : ' bpm'}`);
        if (vitalsObj.temp) vParts.push(`Temp ${vitalsObj.temp}${/°|c/i.test(vitalsObj.temp) ? '' : '°C'}`);
        if (vitalsObj.spo2) vParts.push(`SpO2 ${vitalsObj.spo2}${/%/.test(vitalsObj.spo2) ? '' : '%'}`);
        if (vitalsObj.rr) vParts.push(`RR ${vitalsObj.rr}${/\/min|bpm/i.test(vitalsObj.rr) ? '' : '/min'}`);
        if (vitalsObj.rbs) vParts.push(`RBS ${vitalsObj.rbs}${/mmol/i.test(vitalsObj.rbs) ? '' : ' mmol/L'}`);
      }
      const formattedVitals = vParts.join(', ') || rawData.vitals_summary || rawData.vital_signs || '';

      payload = {
        hospital_name: rawData.hospital_name || note.hospital_name || 'Gumare Primary Hospital',
        document_title: rawData.document_title || 'TREATMENT CHART',
        reg_no: rawData.reg_no || note.reg_no || 'N/A',
        firstname: rawData.patient_name || note.patient_name || '',
        lastname: rawData.patient_surname || note.patient_surname || '',
        patient_name: rawData.patient_name || note.patient_name || '',
        patient_surname: rawData.patient_surname || note.patient_surname || '',
        ward: rawData.ward || note.ward || 'General',
        diagnosis: rawData.diagnosis || note.diagnosis || 'Clinical Diagnosis',
        date: datePart,
        time: timePart,
        admission_date: rawData.admission_date || note.admission_date || `${datePart} ${timePart}`,
        doctor_name: rawData.doctor_name || note.doctor_name || 'Medical Officer',
        signature: rawData.signature || rawData.doctor_name || note.doctor_name || 'DOCTOR',
        bed_no: rawData.bed_no || 'TB Ward',
        treatment_note: treatmentText,
        treatment_text: treatmentText,
        treatment_note_xml: treatmentXml,
        treatment_text_xml: treatmentXml,
        vitals: formattedVitals,
        vital_signs: formattedVitals,
        vitals_summary: formattedVitals,
        bp: vitalsObj.bp || '',
        hr: vitalsObj.hr || '',
        pulse: vitalsObj.hr || '',
        temp: vitalsObj.temp || '',
        spo2: vitalsObj.spo2 || '',
        rr: vitalsObj.rr || '',
        rbs: vitalsObj.rbs || '',
        exam_general: examObj.general || '',
        exam_cvs: examObj.cvs || '',
        exam_resp: examObj.respiratory || '',
        exam_abdo: examObj.abdomen || '',
        exam_cns: examObj.cns || examObj.neuro || '',
        exam_neuro: examObj.cns || examObj.neuro || '',
        exam_msk: examObj.msk || '',
        exam_ent: examObj.ent || '',
        exam_eye: examObj.eye || '',
        exam_skin: examObj.skin || '',
        exam_gu: examObj.gu || '',
        ...Object.fromEntries(
          Object.entries(examObj).map(([k, v]) => [`exam_${k}`, v || ''])
        ),
        examination: examSummary,
        examination_text: examSummary,
        medications: medications.map(m => ({
          drug: m.drug || '',
          dose: m.dose || '',
          route: m.route || '',
          frequency: m.frequency || '',
          indication: m.indication || '-',
          signature: rawData.doctor_name || note.doctor_name || 'DR'
        })),
        stat_meds: statMeds.map(m => ({
          drug: m.drug || '',
          dose: m.dose || '',
          route: m.route || '',
          given_time: m.given_time || 'Stat',
          signature: m.signature || note.doctor_name
        })),
        iv_fluids: ivFluids.map(f => ({
          fluid: f.fluid || '',
          volume: f.volume || '',
          rate_hours: f.rate_hours || '',
          indication: f.indication || '-'
        })),
        vitals_orders: monitoring.vitals_frequency || '4 hourly',
        special_instructions: ds ? (ds.special_instructions || 'Standard ward precautions') : 'Standard precautions',
        ...mapMedicationsToMH005Slots(medications, rawData.admission_date || note.admission_date, note.doctor_name),
        ...mapStatMedsToTable7Slots(statMeds, rawData.admission_date || note.admission_date, note.doctor_name)
      };
    } else {
      // Referral Note - support both standard Hospital Referral & Report Form and detailed summary
      let fullHistory = rawData.clinical_history || '';
      if (!fullHistory || fullHistory.length < 50) {
        const parts = [];
        if (rawData.reason_for_referral) parts.push(`Reason for Referral: ${rawData.reason_for_referral}`);
        if (rawData.clinical_history) parts.push(`Clinical Presentation: ${rawData.clinical_history}`);
        if (rawData.vital_signs) parts.push(`Vitals: ${rawData.vital_signs}`);
        if (examSummary) parts.push(`Examination:\n${examSummary}`);
        if (rawData.investigations) parts.push(`Investigations: ${rawData.investigations}`);
        if (rawData.treatment_given) parts.push(`Treatment: ${rawData.treatment_given}`);
        if (rawData.transport_needs) parts.push(`Transport: ${rawData.transport_needs}`);
        fullHistory = parts.join('\n\n');
      }

      payload = {
        hospital_name: rawData.hospital_name || note.hospital_name || 'Gumare Primary Hospital',
        referring_unit: rawData.referring_unit || 'Inpatient Medical Unit',
        receiving_hospital: rawData.receiving_hospital || 'Referral Hospital',
        receiving_department: rawData.receiving_department || 'Specialist Clinic',
        urgency: rawData.urgency || 'Routine',
        firstname: rawData.patient_name || note.patient_name || '',
        lastname: rawData.patient_surname || note.patient_surname || '',
        patient_name: rawData.patient_name || note.patient_name,
        patient_surname: rawData.patient_surname || note.patient_surname,
        reg_no: rawData.reg_no || note.reg_no || 'N/A',
        age: rawData.age || note.age || 'N/A',
        gender: rawData.gender || note.gender || 'N/A',
        ward: rawData.ward || note.ward || 'Medical',
        diagnosis: rawData.diagnosis || note.diagnosis || 'Clinical Referral',
        date: datePart,
        time: timePart,
        admission_date: rawData.admission_date || note.admission_date || new Date().toLocaleDateString('en-GB'),
        doctor_name: rawData.doctor_name || note.doctor_name || 'Dr. Gumbo',
        signature: rawData.signature || rawData.doctor_name || note.doctor_name || 'DR. GUMBO',
        reason_for_referral: rawData.reason_for_referral || '',
        clinical_history: fullHistory,
        vital_signs: rawData.vital_signs || '',
        examination: examSummary || rawData.examination || '',
        examination_text: examSummary || rawData.examination || '',
        exam_general: examObj.general || '',
        exam_cvs: examObj.cvs || '',
        exam_resp: examObj.respiratory || '',
        exam_abdo: examObj.abdomen || '',
        exam_cns: examObj.cns || examObj.neuro || '',
        exam_neuro: examObj.cns || examObj.neuro || '',
        exam_msk: examObj.msk || '',
        exam_ent: examObj.ent || '',
        exam_eye: examObj.eye || '',
        exam_skin: examObj.skin || '',
        exam_gu: examObj.gu || '',
        investigations: rawData.investigations || '',
        treatment_given: rawData.treatment_given || '',
        transport_needs: rawData.transport_needs || 'Standard transport'
      };
    }

    const docxBuffer = renderDocx(templateFile, payload);

    const isDrugSheet = templateFile.toLowerCase().includes('drug') || exportType === 'drug_sheet' || exportType === 'drugsheet';
    const filePrefix = isDrugSheet ? 'drugsheet' : note.type;
    const safeFilename = `${filePrefix}_${note.patient_surname || 'patient'}_${note.reg_no || note.id}.docx`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(docxBuffer);
  } catch (err) {
    console.error('Export docx error:', err);
    res.status(500).json({ error: 'Failed to generate Word (.docx) document: ' + err.message });
  }
});

// Export Note preview data for frontend print & visual preview
router.get('/:id/export/preview', async (req, res) => {
  try {
    await ready;
    const note = await db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const rawData = JSON.parse(note.raw_data_json || '{}');
    let drugSheet = null;

    if (note.type === 'admission') {
      const ds = await db.get('SELECT * FROM drug_sheets WHERE note_id = ?', [note.id]);
      if (ds) {
        drugSheet = {
          medications: JSON.parse(ds.medications_json || '[]'),
          stat_meds: JSON.parse(ds.stat_meds_json || '[]'),
          prn_meds: JSON.parse(ds.prn_meds_json || '[]'),
          iv_fluids: JSON.parse(ds.iv_fluids_json || '[]'),
          monitoring_orders: JSON.parse(ds.monitoring_orders_json || '{}'),
          special_instructions: ds.special_instructions || ''
        };
      }
    }

    res.json({
      note,
      rawData,
      treatmentText: formatTreatmentNoteText(rawData),
      treatmentXml: formatTreatmentNoteXml(rawData),
      drugSheet
    });
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

router.formatTreatmentNoteText = formatTreatmentNoteText;
router.formatTreatmentNoteXml = formatTreatmentNoteXml;
module.exports = router;
