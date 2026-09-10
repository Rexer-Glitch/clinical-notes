const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle, HeadingLevel, AlignmentType 
} = require('docx');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure directories exist
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Creates default .docx template files with docxtemplater tags if they don't exist
 */
async function ensureDefaultTemplates() {
  const authenticAdmissionPath = path.join(TEMPLATES_DIR, 'admission_template.docx');
  const authenticDrugSheetPath = path.join(TEMPLATES_DIR, 'drugsheet_template.docx');
  const admissionPath = path.join(TEMPLATES_DIR, 'gph_admission_treatment_chart.docx');
  const drugSheetPath = path.join(TEMPLATES_DIR, 'inpatient_drug_sheet.docx');
  const referralPath = path.join(TEMPLATES_DIR, 'clinical_referral_note.docx');

  // If authentic hospital files exist, mirror them to legacy filenames so all paths use authentic designs
  if (fs.existsSync(authenticAdmissionPath)) {
    try {
      fs.copyFileSync(authenticAdmissionPath, admissionPath);
    } catch (e) {
      console.warn('Could not mirror admission_template.docx to legacy filename:', e.message);
    }
  } else if (!fs.existsSync(admissionPath)) {
    await createAdmissionDocxTemplate(admissionPath);
  }

  if (fs.existsSync(authenticDrugSheetPath)) {
    try {
      fs.copyFileSync(authenticDrugSheetPath, drugSheetPath);
    } catch (e) {
      console.warn('Could not mirror drugsheet_template.docx to legacy filename:', e.message);
    }
  } else if (!fs.existsSync(drugSheetPath)) {
    await createDrugSheetDocxTemplate(drugSheetPath);
  }

  if (!fs.existsSync(referralPath)) {
    await createReferralDocxTemplate(referralPath);
  }
}

/**
 * Helper to build the exact MH 005 Hospital Drug Sheet Table
 */
function buildMH005DrugSheetChildren() {
  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
  };

  const tableRows = [];

  // Table Header Row: Date across the top with 14 columns
  const dateCells = [];
  for (let d = 1; d <= 14; d++) {
    dateCells.push(new TableCell({
      width: { size: 3.5, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      children: [new Paragraph({ text: String(d), alignment: AlignmentType.CENTER })]
    }));
  }

  tableRows.push(new TableRow({
    children: [
      new TableCell({
        width: { size: 36, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        children: [new Paragraph({ children: [new TextRun({ text: "DRUG / PRESCRIPTION", bold: true })] })]
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        children: [new Paragraph({ children: [new TextRun({ text: "Time", bold: true })], alignment: AlignmentType.CENTER })]
      }),
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        children: [new Paragraph({ children: [new TextRun({ text: "Alt.", bold: true })], alignment: AlignmentType.CENTER })]
      }),
      ...dateCells
    ]
  }));

  // Build 6 Drug Slots matching MH 005
  const timeLabels = ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'];

  for (let slot = 1; slot <= 6; slot++) {
    for (let tIdx = 0; tIdx < 7; tIdx++) {
      const time = timeLabels[tIdx];
      const rowChildren = [];

      // Left Drug Box (spans 7 rows)
      if (tIdx === 0) {
        rowChildren.push(new TableCell({
          rowSpan: 7,
          width: { size: 36, type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "DRUG: ", bold: true }),
                new TextRun({ text: `{d${slot}_name}`, bold: true, size: 22 })
              ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({ text: "Date: ", bold: true }),
                new TextRun(`{d${slot}_date}`),
                new TextRun({ text: "  Dose: ", bold: true }),
                new TextRun(`{d${slot}_dose}`),
                new TextRun({ text: "  Route: ", bold: true }),
                new TextRun(`{d${slot}_route}`)
              ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({ text: "Drs. Signature: ", bold: true }),
                new TextRun(`{d${slot}_signature}`)
              ]
            })
          ]
        }));
      }

      // Time Cell
      rowChildren.push(new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        children: [
          new Paragraph({
            children: [new TextRun({ text: `${time} {s${slot}_t${tIdx}}` })],
            alignment: AlignmentType.CENTER
          })
        ]
      }));

      // Alt Cell
      rowChildren.push(new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        borders: thinBorder,
        children: [new Paragraph({ text: "" })]
      }));

      // 14 Date Administration Grid Cells
      for (let d = 1; d <= 14; d++) {
        rowChildren.push(new TableCell({
          width: { size: 3.5, type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [new Paragraph({ text: "" })]
        }));
      }

      tableRows.push(new TableRow({ children: rowChildren }));
    }
  }

  return [
    // Centered Title
    new Paragraph({
      children: [
        new TextRun({ text: "Drug Sheet", bold: true, size: 36 })
      ],
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({ text: "" }),
    // Header Row with Surname, Forename, MH 005, WARD
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Surname:    ", bold: true }), new TextRun("{patient_surname}")] }),
                new Paragraph({ children: [new TextRun({ text: "Forename:   ", bold: true }), new TextRun("{patient_name}")] })
              ]
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                new Paragraph({ children: [new TextRun({ text: "MH 005", bold: true })], alignment: AlignmentType.RIGHT }),
                new Paragraph({ children: [new TextRun({ text: "WARD:   ", bold: true }), new TextRun("{ward}")], alignment: AlignmentType.RIGHT })
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows
    })
  ];
}

/**
 * Creates the Admission & Treatment Chart docx template matching Gumare Primary Hospital layout
 * and appends the standard MH 005 Drug Sheet
 */
async function createAdmissionDocxTemplate(targetPath) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          // Header info matching Gumare photo 1
          new Paragraph({
            children: [
              new TextRun({ text: "Hospital: ", bold: true }),
              new TextRun("{hospital_name}")
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "{document_title}", bold: true, size: 28 }),
              new TextRun({ text: "\t\t\tReg. NO. {reg_no}", bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "First name: ", bold: true }),
              new TextRun("{patient_name}"),
              new TextRun({ text: "\t\t\t\tWard: ", bold: true }),
              new TextRun("{ward}")
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Surname: ", bold: true }),
              new TextRun("{patient_surname}"),
              new TextRun({ text: "\t\t\t\tDiagnosis: ", bold: true }),
              new TextRun("{diagnosis}")
            ]
          }),
          new Paragraph({ text: "" }),

          // 3-column Treatment Chart Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "DATE", bold: true })], alignment: AlignmentType.CENTER })]
                  }),
                  new TableCell({
                    width: { size: 62, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "TREATMENT", bold: true })], alignment: AlignmentType.CENTER })]
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "SIGNATURE", bold: true })], alignment: AlignmentType.CENTER })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "{admission_date}" })] })
                    ]
                  }),
                  new TableCell({
                    width: { size: 62, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "ADMISSION NOTES - {doctor_name}", bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: "{treatment_text}" })] })
                    ]
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "{signature}" })] })
                    ]
                  })
                ]
              })
            ]
          }),

          // Page break for the coupled standard Hospital Drug Sheet (MH 005)
          new Paragraph({ pageBreakBefore: true, text: "" }),

          // Coupled MH 005 Standard Drug Sheet
          ...buildMH005DrugSheetChildren()
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(targetPath, buffer);
}

/**
 * Creates standalone MH 005 Drug Sheet docx template
 */
async function createDrugSheetDocxTemplate(targetPath) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: buildMH005DrugSheetChildren()
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(targetPath, buffer);
}

/**
 * Creates Referral Note docx template
 */
async function createReferralDocxTemplate(targetPath) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "{hospital_name}", bold: true, size: 28 }),
              new TextRun({ text: "\nCLINICAL REFERRAL & TRANSFER SUMMARY", bold: true, size: 22 })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "From Facility:", bold: true })], alignment: AlignmentType.LEFT })] }),
                  new TableCell({ children: [new Paragraph("{hospital_name} ({referring_unit})")] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "To Facility:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("{receiving_hospital} - {receiving_department}")] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Patient Name:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("{patient_name} {patient_surname}")] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reg No / Age / Sex:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("{reg_no} / {age} yrs / {gender}")] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Urgency:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("{urgency}")] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Working Diagnosis:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("{diagnosis}")] })
                ]
              })
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Reason for Referral:", bold: true }),
              new TextRun("\n{reason_for_referral}")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. Clinical History & Presentation:", bold: true }),
              new TextRun("\n{clinical_history}")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Vital Signs & Physical Examination:", bold: true }),
              new TextRun("\nVitals: {vital_signs}"),
              new TextRun("\nExamination: {examination}")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "4. Investigations Done:", bold: true }),
              new TextRun("\n{investigations}")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "5. Treatments & Stat Doses Administered:", bold: true }),
              new TextRun("\n{treatment_given}")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "6. Transport & Escort Requirements:", bold: true }),
              new TextRun("\n{transport_needs}")
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Referring Doctor: ", bold: true }),
              new TextRun("{doctor_name}\t\t\t"),
              new TextRun({ text: "Date / Time: ", bold: true }),
              new TextRun("{admission_date}")
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(targetPath, buffer);
}

/**
 * Render a DOCX document using docxtemplater
 */
function renderDocx(templateFilename, data) {
  let templatePath = path.isAbsolute(templateFilename) ? templateFilename : path.join(TEMPLATES_DIR, templateFilename);
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(UPLOADS_DIR, templateFilename);
  }

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file "${templateFilename}" not found`);
  }

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const renderData = { ...data };

  // If treatment_note_xml is provided, enable raw XML replacement by converting {treatment_note} to {@treatment_note}
  if (renderData.treatment_note_xml) {
    let docXml = zip.file('word/document.xml').asText();
    if (docXml.includes('{treatment_note}') || docXml.includes('{treatment_text}')) {
      docXml = docXml
        .replace(/\{treatment_note\}/g, '{@treatment_note}')
        .replace(/\{treatment_text\}/g, '{@treatment_text}');
      zip.file('word/document.xml', docXml);
    }
    renderData.treatment_note = renderData.treatment_note_xml;
    renderData.treatment_text = renderData.treatment_note_xml;
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  doc.render(renderData);

  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  return buffer;
}

/**
 * Build OpenXML .docx template matching an online-designed layout specification
 */
async function createCustomOnlineLayoutDocx(targetPath, type, layoutConfig = {}, options = {}) {
  const styling = layoutConfig.styling || {};
  const sections = Array.isArray(layoutConfig.sections) ? layoutConfig.sections : [];
  const isSectionEnabled = (id) => {
    const sec = sections.find(s => s.id === id);
    return sec ? sec.enabled !== false : true;
  };

  const accentHex = (styling.accentColor || '#059669').replace(/[^0-9A-Fa-f]/g, '') || '059669';
  const fontName = styling.fontFamily === 'serif' ? 'Times New Roman' : (styling.fontFamily === 'mono' ? 'Courier New' : 'Arial');
  const slotCount = Math.min(10, Math.max(2, parseInt(styling.drugSlots || 6, 10)));
  const dateColWidth = Math.min(30, Math.max(12, parseInt(styling.dateColumnWidth || 18, 10)));
  const isTwoCol = styling.chartColumns === '2-column';
  const hospitalTitle = layoutConfig.hospitalName || options.hospitalName || 'Gumare Primary Hospital';
  const docTitle = layoutConfig.documentTitle || options.title || (type === 'referral' ? 'REFERRAL AND REPORT FORM' : 'TREATMENT CHART & DRUG SHEET');

  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: accentHex },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: accentHex },
    left: { style: BorderStyle.SINGLE, size: 4, color: accentHex },
    right: { style: BorderStyle.SINGLE, size: 4, color: accentHex }
  };

  const children = [];

  // 1. Hospital Header
  if (isSectionEnabled('header')) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Hospital: ", bold: true, font: fontName }),
          new TextRun({ text: `{hospital_name}`, font: fontName })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `{document_title}`, bold: true, size: 28, color: accentHex, font: fontName }),
          new TextRun({ text: "\t\t\tReg. NO. {reg_no}", bold: true, font: fontName })
        ]
      })
    );
  }

  // 2. Demographics
  if (isSectionEnabled('demographics')) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "First name: ", bold: true, font: fontName }),
          new TextRun({ text: "{patient_name}", font: fontName }),
          new TextRun({ text: "\t\t\t\tWard: ", bold: true, font: fontName }),
          new TextRun({ text: "{ward}", font: fontName })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Surname: ", bold: true, font: fontName }),
          new TextRun({ text: "{patient_surname}", font: fontName }),
          new TextRun({ text: "\t\t\t\tDiagnosis: ", bold: true, font: fontName }),
          new TextRun({ text: "{diagnosis}", bold: true, font: fontName })
        ]
      }),
      new Paragraph({ text: "" })
    );
  }

  if (type === 'admission') {
    // 3. Treatment Chart Table
    if (isSectionEnabled('treatment_chart')) {
      const treatColWidth = isTwoCol ? (100 - dateColWidth) : (100 - dateColWidth - 20);
      const headerCells = [
        new TableCell({
          width: { size: dateColWidth, type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [new Paragraph({ children: [new TextRun({ text: isTwoCol ? "DATE & CLINICIAN" : "DATE", bold: true, font: fontName })], alignment: AlignmentType.CENTER })]
        }),
        new TableCell({
          width: { size: treatColWidth, type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "TREATMENT & CLINICAL ORDERS", bold: true, font: fontName })], alignment: AlignmentType.CENTER })]
        })
      ];

      if (!isTwoCol) {
        headerCells.push(
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "SIGNATURE", bold: true, font: fontName })], alignment: AlignmentType.CENTER })]
          })
        );
      }

      const bodyCells = [
        new TableCell({
          width: { size: dateColWidth, type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [
            new Paragraph({ children: [new TextRun({ text: "{admission_date}", font: fontName })] }),
            ...(isTwoCol ? [new Paragraph({ children: [new TextRun({ text: "{doctor_name}", bold: true, italic: true, font: fontName })] })] : [])
          ]
        }),
        new TableCell({
          width: { size: treatColWidth, type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [
            new Paragraph({ children: [new TextRun({ text: "ADMISSION NOTES - {doctor_name}", bold: true, font: fontName })] }),
            new Paragraph({ children: [new TextRun({ text: "{treatment_text}", font: fontName })] })
          ]
        })
      ];

      if (!isTwoCol) {
        bodyCells.push(
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: "{doctor_name}", italic: true, bold: true, font: fontName })], alignment: AlignmentType.CENTER }),
              new Paragraph({ children: [new TextRun({ text: "Prescriber", size: 16, font: fontName })], alignment: AlignmentType.CENTER })
            ]
          })
        );
      }

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: headerCells }),
            new TableRow({ children: bodyCells })
          ]
        }),
        new Paragraph({ text: "" })
      );
    }

    // 4. Physical Examinations
    if (isSectionEnabled('examinations')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "PHYSICAL EXAMINATION & SYSTEMS REVIEW", bold: true, color: accentHex, font: fontName })
          ]
        }),
        new Paragraph({ children: [new TextRun({ text: "General: ", bold: true, font: fontName }), new TextRun({ text: "{exam_general}", font: fontName })] }),
        new Paragraph({ children: [new TextRun({ text: "CVS: ", bold: true, font: fontName }), new TextRun({ text: "{exam_cvs}", font: fontName })] }),
        new Paragraph({ children: [new TextRun({ text: "Respiratory: ", bold: true, font: fontName }), new TextRun({ text: "{exam_resp}", font: fontName })] }),
        new Paragraph({ children: [new TextRun({ text: "Abdomen: ", bold: true, font: fontName }), new TextRun({ text: "{exam_abdomen}", font: fontName })] }),
        new Paragraph({ children: [new TextRun({ text: "CNS / Neuro: ", bold: true, font: fontName }), new TextRun({ text: "{exam_cns}", font: fontName })] }),
        new Paragraph({ children: [new TextRun({ text: "MSK / Other: ", bold: true, font: fontName }), new TextRun({ text: "{exam_msk}", font: fontName })] }),
        new Paragraph({ text: "" })
      );
    }

    // 5. Drug Sheet (MH 005)
    if (isSectionEnabled('drug_sheet')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Drug Sheet (MH 005)", bold: true, size: 32, color: accentHex, font: fontName })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Surname: ", bold: true, font: fontName }),
            new TextRun({ text: "{patient_surname}\t\t", font: fontName }),
            new TextRun({ text: "Forename: ", bold: true, font: fontName }),
            new TextRun({ text: "{patient_name}\t\t", font: fontName }),
            new TextRun({ text: "WARD: ", bold: true, font: fontName }),
            new TextRun({ text: "{ward}", font: fontName })
          ]
        }),
        new Paragraph({ text: "" })
      );

      // Add MAR table with slotCount rows
      const marRows = [];
      const timeLabels = styling.adminTimes && Array.isArray(styling.adminTimes) && styling.adminTimes.length > 0
        ? styling.adminTimes
        : ['6 am', '10 am', '12 md', '2 pm', '6 pm', '10 pm', '12 mn'];

      const daysCount = parseInt(styling.dateGridDays || 14, 10) === 7 ? 7 : 14;
      const dateHeaderCells = [];
      for (let d = 1; d <= daysCount; d++) {
        dateHeaderCells.push(new TableCell({
          width: { size: (50 / daysCount), type: WidthType.PERCENTAGE },
          borders: thinBorder,
          children: [new Paragraph({ text: String(d), alignment: AlignmentType.CENTER })]
        }));
      }

      marRows.push(new TableRow({
        children: [
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "DRUG / PRESCRIPTION", bold: true, font: fontName })] })]
          }),
          new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Time", bold: true, font: fontName })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Alt.", bold: true, font: fontName })], alignment: AlignmentType.CENTER })]
          }),
          ...dateHeaderCells
        ]
      }));

      for (let slot = 1; slot <= slotCount; slot++) {
        for (let tIdx = 0; tIdx < timeLabels.length; tIdx++) {
          const time = timeLabels[tIdx];
          const rowChildren = [];

          if (tIdx === 0) {
            rowChildren.push(new TableCell({
              rowSpan: timeLabels.length,
              width: { size: 36, type: WidthType.PERCENTAGE },
              borders: thinBorder,
              children: [
                new Paragraph({ children: [new TextRun({ text: "DRUG: ", bold: true, font: fontName }), new TextRun({ text: `{d${slot}_name}`, bold: true, font: fontName })] }),
                new Paragraph({ children: [new TextRun({ text: "Dose: ", bold: true, font: fontName }), new TextRun({ text: `{d${slot}_dose}`, font: fontName })] }),
                new Paragraph({ children: [new TextRun({ text: "Route: ", bold: true, font: fontName }), new TextRun({ text: `{d${slot}_route}`, font: fontName })] }),
                new Paragraph({ children: [new TextRun({ text: "Dr. Sig: ", bold: true, font: fontName }), new TextRun({ text: `{d${slot}_signature}`, italic: true, font: fontName })] })
              ]
            }));
          }

          rowChildren.push(new TableCell({
            width: { size: 9, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: `${time} {s${slot}_t${tIdx}}`, font: fontName })], alignment: AlignmentType.CENTER })]
          }));

          rowChildren.push(new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            borders: thinBorder,
            children: [new Paragraph({ text: "" })]
          }));

          for (let d = 1; d <= daysCount; d++) {
            rowChildren.push(new TableCell({
              width: { size: (50 / daysCount), type: WidthType.PERCENTAGE },
              borders: thinBorder,
              children: [new Paragraph({ text: "" })]
            }));
          }

          marRows.push(new TableRow({ children: rowChildren }));
        }
      }

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: marRows }));
    }

    // 6. IV Fluids & Orders
    if (isSectionEnabled('iv_fluids')) {
      children.push(
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Intravenous Fluids: ", bold: true, font: fontName }),
            new TextRun({ text: "{iv_fluids}", font: fontName })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Nursing / Monitoring Orders: ", bold: true, font: fontName }),
            new TextRun({ text: "{monitoring_orders}", font: fontName })
          ]
        })
      );
    }
  } else {
    // Referral Form Layout
    if (isSectionEnabled('referral_body')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "1. Transfer Details & Receiving Facility:", bold: true, color: accentHex, font: fontName }),
            new TextRun({ text: "\nReferring: {hospital_name} ({referring_unit})\nReceiving: {receiving_hospital} ({receiving_department})\nReason: {reason_for_referral}", font: fontName })
          ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "2. Significant Clinical History & Examination:", bold: true, color: accentHex, font: fontName }),
            new TextRun({ text: "\nHistory: {clinical_history}\nVitals: {vital_signs}\nExamination: {examination}", font: fontName })
          ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "3. Investigations Done & Treatments Given:", bold: true, color: accentHex, font: fontName }),
            new TextRun({ text: "\nInvestigations: {investigations}\nTreatment: {treatment_given}", font: fontName })
          ]
        })
      );
    }

    if (isSectionEnabled('transport_logistics')) {
      children.push(
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "4. Transport & Escort Requirements:", bold: true, color: accentHex, font: fontName }),
            new TextRun({ text: "\n{transport_needs}", font: fontName })
          ]
        })
      );
    }
  }

  // Signatures
  if (isSectionEnabled('signatures')) {
    children.push(
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Clinician Signature: ", bold: true, font: fontName }),
          new TextRun({ text: "{doctor_name}\t\t\t\t", italic: true, font: fontName }),
          new TextRun({ text: "Date / Time: ", bold: true, font: fontName }),
          new TextRun({ text: "{admission_date}", font: fontName })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(targetPath, buffer);
}

/**
 * Generate a DOCX template file for a custom template
 */
async function generateCustomDocxTemplate(type, targetPath, options = {}) {
  // If layoutConfig was provided from the in-depth online designer, compile customized docx
  if (options.layoutConfig && typeof options.layoutConfig === 'object' && Object.keys(options.layoutConfig).length > 0) {
    await createCustomOnlineLayoutDocx(targetPath, type, options.layoutConfig, options);
    return;
  }

  // If clinician selected a specific custom docx file as base design, copy it
  const baseDesign = options.designFilename || options.baseDesignFilename;
  if (baseDesign) {
    let sourcePath = path.join(UPLOADS_DIR, baseDesign);
    if (!fs.existsSync(sourcePath)) {
      sourcePath = path.join(TEMPLATES_DIR, baseDesign);
    }
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      return;
    }
  }

  if (type === 'admission') {
    const standardAdmissionPath = path.join(TEMPLATES_DIR, 'admission_template.docx');
    if (fs.existsSync(standardAdmissionPath)) {
      fs.copyFileSync(standardAdmissionPath, targetPath);
    } else {
      await createAdmissionDocxTemplate(targetPath);
    }
  } else {
    const standardRefPath = path.join(TEMPLATES_DIR, 'referral_and_report_form_template.docx');
    if (fs.existsSync(standardRefPath)) {
      fs.copyFileSync(standardRefPath, targetPath);
    } else {
      await createReferralDocxTemplate(targetPath);
    }
  }
}

module.exports = {
  ensureDefaultTemplates,
  generateCustomDocxTemplate,
  renderDocx,
  TEMPLATES_DIR,
  UPLOADS_DIR
};
