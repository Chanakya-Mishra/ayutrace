export interface SampleMedicinePackage {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  category: string;
  svgDataUri: string;
  description: string;
}

function createMedicinePackageSvg(
  brand: string,
  generic: string,
  strength: string,
  batch: string,
  exp: string,
  manufacturer: string,
  accentColor: string,
  badgeText: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </linearGradient>
      <linearGradient id="strip" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <!-- Background Card -->
    <rect width="600" height="400" rx="16" fill="url(#grad)" stroke="#cbd5e1" stroke-width="2"/>
    <!-- Top Healthcare Header Stripe -->
    <rect width="600" height="48" rx="16" fill="url(#strip)"/>
    <rect y="32" width="600" height="16" fill="url(#strip)"/>
    <text x="24" y="30" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff" letter-spacing="1">AYUTRACE PHARMACEUTICAL AUDIT</text>
    <text x="576" y="30" text-anchor="end" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#99f6e4">${badgeText}</text>
    
    <!-- Medicine Commercial Name -->
    <text x="36" y="110" font-family="system-ui, sans-serif" font-size="34" font-weight="800" fill="#0f172a">${brand}</text>
    <text x="36" y="142" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#0d9488">${generic}</text>
    <text x="36" y="170" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#64748b">Strength: ${strength} • Mfg: ${manufacturer}</text>

    <!-- Packaging Foil Divider -->
    <line x1="36" y1="195" x2="564" y2="195" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6,6"/>

    <!-- Lot & Expiry Printed Block -->
    <rect x="36" y="215" width="528" height="120" rx="10" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="56" y="245" font-family="monospace" font-size="13" font-weight="700" fill="#475569">PRINTED LOT &amp; STATUTORY COMPLIANCE:</text>
    
    <text x="56" y="278" font-family="monospace" font-size="15" font-weight="800" fill="#0f172a">BATCH / LOT NO:  ${batch}</text>
    <text x="56" y="308" font-family="monospace" font-size="15" font-weight="800" fill="#0f172a">EXPIRY DATE:     ${exp}</text>

    <text x="360" y="278" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Schedule Type:</text>
    <text x="360" y="295" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#b91c1c">Prescription Drug</text>
    <text x="360" y="318" font-family="system-ui, sans-serif" font-size="10" font-weight="500" fill="#64748b">FEFO Protocol Ready</text>

    <!-- Bottom Security Barcode Representation -->
    <rect x="36" y="356" width="300" height="20" rx="3" fill="#cbd5e1"/>
    <text x="350" y="370" font-family="monospace" font-size="11" fill="#94a3b8">CDSCO / FDA STANDARD PACKAGING</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_MEDICINE_PACKAGES: SampleMedicinePackage[] = [
  {
    id: "paracip-500",
    name: "Paracip 500",
    genericName: "Paracetamol Tablets IP",
    strength: "500 mg",
    dosageForm: "Tablet",
    manufacturer: "Cipla Ltd",
    batchNumber: "B240901",
    mfgDate: "03/2024",
    expDate: "08/2026",
    category: "Analgesic & Antipyretic",
    description: "Standard blister strip of 10 tablets",
    svgDataUri: createMedicinePackageSvg(
      "Paracip 500",
      "Paracetamol Tablets IP",
      "500 mg",
      "B240901",
      "08/2026",
      "Cipla Ltd",
      "#0f766e",
      "ANALGESIC OTC"
    ),
  },
  {
    id: "augmentin-625",
    name: "Augmentin 625 Duo",
    genericName: "Amoxicillin and Potassium Clavulanate",
    strength: "625 mg (500mg + 125mg)",
    dosageForm: "Tablet",
    manufacturer: "GlaxoSmithKline Pharmaceuticals",
    batchNumber: "AUG-8820",
    mfgDate: "11/2023",
    expDate: "12/2026",
    category: "Antibacterial",
    description: "Foil pack of 10 film-coated tablets",
    svgDataUri: createMedicinePackageSvg(
      "Augmentin 625 Duo",
      "Amoxicillin & Clavulanate IP",
      "625 mg",
      "AUG-8820",
      "12/2026",
      "GlaxoSmithKline",
      "#1e3a8a",
      "SCHEDULE H1"
    ),
  },
  {
    id: "huminsulin-r",
    name: "Huminsulin R 40 IU/ml",
    genericName: "Regular Soluble Human Insulin IP",
    strength: "40 IU/ml",
    dosageForm: "Injection",
    manufacturer: "Eli Lilly / Lupin",
    batchNumber: "INS-9102",
    mfgDate: "06/2024",
    expDate: "10/2026",
    category: "Endocrine & Diabetes",
    description: "Refrigerated 10ml vial (2°C - 8°C)",
    svgDataUri: createMedicinePackageSvg(
      "Huminsulin R 40 IU/ml",
      "Regular Soluble Insulin IP",
      "40 IU/ml",
      "INS-9102",
      "10/2026",
      "Eli Lilly / Lupin",
      "#0369a1",
      "COLD CHAIN 2-8°C"
    ),
  },
  {
    id: "azithral-200",
    name: "Azithral 200 Suspension",
    genericName: "Azithromycin Oral Suspension IP",
    strength: "200 mg / 5 ml",
    dosageForm: "Syrup",
    manufacturer: "Alembic Pharmaceuticals Ltd",
    batchNumber: "AZI-5022",
    mfgDate: "04/2024",
    expDate: "01/2027",
    category: "Pediatric Antibacterial",
    description: "Pediatric liquid bottle 15 ml",
    svgDataUri: createMedicinePackageSvg(
      "Azithral 200 Suspension",
      "Azithromycin Suspension IP",
      "200 mg / 5 ml",
      "AZI-5022",
      "01/2027",
      "Alembic Pharma",
      "#701a75",
      "PEDIATRIC RX"
    ),
  },
];
