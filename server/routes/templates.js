const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, ready } = require('../db');
const { TEMPLATES_DIR, UPLOADS_DIR, generateCustomDocxTemplate } = require('../services/docxService');
const { inspectDocxFile } = require('../services/docxInspector');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for docx template uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'custom-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.docx') || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  }
});

// List all templates (supports ?type=admission or ?type=referral)
router.get('/', optionalAuth, async (req, res) => {
  try {
    await ready;
    const { type } = req.query;
    let query = 'SELECT * FROM templates';
    const params = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type.toLowerCase().trim());
    }

    query += ' ORDER BY is_default DESC, id DESC';

    const templates = await db.all(query, params);

    const formatted = templates.map(t => ({
      ...t,
      default_data: JSON.parse(t.default_data_json || '{}'),
      schema_fields: JSON.parse(t.schema_fields || '[]')
    }));

    res.json({ templates: formatted });
  } catch (err) {
    console.error('List templates error:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// List all available DOCX design files (standard hospital layouts + custom uploaded files)
router.get('/docx-files', optionalAuth, async (req, res) => {
  try {
    await ready;
    const { type } = req.query;
    const allTemplates = await db.all('SELECT id, name, type, filename, is_default, description, default_data_json FROM templates ORDER BY is_default DESC, id DESC');
    
    let filtered = allTemplates;
    if (type) {
      const normType = type.toLowerCase().trim();
      filtered = allTemplates.filter(t => t.type === normType || (normType === 'admission' && t.type === 'drug_sheet'));
    }

    const designFiles = filtered.map(t => {
      let defData = {};
      try { defData = JSON.parse(t.default_data_json || '{}'); } catch (e) {}
      return {
        template_id: t.id,
        name: t.name,
        filename: t.filename,
        type: t.type,
        is_default: !!t.is_default,
        description: t.description || (t.is_default ? 'Standard hospital layout' : 'Custom uploaded Word (.docx) design'),
        layout_config: defData.layout_config || null
      };
    });

    res.json({ files: designFiles });
  } catch (err) {
    console.error('List docx files error:', err);
    res.status(500).json({ error: 'Failed to list docx design files' });
  }
});

// Inspect a premade DOCX file to extract structure, sections, tables, and merge tags
router.post('/inspect-docx', optionalAuth, upload.single('template_file'), async (req, res) => {
  try {
    await ready;
    let filePath = null;

    if (req.file) {
      filePath = req.file.path;
    } else if (req.body.filename) {
      const candidateUpload = path.join(UPLOADS_DIR, req.body.filename);
      const candidateTemplate = path.join(TEMPLATES_DIR, req.body.filename);
      if (fs.existsSync(candidateUpload)) {
        filePath = candidateUpload;
      } else if (fs.existsSync(candidateTemplate)) {
        filePath = candidateTemplate;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Please upload a .docx file or provide a valid filename to inspect' });
    }

    const inspected = inspectDocxFile(filePath);
    res.json({
      message: 'DOCX file inspected successfully',
      filename: req.file ? req.file.filename : req.body.filename,
      ...inspected
    });
  } catch (err) {
    console.error('Inspect docx error:', err);
    res.status(500).json({ error: err.message || 'Failed to inspect DOCX file' });
  }
});

// Save an online-designed layout as a reusable template
router.post('/online-layout', optionalAuth, async (req, res) => {
  try {
    await ready;
    const { name, type = 'admission', description, layout_config, default_data } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Layout name is required' });
    }

    const normalizedType = (type || 'admission').toLowerCase().trim();
    if (!['admission', 'referral'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Layout type must be admission or referral' });
    }

    const filename = `custom-layout-${normalizedType}-${Date.now()}-${Math.round(Math.random() * 1e6)}.docx`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Build customized OpenXML .docx template
    await generateCustomDocxTemplate(normalizedType, filePath, {
      title: name,
      layoutConfig: layout_config || {}
    });

    const parsedData = typeof default_data === 'object' ? { ...default_data } : JSON.parse(default_data || '{}');
    parsedData.layout_config = layout_config || {};
    parsedData.design_filename = filename;
    const defaultDataStr = JSON.stringify(parsedData);

    const result = await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, default_data_json, is_default)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [
      name.trim(),
      normalizedType,
      description ? description.trim() : 'Custom online-designed document layout',
      filename,
      JSON.stringify(['patient_name', 'patient_surname', 'reg_no', 'ward', 'diagnosis', 'date', 'treatment_text', 'medications']),
      defaultDataStr
    ]);

    const created = await db.get('SELECT * FROM templates WHERE id = ?', [result.lastID]);
    res.status(201).json({
      message: 'Online layout template created successfully',
      template: {
        ...created,
        default_data: JSON.parse(created.default_data_json || '{}'),
        schema_fields: JSON.parse(created.schema_fields || '[]')
      }
    });
  } catch (err) {
    console.error('Create online layout error:', err);
    res.status(500).json({ error: err.message || 'Failed to save online layout' });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    await ready;
    const template = await db.get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({
      template: {
        ...template,
        default_data: JSON.parse(template.default_data_json || '{}'),
        schema_fields: JSON.parse(template.schema_fields || '[]')
      }
    });
  } catch (err) {
    console.error('Get template error:', err);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create custom template via in-app builder (without requiring Word upload)
router.post('/custom', optionalAuth, async (req, res) => {
  try {
    await ready;
    const { name, type, description, default_data, design_filename } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Template name and type are required' });
    }

    const normalizedType = type.toLowerCase().trim();
    if (!['admission', 'referral'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Template type must be admission or referral' });
    }

    // Generate unique filename and build companion .docx template
    const filename = `custom-${normalizedType}-${Date.now()}-${Math.round(Math.random() * 1e6)}.docx`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await generateCustomDocxTemplate(normalizedType, filePath, {
      title: name,
      designFilename: design_filename
    });

    const parsedData = typeof default_data === 'object' ? { ...default_data } : JSON.parse(default_data || '{}');
    if (design_filename) {
      parsedData.design_filename = design_filename;
    }
    const defaultDataStr = JSON.stringify(parsedData);

    const result = await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, default_data_json, is_default)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [
      name.trim(),
      normalizedType,
      description ? description.trim() : '',
      filename,
      JSON.stringify(['patient_name', 'patient_surname', 'reg_no', 'ward', 'diagnosis', 'date', 'treatment_text', 'medications']),
      defaultDataStr
    ]);

    const created = await db.get('SELECT * FROM templates WHERE id = ?', [result.lastID]);
    res.status(201).json({
      message: 'Custom template created successfully',
      template: {
        ...created,
        default_data: JSON.parse(created.default_data_json || '{}'),
        schema_fields: JSON.parse(created.schema_fields || '[]')
      }
    });
  } catch (err) {
    console.error('Create custom template error:', err);
    res.status(500).json({ error: err.message || 'Failed to create custom template' });
  }
});

// Update custom template
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    await ready;
    const template = await db.get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (template.is_default) {
      return res.status(403).json({ error: 'System default templates cannot be modified' });
    }

    const { name, description, default_data } = req.body;
    const newName = name ? name.trim() : template.name;
    const newDesc = description !== undefined ? description.trim() : template.description;
    const newDefaultData = default_data !== undefined
      ? (typeof default_data === 'object' ? JSON.stringify(default_data) : default_data)
      : template.default_data_json;

    await db.run(`
      UPDATE templates
      SET name = ?, description = ?, default_data_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newName, newDesc, newDefaultData, req.params.id]);

    const updated = await db.get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    res.json({
      message: 'Template updated successfully',
      template: {
        ...updated,
        default_data: JSON.parse(updated.default_data_json || '{}'),
        schema_fields: JSON.parse(updated.schema_fields || '[]')
      }
    });
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ error: err.message || 'Failed to update template' });
  }
});

// Upload custom docx template
router.post('/upload', optionalAuth, upload.single('template_file'), async (req, res) => {
  try {
    await ready;
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a .docx file' });
    }

    const { name, type, description, schema_fields, default_data } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Template name and type are required' });
    }

    const defaultDataStr = typeof default_data === 'object' ? JSON.stringify(default_data) : (default_data || '{}');

    const result = await db.run(`
      INSERT INTO templates (name, type, description, filename, schema_fields, default_data_json, is_default)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [
      name.trim(),
      type.trim(),
      description ? description.trim() : '',
      req.file.filename,
      schema_fields || JSON.stringify(['patient_name', 'diagnosis', 'date', 'medications']),
      defaultDataStr
    ]);

    const created = await db.get('SELECT * FROM templates WHERE id = ?', [result.lastID]);
    res.status(201).json({
      message: 'Template uploaded successfully',
      template: {
        ...created,
        default_data: JSON.parse(created.default_data_json || '{}'),
        schema_fields: JSON.parse(created.schema_fields || '[]')
      }
    });
  } catch (err) {
    console.error('Upload template error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload template' });
  }
});

// Download docx template file
router.get('/:id/download', async (req, res) => {
  try {
    await ready;
    const template = await db.get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    let filePath = path.join(TEMPLATES_DIR, template.filename);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(UPLOADS_DIR, template.filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Template file not found on disk' });
    }

    res.download(filePath, template.filename);
  } catch (err) {
    console.error('Download template error:', err);
    res.status(500).json({ error: 'Failed to download template' });
  }
});

// Delete custom template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await ready;
    const template = await db.get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.is_default) {
      return res.status(403).json({ error: 'Default system templates cannot be deleted' });
    }

    const uploadPath = path.join(UPLOADS_DIR, template.filename);
    if (fs.existsSync(uploadPath)) {
      try {
        fs.unlinkSync(uploadPath);
      } catch (e) {
        console.warn('Could not remove file:', uploadPath);
      }
    }

    await db.run('DELETE FROM templates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Delete template error:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
