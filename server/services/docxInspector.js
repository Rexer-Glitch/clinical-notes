const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

/**
 * Inspects a .docx file and extracts structural layout metadata,
 * detected sections, tables, merge tags, and visual style hints.
 */
function inspectDocxFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'binary');
  const zip = new PizZip(content);

  // Extract document.xml
  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error('Invalid .docx file: word/document.xml not found');
  }
  const documentXml = documentXmlFile.asText();

  // Extract all docxtemplater merge tags: {tag_name}
  const tagRegex = /\{([a-zA-Z0-9_\-]+)\}/g;
  const foundTags = new Set();
  let match;
  while ((match = tagRegex.exec(documentXml)) !== null) {
    foundTags.add(match[1]);
  }
  const mergeTags = Array.from(foundTags);

  // Extract paragraphs (w:p) text snippets
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  const tRegex = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g;
  const paragraphs = [];
  let pMatch;
  while ((pMatch = pRegex.exec(documentXml)) !== null) {
    const pContent = pMatch[1];
    let pText = '';
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      pText += tMatch[1];
    }
    const cleanText = pText.trim();
    if (cleanText) {
      paragraphs.push(cleanText);
    }
  }

  // Count tables (w:tbl) and their dimensions
  const tblRegex = /<w:tbl(?:\s+[^>]*)?>([\s\S]*?)<\/w:tbl>/g;
  const trRegex = /<w:tr(?:\s+[^>]*)?>/g;
  const tcRegex = /<w:tc(?:\s+[^>]*)?>/g;
  const tables = [];
  let tblMatch;
  while ((tblMatch = tblRegex.exec(documentXml)) !== null) {
    const tblContent = tblMatch[1];
    const rows = (tblContent.match(trRegex) || []).length;
    const firstRowMatch = tblContent.match(/<w:tr(?:\s+[^>]*)?>([\s\S]*?)<\/w:tr>/);
    const cols = firstRowMatch ? (firstRowMatch[1].match(tcRegex) || []).length : 0;
    tables.push({ rows, cols });
  }

  // Detect color hints (w:color w:val="HEX" or w:shd w:fill="HEX")
  const colorRegex = /w:(?:color|fill)="([0-9A-Fa-f]{6})"/g;
  const detectedColors = new Set();
  let colorMatch;
  while ((colorMatch = colorRegex.exec(documentXml)) !== null) {
    const hex = colorMatch[1].toUpperCase();
    if (hex !== 'FFFFFF' && hex !== '000000' && hex !== 'AUTO') {
      detectedColors.add('#' + hex);
    }
  }

  // Detect font hints
  let detectedFont = 'sans';
  if (/Times New Roman|Georgia|Garamond/i.test(documentXml)) {
    detectedFont = 'serif';
  } else if (/Courier|Consolas|Roboto Mono/i.test(documentXml)) {
    detectedFont = 'mono';
  }

  // Infer template type based on tags and content
  const xmlLower = documentXml.toLowerCase();
  let inferredType = 'admission';
  let documentTitle = 'Clinical Treatment Chart & MAR';
  let hospitalName = 'Gumare Primary Hospital';

  if (xmlLower.includes('referral') || mergeTags.some(t => t.includes('referral') || t.includes('receiving_hospital'))) {
    inferredType = 'referral';
    documentTitle = 'Referral and Report Form';
  } else if (xmlLower.includes('drug sheet') || mergeTags.some(t => t.startsWith('d1_') || t.startsWith('s1_'))) {
    inferredType = 'admission';
    documentTitle = 'Treatment Chart & Inpatient Drug Sheet (MH 005)';
  }

  // Look for hospital name in paragraphs
  const hospitalPara = paragraphs.find(p => /hospital|clinic|health/i.test(p));
  if (hospitalPara) {
    const cleaned = hospitalPara.replace(/^(hospital:\s*)/i, '').trim();
    if (cleaned.length < 60) {
      hospitalName = cleaned;
    }
  }

  // Determine standard sections based on detected content
  const sections = [
    {
      id: 'header',
      name: 'Hospital Header & Document Title',
      enabled: true,
      removable: false
    },
    {
      id: 'demographics',
      name: 'Patient Demographics & Ward Summary',
      enabled: true,
      removable: true
    },
    {
      id: 'treatment_chart',
      name: '3-Column Treatment Chart (Date | Treatment | Signature)',
      enabled: inferredType === 'admission',
      removable: true
    },
    {
      id: 'examinations',
      name: 'Physical Examination & Systems Assessment',
      enabled: true,
      removable: true
    },
    {
      id: 'assessment_plan',
      name: 'Clinical Assessment, DDX & Management Plan',
      enabled: inferredType === 'admission',
      removable: true
    },
    {
      id: 'drug_sheet',
      name: 'MH 005 Inpatient Drug Administration Sheet (MAR)',
      enabled: inferredType === 'admission',
      removable: true
    },
    {
      id: 'iv_fluids',
      name: 'Intravenous Fluids & Infusion Schedule',
      enabled: inferredType === 'admission',
      removable: true
    },
    {
      id: 'referral_body',
      name: 'Transfer Summary, Vitals, Investigations & Treatment Given',
      enabled: inferredType === 'referral',
      removable: true
    },
    {
      id: 'transport_logistics',
      name: 'Transport, Receiving Facility & Escort Requirements',
      enabled: inferredType === 'referral',
      removable: true
    },
    {
      id: 'signatures',
      name: 'Doctor & Clinician Signatures',
      enabled: true,
      removable: true
    }
  ];

  // Default color choice
  const primaryColor = detectedColors.size > 0 
    ? Array.from(detectedColors)[0] 
    : (inferredType === 'referral' ? '#1e3a8a' : '#059669');

  return {
    inferredType,
    documentTitle,
    hospitalName,
    sections,
    styling: {
      accentColor: primaryColor,
      fontFamily: detectedFont,
      borderStyle: 'double',
      headerStyle: 'boxed',
      chartColumns: '3-column',
      dateColumnWidth: '18%',
      drugSlots: 6,
      adminTimes: ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'],
      timeBadgeStyle: 'circle',
      dateGridDays: 14,
      watermark: 'NONE'
    },
    stats: {
      paragraphCount: paragraphs.length,
      tableCount: tables.length,
      detectedColors: Array.from(detectedColors),
      tables
    },
    mergeTags
  };
}

module.exports = {
  inspectDocxFile
};
