/**
 * AROMI Offline Database — Dexie.js (IndexedDB wrapper)
 * Day 4: Full offline-first support with sync queue
 *
 * Strategy:
 *   1. All mutations are written to offlineQueue first
 *   2. Reads fall back to local cache when API fails
 *   3. Background sync fires every 30s when online
 *   4. UI shows badge count of pending operations
 */

import Dexie, { Table } from "dexie";

// ─── Schema Types ────────────────────────────────────────────────────────────

export interface QueuedOp {
  id?: number;
  endpoint: string;          // e.g. "/attendance/bulk"
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: any;
  timestamp: number;
  retries: number;
  status: "pending" | "syncing" | "failed";
  errorMsg?: string;
}

export interface CachedChild {
  id: number;
  name: string;
  age_months: number;
  gender: string;
  nutrition_status: string;
  muac_cm?: number;
  weight_kg?: number;
  guardian_name?: string;
  guardian_phone?: string;
  is_active: boolean;
  worker_id: number;
  cachedAt: number;
}

export interface CachedAttendance {
  id?: number;
  child_id: number;
  date: string;
  present: boolean;
  synced: boolean;
}

export interface CachedGrowthRecord {
  id?: number;
  child_id: number;
  weight_kg?: number;
  muac_cm?: number;
  date: string;
  nutrition_status: string;
  z_score?: number;
  synced: boolean;
}

export interface CachedDashboardStats {
  id?: number;            // always 1 (singleton)
  data: any;
  cachedAt: number;
}

export interface KBEntry {
  id?: number;
  source: string;
  content: string;
  keywords: string[];     // for local full-text search
}

// ─── Database Definition ─────────────────────────────────────────────────────

export class AROMIDatabase extends Dexie {
  offlineQueue!: Table<QueuedOp, number>;
  children!: Table<CachedChild, number>;
  attendance!: Table<CachedAttendance, number>;
  growthRecords!: Table<CachedGrowthRecord, number>;
  dashboardStats!: Table<CachedDashboardStats, number>;
  knowledgeBase!: Table<KBEntry, number>;

  constructor() {
    super("AROMI_DB");

    this.version(1).stores({
      offlineQueue:   "++id, endpoint, status, timestamp",
      children:       "id, worker_id, nutrition_status, is_active, cachedAt",
      attendance:     "++id, child_id, date, synced",
      growthRecords:  "++id, child_id, date, synced",
      dashboardStats: "++id",
      knowledgeBase:  "++id, source, *keywords",
    });
  }
}

export const db = new AROMIDatabase();

// ─── Seed local WHO/ICDS knowledge base ──────────────────────────────────────

export async function seedKnowledgeBase() {
  const count = await db.knowledgeBase.count();
  if (count > 0) return; // already seeded

  const entries: Omit<KBEntry, "id">[] = [
    {
      source: "WHO Child Growth Standards",
      content: "MUAC < 11.5 cm = SAM (Severe Acute Malnutrition). MUAC 11.5–12.5 cm = MAM. MUAC ≥ 12.5 cm = Normal. SAM children require immediate therapeutic feeding and PHC referral.",
      keywords: ["muac", "sam", "mam", "malnutrition", "कुपोषण", "severe", "moderate"],
    },
    {
      source: "WHO Weight-for-Age Z-Score",
      content: "WAZ < -3 SD = Severely Underweight (SAM). WAZ -3 to -2 SD = Underweight (MAM). WAZ > -2 SD = Normal. Monthly weighing mandatory for all children 0–60 months.",
      keywords: ["weight", "waz", "z-score", "वजन", "underweight", "zscore"],
    },
    {
      source: "WHO Height-for-Age (Stunting)",
      content: "HAZ < -3 SD = Severe Stunting. HAZ -3 to -2 SD = Moderate Stunting. Stunting is irreversible after age 2; focus on first 1000 days of life.",
      keywords: ["height", "stunting", "haz", "height-for-age", "लंबाई", "छोटा"],
    },
    {
      source: "ICDS Guidelines — SAM Management",
      content: "SAM (Severe Acute Malnutrition) with complications: admit to NRC within 24 hours. Uncomplicated SAM: community-based management with RUTF (Ready-to-Use Therapeutic Food). Follow-up every 7 days.",
      keywords: ["sam", "nrc", "rutf", "severe", "therapeutic", "admit", "गंभीर"],
    },
    {
      source: "ICDS Guidelines — MAM Management",
      content: "MAM children (3–6 years): RUSF (Ready-to-Use Supplementary Food), 5–6 meals daily, dal, eggs, milk. Follow up every 15 days. If no improvement in 8 weeks → escalate to SAM protocol.",
      keywords: ["mam", "rusf", "moderate", "supplementary", "dal", "दाल", "पोषण"],
    },
    {
      source: "POSHAN Abhiyaan Targets",
      content: "National targets: reduce stunting 2%/year, wasting 2%/year, anaemia 3%/year. Convergence mission covering ICDS, health, WASH, food security. Monthly home visits mandatory for SAM cases.",
      keywords: ["poshan", "stunting", "wasting", "anaemia", "national", "target", "पोषण अभियान"],
    },
    {
      source: "ICDS Immunisation Schedule",
      content: "Birth: BCG, OPV0, Hep B0. 6wk: OPV1, Penta1, RVV1, fIPV1. 10wk: OPV2, Penta2, RVV2. 14wk: OPV3, Penta3, fIPV2. 9mo: MR1, JE1. 16–24mo: DPT/OPV/Penta boosters, MR2, JE2.",
      keywords: ["immunisation", "vaccine", "टीका", "bcg", "opv", "penta", "mrv", "schedule"],
    },
    {
      source: "ICDS — Breastfeeding & Complementary Feeding",
      content: "Exclusive breastfeeding for 6 months. Complementary feeding starts at 6 months: mashed dal-rice, mashed vegetables. By 12 months: family food (soft). Breastfeeding continues up to 2 years.",
      keywords: ["breastfeeding", "complementary", "feeding", "स्तनपान", "खिलाना", "aahar"],
    },
    {
      source: "Vitamin & Micronutrient Supplementation",
      content: "Vitamin A: 1 lakh IU at 9 months, then 2 lakh IU every 6 months until age 5. Iron-Folic Acid: weekly for 6–59 months. Zinc: for diarrhoea management (10–20 mg/day for 10–14 days).",
      keywords: ["vitamin a", "iron", "folic", "zinc", "विटामिन", "आयरन", "supplement"],
    },
    {
      source: "Home Visit Protocol — Anganwadi",
      content: "Mandatory home visit frequency: SAM child — weekly. MAM child — fortnightly. Newborn — within 24 hours of birth. All other children — monthly. Record visit in AWC register and mobile app.",
      keywords: ["home visit", "griha bhramaण", "visit", "frequency", "grihabhramaN", "गृह भ्रमण"],
    },
    {
      source: "ICDS — Anaemia Management",
      content: "Anaemia in children <5 years: Hb < 11 g/dL. Mild: 10–10.9. Moderate: 7–9.9. Severe: <7. Treatment: IFA syrup 20 mg/day for mild-moderate. Refer to PHC for severe anaemia.",
      keywords: ["anaemia", "anemia", "hemoglobin", "hb", "iron", "आयरन", "रक्त"],
    },
    {
      source: "Diarrhoea & ORS Protocol",
      content: "Diarrhoea management: ORS after every loose stool (50–100 mL for <2 years, 100–200 mL for ≥2 years). Continue breastfeeding. Zinc 20 mg/day × 14 days. Refer if blood in stool, sunken eyes, or unable to drink.",
      keywords: ["diarrhoea", "diarrhea", "ors", "oral rehydration", "दस्त", "zinc"],
    },
    {
      source: "WASH — Water & Sanitation",
      content: "Handwashing with soap: before food, after toilet, after handling child waste. Safe water: boil or use chlorine tablets. Open defecation-free status linked to reduced wasting. AWC must have hand-washing facility.",
      keywords: ["wash", "handwashing", "water", "sanitation", "hygiene", "स्वच्छता"],
    },
    {
      source: "Growth Monitoring — Monthly Protocol",
      content: "Weigh child on same scale monthly. Record on growth chart. Plot on WHO standard curves. Falling two major lines = growth faltering → immediate referral. Reweigh if weight seems incorrect.",
      keywords: ["growth monitoring", "weigh", "chart", "plot", "faltering", "विकास निगरानी"],
    },
    {
      source: "ICDS — Severe Wasting vs Oedema",
      content: "Bilateral pitting oedema = Kwashiorkor (protein deficiency). Severe wasting without oedema = Marasmus. Both are SAM — refer to NRC. Test for oedema by pressing top of foot for 3 seconds.",
      keywords: ["oedema", "kwashiorkor", "marasmus", "wasting", "protein", "edema", "सूजन"],
    },
  ];

  await db.knowledgeBase.bulkAdd(entries as KBEntry[]);
  console.log("[AROMI-DB] Knowledge base seeded:", entries.length, "entries");
}

// ─── Offline Queue Operations ─────────────────────────────────────────────────

export async function enqueueOp(
  endpoint: string,
  method: QueuedOp["method"],
  payload: any
): Promise<number> {
  return db.offlineQueue.add({
    endpoint,
    method,
    payload,
    timestamp: Date.now(),
    retries: 0,
    status: "pending",
  });
}

export async function getPendingCount(): Promise<number> {
  return db.offlineQueue.where("status").anyOf(["pending", "failed"]).count();
}

// ─── Local KB Search (works fully offline) ───────────────────────────────────

export async function searchKB(query: string): Promise<KBEntry[]> {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return [];

  const all = await db.knowledgeBase.toArray();
  const scored = all
    .map((entry) => {
      const haystack = (entry.content + " " + entry.keywords.join(" ") + " " + entry.source).toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((r) => r.entry);
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function cacheChildren(children: CachedChild[]) {
  const now = Date.now();
  await db.children.bulkPut(children.map((c) => ({ ...c, cachedAt: now })));
}

export async function getCachedChildren(workerId: number): Promise<CachedChild[]> {
  return db.children.where("worker_id").equals(workerId).toArray();
}

export async function cacheDashboardStats(data: any) {
  await db.dashboardStats.put({ id: 1, data, cachedAt: Date.now() });
}

export async function getCachedDashboardStats(): Promise<any | null> {
  const row = await db.dashboardStats.get(1);
  if (!row) return null;
  // Stale after 1 hour
  if (Date.now() - row.cachedAt > 60 * 60 * 1000) return null;
  return row.data;
}
