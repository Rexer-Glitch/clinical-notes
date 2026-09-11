/**
 * Client-side Template Persistence & Synchronization Service
 * 
 * Guarantees that custom templates created by clinicians persist across
 * browser refreshes, server restarts, ephemeral Render redeploys, and offline usage.
 */

const STORAGE_KEY = 'clinical_custom_templates_v1';
const DEFAULTS_STORAGE_KEY = 'clinical_default_templates_cache';

// Built-in standard templates as offline fallbacks
export const STANDARD_FALLBACK_TEMPLATES = [
  {
    id: 1,
    name: 'Official Hospital Treatment Chart',
    type: 'admission',
    description: 'Official Gumare Primary Hospital Treatment Chart (3-column layout: Date, Treatment, Signature)',
    filename: 'admission_template.docx',
    is_default: 1,
    default_data: {},
    schema_fields: ['reg_no', 'firstname', 'lastname', 'ward', 'diagnosis', 'date', 'time', 'doctor_name', 'treatment_note']
  },
  {
    id: 2,
    name: 'Official Hospital Drug Sheet (MH 005)',
    type: 'drug_sheet',
    description: 'Official MH 005 Inpatient Medication Administration Record (7-time administration grid)',
    filename: 'drugsheet_template.docx',
    is_default: 1,
    default_data: {},
    schema_fields: ['firstname', 'lastname', 'ward', 'drugN1', 'drugDate1', 'drugD1', 'drugR1']
  },
  {
    id: 3,
    name: 'Clinical Referral & Transfer Note',
    type: 'referral',
    description: 'Standard inter-facility and specialist referral letter with clinical summary, vitals, and transport orders',
    filename: 'clinical_referral_note.docx',
    is_default: 0,
    default_data: {},
    schema_fields: ['referring_hospital', 'receiving_hospital', 'patient_name', 'reg_no', 'reason_for_referral', 'history', 'examination', 'investigations', 'treatment_given', 'doctor_name']
  },
  {
    id: 4,
    name: 'Official Hospital Referral & Report Form (REFERRAL form)',
    type: 'referral',
    description: 'Authentic Botswana hospital two-part referral document (Reporting Officer and Referring Officer sections)',
    filename: 'referral_and_report_form_template.docx',
    is_default: 1,
    default_data: {},
    schema_fields: ['patient_name', 'patient_surname', 'age', 'gender', 'reg_no', 'doctor_name', 'hospital_name', 'receiving_hospital', 'diagnosis', 'clinical_history', 'admission_date']
  },
  {
    id: 26,
    name: 'Pediatric Acute Gastroenteritis with no dehydration',
    type: 'admission',
    description: 'Standard pediatric AGE admission plan with ORS replacement and zinc sulphate',
    filename: 'custom-admission-1788898056936-341322.docx',
    is_default: 0,
    schema_fields: ['patient_name', 'patient_surname', 'reg_no', 'ward', 'diagnosis', 'date', 'treatment_text', 'medications'],
    default_data: {
      design_filename: 'admission_template.docx',
      ward: 'General',
      diagnosis: 'AGE with no dehydration',
      chief_complaint: 'Watery stools and vomiting x   /7',
      history_present_illness: 'Reports watery stools x , non bloody, non mucoid associated with vomiting x  episodes, subjective fevers.',
      included_examinations: ['general', 'abdomen', 'custom_1788897330823'],
      custom_examinations: [{ id: 'custom_1788897330823', label: 'Hydration status', default_text: 'No sunken eyes, normal CRT/Skin turgor, moist mucous membranes = no dehydration' }],
      examination: {
        general: 'Alert, active, no signs of distress',
        abdomen: '',
        custom_1788897330823: 'No sunken eyes, normal CRT/Skin turgor, moist mucous membranes = no dehydration'
      },
      assessment: 'A - Acute Gastroenteritis with no dehydration',
      plan: [
        'Admit to general ward as per protocol',
        'Zinc sulphate 20mg PO OD',
        'Replacement of loses with 10ml/kg ----->   ml ORS per watery stool, 2ml/kg --->  ml ORS per vomitus',
        'Monitor vitals routinely.'
      ],
      medications: [{ drug: 'Zinc Sulphate', dose: '20mg', route: 'PO', frequency: 'OD' }],
      iv_fluids: []
    }
  }
];

export const templateSyncService = {
  /**
   * Get all custom templates stored in localStorage
   */
  getLocalCustomTemplates() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to read custom templates from localStorage:', e);
      return [];
    }
  },

  /**
   * Save or update a single custom template in localStorage
   */
  saveLocalCustomTemplate(template) {
    if (!template || !template.name) return;
    try {
      const current = this.getLocalCustomTemplates();
      const cleanName = template.name.trim();
      const existingIndex = current.findIndex(t => 
        (t.id && template.id && t.id === template.id) ||
        (t.filename && template.filename && t.filename === template.filename) ||
        (t.name && t.name.trim().toLowerCase() === cleanName.toLowerCase())
      );

      const normalized = {
        ...template,
        name: cleanName,
        is_default: 0,
        updated_at: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        current[existingIndex] = { ...current[existingIndex], ...normalized };
      } else {
        current.push(normalized);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save custom template to localStorage:', e);
    }
  },

  /**
   * Remove a template from local storage
   */
  removeLocalCustomTemplate(templateIdOrName) {
    try {
      const current = this.getLocalCustomTemplates();
      const filtered = current.filter(t => 
        t.id !== templateIdOrName && 
        t.name !== templateIdOrName &&
        t.filename !== templateIdOrName
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to remove custom template from localStorage:', e);
    }
  },

  /**
   * Merge server templates with local custom templates
   */
  mergeServerAndLocalTemplates(serverTemplates = [], filterType = '') {
    const localCustoms = this.getLocalCustomTemplates();
    const result = [];
    const seenKeys = new Set();

    // 1. Add server templates
    if (Array.isArray(serverTemplates)) {
      serverTemplates.forEach(st => {
        const key = (st.name || '').trim().toLowerCase();
        seenKeys.add(key);
        if (st.filename) seenKeys.add(st.filename.toLowerCase());
        result.push(st);

        // If it's a custom template on server, cache it locally too
        if (!st.is_default) {
          this.saveLocalCustomTemplate(st);
        }
      });
    }

    // 2. Add local custom templates that the server might have lost (e.g. after container restart)
    localCustoms.forEach(lt => {
      const key = (lt.name || '').trim().toLowerCase();
      const fnKey = lt.filename ? lt.filename.toLowerCase() : '';
      if (!seenKeys.has(key) && (!fnKey || !seenKeys.has(fnKey))) {
        result.push({
          ...lt,
          _localRestored: true
        });
        seenKeys.add(key);
      }
    });

    // 3. If result is empty (e.g. server completely unreachable and local empty), use built-in fallbacks
    if (result.length === 0) {
      STANDARD_FALLBACK_TEMPLATES.forEach(fb => {
        result.push(fb);
      });
    }

    // Filter by type if requested
    if (filterType) {
      const normFilter = filterType.toLowerCase().trim();
      return result.filter(t => {
        const tType = (t.type || '').toLowerCase();
        if (normFilter === 'admission') {
          return tType === 'admission' || tType === 'drug_sheet';
        }
        return tType === normFilter;
      });
    }

    return result;
  },

  /**
   * Sync local custom templates to the server in background
   */
  async syncWithServer(apiClient) {
    if (!apiClient || !apiClient.templates || !apiClient.templates.sync) return;
    const localTemplates = this.getLocalCustomTemplates();
    if (localTemplates.length === 0) return;

    try {
      await apiClient.templates.sync(localTemplates);
    } catch (err) {
      console.warn('Background template sync with server deferred (offline or server waking):', err.message);
    }
  },

  /**
   * Export all templates as a JSON string
   */
  exportTemplatesAsJson() {
    const localCustoms = this.getLocalCustomTemplates();
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      app: 'Clinical Notes Suite',
      custom_templates: localCustoms
    };
    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Import templates from a JSON string
   */
  importTemplatesFromJson(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      const list = Array.isArray(data) ? data : (Array.isArray(data.custom_templates) ? data.custom_templates : []);
      if (list.length === 0) {
        throw new Error('No valid templates found in the imported file');
      }

      let count = 0;
      list.forEach(item => {
        if (item.name) {
          this.saveLocalCustomTemplate(item);
          count++;
        }
      });
      return { success: true, count };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
