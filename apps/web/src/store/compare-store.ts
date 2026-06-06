import { create } from "zustand";
import type { CompareOptions } from "@jsontools/shared";

interface CompareState {
  json1: string;
  json2: string;
  options: CompareOptions;
  setJson1: (v: string) => void;
  setJson2: (v: string) => void;
  setOptions: (o: CompareOptions) => void;
  reset: () => void;
}

const SAMPLE_JSON_1 = JSON.stringify(
  {
    name: "Alice",
    age: 30,
    address: { city: "Mumbai", zip: "400001" },
    tags: ["developer", "architect"],
  },
  null,
  2
);

const SAMPLE_JSON_2 = JSON.stringify(
  {
    name: "Alice",
    age: 31,
    address: { city: "Pune", zip: "411001" },
    tags: ["developer", "manager"],
    email: "alice@example.com",
  },
  null,
  2
);

export const useCompareStore = create<CompareState>((set) => ({
  json1: SAMPLE_JSON_1,
  json2: SAMPLE_JSON_2,
  options: { ttlHours: 12 },
  setJson1: (v) => set({ json1: v }),
  setJson2: (v) => set({ json2: v }),
  setOptions: (o) => set({ options: o }),
  reset: () => set({ json1: "", json2: "", options: {} }),
}));
