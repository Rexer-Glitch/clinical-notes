/**
 * Botswana Pediatric Drug Dosing Handbook ("Pink Book", pp. 34-38)
 * Structured Pediatric Medication Catalog & Weight-Based Calculator
 * Compiled from Tonya Arscott-Mills & Shiang-Ju Kung (University of Botswana / PMH)
 */

export const PINK_BOOK_CATEGORIES = [
  'All',
  'Antibiotics',
  'Analgesics / Antipyretics',
  'Anticonvulsants & Sedatives',
  'Respiratory & Asthma',
  'Emergency & Resuscitation',
  'GI & Fluids',
  'Steroids',
  'Cardiovascular',
  'Vitamins & Minerals',
  'Antiparasitic / Antifungal'
];

export const formatDoseNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  if (val >= 10) return Math.round(val).toString();
  if (val >= 1) return (Math.round(val * 10) / 10).toString();
  if (val >= 0.01) return (Math.round(val * 100) / 100).toString();
  return (Math.round(val * 1000) / 1000).toString();
};

/**
 * Standard weight-based medication entries from Pink Book pages 34-38
 */
export const PINK_BOOK_MEDICATIONS = [
  // ==========================================
  // ANTIBIOTICS & ANTIMICROBIALS
  // ==========================================
  {
    id: 'amoxicillin-std',
    name: 'Amoxicillin (Standard Dose)',
    genericName: 'Amoxicillin',
    aliases: ['Amoxil', 'Amoxi'],
    category: 'Antibiotics',
    indication: 'Mild/Moderate bacterial infection / Pharyngitis',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '125mg/5ml susp, 250mg/5ml susp, 250mg cap, 500mg cap',
    dosePerKg: 25,
    unit: 'mg',
    maxDose: 1000,
    notes: 'Standard 25 mg/kg/dose TDS (or 50 mg/kg/day div TDS). Take with or after meals.',
    calc: (wt) => {
      const dose = Math.min(wt * 25, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(25mg/kg)',
        fullDoseString: `${str} (25mg/kg)`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'amoxicillin-high',
    name: 'Amoxicillin (High Dose)',
    genericName: 'Amoxicillin',
    aliases: ['Amoxil high dose', 'Amoxil otitis'],
    category: 'Antibiotics',
    indication: 'Acute Otitis Media / Severe Community-Acquired Pneumonia',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '250mg/5ml susp, 500mg cap',
    dosePerKg: 45,
    unit: 'mg',
    maxDose: 1500,
    notes: 'High dose 40-45 mg/kg/dose BD (80-90 mg/kg/day) for resistant S. pneumoniae.',
    calc: (wt) => {
      const dose = Math.min(wt * 45, 1500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(45mg/kg)',
        fullDoseString: `${str} (45mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'ampicillin-std',
    name: 'Ampicillin (Standard Dose)',
    genericName: 'Ampicillin',
    aliases: ['Penbritin'],
    category: 'Antibiotics',
    indication: 'Bacterial sepsis / Pneumonia / Listeria coverage',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '500mg vial, 1g vial',
    dosePerKg: 50,
    unit: 'mg',
    maxDose: 2000,
    notes: '25-50 mg/kg/dose IV q6h. Dilute with sterile water.',
    calc: (wt) => {
      const dose = Math.min(wt * 50, 2000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(50mg/kg)',
        fullDoseString: `${str} (50mg/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'ampicillin-meningitis',
    name: 'Ampicillin (Meningitis Dose)',
    genericName: 'Ampicillin',
    aliases: ['Ampicillin high dose'],
    category: 'Antibiotics',
    indication: 'Bacterial Meningitis / Severe Neonatal Sepsis',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '500mg vial, 1g vial',
    dosePerKg: 100,
    unit: 'mg',
    maxDose: 3000,
    notes: '75-100 mg/kg/dose IV q6h (up to 400 mg/kg/day, max 12g/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 100, 3000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(100mg/kg)',
        fullDoseString: `${str} (100mg/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'augmentin-po',
    name: 'Augmentin (Amoxicillin-Clavulanate) PO',
    genericName: 'Amoxicillin + Clavulanate',
    aliases: ['Co-amoxiclav', 'Curam', 'Clavam'],
    category: 'Antibiotics',
    indication: 'Complicated ENT / RTI / Animal bites / UTI',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '156.25mg/5ml susp, 312.5mg/5ml susp, 375mg tab, 625mg tab',
    dosePerKg: 25,
    unit: 'mg',
    maxDose: 1000,
    notes: 'Dosed on amoxicillin component: 15-25 mg/kg/dose PO TDS.',
    calc: (wt) => {
      const dose = Math.min(wt * 25, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(25mg amox/kg)',
        fullDoseString: `${str} (25mg/kg)`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'augmentin-iv',
    name: 'Augmentin (Co-amoxiclav) IV',
    genericName: 'Amoxicillin + Clavulanate',
    aliases: ['Augmentin IV'],
    category: 'Antibiotics',
    indication: 'Severe intra-abdominal infection / Severe pneumonia / Sepsis',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '600mg vial, 1.2g vial',
    dosePerKg: 30,
    unit: 'mg',
    maxDose: 1200,
    notes: '30 mg/kg/dose IV q8h slowly over 3-4 minutes or infusion.',
    calc: (wt) => {
      const dose = Math.min(wt * 30, 1200);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(30mg/kg)',
        fullDoseString: `${str} (30mg/kg)`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'cefotaxime-std',
    name: 'Cefotaxime (Standard Dose)',
    genericName: 'Cefotaxime',
    aliases: ['Claforan'],
    category: 'Antibiotics',
    indication: 'Neonatal sepsis / Pediatric sepsis / Severe pneumonia',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '500mg vial, 1g vial',
    dosePerKg: 50,
    unit: 'mg',
    maxDose: 2000,
    notes: '50 mg/kg/dose IV q8h (neonates q12h). Preferred cephalosporin for neonates (no kernicterus risk).',
    calc: (wt) => {
      const dose = Math.min(wt * 50, 2000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(50mg/kg)',
        fullDoseString: `${str} (50mg/kg)`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'cefotaxime-meningitis',
    name: 'Cefotaxime (Meningitis Dose)',
    genericName: 'Cefotaxime',
    aliases: ['Claforan meningitis'],
    category: 'Antibiotics',
    indication: 'Bacterial Meningitis / Refractory Sepsis',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '500mg vial, 1g vial',
    dosePerKg: 75,
    unit: 'mg',
    maxDose: 3000,
    notes: '75 mg/kg/dose IV q6h (max 12g/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 75, 3000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(75mg/kg)',
        fullDoseString: `${str} (75mg/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'ceftriaxone-std',
    name: 'Ceftriaxone (Standard Dose)',
    genericName: 'Ceftriaxone',
    aliases: ['Rocephin'],
    category: 'Antibiotics',
    indication: 'Severe bacterial infection / Sepsis / Severe Pneumonia / Pyelonephritis',
    route: 'IV',
    frequency: 'OD',
    isStat: false,
    forms: '250mg vial, 500mg vial, 1g vial',
    dosePerKg: 50,
    unit: 'mg',
    maxDose: 2000,
    notes: '50-80 mg/kg IV/IM OD (max 2g/day). Avoid co-administration with IV calcium solutions.',
    calc: (wt) => {
      const dose = Math.min(wt * 50, 2000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(50mg/kg)',
        fullDoseString: `${str} (50mg/kg)`,
        route: 'IV',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'ceftriaxone-meningitis',
    name: 'Ceftriaxone (Meningitis Dose)',
    genericName: 'Ceftriaxone',
    aliases: ['Rocephin meningitis'],
    category: 'Antibiotics',
    indication: 'Bacterial Meningitis / Severe Enteric Sepsis',
    route: 'IV',
    frequency: 'OD',
    isStat: false,
    forms: '1g vial, 2g vial',
    dosePerKg: 100,
    unit: 'mg',
    maxDose: 4000,
    notes: '100 mg/kg IV OD (or 50 mg/kg BD, max 4g/day). Avoid mixing with IV calcium.',
    calc: (wt) => {
      const dose = Math.min(wt * 100, 4000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(100mg/kg)',
        fullDoseString: `${str} (100mg/kg)`,
        route: 'IV',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'cefpodoxime',
    name: 'Cefpodoxime',
    genericName: 'Cefpodoxime proxetil',
    aliases: ['Orelox', 'Vantin'],
    category: 'Antibiotics',
    indication: 'Otitis Media / Sinusitis / Pharyngitis / UTI (Step-down)',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '40mg/5ml susp, 100mg/5ml susp, 100mg tab',
    dosePerKg: 5,
    unit: 'mg',
    maxDose: 200,
    notes: '5 mg/kg/dose PO BD (max 200mg/dose). Give with food.',
    calc: (wt) => {
      const dose = Math.min(wt * 5, 200);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(5mg/kg)',
        fullDoseString: `${str} (5mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'cephadrine',
    name: 'Cephadrine',
    genericName: 'Cephadrine',
    aliases: ['Velosef'],
    category: 'Antibiotics',
    indication: 'Skin & soft tissue infection / UTI / RTI',
    route: 'PO',
    frequency: 'QID',
    isStat: false,
    forms: '125mg/5ml susp, 250mg/5ml susp, 250mg cap',
    dosePerKg: 12.5,
    unit: 'mg',
    maxDose: 500,
    notes: '12.5-25 mg/kg/dose PO q6h (max 2g/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 12.5, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(12.5mg/kg)',
        fullDoseString: `${str} (12.5mg/kg)`,
        route: 'PO',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'chloramphenicol',
    name: 'Chloramphenicol',
    genericName: 'Chloramphenicol',
    aliases: ['Chloromycetin'],
    category: 'Antibiotics',
    indication: 'Severe enteric fever (Typhoid) / Severe Meningitis / Brain Abscess',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '1g vial inj, 125mg/5ml susp',
    dosePerKg: 18.75,
    unit: 'mg',
    maxDose: 1000,
    notes: '12.5-25 mg/kg/dose IV q6h (75-100 mg/kg/day). Monitor for gray baby syndrome and bone marrow suppression.',
    calc: (wt) => {
      const dose = Math.min(wt * 18.75, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(18.75mg/kg)',
        fullDoseString: `${str} (18.75mg/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'clindamycin',
    name: 'Clindamycin',
    genericName: 'Clindamycin',
    aliases: ['Dalacin C'],
    category: 'Antibiotics',
    indication: 'Staph aureus / Osteomyelitis / Septic Arthritis / Anaerobic infection',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '150mg/ml amp, 75mg/5ml susp, 150mg cap',
    dosePerKg: 10,
    unit: 'mg',
    maxDose: 600,
    notes: '7.5-10 mg/kg/dose IV/PO q8h (20-40 mg/kg/day, max 1.8-2.7g/day). Infuse IV over 20-30 min.',
    calc: (wt) => {
      const dose = Math.min(wt * 10, 600);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(10mg/kg)',
        fullDoseString: `${str} (10mg/kg)`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'cloxacillin-std',
    name: 'Cloxacillin (Standard Dose)',
    genericName: 'Cloxacillin',
    aliases: ['Orbenin'],
    category: 'Antibiotics',
    indication: 'Staphylococcal skin/soft tissue infection / Mild cellulitis',
    route: 'PO',
    frequency: 'QID',
    isStat: false,
    forms: '125mg/5ml susp, 250mg cap, 500mg vial',
    dosePerKg: 25,
    unit: 'mg',
    maxDose: 500,
    notes: '12.5-25 mg/kg/dose PO/IV q6h. Give oral doses on an empty stomach.',
    calc: (wt) => {
      const dose = Math.min(wt * 25, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(25mg/kg)',
        fullDoseString: `${str} (25mg/kg)`,
        route: 'PO',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'cloxacillin-severe',
    name: 'Cloxacillin (Severe Staph Dose)',
    genericName: 'Cloxacillin',
    aliases: ['Cloxacillin IV severe', 'Orbenin IV'],
    category: 'Antibiotics',
    indication: 'Severe Staph sepsis / Osteomyelitis / Septic Arthritis / Pneumatoceles',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '500mg vial, 1g vial',
    dosePerKg: 50,
    unit: 'mg',
    maxDose: 2000,
    notes: '50 mg/kg/dose IV q6h (200 mg/kg/day, max 2g/dose).',
    calc: (wt) => {
      const dose = Math.min(wt * 50, 2000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(50mg/kg)',
        fullDoseString: `${str} (50mg/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'cotrimoxazole-rx',
    name: 'Cotrimoxazole (TMP-SMZ) Treatment',
    genericName: 'Trimethoprim + Sulfamethoxazole',
    aliases: ['Bactrim', 'Septra', 'Co-trim'],
    category: 'Antibiotics',
    indication: 'UTI / Otitis media / Dysentery / Severe PCP pneumonia',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: 'Syrup (40mg TMP + 200mg SMZ / 5ml), Single Str Tab (80mg TMP/400mg SMZ)',
    dosePerKg: 4,
    unit: 'mg TMP',
    maxDose: 160,
    notes: 'Dosed by TMP component: 4-5 mg TMP/kg/dose PO BD. For severe PCP: 5 mg TMP/kg IV/PO q6h.',
    calc: (wt) => {
      const doseTmp = Math.min(wt * 4, 160);
      const smz = doseTmp * 5;
      const str = `${formatDoseNumber(doseTmp)}mg TMP / ${formatDoseNumber(smz)}mg SMZ`;
      return {
        formattedDose: str,
        formulaDisplay: '(4mg TMP/kg)',
        fullDoseString: `${str} (4mg TMP/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'cotrimoxazole-proph',
    name: 'Cotrimoxazole Prophylaxis (PCP/HEI)',
    genericName: 'Trimethoprim + Sulfamethoxazole',
    aliases: ['Bactrim Prophylaxis', 'Co-trim HEI'],
    category: 'Antibiotics',
    indication: 'HIV exposed infant (HEI) / CD4 suppression PCP prophylaxis',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: 'Syrup (40mg TMP + 200mg SMZ / 5ml)',
    dosePerKg: 2.5,
    unit: 'mg TMP',
    maxDose: 160,
    notes: '2.5 mg TMP/kg PO OD (or 5 mg TMP/kg 3x weekly). Given to all HEI infants from 4-6 wks.',
    calc: (wt) => {
      const doseTmp = Math.min(wt * 2.5, 160);
      const smz = doseTmp * 5;
      const str = `${formatDoseNumber(doseTmp)}mg TMP / ${formatDoseNumber(smz)}mg SMZ`;
      return {
        formattedDose: str,
        formulaDisplay: '(2.5mg TMP/kg)',
        fullDoseString: `${str} (2.5mg TMP/kg)`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'doxycycline',
    name: 'Doxycycline',
    genericName: 'Doxycycline',
    aliases: ['Vibramycin'],
    category: 'Antibiotics',
    indication: 'Atypical pneumonia / Rickettsia / Malaria / Chlamydia (>8 yrs)',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '50mg cap, 100mg cap',
    dosePerKg: 2,
    unit: 'mg',
    maxDose: 100,
    notes: '2 mg/kg/dose PO BD (or 2-4 mg/kg/day div BD, max 200mg/day). Avoid <8 yrs unless life-threatening.',
    calc: (wt) => {
      const dose = Math.min(wt * 2, 100);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(2mg/kg)',
        fullDoseString: `${str} (2mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'erythromycin',
    name: 'Erythromycin',
    genericName: 'Erythromycin',
    aliases: ['Erythrocin', 'E-Mycin'],
    category: 'Antibiotics',
    indication: 'Pertussis (Whooping cough) / Penicillin allergy / Atypical pneumonia',
    route: 'PO',
    frequency: 'QID',
    isStat: false,
    forms: '125mg/5ml susp, 250mg/5ml susp, 250mg tab',
    dosePerKg: 10,
    unit: 'mg',
    maxDose: 500,
    notes: '10-12.5 mg/kg/dose PO q6h (40-50 mg/kg/day, max 2g/day). Give with meals.',
    calc: (wt) => {
      const dose = Math.min(wt * 10, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(10mg/kg)',
        fullDoseString: `${str} (10mg/kg)`,
        route: 'PO',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'gentamicin',
    name: 'Gentamicin',
    genericName: 'Gentamicin sulfate',
    aliases: ['Genticyn'],
    category: 'Antibiotics',
    indication: 'Gram-negative sepsis / Neonatal sepsis / Pyelonephritis',
    route: 'IV',
    frequency: 'OD',
    isStat: false,
    forms: '20mg/2ml amp, 80mg/2ml amp',
    dosePerKg: 7.5,
    unit: 'mg',
    maxDose: 360,
    notes: 'Botswana standard: 7.5 mg/kg IV/IM OD (over 30-60 min). Monitor renal function & urine output.',
    calc: (wt) => {
      const dose = Math.min(wt * 7.5, 360);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(7.5mg/kg)',
        fullDoseString: `${str} (7.5mg/kg)`,
        route: 'IV',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'metronidazole',
    name: 'Metronidazole',
    genericName: 'Metronidazole',
    aliases: ['Flagyl'],
    category: 'Antibiotics',
    indication: 'Anaerobic infection / Intra-abdominal sepsis / Amoebiasis / Giardiasis',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '200mg/5ml susp, 200mg tab, 400mg tab, 500mg/100ml IV vial',
    dosePerKg: 7.5,
    unit: 'mg',
    maxDose: 500,
    notes: '7.5 mg/kg/dose PO/IV TDS (22.5 mg/kg/day). For amoebic dysentery: 12-15 mg/kg TDS x 7-10d.',
    calc: (wt) => {
      const dose = Math.min(wt * 7.5, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(7.5mg/kg)',
        fullDoseString: `${str} (7.5mg/kg)`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'nalidixic-acid',
    name: 'Nalidixic Acid',
    genericName: 'Nalidixic acid',
    aliases: ['NegGram'],
    category: 'Antibiotics',
    indication: 'Shigellosis / Bacillary Dysentery',
    route: 'PO',
    frequency: 'QID',
    isStat: false,
    forms: '250mg/5ml susp, 500mg tab',
    dosePerKg: 15,
    unit: 'mg',
    maxDose: 1000,
    notes: '15 mg/kg/dose PO q6h (60 mg/kg/day, max 4g/day) for 5 days.',
    calc: (wt) => {
      const dose = Math.min(wt * 15, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(15mg/kg)',
        fullDoseString: `${str} (15mg/kg)`,
        route: 'PO',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'pcn-benzathine',
    name: 'Penicillin Benzathine (Benzathine PCN)',
    genericName: 'Benzathine penicillin G',
    aliases: ['Bicillin', 'Penadur'],
    category: 'Antibiotics',
    indication: 'Rheumatic fever prophylaxis / Primary Syphilis / Group A Strep',
    route: 'IM',
    frequency: 'STAT',
    isStat: true,
    forms: '1.2 MU vial, 2.4 MU vial',
    dosePerKg: 0,
    unit: 'IU',
    maxDose: 1200000,
    notes: '<27 kg: 600,000 IU (0.6 MU) IM single dose; ≥27 kg: 1,200,000 IU (1.2 MU) IM single dose. Deep IM only.',
    calc: (wt) => {
      const iu = wt < 27 ? 600000 : 1200000;
      const str = wt < 27 ? '600,000 IU (0.6 MU)' : '1,200,000 IU (1.2 MU)';
      return {
        formattedDose: str,
        formulaDisplay: wt < 27 ? '(<27kg: 0.6MU)' : '(≥27kg: 1.2MU)',
        fullDoseString: `${str} IM Stat`,
        route: 'IM',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'pcn-benzyl',
    name: 'Penicillin Benzyl (X-pen / Crystalline PCN)',
    genericName: 'Benzylpenicillin sodium',
    aliases: ['X-pen', 'Crystalline penicillin', 'Penicillin G'],
    category: 'Antibiotics',
    indication: 'Severe Pneumonia / Streptococcal Sepsis / Tetanus / Meningitis',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '1 MU vial, 5 MU vial',
    dosePerKg: 50000,
    unit: 'IU',
    maxDose: 4000000,
    notes: '50,000 - 100,000 IU/kg/dose IV q6h (for meningitis: 100,000 IU/kg q4h, max 24 MU/day).',
    calc: (wt) => {
      const iu = Math.min(wt * 50000, 4000000);
      const str = `${(iu / 1000000).toFixed(2)} MU (${Math.round(iu).toLocaleString()} IU)`;
      return {
        formattedDose: str,
        formulaDisplay: '(50,000 IU/kg)',
        fullDoseString: `${str} (50,000 IU/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'pen-v',
    name: 'Penicillin V (Phenoxymethylpenicillin)',
    genericName: 'Phenoxymethylpenicillin',
    aliases: ['Pen-VK', 'Betapen'],
    category: 'Antibiotics',
    indication: 'Streptococcal pharyngitis / Splenectomy prophylaxis / Sickle cell',
    route: 'PO',
    frequency: 'QID',
    isStat: false,
    forms: '125mg/5ml susp, 250mg/5ml susp, 250mg tab',
    dosePerKg: 12.5,
    unit: 'mg',
    maxDose: 500,
    notes: '12.5-25 mg/kg/dose PO q6h (max 500mg/dose). Give on empty stomach 1h before food.',
    calc: (wt) => {
      const dose = Math.min(wt * 12.5, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(12.5mg/kg)',
        fullDoseString: `${str} (12.5mg/kg)`,
        route: 'PO',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'piperacillin-tazo',
    name: 'Piperacillin-Tazobactam (Tazocin)',
    genericName: 'Piperacillin + Tazobactam',
    aliases: ['Tazocin', 'Zosyn'],
    category: 'Antibiotics',
    indication: 'Severe hospital-acquired sepsis / Febrile Neutropenia / Pseudomonas',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '2.25g vial, 4.5g vial',
    dosePerKg: 80,
    unit: 'mg',
    maxDose: 4500,
    notes: '75-100 mg/kg/dose IV q6-8h (infuse over 30 min, max 4.5g/dose).',
    calc: (wt) => {
      const dose = Math.min(wt * 80, 4500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(80mg/kg)',
        fullDoseString: `${str} (80mg/kg)`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'vancomycin',
    name: 'Vancomycin',
    genericName: 'Vancomycin hydrochloride',
    aliases: ['Vancocin'],
    category: 'Antibiotics',
    indication: 'MRSA / Resistant Enterococcus / Sepsis in PICU / C. difficile',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '500mg vial, 1g vial',
    dosePerKg: 15,
    unit: 'mg',
    maxDose: 1000,
    notes: '10-15 mg/kg/dose IV q8h (infuse over ≥60 min to prevent Red Man syndrome). Monitor trough levels.',
    calc: (wt) => {
      const dose = Math.min(wt * 15, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(15mg/kg)',
        fullDoseString: `${str} (15mg/kg)`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },

  // ==========================================
  // ANTIFUNGALS & ANTIVIRALS
  // ==========================================
  {
    id: 'acyclovir-po',
    name: 'Acyclovir (Oral)',
    genericName: 'Acyclovir',
    aliases: ['Zovirax'],
    category: 'Antiparasitic / Antifungal',
    indication: 'Herpes simplex mucocutaneous / Varicella zoster (Chickenpox)',
    route: 'PO',
    frequency: 'QID',
    isStat: false,
    forms: '200mg/5ml susp, 200mg tab, 400mg tab',
    dosePerKg: 20,
    unit: 'mg',
    maxDose: 800,
    notes: '20 mg/kg/dose PO 4-5 times/day x 5-7 days (max 800mg/dose). Ensure adequate hydration.',
    calc: (wt) => {
      const dose = Math.min(wt * 20, 800);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(20mg/kg)',
        fullDoseString: `${str} (20mg/kg)`,
        route: 'PO',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'acyclovir-iv',
    name: 'Acyclovir (IV Encephalitis)',
    genericName: 'Acyclovir sodium',
    aliases: ['Zovirax IV'],
    category: 'Antiparasitic / Antifungal',
    indication: 'HSV Encephalitis / Disseminated Neonatal HSV',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '250mg vial, 500mg vial',
    dosePerKg: 15,
    unit: 'mg',
    maxDose: 1000,
    notes: '10-20 mg/kg/dose IV q8h (infuse over 1h with liberal fluids to protect kidneys).',
    calc: (wt) => {
      const dose = Math.min(wt * 15, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(15mg/kg)',
        fullDoseString: `${str} (15mg/kg)`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'amphotericin-b',
    name: 'Amphotericin B (Deoxycholate)',
    genericName: 'Amphotericin B',
    aliases: ['Fungizone'],
    category: 'Antiparasitic / Antifungal',
    indication: 'Cryptococcal meningitis / Severe systemic fungal infection',
    route: 'IV',
    frequency: 'OD',
    isStat: false,
    forms: '50mg vial inj',
    dosePerKg: 0.7,
    unit: 'mg',
    maxDose: 50,
    notes: '0.5-1 mg/kg/day IV infusion over 4-6h diluted in 5% Dextrose ONLY (never saline). Test dose 0.1 mg/kg.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.7, 50);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.7mg/kg)',
        fullDoseString: `${str} (0.7mg/kg) in D5W`,
        route: 'IV',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'fluconazole',
    name: 'Fluconazole',
    genericName: 'Fluconazole',
    aliases: ['Diflucan'],
    category: 'Antiparasitic / Antifungal',
    indication: 'Oral/Esophageal Candidiasis / Systemic fungal infection',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '50mg/5ml susp, 50mg cap, 150mg cap, 200mg/100ml IV vial',
    dosePerKg: 6,
    unit: 'mg',
    maxDose: 400,
    notes: 'Loading 6-12 mg/kg, then 3-6 mg/kg/day PO/IV OD (max 400mg/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 6, 400);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(6mg/kg)',
        fullDoseString: `${str} (6mg/kg)`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'ganciclovir',
    name: 'Ganciclovir',
    genericName: 'Ganciclovir sodium',
    aliases: ['Cymevene'],
    category: 'Antiparasitic / Antifungal',
    indication: 'Congenital CMV / CMV Retinitis / Immunocompromised CMV pneumonitis',
    route: 'IV',
    frequency: 'BD',
    isStat: false,
    forms: '500mg vial',
    dosePerKg: 5,
    unit: 'mg',
    maxDose: 500,
    notes: 'Induction: 5 mg/kg/dose IV q12h x 14-21 days (infuse over 1h). Monitor FBC for neutropenia.',
    calc: (wt) => {
      const dose = Math.min(wt * 5, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(5mg/kg)',
        fullDoseString: `${str} (5mg/kg)`,
        route: 'IV',
        frequency: 'BD'
      };
    }
  },

  // ==========================================
  // ANALGESICS, ANTIPYRETICS & SEDATION
  // ==========================================
  {
    id: 'paracetamol',
    name: 'Paracetamol (Standard)',
    genericName: 'Paracetamol',
    aliases: ['Acetaminophen', 'Panado', 'Calpol'],
    category: 'Analgesics / Antipyretics',
    indication: 'Fever / Mild to moderate pain',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '120mg/5ml syrup, 250mg/5ml syrup, 500mg tab, 125mg/250mg supp',
    dosePerKg: 15,
    unit: 'mg',
    maxDose: 1000,
    notes: '10-15 mg/kg/dose PO/PR q4-6h (standard 15 mg/kg TDS, max 60 mg/kg/day or 1g/dose).',
    calc: (wt) => {
      const dose = Math.min(wt * 15, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(15mg/kg)',
        fullDoseString: `${str} (15mg/kg)`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'paracetamol-stat',
    name: 'Paracetamol Stat (PO/PR)',
    genericName: 'Paracetamol',
    aliases: ['Panado stat', 'Calpol stat'],
    category: 'Analgesics / Antipyretics',
    indication: 'High fever / Acute pain stat dose',
    route: 'PR/PO',
    frequency: 'STAT',
    isStat: true,
    forms: '120mg/5ml syrup, 125mg/250mg supp',
    dosePerKg: 15,
    unit: 'mg',
    maxDose: 1000,
    notes: '15 mg/kg stat PO or PR for rapid temperature reduction.',
    calc: (wt) => {
      const dose = Math.min(wt * 15, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(15mg/kg)',
        fullDoseString: `${str} (15mg/kg)`,
        route: 'PR/PO',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    aliases: ['Brufen', 'Nurofen', 'Advil'],
    category: 'Analgesics / Antipyretics',
    indication: 'Inflammatory pain / Musculoskeletal pain / High fever',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '100mg/5ml susp, 200mg tab, 400mg tab',
    dosePerKg: 10,
    unit: 'mg',
    maxDose: 400,
    notes: '5-10 mg/kg/dose PO TDS (max 400mg/dose, 40 mg/kg/day). Take with food. Avoid in dehydrated children.',
    calc: (wt) => {
      const dose = Math.min(wt * 10, 400);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(10mg/kg)',
        fullDoseString: `${str} (10mg/kg)`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'codeine',
    name: 'Codeine Phosphate',
    genericName: 'Codeine phosphate',
    aliases: ['Codeine'],
    category: 'Analgesics / Antipyretics',
    indication: 'Moderate pain (Use caution; not recommended in <12 yrs post-tonsillectomy)',
    route: 'PO',
    frequency: 'PRN',
    isStat: false,
    forms: '15mg/5ml syrup, 30mg tab',
    dosePerKg: 0.5,
    unit: 'mg',
    maxDose: 30,
    notes: '0.5-1 mg/kg/dose PO q4-6h prn (max 30-60mg/dose). Risk of respiratory depression.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.5, 30);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.5mg/kg)',
        fullDoseString: `${str} (0.5mg/kg)`,
        route: 'PO',
        frequency: 'PRN'
      };
    }
  },
  {
    id: 'morphine',
    name: 'Morphine Sulfate',
    genericName: 'Morphine sulfate',
    aliases: ['MST', 'Morphine IV'],
    category: 'Analgesics / Antipyretics',
    indication: 'Severe acute pain / Sickle cell crisis / Post-operative pain / Burns',
    route: 'IV',
    frequency: 'PRN',
    isStat: false,
    forms: '10mg/ml ampoule',
    dosePerKg: 0.1,
    unit: 'mg',
    maxDose: 10,
    notes: '0.05-0.1 mg/kg/dose slow IV over 5 min q2-4h prn (max 0.2 mg/kg or 10mg). Monitor SpO2 and respiratory rate.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.1, 10);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.1mg/kg)',
        fullDoseString: `${str} (0.1mg/kg)`,
        route: 'IV',
        frequency: 'PRN'
      };
    }
  },
  {
    id: 'pethidine',
    name: 'Pethidine (Meperidine)',
    genericName: 'Pethidine hydrochloride',
    aliases: ['Demerol'],
    category: 'Analgesics / Antipyretics',
    indication: 'Severe acute procedural or visceral pain',
    route: 'IM',
    frequency: 'PRN',
    isStat: false,
    forms: '50mg/ml ampoule',
    dosePerKg: 0.8,
    unit: 'mg',
    maxDose: 50,
    notes: '0.5-1 mg/kg/dose IM/SC/slow IV q3-4h prn (max 50mg/dose).',
    calc: (wt) => {
      const dose = Math.min(wt * 0.8, 50);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.8mg/kg)',
        fullDoseString: `${str} (0.8mg/kg)`,
        route: 'IM',
        frequency: 'PRN'
      };
    }
  },
  {
    id: 'ketamine-sedation',
    name: 'Ketamine (Procedural Sedation)',
    genericName: 'Ketamine hydrochloride',
    aliases: ['Ketalar'],
    category: 'Anticonvulsants & Sedatives',
    indication: 'Procedural sedation / Painful procedures / Fracture reduction',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '50mg/ml vial',
    dosePerKg: 1.5,
    unit: 'mg',
    maxDose: 100,
    notes: '1-2 mg/kg slow IV over 1-2 min (or 3-5 mg/kg IM). Keep suction and bag-valve-mask ready.',
    calc: (wt) => {
      const dose = Math.min(wt * 1.5, 100);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(1.5mg/kg)',
        fullDoseString: `${str} (1.5mg/kg) slow IV`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'midazolam-sedation',
    name: 'Midazolam (Conscious Sedation)',
    genericName: 'Midazolam hydrochloride',
    aliases: ['Dormicum', 'Versed'],
    category: 'Anticonvulsants & Sedatives',
    indication: 'Procedural sedation / Anxiolysis / Acute agitation',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '5mg/ml amp, 1mg/ml amp',
    dosePerKg: 0.1,
    unit: 'mg',
    maxDose: 5,
    notes: '0.05-0.1 mg/kg slow IV over 2-3 min (max 5mg). For buccal/intranasal: 0.2-0.3 mg/kg.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.1, 5);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.1mg/kg)',
        fullDoseString: `${str} (0.1mg/kg) IV Stat`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },

  // ==========================================
  // ANTICONVULSANTS & EMERGENCY NEURO
  // ==========================================
  {
    id: 'diazepam-iv',
    name: 'Diazepam IV (Status Epilepticus)',
    genericName: 'Diazepam',
    aliases: ['Valium IV'],
    category: 'Emergency & Resuscitation',
    indication: 'Acute convulsion / Status epilepticus',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '10mg/2ml ampoule',
    dosePerKg: 0.3,
    unit: 'mg',
    maxDose: 10,
    notes: '0.2-0.3 mg/kg slow IV over 2-3 min (max 5mg if <5 yrs, max 10mg if ≥5 yrs). Monitor airway and breathing.',
    calc: (wt) => {
      const cap = wt < 20 ? 5 : 10;
      const dose = Math.min(wt * 0.3, cap);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.3mg/kg)',
        fullDoseString: `${str} (0.3mg/kg) slow IV Stat`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'diazepam-pr',
    name: 'Diazepam PR (Rectal Seizure Dose)',
    genericName: 'Diazepam',
    aliases: ['Valium PR', 'Stesolid'],
    category: 'Emergency & Resuscitation',
    indication: 'Acute convulsion without IV access',
    route: 'PR',
    frequency: 'STAT',
    isStat: true,
    forms: '5mg rectal tube, 10mg rectal tube, IV solution given rectally via syringe without needle',
    dosePerKg: 0.5,
    unit: 'mg',
    maxDose: 10,
    notes: '0.5 mg/kg PR (max 5mg if <5 yrs, 10mg if ≥5 yrs). Administer via 1ml syringe/cannula into rectum.',
    calc: (wt) => {
      const cap = wt < 20 ? 5 : 10;
      const dose = Math.min(wt * 0.5, cap);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.5mg/kg)',
        fullDoseString: `${str} (0.5mg/kg) PR Stat`,
        route: 'PR',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'phenobarbitone-load',
    name: 'Phenobarbitone (Loading Dose)',
    genericName: 'Phenobarbital sodium',
    aliases: ['Luminal', 'Phenobarbitone IV'],
    category: 'Emergency & Resuscitation',
    indication: 'Neonatal seizures / Status epilepticus after benzodiazepine failure',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '200mg/ml ampoule',
    dosePerKg: 20,
    unit: 'mg',
    maxDose: 1000,
    notes: '15-20 mg/kg IV infused over 15-20 minutes. Dilute with sterile water.',
    calc: (wt) => {
      const dose = Math.min(wt * 20, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(20mg/kg)',
        fullDoseString: `${str} (20mg/kg) IV load over 15-20 min`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'phenobarbitone-maint',
    name: 'Phenobarbitone (Maintenance)',
    genericName: 'Phenobarbital',
    aliases: ['Luminal maintenance'],
    category: 'Anticonvulsants & Sedatives',
    indication: 'Epilepsy maintenance / Neonatal seizure follow-up',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '15mg tab, 30mg tab, 60mg tab, 15mg/5ml liquid',
    dosePerKg: 2.5,
    unit: 'mg',
    maxDose: 100,
    notes: '2.5-5 mg/kg/day PO divided BD or OD at bedtime. Start 12-24h after loading dose.',
    calc: (wt) => {
      const dose = Math.min(wt * 2.5, 100);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(2.5mg/kg)',
        fullDoseString: `${str} (2.5mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'phenytoin-load',
    name: 'Phenytoin (Loading Dose)',
    genericName: 'Phenytoin sodium',
    aliases: ['Epanutin', 'Dilantin'],
    category: 'Emergency & Resuscitation',
    indication: 'Status epilepticus refractory to benzodiazepines',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '250mg/5ml ampoule',
    dosePerKg: 18,
    unit: 'mg',
    maxDose: 1000,
    notes: '15-20 mg/kg IV in 0.9% Normal Saline ONLY over 20-30 min (rate <1 mg/kg/min). Never mix with dextrose.',
    calc: (wt) => {
      const dose = Math.min(wt * 18, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(18mg/kg)',
        fullDoseString: `${str} (18mg/kg) in NS over 20-30 min`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'phenytoin-maint',
    name: 'Phenytoin (Maintenance)',
    genericName: 'Phenytoin',
    aliases: ['Epanutin PO'],
    category: 'Anticonvulsants & Sedatives',
    indication: 'Partial & generalized tonic-clonic seizures maintenance',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '30mg/5ml susp, 50mg chewable tab, 100mg cap',
    dosePerKg: 3.5,
    unit: 'mg',
    maxDose: 150,
    notes: '2.5-5 mg/kg/dose PO BD (5-8 mg/kg/day). Monitor levels and gum hypertrophy.',
    calc: (wt) => {
      const dose = Math.min(wt * 3.5, 150);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(3.5mg/kg)',
        fullDoseString: `${str} (3.5mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'valproate',
    name: 'Sodium Valproate',
    genericName: 'Sodium valproate',
    aliases: ['Epilim'],
    category: 'Anticonvulsants & Sedatives',
    indication: 'Generalized epilepsy / Absence seizures / Myoclonic seizures',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '200mg/5ml syrup, 100mg/200mg/500mg crushable/gastro-resistant tabs',
    dosePerKg: 10,
    unit: 'mg',
    maxDose: 500,
    notes: 'Initial 10-15 mg/kg/day div BD; titrate to 20-30 mg/kg/day (max 40 mg/kg/day). Take with meals.',
    calc: (wt) => {
      const dose = Math.min(wt * 10, 500);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(10mg/kg)',
        fullDoseString: `${str} (10mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'carbamazepine',
    name: 'Carbamazepine',
    genericName: 'Carbamazepine',
    aliases: ['Tegretol'],
    category: 'Anticonvulsants & Sedatives',
    indication: 'Focal seizures / Trigeminal neuralgia',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '100mg/5ml susp, 100mg tab, 200mg tab',
    dosePerKg: 5,
    unit: 'mg',
    maxDose: 200,
    notes: 'Initial 5 mg/kg/day div BD, gradually titrate to 10-20 mg/kg/day (max 1000mg/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 5, 200);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(5mg/kg)',
        fullDoseString: `${str} (5mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'mannitol',
    name: 'Mannitol 20%',
    genericName: 'Mannitol',
    aliases: ['Osmitrol'],
    category: 'Emergency & Resuscitation',
    indication: 'Acute cerebral oedema / Raised intracranial pressure (ICP) / Brain herniation',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '20% solution (0.2g/ml)',
    dosePerKg: 0.5,
    unit: 'g',
    maxDose: 50,
    notes: '0.25-0.5 g/kg (1.25-2.5 ml/kg of 20% solution) IV over 20-30 min. Check serum osmolarity and renal function.',
    calc: (wt) => {
      const grams = Math.min(wt * 0.5, 50);
      const ml = Math.min(wt * 2.5, 250);
      const str = `${formatDoseNumber(ml)}ml 20% (${formatDoseNumber(grams)}g)`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.5g/kg = 2.5ml/kg)',
        fullDoseString: `${str} IV over 20-30 min`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },

  // ==========================================
  // EMERGENCY & RESUSCITATION
  // ==========================================
  {
    id: 'adrenaline-anaph',
    name: 'Adrenaline (1:1000 Anaphylaxis / Severe Asthma)',
    genericName: 'Adrenaline (Epinephrine)',
    aliases: ['Epinephrine 1:1000', 'Epi IM'],
    category: 'Emergency & Resuscitation',
    indication: 'Anaphylaxis / Severe unresponsive bronchospasm',
    route: 'IM',
    frequency: 'STAT',
    isStat: true,
    forms: '1:1000 ampoule (1mg/ml)',
    dosePerKg: 0.01,
    unit: 'mg',
    maxDose: 0.5,
    notes: '0.01 mg/kg (0.01 ml/kg of 1:1000) IM into anterolateral thigh. Repeat every 5-15 min if no improvement (max 0.5mg).',
    calc: (wt) => {
      const mg = Math.min(wt * 0.01, 0.5);
      const ml = mg; // 1mg/ml
      const str = `${formatDoseNumber(mg)}mg (${formatDoseNumber(ml)}ml of 1:1000)`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.01mg/kg = 0.01ml/kg of 1:1000)',
        fullDoseString: `${str} IM Stat (anterolateral thigh)`,
        route: 'IM',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'adrenaline-croup',
    name: 'Adrenaline (Nebulized for Croup / Stridor)',
    genericName: 'Adrenaline (Epinephrine)',
    aliases: ['Racemic adrenaline', 'Epi neb'],
    category: 'Respiratory & Asthma',
    indication: 'Moderate to severe Croup / Subglottic oedema / Post-extubation stridor',
    route: 'NEB',
    frequency: 'STAT',
    isStat: true,
    forms: '1:1000 ampoule (1mg/ml)',
    dosePerKg: 0.5,
    unit: 'ml',
    maxDose: 5,
    notes: '0.5 ml/kg of 1:1000 (max 5ml) made up to 3-4 ml with Normal Saline. Nebulize with 6-8 L/min O2. Monitor for rebound stridor.',
    calc: (wt) => {
      const ml = Math.min(wt * 0.5, 5);
      const str = `${formatDoseNumber(ml)}ml 1:1000 in 3ml NS`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.5ml/kg of 1:1000, max 5ml)',
        fullDoseString: `${str} via Nebulizer with O2 Stat`,
        route: 'NEB',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'adrenaline-arrest',
    name: 'Adrenaline (1:10,000 Cardiac Arrest)',
    genericName: 'Adrenaline (Epinephrine)',
    aliases: ['Epi arrest', 'Adrenaline CPR'],
    category: 'Emergency & Resuscitation',
    indication: 'Pediatric Cardiac Arrest / Asystole / Pulseless Electrical Activity',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '1:10,000 solution (0.1mg/ml) or 1ml of 1:1000 diluted to 10ml with NS',
    dosePerKg: 0.01,
    unit: 'mg',
    maxDose: 1,
    notes: '0.01 mg/kg (0.1 ml/kg of 1:10,000) IV/IO every 3-5 minutes during CPR. Follow with 5ml NS flush.',
    calc: (wt) => {
      const mg = Math.min(wt * 0.01, 1);
      const ml = mg * 10;
      const str = `${formatDoseNumber(ml)}ml 1:10,000 (${formatDoseNumber(mg)}mg)`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.1ml/kg of 1:10,000)',
        fullDoseString: `${str} IV/IO Stat during CPR`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'atropine',
    name: 'Atropine',
    genericName: 'Atropine sulfate',
    aliases: ['Atropine'],
    category: 'Emergency & Resuscitation',
    indication: 'Symptomatic bradycardia / Organophosphate poisoning / Pre-intubation',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '0.5mg/ml ampoule, 1mg/ml ampoule',
    dosePerKg: 0.02,
    unit: 'mg',
    maxDose: 0.5,
    notes: '0.01-0.02 mg/kg IV/IM (minimum dose 0.1 mg to prevent paradoxical bradycardia, max single dose 0.5 mg).',
    calc: (wt) => {
      let dose = wt * 0.02;
      if (dose < 0.1) dose = 0.1;
      if (dose > 0.5) dose = 0.5;
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.02mg/kg, min 0.1mg)',
        fullDoseString: `${str} IV Stat`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'calcium-gluconate',
    name: 'Calcium Gluconate 10%',
    genericName: 'Calcium gluconate',
    aliases: ['Calcium 10%'],
    category: 'Emergency & Resuscitation',
    indication: 'Hypocalcemia / Severe Hyperkalemia / Hypomagnesemia / Calcium channel blocker toxicity',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '10% solution (100mg/ml, 0.22mmol Ca/ml)',
    dosePerKg: 0.5,
    unit: 'ml',
    maxDose: 10,
    notes: '0.5-1 ml/kg (50-100 mg/kg) slow IV over 5-10 minutes with continuous ECG monitoring (max 10ml). Stop if bradycardia occurs.',
    calc: (wt) => {
      const ml = Math.min(wt * 0.5, 10);
      const str = `${formatDoseNumber(ml)}ml 10% (${formatDoseNumber(ml * 100)}mg)`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.5ml/kg 10% slow IV)',
        fullDoseString: `${str} slow IV over 10 min`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },

  // ==========================================
  // RESPIRATORY & ASTHMA
  // ==========================================
  {
    id: 'salbutamol-neb',
    name: 'Salbutamol Nebulization',
    genericName: 'Salbutamol (Albuterol)',
    aliases: ['Ventolin neb', 'Salbutamol neb'],
    category: 'Respiratory & Asthma',
    indication: 'Acute bronchospasm / Asthma exacerbation / Wheeze',
    route: 'NEB',
    frequency: 'PRN',
    isStat: false,
    forms: 'Nebulizing solution 5mg/ml (0.5%), Respules 2.5mg/2.5ml',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 5,
    notes: '<5 years (or <15kg): 1.25-2.5 mg (0.25-0.5 ml); ≥5 years (or ≥15kg): 2.5-5 mg (0.5-1 ml) made up to 3ml with NS. Driven with 6-8 L/min O2.',
    calc: (wt) => {
      const mg = wt < 15 ? 2.5 : 5.0;
      const mlOfSolution = mg / 5;
      const str = `${mg}mg (${mlOfSolution}ml of 5mg/ml in 3ml NS)`;
      return {
        formattedDose: str,
        formulaDisplay: wt < 15 ? '(<15kg: 2.5mg neb)' : '(≥15kg: 5mg neb)',
        fullDoseString: `${str} via Nebulizer with O2 q20m prn`,
        route: 'NEB',
        frequency: 'PRN'
      };
    }
  },
  {
    id: 'salbutamol-mdi',
    name: 'Salbutamol MDI with Spacer',
    genericName: 'Salbutamol MDI',
    aliases: ['Ventolin inhaler', 'Asthavent'],
    category: 'Respiratory & Asthma',
    indication: 'Mild/Moderate acute asthma / Maintenance bronchodilation',
    route: 'Inhaled',
    frequency: 'PRN',
    isStat: false,
    forms: '100 mcg/puff metered dose inhaler',
    dosePerKg: 0,
    unit: 'puffs',
    maxDose: 10,
    notes: '2-6 puffs via spacer (1 puff at a time with 5 normal breaths per puff) q20min x 3 doses in acute exacerbation, then q2-4h.',
    calc: (wt) => {
      const puffs = wt < 15 ? 4 : 6;
      const str = `${puffs} puffs (100mcg/puff)`;
      return {
        formattedDose: str,
        formulaDisplay: wt < 15 ? '(4 puffs via spacer)' : '(6 puffs via spacer)',
        fullDoseString: `${str} via Spacer q2-4h prn`,
        route: 'Inhaled',
        frequency: 'PRN'
      };
    }
  },
  {
    id: 'aminophylline',
    name: 'Aminophylline IV',
    genericName: 'Aminophylline',
    aliases: ['Theophylline'],
    category: 'Respiratory & Asthma',
    indication: 'Severe acute asthma refractory to inhaled beta-agonists and steroids',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '250mg/10ml ampoule',
    dosePerKg: 5,
    unit: 'mg',
    maxDose: 250,
    notes: 'Loading dose: 5-6 mg/kg IV in D5W or NS over 20-30 min (omit loading dose if already taking theophylline). Maintenance: 0.5-0.9 mg/kg/hr.',
    calc: (wt) => {
      const dose = Math.min(wt * 5, 250);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(5mg/kg load over 30 min)',
        fullDoseString: `${str} IV load over 20-30 min`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'beclomethasone',
    name: 'Beclomethasone Inhaler',
    genericName: 'Beclomethasone dipropionate',
    aliases: ['Becotide', 'Clenil'],
    category: 'Respiratory & Asthma',
    indication: 'Persistent asthma long-term maintenance',
    route: 'Inhaled',
    frequency: 'BD',
    isStat: false,
    forms: '50 mcg/puff, 100 mcg/puff MDI',
    dosePerKg: 0,
    unit: 'mcg',
    maxDose: 200,
    notes: '50-100 mcg (1-2 puffs of 50mcg) BD via spacer. Rinse mouth with water after use.',
    calc: () => {
      return {
        formattedDose: '100 mcg (2 puffs of 50mcg)',
        formulaDisplay: '(100 mcg BD)',
        fullDoseString: '100 mcg (2 puffs) via Spacer BD',
        route: 'Inhaled',
        frequency: 'BD'
      };
    }
  },

  // ==========================================
  // STEROIDS (CORTICOSTEROIDS)
  // ==========================================
  {
    id: 'prednisolone-asthma',
    name: 'Prednisolone (Asthma / Croup)',
    genericName: 'Prednisolone',
    aliases: ['Prelone', 'Predone'],
    category: 'Steroids',
    indication: 'Acute asthma exacerbation / Croup step-down',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '5mg/5ml syrup, 5mg tab, 20mg tab',
    dosePerKg: 1,
    unit: 'mg',
    maxDose: 40,
    notes: '1-2 mg/kg/day PO OD in the morning for 3-5 days (max 40mg/day). No taper needed if ≤5 days.',
    calc: (wt) => {
      const dose = Math.min(wt * 1, 40);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(1mg/kg)',
        fullDoseString: `${str} (1mg/kg) for 3-5 days`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'prednisolone-nephrotic',
    name: 'Prednisolone (Nephrotic Syndrome)',
    genericName: 'Prednisolone',
    aliases: ['Prelone nephrotic'],
    category: 'Steroids',
    indication: 'Nephrotic syndrome initial induction therapy',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '5mg tab, 20mg tab',
    dosePerKg: 2,
    unit: 'mg',
    maxDose: 60,
    notes: '2 mg/kg/day (or 60 mg/m²/day) PO OD x 4-6 weeks (max 60mg/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 2, 60);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(2mg/kg)',
        fullDoseString: `${str} (2mg/kg) morning dose`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'dexamethasone-croup',
    name: 'Dexamethasone (Croup / Laryngotracheitis)',
    genericName: 'Dexamethasone sodium phosphate',
    aliases: ['Decadron'],
    category: 'Steroids',
    indication: 'Croup (Laryngotracheobronchitis)',
    route: 'PO',
    frequency: 'STAT',
    isStat: true,
    forms: '0.5mg tab, 2mg tab, 4mg/ml ampoule inj (can be given orally)',
    dosePerKg: 0.6,
    unit: 'mg',
    maxDose: 16,
    notes: '0.6 mg/kg PO/IM/IV single dose (max 16mg). Injectable solution can be mixed with sweet syrup for oral intake.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.6, 16);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.6mg/kg single dose)',
        fullDoseString: `${str} (0.6mg/kg) PO/IV Stat`,
        route: 'PO',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'dexamethasone-meningitis',
    name: 'Dexamethasone (Meningitis Adjunct)',
    genericName: 'Dexamethasone',
    aliases: ['Decadron meningitis'],
    category: 'Steroids',
    indication: 'H. influenzae / Pneumococcal meningitis (given prior to or with 1st antibiotic)',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '4mg/ml ampoule inj',
    dosePerKg: 0.15,
    unit: 'mg',
    maxDose: 10,
    notes: '0.15 mg/kg/dose IV q6h (or 0.4 mg/kg IV q12h) for 2-4 days. Reduces hearing loss.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.15, 10);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.15mg/kg)',
        fullDoseString: `${str} (0.15mg/kg) x 2 days`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },
  {
    id: 'hydrocortisone-iv',
    name: 'Hydrocortisone IV',
    genericName: 'Hydrocortisone sodium succinate',
    aliases: ['Solu-Cortef'],
    category: 'Steroids',
    indication: 'Severe acute asthma / Anaphylaxis / Adrenal crisis / Septic shock',
    route: 'IV',
    frequency: 'QID',
    isStat: false,
    forms: '100mg vial',
    dosePerKg: 2,
    unit: 'mg',
    maxDose: 100,
    notes: '2-4 mg/kg/dose IV q6h (max 100-200mg). Reconstitute with 2ml sterile water.',
    calc: (wt) => {
      const dose = Math.min(wt * 2, 100);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(2mg/kg)',
        fullDoseString: `${str} (2mg/kg)`,
        route: 'IV',
        frequency: 'QID'
      };
    }
  },

  // ==========================================
  // GI & FLUIDS
  // ==========================================
  {
    id: 'ors-plan-b',
    name: 'ORS (Oral Rehydration Solution - Plan B)',
    genericName: 'Oral Rehydration Salts',
    aliases: ['ORS', 'Plan B Rehydration'],
    category: 'GI & Fluids',
    indication: 'Some dehydration / Acute gastroenteritis',
    route: 'PO',
    frequency: 'PRN',
    isStat: false,
    forms: 'Standard WHO-UNICEF low osmolarity sachet dissolved in 1L clean water',
    dosePerKg: 75,
    unit: 'ml',
    maxDose: 2000,
    notes: '75 ml/kg given frequently over 4 hours. If child vomits, wait 10 min and give more slowly.',
    calc: (wt) => {
      const ml = Math.min(Math.round(wt * 75), 2000);
      const str = `${ml} ml`;
      return {
        formattedDose: str,
        formulaDisplay: '(75ml/kg over 4 hours)',
        fullDoseString: `${str} (75ml/kg) PO over 4 hours`,
        route: 'PO',
        frequency: 'PRN'
      };
    }
  },
  {
    id: 'zinc-sulfate',
    name: 'Zinc Sulfate',
    genericName: 'Zinc sulfate dispersible',
    aliases: ['Zinc', 'Zinconia'],
    category: 'GI & Fluids',
    indication: 'Acute / persistent diarrhea in children under 5 years',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '20mg dispersible tablet (score in half for 10mg)',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 20,
    notes: '<6 months: 10 mg PO OD x 14 days; ≥6 months: 20 mg PO OD x 14 days. Dissolve in breast milk or ORS.',
    calc: (wt, age, ageUnit) => {
      let isUnder6Mo = false;
      if (ageUnit === 'months' && Number(age) < 6) isUnder6Mo = true;
      if (wt < 6 && (!age || isUnder6Mo)) isUnder6Mo = true;

      const mg = isUnder6Mo ? 10 : 20;
      const str = `${mg}mg`;
      return {
        formattedDose: str,
        formulaDisplay: isUnder6Mo ? '(<6mo: 10mg OD x 14d)' : '(≥6mo: 20mg OD x 14d)',
        fullDoseString: `${str} PO OD x 14 days`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'metoclopramide',
    name: 'Metoclopramide',
    genericName: 'Metoclopramide hydrochloride',
    aliases: ['Maxolon', 'Plasil'],
    category: 'GI & Fluids',
    indication: 'Nausea & vomiting / GERD (avoid in infants due to dystonic reactions)',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '5mg/5ml syrup, 10mg tab, 10mg/2ml ampoule',
    dosePerKg: 0.1,
    unit: 'mg',
    maxDose: 10,
    notes: '0.1-0.15 mg/kg/dose PO/IV TDS (max 0.5 mg/kg/day, max 10mg/dose). If extrapyramidal reaction occurs, treat with biperiden.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.1, 10);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.1mg/kg)',
        fullDoseString: `${str} (0.1mg/kg)`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    aliases: ['Losec', 'Prilosec'],
    category: 'GI & Fluids',
    indication: 'GERD / Peptic ulcer / Gastric protection with NSAIDs or steroids',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '10mg cap, 20mg cap, 40mg vial inj',
    dosePerKg: 0.8,
    unit: 'mg',
    maxDose: 40,
    notes: '0.7-1 mg/kg/dose PO OD before breakfast (severe GERD 1 mg/kg BD, max 40mg/day). Do not crush granules.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.8, 40);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.8mg/kg)',
        fullDoseString: `${str} (0.8mg/kg)`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'ranitidine',
    name: 'Ranitidine',
    genericName: 'Ranitidine hydrochloride',
    aliases: ['Zantac'],
    category: 'GI & Fluids',
    indication: 'GERD / Gastritis / Stress ulcer prophylaxis',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '75mg/5ml syrup, 150mg tab, 50mg/2ml ampoule',
    dosePerKg: 2,
    unit: 'mg',
    maxDose: 150,
    notes: 'PO: 2-4 mg/kg/dose BD (max 150mg BD); IV: 1 mg/kg/dose slow IV TDS (max 50mg/dose).',
    calc: (wt) => {
      const dose = Math.min(wt * 2, 150);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(2mg/kg)',
        fullDoseString: `${str} (2mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'bisacodyl',
    name: 'Bisacodyl',
    genericName: 'Bisacodyl',
    aliases: ['Dulcolax'],
    category: 'GI & Fluids',
    indication: 'Constipation / Bowel clearance',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '5mg tab, 5mg/10mg suppository',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 10,
    notes: '2-10 yrs: 5 mg PO/PR OD; >10 yrs: 5-10 mg PO/PR OD. Do not chew tabs; take with fluid.',
    calc: (wt) => {
      const mg = wt < 25 ? 5 : 10;
      const str = `${mg}mg`;
      return {
        formattedDose: str,
        formulaDisplay: wt < 25 ? '(<25kg: 5mg)' : '(≥25kg: 10mg)',
        fullDoseString: `${str} PO at night`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },

  // ==========================================
  // CARDIOVASCULAR & DIURETICS
  // ==========================================
  {
    id: 'furosemide-iv',
    name: 'Furosemide IV (Lasix)',
    genericName: 'Furosemide',
    aliases: ['Lasix IV'],
    category: 'Cardiovascular',
    indication: 'Acute pulmonary oedema / Congestive heart failure / Fluid overload',
    route: 'IV',
    frequency: 'BD',
    isStat: false,
    forms: '20mg/2ml ampoule',
    dosePerKg: 1,
    unit: 'mg',
    maxDose: 40,
    notes: '0.5-1 mg/kg/dose slow IV q8-12h (max 2 mg/kg/dose or 40mg). Monitor electrolytes and urine output.',
    calc: (wt) => {
      const dose = Math.min(wt * 1, 40);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(1mg/kg)',
        fullDoseString: `${str} (1mg/kg)`,
        route: 'IV',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'furosemide-po',
    name: 'Furosemide PO (Lasix)',
    genericName: 'Furosemide',
    aliases: ['Lasix tab'],
    category: 'Cardiovascular',
    indication: 'Congestive heart failure / Chronic fluid overload',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '40mg tab, 10mg/ml liquid',
    dosePerKg: 1,
    unit: 'mg',
    maxDose: 40,
    notes: '1-2 mg/kg/dose PO OD or BD (max 6 mg/kg/day). Monitor potassium.',
    calc: (wt) => {
      const dose = Math.min(wt * 1, 40);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(1mg/kg)',
        fullDoseString: `${str} (1mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'spironolactone',
    name: 'Spironolactone',
    genericName: 'Spironolactone',
    aliases: ['Aldactone'],
    category: 'Cardiovascular',
    indication: 'Heart failure / Nephrotic edema / Ascites (potassium-sparing)',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '25mg tab, 100mg tab',
    dosePerKg: 1,
    unit: 'mg',
    maxDose: 100,
    notes: '1-3 mg/kg/day PO divided OD or BD (max 100mg/day). Monitor serum potassium.',
    calc: (wt) => {
      const dose = Math.min(wt * 1, 100);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(1mg/kg/day div BD)',
        fullDoseString: `${str} (1mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'captopril',
    name: 'Captopril',
    genericName: 'Captopril',
    aliases: ['Capoten'],
    category: 'Cardiovascular',
    indication: 'Congestive heart failure / Pediatric hypertension',
    route: 'PO',
    frequency: 'TDS',
    isStat: false,
    forms: '12.5mg tab, 25mg tab, 50mg tab',
    dosePerKg: 0.3,
    unit: 'mg',
    maxDose: 25,
    notes: 'Initial 0.1-0.3 mg/kg/dose PO TDS 1 hour before food; titrate to max 2 mg/kg/dose TDS (max 6 mg/kg/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 0.3, 25);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.3mg/kg)',
        fullDoseString: `${str} (0.3mg/kg) 1h before meals`,
        route: 'PO',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'enalapril',
    name: 'Enalapril',
    genericName: 'Enalapril maleate',
    aliases: ['Innovace', 'Renitec'],
    category: 'Cardiovascular',
    indication: 'Pediatric hypertension / Heart failure / Proteinuria',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '2.5mg tab, 5mg tab, 10mg tab, 20mg tab',
    dosePerKg: 0.08,
    unit: 'mg',
    maxDose: 20,
    notes: '0.05-0.1 mg/kg/day PO OD or div BD, titrate to max 0.5 mg/kg/day (max 20-40mg/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 0.08, 20);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.08mg/kg)',
        fullDoseString: `${str} (0.08mg/kg)`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'hydrochlorothiazide',
    name: 'Hydrochlorothiazide',
    genericName: 'Hydrochlorothiazide (HCTZ)',
    aliases: ['Esidrex'],
    category: 'Cardiovascular',
    indication: 'Mild hypertension / Bronchopulmonary dysplasia / Nephrogenic DI',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '25mg tab, 50mg tab',
    dosePerKg: 1,
    unit: 'mg',
    maxDose: 50,
    notes: '1-2 mg/kg/day PO divided BD (max 50mg/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 1, 50);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(1mg/kg)',
        fullDoseString: `${str} (1mg/kg)`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },

  // ==========================================
  // VITAMINS, MINERALS & NUTRITION
  // ==========================================
  {
    id: 'ferrous-sulfate',
    name: 'Iron (Ferrous Sulfate / Fumarate)',
    genericName: 'Ferrous sulfate',
    aliases: ['Iron drops', 'Fersolate'],
    category: 'Vitamins & Minerals',
    indication: 'Iron deficiency anemia treatment',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: 'Syrup 30mg elemental Fe/5ml, 200mg tab (65mg elemental Fe)',
    dosePerKg: 3,
    unit: 'mg Fe',
    maxDose: 60,
    notes: '3-6 mg elemental iron/kg/day PO divided BD/TDS between meals with vitamin C / juice (max 200mg Fe/day).',
    calc: (wt) => {
      const dose = Math.min(wt * 3, 60);
      const str = `${formatDoseNumber(dose)}mg Fe`;
      return {
        formattedDose: str,
        formulaDisplay: '(3mg elemental Fe/kg)',
        fullDoseString: `${str} (3mg Fe/kg) between meals`,
        route: 'PO',
        frequency: 'BD'
      };
    }
  },
  {
    id: 'folic-acid',
    name: 'Folic Acid',
    genericName: 'Folic acid',
    aliases: ['Folate'],
    category: 'Vitamins & Minerals',
    indication: 'Hemolytic anemia / Malnutrition / Sickle cell disease',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '5mg tab, 1mg tab',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 5,
    notes: '1-5 mg PO OD. (In SAM: 5mg day 1, then 1mg OD).',
    calc: (wt) => {
      const mg = wt < 10 ? 2.5 : 5.0;
      const str = `${mg}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(Daily Folate)',
        fullDoseString: `${str} PO OD`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'vitamin-k',
    name: 'Vitamin K1 (Phytomenadione)',
    genericName: 'Phytomenadione',
    aliases: ['Konakion'],
    category: 'Vitamins & Minerals',
    indication: 'Hemorrhagic disease of the newborn / Coagulopathy / Warfarin reversal',
    route: 'IM',
    frequency: 'STAT',
    isStat: true,
    forms: '1mg/0.5ml ampoule, 10mg/1ml ampoule',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 10,
    notes: 'Neonatal prophylaxis: 1 mg IM at birth (preterm <1kg: 0.5 mg IM). For active bleeding/coagulopathy: 0.25-0.5 mg/kg IV slowly.',
    calc: (wt) => {
      const mg = wt < 3 ? 0.5 : (wt < 10 ? 1.0 : Math.min(wt * 0.3, 10));
      const str = `${formatDoseNumber(mg)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: wt < 10 ? '(Neonatal/Infant dose)' : '(0.3mg/kg)',
        fullDoseString: `${str} IM/IV Stat`,
        route: 'IM',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'multivitamin',
    name: 'Multivitamin Syrup',
    genericName: 'Multivitamin',
    aliases: ['MVI', 'Abidec', 'Vi-Daylin'],
    category: 'Vitamins & Minerals',
    indication: 'General nutritional supplementation / Convalescence / Malnutrition',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: 'Syrup / Drops',
    dosePerKg: 0,
    unit: 'ml',
    maxDose: 5,
    notes: 'Infants <1 yr: 2.5 ml PO OD; Children ≥1 yr: 5 ml PO OD.',
    calc: (wt) => {
      const ml = wt < 10 ? 2.5 : 5.0;
      const str = `${ml} ml`;
      return {
        formattedDose: str,
        formulaDisplay: wt < 10 ? '(<10kg: 2.5ml)' : '(≥10kg: 5ml)',
        fullDoseString: `${str} PO OD`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'thiamine',
    name: 'Thiamine (Vitamin B1)',
    genericName: 'Thiamine hydrochloride',
    aliases: ['Vit B1'],
    category: 'Vitamins & Minerals',
    indication: 'Beriberi / SAM refeeding syndrome / Nutritional deficiency',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '50mg tab, 100mg tab, 100mg/ml ampoule',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 50,
    notes: '10-50 mg PO/IV OD for 1-2 weeks.',
    calc: (wt) => {
      const mg = wt < 10 ? 25 : 50;
      const str = `${mg}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(Daily B1)',
        fullDoseString: `${str} PO OD`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },
  {
    id: 'pyridoxine',
    name: 'Pyridoxine (Vitamin B6)',
    genericName: 'Pyridoxine hydrochloride',
    aliases: ['Vit B6'],
    category: 'Vitamins & Minerals',
    indication: 'Isoniazid (INH) neuropathy prophylaxis / Pyridoxine-dependent seizures',
    route: 'PO',
    frequency: 'OD',
    isStat: false,
    forms: '25mg tab, 50mg tab',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 50,
    notes: '1-2 mg/kg/day PO OD (or 10-25 mg PO OD) with INH regimen.',
    calc: (wt) => {
      const mg = wt < 10 ? 12.5 : 25;
      const str = `${mg}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(Daily B6 with INH)',
        fullDoseString: `${str} PO OD`,
        route: 'PO',
        frequency: 'OD'
      };
    }
  },

  // ==========================================
  // ANTIPARASITIC & DEWORMING
  // ==========================================
  {
    id: 'albendazole',
    name: 'Albendazole',
    genericName: 'Albendazole',
    aliases: ['Zentel', 'Alben'],
    category: 'Antiparasitic / Antifungal',
    indication: 'Ascariasis / Hookworm / Enterobius / Trichuriasis',
    route: 'PO',
    frequency: 'STAT',
    isStat: true,
    forms: '200mg tab, 400mg chewable tab, 100mg/5ml susp',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 400,
    notes: '1-2 years: 200 mg PO single dose; >2 years: 400 mg PO single dose. Chew or crush with food.',
    calc: (wt, age, ageUnit) => {
      let is1to2 = false;
      if (ageUnit === 'years' && Number(age) >= 1 && Number(age) < 2) is1to2 = true;
      if (ageUnit === 'months' && Number(age) >= 12 && Number(age) < 24) is1to2 = true;
      if (wt < 10 && is1to2) is1to2 = true;

      const mg = is1to2 ? 200 : 400;
      const str = `${mg}mg`;
      return {
        formattedDose: str,
        formulaDisplay: is1to2 ? '(1-2 yrs: 200mg)' : '(>2 yrs: 400mg)',
        fullDoseString: `${str} PO Stat single dose`,
        route: 'PO',
        frequency: 'STAT'
      };
    }
  },
  {
    id: 'mebendazole',
    name: 'Mebendazole',
    genericName: 'Mebendazole',
    aliases: ['Vermox'],
    category: 'Antiparasitic / Antifungal',
    indication: 'Intestinal worms / Helminthiasis (>1 year)',
    route: 'PO',
    frequency: 'BD',
    isStat: false,
    forms: '100mg tab, 500mg tab, 100mg/5ml susp',
    dosePerKg: 0,
    unit: 'mg',
    maxDose: 500,
    notes: '100 mg PO BD for 3 days (or 500 mg PO single dose). For children >1 year.',
    calc: () => {
      return {
        formattedDose: '100mg',
        formulaDisplay: '(100mg BD x 3d)',
        fullDoseString: '100mg PO BD for 3 days',
        route: 'PO',
        frequency: 'BD'
      };
    }
  },

  // ==========================================
  // HEMATOLOGY & OTHERS
  // ==========================================
  {
    id: 'tranexamic-acid',
    name: 'Tranexamic Acid',
    genericName: 'Tranexamic acid',
    aliases: ['Cyklokapron'],
    category: 'Emergency & Resuscitation',
    indication: 'Active bleeding / Trauma / Epistaxis / Surgery in hemophilia',
    route: 'IV',
    frequency: 'TDS',
    isStat: false,
    forms: '500mg/5ml ampoule, 500mg tab',
    dosePerKg: 15,
    unit: 'mg',
    maxDose: 1000,
    notes: '10-15 mg/kg/dose slow IV TDS (infuse over 10-15 min, max 1g/dose) or 15-25 mg/kg PO TDS.',
    calc: (wt) => {
      const dose = Math.min(wt * 15, 1000);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(15mg/kg)',
        fullDoseString: `${str} (15mg/kg) slow IV`,
        route: 'IV',
        frequency: 'TDS'
      };
    }
  },
  {
    id: 'biperiden',
    name: 'Biperiden',
    genericName: 'Biperiden lactate',
    aliases: ['Akineton'],
    category: 'Emergency & Resuscitation',
    indication: 'Drug-induced acute dystonic reactions (e.g., from metoclopramide)',
    route: 'IV',
    frequency: 'STAT',
    isStat: true,
    forms: '5mg/ml ampoule, 2mg tab',
    dosePerKg: 0.05,
    unit: 'mg',
    maxDose: 2.5,
    notes: '0.04-0.1 mg/kg slow IV/IM (max 2.5mg). Rapid relief of oculogyric crisis or torticollis.',
    calc: (wt) => {
      const dose = Math.min(wt * 0.05, 2.5);
      const str = `${formatDoseNumber(dose)}mg`;
      return {
        formattedDose: str,
        formulaDisplay: '(0.05mg/kg)',
        fullDoseString: `${str} slow IV Stat`,
        route: 'IV',
        frequency: 'STAT'
      };
    }
  }
];

/**
 * Calculates a patient-specific dose for any preset given weight & age
 */
export const calculatePresetDose = (preset, weightKg, age, ageUnit) => {
  if (!preset || !preset.calc) return null;
  const wt = parseFloat(weightKg) || 0;
  return preset.calc(wt, age, ageUnit);
};
