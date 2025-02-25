import type { ResumeData } from "@reactive-resume/schema";
import { create } from "zustand";

export type ArtboardStore = {
  resume: ResumeData;
  oldResume: ResumeData | null;
  setResume: (resume: ResumeData) => void;
  setOldResume: (oldResume: ResumeData) => void;
};

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  oldResume: null as unknown as ResumeData,
  setResume: (resume) => {
    set({ resume });
  },
  setOldResume: (oldResume) => {
    set({ oldResume });
  },
}));
