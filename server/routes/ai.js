const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

/**
 * Intelligent rule-based fallback clinical parser for offline/no-key usage
 */
function parseClinicalTextOffline(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const result = {
    patient_name: 'Patient',
    patient_surname: 'Record',
    reg_no: 'REG-' + Math.floor(10000 + Math.random() * 90000),
    age: '',
    gender: '',
    ward: 'Medical Ward',
    diagnosis: '',
    rvd_status: 'Unknown',
    comorbidities: 'Nil known comorbidities',
    chief_complaint: '',
    history_present_illness: '',
    today_management_gph: [],
    past_medical_history: 'Unremarkable',
    examination: {
      general: 'Alert, not in respiratory distress. JACCOLD negative.',
      cvs: 'S1 S2 normal, regular pulse.',
      respiratory: 'Chest clear bilaterally, good air entry.',
      abdomen: 'Soft, non-tender, non-distended.',
      msk: 'Normal tone and power.',
      other_systems: 'NAD'
    },
    assessment: '',
    ddx: [],
    plan: [],
    drug_sheet: {
      medications: [],
      stat_meds: [],
      prn_meds: [],
      iv_fluids: [],
      monitoring_orders: { vitals_frequency: '4 hourly' },
      special_instructions: ''
    }
  };

  // Extract age and gender (e.g. "15 year old female", "15F", "42M")
  const ageMatch = rawText.match(/(\d{1,3})\s*(?:year[\s-]*old|yo|y\/o|yr|y)\s*(female|male|f|m)?/i) || rawText.match(/\b(\d{1,3})\s*(F|M)\b/i);
  if (ageMatch) {
    result.age = ageMatch[1];
    if (ageMatch[2]) {
      const g = ageMatch[2].toLowerCase();
      result.gender = (g === 'f' || g === 'female') ? 'Female' : 'Male';
    }
  }

  // Extract vitals
  const vitalsFound = [];
  const bpMatch = rawText.match(/BP\s*[:=]?\s*(\d{2,3}\/\d{2,3})/i);
  if (bpMatch) vitalsFound.push(`BP ${bpMatch[1]} mmHg`);

  const pMatch = rawText.match(/P(?:ulse)?\s*[:=]?\s*(\d{2,3})\s*(?:bpm)?/i);
  if (pMatch) vitalsFound.push(`Pulse ${pMatch[1]} bpm`);

  const tMatch = rawText.match(/T(?:emp)?\s*[:=]?\s*(\d{2}(?:\.\d)?)\s*(?:C)?/i);
  if (tMatch) vitalsFound.push(`Temp ${tMatch[1]}°C`);

  const spo2Match = rawText.match(/SpO2\s*[:=]?\s*(\d{2,3})\s*%/i);
  if (spo2Match) vitalsFound.push(`SpO2 ${spo2Match[1]}% on room air`);

  const rbsMatch = rawText.match(/RBS\s*[:=]?\s*(\d{1,2}(?:\.\d)?)\s*(?:mmol\/l)?/i);
  if (rbsMatch) vitalsFound.push(`RBS ${rbsMatch[1]} mmol/l`);

  if (vitalsFound.length > 0) {
    result.today_management_gph.push(`Initial vitals: ${vitalsFound.join(', ')}`);
  }

  // Common diagnoses
  if (/tuberculosis|tb|genexpert/i.test(rawText)) {
    result.diagnosis = 'Pulmonary tuberculosis';
    result.ward = 'TB Ward';
    result.ddx.push('Superimposed bacterial pneumonia');
    result.plan.push('Admit to TB ward for isolation');
  } else if (/pneumonia|cap|hosp/i.test(rawText)) {
    result.diagnosis = 'Community-Acquired Pneumonia';
    result.ward = 'Medical Ward';
  } else if (/hypertension|htn/i.test(rawText)) {
    result.diagnosis = 'Hypertensive Urgency';
  }

  // Extract complaints
  const coMatch = rawText.match(/(?:CO|C\/O|complaints?|presents? with)\s*[:=]?\s*([^\.\n]+)/i);
  if (coMatch) {
    result.chief_complaint = coMatch[1].trim();
  } else {
    result.chief_complaint = lines[0] || 'Medical admission for assessment and management';
  }

  // Medication extraction regex pattern
  // Matches e.g. "Cefotaxime 1g IV TDS", "ATT 3 tabs PO OD", "Paracetamol 1g PO TDS"
  const medRegex = /(?:start|give|rx|meds?[:\s]*)?([a-zA-Z\s]{3,25})\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|tabs?|caps?|ml))\s+(PO|IV|IM|SC|PR|SL|NEB|topical)?\s*(OD|BD|TDS|QID|PRN|STAT|NOCTE|MANE|Q4H|Q6H|Q8H|Q12H|DAILY)?/gi;
  let match;
  while ((match = medRegex.exec(rawText)) !== null) {
    const rawDrugName = match[1].replace(/^(start|give|rx|and|with|on)\s+/i, '').trim();
    const dose = match[2].trim();
    const route = (match[3] || 'PO').toUpperCase();
    const freq = (match[4] || 'OD').toUpperCase();

    if (rawDrugName.length > 2 && !/initial|today|alert|normal|vitals|clear/i.test(rawDrugName)) {
      const isStat = freq === 'STAT' || /stat/i.test(rawText);
      const isPrn = freq.includes('PRN') || /prn/i.test(rawDrugName);

      const medObj = {
        drug: rawDrugName,
        dose,
        route,
        frequency: freq,
        indication: result.diagnosis || 'Therapeutic'
      };

      if (isStat) {
        result.drug_sheet.stat_meds.push(medObj);
      } else if (isPrn) {
        result.drug_sheet.prn_meds.push(medObj);
      } else {
        result.drug_sheet.medications.push(medObj);
      }
    }
  }

  // Check IV Fluids
  const ivfMatch = rawText.match(/IVF\s*([^\n\.]+)/i) || rawText.match(/(?:Ringer|Saline|RL|NS|D5W)\s*(\d+\s*L|\d+\s*ml)[^\n\.]*/i);
  if (ivfMatch) {
    result.drug_sheet.iv_fluids.push({
      fluid: ivfMatch[0].trim(),
      volume: '1 - 2 L',
      rate_hours: 'Over 24 hours',
      indication: 'Hydration and maintenance'
    });
    result.plan.push(ivfMatch[0].trim());
  }

  // Assessment
  result.assessment = `${result.age ? result.age + 'y ' : ''}${result.gender || 'Patient'} with clinical presentation suggestive of ${result.diagnosis || 'acute illness'}, admitted for stabilization.`;
  result.plan.push('Monitor vital signs 4 hourly', 'Routine baseline bloods (FBC, U&E, LFT)');

  return result;
}

// AI Format Note Endpoint
router.post('/format-note', async (req, res) => {
  try {
    const { text, type = 'admission', apiKey } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Clinical text input is required' });
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (effectiveApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
        const prompt = `You are a clinical documentation assistant for a district and primary hospital.
Transform the following clinical shorthand/doctor notes into a structured JSON document for an Inpatient Admission Note and paired Treatment/Drug Sheet (MAR).

User clinical input:
"""
${text}
"""

Return ONLY a valid JSON object with the following structure without markdown formatting or code blocks:
{
  "hospital_name": "Gumare Primary Hospital",
  "document_title": "TREATMENT CHART",
  "patient_name": "string (first name)",
  "patient_surname": "string (surname)",
  "reg_no": "string",
  "ward": "string",
  "diagnosis": "string",
  "age": "string",
  "gender": "Female or Male",
  "rvd_status": "string (e.g. RVD unknown, HIV negative, HIV positive on ART)",
  "comorbidities": "string",
  "chief_complaint": "string",
  "history_present_illness": "string",
  "today_management_gph": ["array of strings listing initial vitals, labs, stat doses given, GeneXpert, ECG"],
  "past_medical_history": "string",
  "examination": {
    "general": "string",
    "cvs": "string",
    "respiratory": "string",
    "abdomen": "string",
    "msk": "string",
    "other_systems": "string"
  },
  "assessment": "string",
  "ddx": ["array of differential diagnoses"],
  "plan": ["array of management plan items"],
  "drug_sheet": {
    "medications": [
      {
        "drug": "string",
        "dose": "string",
        "route": "PO | IV | IM | SC | PR | SL",
        "frequency": "OD | BD | TDS | QID | NOCTE",
        "indication": "string"
      }
    ],
    "stat_meds": [
      { "drug": "string", "dose": "string", "route": "string", "given_time": "string" }
    ],
    "prn_meds": [
      { "drug": "string", "dose": "string", "route": "string", "frequency": "string" }
    ],
    "iv_fluids": [
      { "fluid": "string", "volume": "string", "rate_hours": "string", "indication": "string" }
    ],
    "monitoring_orders": {
      "vitals_frequency": "4 hourly"
    },
    "special_instructions": "string"
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        let replyText = response.text || '';
        // Strip markdown code fences if model returned them
        replyText = replyText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(replyText);
        return res.json({
          source: 'gemini-ai',
          data: parsed
        });
      } catch (aiErr) {
        console.warn('Gemini API call failed, falling back to offline parser:', aiErr.message);
        // Fall through to offline parser
      }
    }

    // Offline rule-based parser fallback
    const parsedOffline = parseClinicalTextOffline(text);
    return res.json({
      source: 'offline-clinical-engine',
      data: parsedOffline
    });
  } catch (err) {
    console.error('AI formatting error:', err);
    res.status(500).json({ error: 'Failed to format note: ' + err.message });
  }
});

module.exports = router;
