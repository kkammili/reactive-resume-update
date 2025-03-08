import type { ResumeData } from "@reactive-resume/schema";
import { create } from "zustand";

export type ArtboardStore = {
  resume: ResumeData;
  updatedResume: ResumeData | null;
  setResume: (resume: ResumeData) => void;
  setUpdatedResume: (oldResume: ResumeData) => void;
};

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  updatedResume: null as unknown as ResumeData,
  setResume: (resume) => {
    set({ resume });
  },
  setUpdatedResume: (updatedResume) => {
    set({ updatedResume });
  },
}));
