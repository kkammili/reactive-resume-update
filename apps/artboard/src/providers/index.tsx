import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Outlet } from "react-router";

import { helmetContext } from "../constants/helmet";
import { useArtboardStore } from "../store/artboard";

export const Providers = () => {
  const resume = useArtboardStore((state) => state.resume);
  const setResume = useArtboardStore((state) => state.setResume);
  const setUpdatedResume = useArtboardStore((state) => state.setUpdatedResume);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "SET_RESUME") setResume(event.data.payload);
      if (event.data.type === "SET_UPDATED_RESUME") {
        setUpdatedResume(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage, false);

    return () => {
      window.removeEventListener("message", handleMessage, false);
    };
  }, []);

  useEffect(() => {
    const resumeData = window.localStorage.getItem("resume");
    const oldResumeData = window.localStorage.getItem("oldResume");
    if (resumeData) setResume(JSON.parse(resumeData));
    if (oldResumeData) setUpdatedResume(JSON.parse(oldResumeData));
  }, [window.localStorage.getItem("resume"), window.localStorage.getItem("oldResume")]);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!resume) return null;

  return (
    <HelmetProvider context={helmetContext}>
      <Outlet />
    </HelmetProvider>
  );
};
