/**
 * AROMI Conflict Engine & Attention Management System
 * 
 * Implements 5 key verification conflict checks:
 * 1. Duplicate / Existing Assessment Check (same-day duplicate detection)
 * 2. Measurement Conflict Check (sharp anomalies vs historical data)
 * 3. SAM/MAM Classification Conflict (discordance between MUAC and WAZ/WHZ)
 * 4. Existing Urgent Follow-up Conflict (attempting to close/mark normal with pending SAM followup)
 * 5. Review Load / Attention Management Queue (triage Urgent, Conflicts, Pending)
 */

export interface PreviousAssessment {
  id: number;
  date: string;
  weight_kg: number;
  height_cm: number;
  muac_cm: number;
  nutrition_status: "normal" | "mam" | "sam";
  recorded_by?: string;
  notes?: string;
}

export interface AssessmentInput {
  childId: number;
  childName: string;
  ageMonths: number;
  gender: string;
  weightKg: number;
  heightCm: number;
  muacCm: number;
  assessmentDate?: string;
  officerName?: string;
}

export type ClinicalConflict = ConflictItem;

export interface ConflictItem {
  id: string;
  type: "duplicate" | "measurement" | "classification" | "urgent_followup";
  severity: "urgent" | "conflict" | "warning";
  titleHi: string;
  titleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  childId: number;
  childName: string;
  field?: string;
  previousValue?: string;
  currentValue?: string;
  discrepancyDetails: {
    indicatorA: string;
    valueA: string;
    indicatorB: string;
    valueB: string;
  };
  recommendedActionHi: string;
  recommendedActionEn: string;
  canOverrideWithCheck: boolean;
}

export interface AttentionItem {
  id: string;
  caseId: string;
  childId: number;
  childName: string;
  ageMonths: number;
  gender: string;
  category: "urgent" | "conflict" | "pending";
  issueTitleHi: string;
  issueTitleEn: string;
  detailHi: string;
  detailEn: string;
  timestamp: string;
  statusBadge: "sam" | "mam" | "normal" | "conflict" | "pending";
  assignedOfficer?: string;
  dueAction: string;
  conflictData?: ConflictItem;
}

// ─── Historical Baseline Data for Children ────────────────────────────────────

export const HISTORICAL_ASSESSMENTS: Record<number, PreviousAssessment[]> = {
  1: [
    {
      id: 101,
      date: "2026-08-15",
      weight_kg: 12.5,
      height_cm: 92,
      muac_cm: 12.0,
      nutrition_status: "mam",
      recorded_by: "श्रीमती प्रिया शर्मा",
      notes: "वजन में स्थिरता, THR राशन दिया गया।",
    },
    {
      id: 95,
      date: "2026-07-15",
      weight_kg: 12.2,
      height_cm: 91,
      muac_cm: 12.1,
      nutrition_status: "mam",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
  2: [
    {
      id: 102,
      date: "2026-08-16",
      weight_kg: 15.2,
      height_cm: 102,
      muac_cm: 14.1,
      nutrition_status: "normal",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
  3: [
    {
      id: 103,
      date: "2026-08-18",
      weight_kg: 10.8,
      height_cm: 98,
      muac_cm: 11.2,
      nutrition_status: "sam",
      recorded_by: "श्रीमती प्रिया शर्मा",
      notes: "MUAC 11.2 cm अति-गंभीर। PHC रेफरल लंबित है।",
    },
  ],
  4: [
    {
      id: 104,
      date: "2026-08-19",
      weight_kg: 14.0,
      height_cm: 96,
      muac_cm: 13.8,
      nutrition_status: "normal",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
  5: [
    {
      id: 105,
      date: "2026-08-20",
      weight_kg: 11.0,
      height_cm: 85,
      muac_cm: 11.9,
      nutrition_status: "mam",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
  6: [
    {
      id: 106,
      date: "2026-08-21",
      weight_kg: 17.5,
      height_cm: 110,
      muac_cm: 14.5,
      nutrition_status: "normal",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
  7: [
    {
      id: 107,
      date: "2026-08-21",
      weight_kg: 14.8,
      height_cm: 100,
      muac_cm: 13.9,
      nutrition_status: "normal",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
  8: [
    {
      id: 108,
      date: "2026-08-22",
      weight_kg: 12.0,
      height_cm: 90,
      muac_cm: 12.2,
      nutrition_status: "mam",
      recorded_by: "श्रीमती प्रिया शर्मा",
    },
  ],
};

// ─── Conflict Check 1: Duplicate Assessment Check ─────────────────────────────

export function checkDuplicateAssessment(
  childId: number,
  childName: string,
  assessmentDate: string
): ConflictItem | null {
  const history = HISTORICAL_ASSESSMENTS[childId] || [];
  const existingToday = history.find((a) => a.date === assessmentDate);

  if (existingToday) {
    return {
      id: `dup-${childId}-${assessmentDate}`,
      type: "duplicate",
      severity: "warning",
      titleHi: "संभावित दोहरा मूल्यांकन (Possible Duplicate Assessment)",
      titleEn: "Duplicate Assessment Detected for Today",
      descriptionHi: `${childName} के लिए आज दिनांक (${assessmentDate}) को पहले ही एक मूल्यांकन दर्ज किया जा चुका है।`,
      descriptionEn: `An assessment for ${childName} was already recorded today (${assessmentDate}) by ${existingToday.recorded_by || "Staff"}.`,
      childId,
      childName,
      previousValue: `${existingToday.weight_kg} kg | ${existingToday.muac_cm} cm (${existingToday.date})`,
      currentValue: `नया मूल्यांकन (${assessmentDate})`,
      discrepancyDetails: {
        indicatorA: "पूर्व प्रविष्टि (Existing Record)",
        valueA: `वजन: ${existingToday.weight_kg} kg, MUAC: ${existingToday.muac_cm} cm`,
        indicatorB: "वर्तमान प्रविष्टि (New Entry)",
        valueB: `आज का नया रिकॉर्ड प्रविष्टि प्रयास`,
      },
      recommendedActionHi: "क्या आप पूर्व प्रविष्टि को संशोधित करना चाहते हैं या नई प्रविष्टि जारी रखनी है?",
      recommendedActionEn: "Review existing record before creating a duplicate entry.",
      canOverrideWithCheck: true,
    };
  }
  return null;
}

// ─── Conflict Check 2: Measurement Anomaly Conflict Check ─────────────────────

export function checkMeasurementConflict(
  input: AssessmentInput
): ConflictItem | null {
  const history = HISTORICAL_ASSESSMENTS[input.childId] || [];
  if (history.length === 0) return null;

  const prev = history[0]; // Most recent assessment

  // Weight anomaly check: Weight change > 25% or drop > 2.0 kg in short period
  const weightDiff = Math.abs(input.weightKg - prev.weight_kg);
  const weightPctChange = (weightDiff / prev.weight_kg) * 100;

  if (weightPctChange > 25 || (prev.weight_kg - input.weightKg > 2.5)) {
    return {
      id: `meas-wt-${input.childId}`,
      type: "measurement",
      severity: "conflict",
      titleHi: "माप विसंगति समीक्षा आवश्यक (Measurement Requires Review)",
      titleEn: "Significant Weight Variance Detected",
      descriptionHi: `नया दर्ज वजन (${input.weightKg} kg) पिछले दर्ज माप (${prev.weight_kg} kg) से अत्यधिक भिन्न है (${weightPctChange.toFixed(0)}% अंतर)।`,
      descriptionEn: `The newly entered weight (${input.weightKg} kg) differs significantly from the previous recorded measurement (${prev.weight_kg} kg).`,
      childId: input.childId,
      childName: input.childName,
      field: "weight_kg",
      previousValue: `${prev.weight_kg} kg (${prev.date})`,
      currentValue: `${input.weightKg} kg (आज)`,
      discrepancyDetails: {
        indicatorA: `पूर्व माप (${prev.date})`,
        valueA: `${prev.weight_kg} kg (स्थिति: ${prev.nutrition_status.toUpperCase()})`,
        indicatorB: `वर्तमान प्रविष्टि`,
        valueB: `${input.weightKg} kg (अंतर: ${(input.weightKg - prev.weight_kg).toFixed(1)} kg)`,
      },
      recommendedActionHi: "कृपया वजन तराजू व प्रविष्टि अंकों की पुष्टि करें। यदि माप सही है तो पुनः जाँच की पुष्टि करें।",
      recommendedActionEn: "Verify physical weighing scale and confirm measurement recheck.",
      canOverrideWithCheck: true,
    };
  }

  // Height anomaly check: Height decreased by more than 1 cm (impossible shrinkage)
  if (prev.height_cm - input.heightCm > 1.0) {
    return {
      id: `meas-ht-${input.childId}`,
      type: "measurement",
      severity: "conflict",
      titleHi: "ऊंचाई माप विसंगति (Height Measurement Anomaly)",
      titleEn: "Recorded Height is Lower than Previous Record",
      descriptionHi: `वर्तमान दर्ज लंबाई (${input.heightCm} cm) पिछली दर्ज लंबाई (${prev.height_cm} cm) से कम है।`,
      descriptionEn: `Current recorded height (${input.heightCm} cm) is lower than previous record (${prev.height_cm} cm).`,
      childId: input.childId,
      childName: input.childName,
      field: "height_cm",
      previousValue: `${prev.height_cm} cm (${prev.date})`,
      currentValue: `${input.heightCm} cm (आज)`,
      discrepancyDetails: {
        indicatorA: `पूर्व लंबाई (${prev.date})`,
        valueA: `${prev.height_cm} cm`,
        indicatorB: `वर्तमान प्रविष्टि`,
        valueB: `${input.heightCm} cm (असंभव कमी)`,
      },
      recommendedActionHi: "इन्फेंटोमीटर / स्टेडियोमीटर पर लंबाई पुनः मापें।",
      recommendedActionEn: "Recheck height using stadiometer before submitting.",
      canOverrideWithCheck: true,
    };
  }

  return null;
}

// ─── Conflict Check 3: SAM / MAM Classification Conflict ─────────────────────

export function checkClassificationConflict(
  input: AssessmentInput
): ConflictItem | null {
  // MUAC-based classification
  // MUAC < 11.5 cm => SAM
  // MUAC 11.5 - 12.5 cm => MAM
  // MUAC >= 12.5 cm => Normal
  const muacStatus =
    input.muacCm < 11.5 ? "sam" : input.muacCm <= 12.5 ? "mam" : "normal";

  // Approximate weight-for-age indicator based on age
  // Median weights roughly: 36mo: 14kg, 48mo: 16kg, 60mo: 18kg
  const expectedWeight = 8 + (input.ageMonths / 12) * 2;
  const weightRatio = input.weightKg / expectedWeight;
  const weightStatus =
    weightRatio < 0.70 ? "sam" : weightRatio < 0.85 ? "mam" : "normal";

  // Check if MUAC says SAM but Weight says Normal, or vice versa
  if (muacStatus === "sam" && weightStatus === "normal") {
    return {
      id: `class-sam-norm-${input.childId}`,
      type: "classification",
      severity: "urgent",
      titleHi: "वर्गीकरण विसंगति संसूचन (Classification Conflict Detected)",
      titleEn: "Discordant Nutritional Classification Indicators",
      descriptionHi: "MUAC मापन अति गंभीर कुपोषण (SAM) दर्शाता है जबकि वजन-आयु अनुपात सामान्य सीमा में प्रतीत होता है।",
      descriptionEn: "MUAC indicates Severe Acute Malnutrition (SAM < 11.5 cm) while Weight-for-Age appears Normal.",
      childId: input.childId,
      childName: input.childName,
      discrepancyDetails: {
        indicatorA: "MUAC फीता मापन (MUAC Tape)",
        valueA: `${input.muacCm} cm → SAM (अति गंभीर)`,
        indicatorB: "वजन-आयु अनुपात (Weight Indicator)",
        valueB: `${input.weightKg} kg → Normal (अपेक्षित ~${expectedWeight.toFixed(1)} kg)`,
      },
      recommendedActionHi: "MUAC टेप का रंग बैंड व दोनों हाथों का मध्य बिंदु पुनः जांचें। क्लीनिकल प्रोटोकॉल अनुसार SAM प्राथमिकता को मान्य किया जाएगा।",
      recommendedActionEn: "Recheck MUAC tape placement. Clinical safety protocol prioritizes SAM escalation.",
      canOverrideWithCheck: true,
    };
  }

  if (muacStatus === "normal" && weightStatus === "sam") {
    return {
      id: `class-norm-sam-${input.childId}`,
      type: "classification",
      severity: "conflict",
      titleHi: "पोषण स्थिति विसंगति (Nutritional Indicator Discrepancy)",
      titleEn: "Low Weight vs Normal MUAC Discrepancy",
      descriptionHi: "वजन गंभीर रूप से कम है परंतु MUAC सामान्य दर्ज हुआ है।",
      descriptionEn: "Weight is severely low compared to age, but MUAC is in the normal range.",
      childId: input.childId,
      childName: input.childName,
      discrepancyDetails: {
        indicatorA: "वजन मापन (Weight Scale)",
        valueA: `${input.weightKg} kg → गंभीर कम वजन (Severely Low)`,
        indicatorB: "MUAC मापन (MUAC Tape)",
        valueB: `${input.muacCm} cm → सामान्य (Normal)`,
      },
      recommendedActionHi: "कपड़े/जूते हटाकर वजन व बाएं हाथ का MUAC पुनः लें।",
      recommendedActionEn: "Verify child weight without heavy clothing and re-measure MUAC.",
      canOverrideWithCheck: true,
    };
  }

  return null;
}

// ─── Conflict Check 4: Existing Urgent Follow-up Conflict ─────────────────────

export function checkUrgentFollowUpConflict(
  childId: number,
  childName: string,
  targetStatus: string,
  actionType: "mark_normal" | "close_case" | "dismiss_alert"
): ConflictItem | null {
  // Check if child has active SAM history or pending referral
  const history = HISTORICAL_ASSESSMENTS[childId] || [];
  const hasActiveSAM = history.some((h) => h.nutrition_status === "sam");

  if (hasActiveSAM && (targetStatus === "normal" || actionType === "close_case")) {
    return {
      id: `urgent-followup-${childId}`,
      type: "urgent_followup",
      severity: "urgent",
      titleHi: "लंबित आपातकालीन फॉलो-अप अवरोध (Existing Action Requires Attention)",
      titleEn: "Unresolved High-Priority Follow-up Active",
      descriptionHi: `${childName} के लिए पूर्व में गंभीर कुपोषण (SAM) दर्ज है और PHC रेफरल / NRC सत्यापन अभी भी लंबित है।`,
      descriptionEn: `${childName} has an unresolved high-priority SAM referral follow-up from a previous clinical assessment.`,
      childId,
      childName,
      discrepancyDetails: {
        indicatorA: "वर्तमान प्रस्तावित कार्यवाही (Proposed Action)",
        valueA: targetStatus === "normal" ? "स्थिति को 'सामान्य' दर्ज करना" : "प्रकरण बंद करना (Close Case)",
        indicatorB: "लंबित आपातकालीन कार्यवाही (Pending Action)",
        valueB: "PHC मेडिकल ऑफिसर रेफरल व NRC पोषण अनुवर्ती",
      },
      recommendedActionHi: "प्रकरण बंद करने या सामान्य घोषित करने से पहले अधिकृत PHC डिस्चार्ज प्रमाणपत्र व पोषण सुधार की पुष्टि आवश्यक है।",
      recommendedActionEn: "Verify PHC medical clearance before resolving or changing status.",
      canOverrideWithCheck: true,
    };
  }

  return null;
}

// ─── Combined Conflict Detection Engine ───────────────────────────────────────


export interface EvaluateInput {
  childId: number;
  childName: string;
  ageMonths: number;
  gender: string;
  currentWeight?: number;
  weightKg?: number;
  currentHeight?: number;
  heightCm?: number;
  currentMuac?: number;
  muacCm?: number;
  assessmentDate?: string;
  officerName?: string;
}

export const conflictEngine = {
  evaluate: (input: EvaluateInput): ConflictItem[] => {
    return runConflictEngine({
      childId: input.childId,
      childName: input.childName,
      ageMonths: input.ageMonths,
      gender: input.gender,
      weightKg: input.currentWeight ?? input.weightKg ?? 0,
      heightCm: input.currentHeight ?? input.heightCm ?? 0,
      muacCm: input.currentMuac ?? input.muacCm ?? 0,
      assessmentDate: input.assessmentDate,
      officerName: input.officerName,
    });
  },
  run: runConflictEngine,
};

export function runConflictEngine(input: AssessmentInput): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  const todayStr = input.assessmentDate || new Date().toISOString().split("T")[0];

  // 1. Duplicate check
  const dup = checkDuplicateAssessment(input.childId, input.childName, todayStr);
  if (dup) conflicts.push(dup);

  // 2. Measurement anomaly check
  const meas = checkMeasurementConflict(input);
  if (meas) conflicts.push(meas);

  // 3. Classification conflict check
  const classConf = checkClassificationConflict(input);
  if (classConf) conflicts.push(classConf);

  return conflicts;
}

// ─── Attention Center / Review Load Aggregator ────────────────────────────────

export function generateAttentionCenterQueue(): AttentionItem[] {
  return [
    {
      id: "att-1",
      caseId: "AROMI-2026-00003",
      childId: 3,
      childName: "अनीता पाटिल (Anita Patil)",
      ageMonths: 54,
      gender: "F",
      category: "urgent",
      issueTitleHi: "SAM फॉलो-अप व PHC रेफरल लंबित",
      issueTitleEn: "Urgent SAM follow-up overdue",
      detailHi: "MUAC 11.2 cm अति-गंभीर। 72 घंटे पूर्व जारी रेफरल का अनुवर्ती सत्यापन नहीं हुआ है।",
      detailEn: "Critical SAM case requiring immediate hospital follow-up and supervisor escalation.",
      timestamp: "22 Aug 2026, 08:30 AM",
      statusBadge: "sam",
      assignedOfficer: "श्रीमती प्रिया शर्मा (AWW)",
      dueAction: "PHC रेफरल स्थिति सत्यापित करें",
    },
    {
      id: "att-2",
      caseId: "AROMI-2026-00001",
      childId: 1,
      childName: "राज कुमार (Raj Kumar)",
      ageMonths: 36,
      gender: "M",
      category: "conflict",
      issueTitleHi: "वजन विसंगति समीक्षा लंबित",
      issueTitleEn: "Weight inconsistency conflict requires review",
      detailHi: "पूर्व वजन 12.5 kg के मुकाबले नई प्रविष्टि में अत्यधिक गिरावट दर्ज की गई।",
      detailEn: "Significant weight variance detected vs previous record. Verification required.",
      timestamp: "22 Aug 2026, 10:15 AM",
      statusBadge: "conflict",
      assignedOfficer: "श्रीमती प्रिया शर्मा (AWW)",
      dueAction: "माप पुनः जांचें व पुष्टि करें",
    },
    {
      id: "att-3",
      caseId: "AROMI-2026-00008",
      childId: 8,
      childName: "काव्या मोरे (Kavya More)",
      ageMonths: 38,
      gender: "F",
      category: "conflict",
      issueTitleHi: "संभावित दोहरा मूल्यांकन दर्ज",
      issueTitleEn: "Duplicate assessment detected today",
      detailHi: "आज की तिथि में दो अलग-अलग प्रविष्टियों का प्रयास किया गया।",
      detailEn: "Multiple assessment entries attempted within the same reporting cycle.",
      timestamp: "22 Aug 2026, 11:40 AM",
      statusBadge: "conflict",
      assignedOfficer: "श्रीमती प्रिया शर्मा (AWW)",
      dueAction: "मूल्यांकन प्रविष्टि विलय करें",
    },
    {
      id: "att-4",
      caseId: "AROMI-2026-00005",
      childId: 5,
      childName: "सोनू यादव (Sonu Yadav)",
      ageMonths: 30,
      gender: "M",
      category: "pending",
      issueTitleHi: "मासिक MAM प्रगति सत्यापन लंबित",
      issueTitleEn: "MAM Monthly Verification Pending",
      detailHi: "15-दिवसीय अनुपूरक पोषाहार (THR) फॉलो-अप निरीक्षण प्रतीक्षारत।",
      detailEn: "Awaiting supervisor sign-off on 15-day supplementary nutrition progress.",
      timestamp: "21 Aug 2026, 04:20 PM",
      statusBadge: "mam",
      assignedOfficer: "श्रीमती प्रिया शर्मा (AWW)",
      dueAction: "पर्यवेक्षक सत्यापन पूर्ण करें",
    },
    {
      id: "att-5",
      caseId: "AROMI-2026-00006",
      childId: 6,
      childName: "पूजा वर्मा (Pooja Verma)",
      ageMonths: 60,
      gender: "F",
      category: "pending",
      issueTitleHi: "नया लाभार्थी पंजीकरण अनुमोदन",
      issueTitleEn: "New Registration Approval",
      detailHi: "आंगनवाड़ी केंद्र 14 में नए नामांकन का प्राथमिक डेटा सत्यापन लंबित है।",
      detailEn: "Initial demographic and immunization record verification pending.",
      timestamp: "21 Aug 2026, 02:10 PM",
      statusBadge: "pending",
      assignedOfficer: "श्रीमती प्रिया शर्मा (AWW)",
      dueAction: "दस्तावेज़ सत्यापन करें",
    },
  ];
}
