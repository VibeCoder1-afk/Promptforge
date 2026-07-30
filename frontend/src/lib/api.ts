import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("pf_token");
    }
    return Promise.reject(err);
  }
);

// ---- Typed shapes shared across the app ----
export type Prompt = {
  _id: string;
  title: string;
  description: string;
  workspace: string;
  collection: string | null;
  tags: string[];
  currentVersion: PromptVersion | null;
  isPublicTemplate: boolean;
  favoritedBy: string[];
  forkCount: number;
  updatedAt: string;
};

export type PromptVersion = {
  _id: string;
  prompt: string;
  versionNumber: number;
  content: string;
  variables: string[];
  jsonMode: boolean;
  functionCallingEnabled: boolean;
  notes: string;
  createdAt: string;
};

export type Evaluation = {
  _id: string;
  provider: "groq" | "gemini" | "mistral";
  model: string;
  output: string;
  renderedPrompt: string;
  isJsonValid: boolean | null;
  latencyMs: number;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  starRating: number | null;
  criteria: { accuracy: number | null; creativity: number | null; relevance: number | null; jsonValidity: number | null };
  promptScore: { clarity: number; specificity: number; outputConsistency: number; hallucinationRisk: number };
  abGroup: string | null;
  abLabel: "A" | "B" | null;
  status: "success" | "error";
  errorMessage: string;
  createdAt: string;
};
