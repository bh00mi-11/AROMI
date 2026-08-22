import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aromi_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("aromi_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Types ────────────────────────────────────────────────────────────────────
export interface AgentStatus {
  agent: string;
  status: "idle" | "running" | "completed" | "failed";
  last_run?: string | null;
  duration_ms?: number | null;
}

export interface DashboardSummary {
  total_children: number;
  present_today: number;
  mam_count: number;
  sam_count: number;
  normal_count: number;
  visits_due_today: number;
  worker_hours_saved: number;
  reports_automated_pct: number;
  offline_mode?: boolean;
  last_sync?: string;
}

// ── File Download Helper ─────────────────────────────────────────────────────
export const downloadBlobFile = (blobData: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blobData);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ── API helpers ──────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

export const childAPI = {
  list: () => api.get("/children/"),
  getAll: () => api.get("/children/"),
  get: (id: number | string) => api.get(`/children/${id}`),
  getById: (id: number | string) => api.get(`/children/${id}`),
  create: (data: any) => api.post("/children/", data),
  register: (data: any) => api.post("/children/", data),
  downloadDossierPDF: async (id: number | string, childName?: string) => {
    const res = await api.get(`/children/${id}/pdf`, { responseType: "blob" });
    const cleanName = (childName || `child_${id}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadBlobFile(res.data, `AROMI_Dossier_${cleanName}.pdf`);
  },
};

export const childrenAPI = childAPI;

export const growthAPI = {
  record: (data: any) => api.post("/growth/record", data),
  history: (childId: number | string) => api.get(`/growth/child/${childId}`),
};

export const attendanceAPI = {
  bulkLog: (date: string, records: any[]) =>
    api.post("/attendance/bulk", { date, records }),
  today: () => api.get("/attendance/today"),
};

export const activityAPI = {
  generate: (data: any) => api.post("/activity/generate", data),
  generatePlan: (data: any) => api.post("/activity/generate", data),
  today: () => api.get("/activity/today"),
  downloadPDF: async (planData: any) => {
    const res = await api.post("/activity/pdf", planData, { responseType: "blob" });
    downloadBlobFile(res.data, "AROMI_ECCE_Daily_Activity_Plan.pdf");
  },
  downloadTodayPDF: async () => {
    const res = await api.get("/activity/today/pdf", { responseType: "blob" });
    downloadBlobFile(res.data, "AROMI_ECCE_Today_Plan.pdf");
  },
};

export const mprAPI = {
  generate: (month: number, year: number) =>
    api.post("/mpr/generate", { month, year }),
  downloadPDF: async (month: number, year: number, mprData?: any) => {
    const res = await api.post(
      "/mpr/pdf",
      mprData ? { ...mprData, month, year } : { month, year },
      { responseType: "blob" }
    );
    downloadBlobFile(
      res.data,
      `AROMI_MPR_${year}_${String(month).padStart(2, "0")}.pdf`
    );
  },
};

export const voiceAPI = {
  process: (formData: FormData) =>
    api.post("/voice/process", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  logs: () => api.get("/voice/logs"),
};

export const photoAPI = {
  check: (formData: FormData) =>
    api.post("/photo/check", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  analyze: (
    photoBlob: Blob,
    childName?: string,
    ageMonths?: number,
    gender?: string
  ) => {
    const formData = new FormData();
    formData.append("photo", photoBlob, "child_photo.jpg");
    if (childName) formData.append("child_name", childName);
    if (ageMonths) formData.append("age_months", String(ageMonths));
    if (gender) formData.append("gender", gender);
    return api.post("/photo/check", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  checkDemo: (childName: string, status: string) =>
    api.post(
      `/photo/check-demo?child_name=${encodeURIComponent(
        childName
      )}&status=${status}`
    ),
};

export const ragAPI = {
  query: (question: string, language = "hindi") =>
    api.post("/rag/query", { question, language }),
};

export const agentAPI = {
  events: () => api.get("/agent/events"),
  pipelineStatus: () => api.get("/agent/pipeline/status"),
  getPipeline: () => api.get("/agent/pipeline/status"),
  getMetrics: () => api.get("/dashboard/stats"),
};

export const dashboardAPI = {
  stats: () => api.get("/dashboard/stats"),
  getStats: () => api.get("/dashboard/stats"),
};

export const visitsAPI = {
  list: () => api.get("/visits/"),
  getPriority: () => api.get("/visits/priority"),
  create: (data: any) => api.post("/visits/", data),
  schedule: (data: any) => api.post("/visits/", data),
  complete: (id: number | string, notes?: string) =>
    api.post(`/visits/${id}/complete`, { notes }),
};
