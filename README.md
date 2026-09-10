# Gumare Clinical Notes & Inpatient Treatment Chart Suite

A mobile-friendly full-stack application built with **Node.js (Express)**, **React 18 (Vite + Tailwind CSS)**, **SQLite**, and **docxtemplater** for clinical admission notes, coupled inpatient drug administration sheets (MAR), and referral notes.

Designed to mirror the 3-column hospital treatment chart (`DATE` | `TREATMENT` | `SIGNATURE`) from **Gumare Primary Hospital** as captured in real-world inpatient medical records.

---

## 🌟 Key Features

### 1. Inpatient Admission Notes Coupled with Drug Sheets (MAR)
- **Exact Hospital Chart Layout**: Faithfully reproduces the 3-column structure (`DATE` | `TREATMENT` | `SIGNATURE`) with patient identifiers (Hospital, Reg No, Name, Surname, Ward, Diagnosis).
- **Coupled Drug Administration Sheet**: Automatically links every admission note with:
  - Regular inpatient medications (Drug, Dose, Route, Frequency, Indication, Doctor Signature, Nurse Time Slots e.g. 06:00, 14:00, 22:00).
  - Stat / Once-Only doses given upon admission.
  - PRN / "As Needed" medications.
  - Intravenous fluids (Type, Volume, Rate/Duration, Indication).
  - Nursing monitoring orders (e.g. 4-hourly vitals, strict I/O, airborne isolation).

### 2. Clinical Referral & Transfer Notes
- Standardized inter-facility and specialist referral letterhead.
- Includes reason for referral, clinical summary, vitals, examination findings, pre-transfer stat treatments, and ambulance/oxygen escort requirements.

### 3. docxtemplater OpenXML (.docx) Engine
- Built-in template generator provisions standard Word (`.docx`) templates on startup.
- Dynamic table looping with tags:
  - `{#medications}{drug} | {dose} | {route} | {frequency}{/medications}`
  - `{#iv_fluids}{fluid} | {volume} | {rate_hours}{/iv_fluids}`
  - `{hospital_name}`, `{patient_name}`, `{admission_date}`, `{treatment_text}`.
- 1-click **Export to .docx** downloads a formatted Word document populated from SQLite data.
- **Custom Template Upload**: Upload any `.docx` file with custom formatting and docxtemplater tags.

### 4. High-Fidelity Print & PDF Engine
- `@media print` optimized for standard A4 hospital sheets.
- 1-click **Print / Save as PDF** in the browser.

### 5. AI Clinical Shorthand Assist
- Clinicians can type or dictate bulleted notes or shorthand.
- Transforms messy text into a structured Inpatient Admission Note and paired Drug Sheet.
- Features a **100% offline rule-based medical parser** for air-gapped environments, and supports **Google Gemini 2.5 Flash** for advanced generative restructuring when an API key is provided.

### 6. Mobile-First Responsive Interface
- Bottom navigation bar on mobile phones for one-handed operation.
- Touch-friendly action buttons (>= 44px).
- Dynamic vitals alert badges (Tachycardia, Febrile, Hypoxic).
- Quick clinical preset chips (Gumare TB case from photos, Severe Pneumonia, Meningitis).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) and npm

### Default Credentials
A pre-seeded clinician account is ready for immediate login:
- **Username**: `drgumbo`
- **Password**: `password123`
- *(Or click the "1-Click Demo Login" button on the sign-in screen)*

### Running the Application

#### Option A: Unified Production Server (Recommended)
Builds the client and starts the backend on port 5000 (serves both API and UI):
```bash
# From the project root
npm run build
npm start
```
Then visit: **`http://localhost:5000`**

#### Option B: Development Mode (Hot Reloading)
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```
Then visit: **`http://localhost:3000`**

---

## 🧪 Automated Test Suite

Run the automated test suite verifying health, authentication, note creation, coupled drug sheet persistence, docxtemplater export, and AI shorthand extraction:
```bash
npm test
```

---

## 📂 Project Architecture

```
Temp/
├── client/                     # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppNavbar.jsx           # Top header with user profile and navigation
│   │   │   ├── MobileBottomNav.jsx     # Mobile-friendly fixed bottom bar
│   │   │   ├── TreatmentChartModal.jsx # 3-column hospital chart & drug sheet modal
│   │   │   └── AIAssistModal.jsx       # AI shorthand parsing modal
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx           # Sign in & doctor registration
│   │   │   ├── DashboardPage.jsx       # Patient list, search, stats, actions
│   │   │   ├── AdmissionNoteFormPage.jsx # Admission Note + Coupled Drug Sheet builder
│   │   │   ├── ReferralNoteFormPage.jsx  # Clinical transfer form
│   │   │   └── TemplateManagerPage.jsx # docxtemplater template management
│   │   └── services/
│   │       └── api.js                  # Centralized API fetcher
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── clinical_notes.db       # SQLite Database
│   ├── db.js                   # SQLite connection & schema initialization
│   ├── server.js               # Express app & static server
│   ├── test.js                 # End-to-end automated test suite
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js             # Login, register, me
│   │   ├── notes.js            # Notes CRUD, coupled drug sheet, docx export
│   │   ├── templates.js        # Template listing, upload, download
│   │   └── ai.js               # AI clinical structuring endpoint
│   ├── services/
│   │   └── docxService.js      # docxtemplater + pizzip OpenXML generation
│   ├── templates/              # Base .docx template files
│   └── uploads/                # Custom user-uploaded .docx files
│
└── package.json                # Root scripts
```

---

## 🩺 Sample Patient (Gumare Primary Hospital)

Pre-loaded directly from the uploaded hospital charts:
- **Patient**: SHAROH MBAMBI (15F)
- **Reg No**: `GPH-2026-08942` | **Ward**: TB
- **Diagnosis**: Pulmonary tuberculosis
- **Admission Note**: Dr. Gumbo (CO productive cough 2 wks, vitals BP 117/74, P146, T39.7, SpO2 99, GeneXpert detected scanty, exam findings)
- **Coupled Drug Sheet**: ATT 3 tabs PO OD, Pyridoxime 25mg PO OD, Cefotaxime 1g IV TDS, Paracetamol 1g PO TDS, Ibuprofen 400mg PO TDS, IVF 2L NS/RL over 24 hours, 4-hourly vitals.

---

## 🛠️ Self-Corrections & Bug Tracking Log

During development, the following bug was identified and resolved:
- **Issue**: `better-sqlite3` native compilation failed on modern Node v24 due to an upstream node-gyp nested path generation bug (`./Release/.deps/Release/obj.target/sqlite3/gen/sqlite3/sqlite3.o.d.raw`).
- **Resolution**: Adopted the standard `sqlite3` driver with a clean async promise wrapper (`db.run`, `db.get`, `db.all`, `db.exec`), ensuring universal compatibility and native execution on all platforms without compile errors.
