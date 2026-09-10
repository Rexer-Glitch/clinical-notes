const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = require('docx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

async function buildMH005Template(targetPath) {
  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
  };

  const tableRows = [];

  // Table Header Row
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

  // Build 6 Drug Slots
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

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({ text: "Drug Sheet", bold: true, size: 34 })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: "" }),
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
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(targetPath, buffer);
  console.log('✓ MH 005 Drug Sheet template compiled successfully to:', targetPath);
}

async function testRender() {
  const templatePath = path.join(__dirname, 'templates', 'test_mh005.docx');
  await buildMH005Template(templatePath);

  // Test render with docxtemplater
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const payload = {
    patient_surname: 'Sarefo',
    patient_name: 'Sarah',
    ward: 'General ward',
    d1_name: 'Cefotaxime', d1_date: '18/04/24', d1_dose: '1g', d1_route: 'IV', d1_signature: 'Dr. Gumbo',
    s1_t0: '●', s1_t1: '', s1_t2: '', s1_t3: '●', s1_t4: '', s1_t5: '●', s1_t6: '',
    d2_name: 'Flagyl', d2_date: '18/04/24', d2_dose: '500mg', d2_route: 'IV', d2_signature: 'Dr. Gumbo',
    s2_t0: '●', s2_t1: '', s2_t2: '', s2_t3: '●', s2_t4: '', s2_t5: '●', s2_t6: '',
    d3_name: 'Gentamycin', d3_date: '18/04/24', d3_dose: '80mg', d3_route: 'IV', d3_signature: 'Dr. Gumbo',
    s3_t0: '●', s3_t1: '', s3_t2: '', s3_t3: '', s3_t4: '', s3_t5: '', s3_t6: '',
    d4_name: 'Paracetamol', d4_date: '18/04/24', d4_dose: '500mg', d4_route: 'PO', d4_signature: 'Dr. Gumbo',
    s4_t0: '●', s4_t1: '', s4_t2: '', s4_t3: '●', s4_t4: '', s4_t5: '●', s4_t6: '',
    d5_name: '', d5_date: '', d5_dose: '', d5_route: '', d5_signature: '',
    s5_t0: '', s5_t1: '', s5_t2: '', s5_t3: '', s5_t4: '', s5_t5: '', s5_t6: '',
    d6_name: '', d6_date: '', d6_dose: '', d6_route: '', d6_signature: '',
    s6_t0: '', s6_t1: '', s6_t2: '', s6_t3: '', s6_t4: '', s6_t5: '', s6_t6: ''
  };

  doc.render(payload);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  console.log('✓ Rendered MH 005 docx successfully! Buffer size:', outBuf.length);
}

testRender().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
