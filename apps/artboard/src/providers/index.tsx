import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Outlet } from "react-router";

import { helmetContext } from "../constants/helmet";
import { useArtboardStore } from "../store/artboard";
import { updatedResume } from './new.js';
import { oldResume } from './old.js';

export const Providers = () => {
  const resume = useArtboardStore((state) => state.resume);
  const setResume = useArtboardStore((state) => state.setResume);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "SET_RESUME") setResume(event.data.payload);
    };

    window.addEventListener("message", handleMessage, false);

    return () => {
      window.removeEventListener("message", handleMessage, false);
    };
  }, []);

  useEffect(() => {
    // const resumeData = window.localStorage.getItem("resume");
    // console.log(updatedResume, JSON.parse(resumeData), '<----- check these')

    // if (resumeData) setResume(JSON.parse(resumeData));
    setResume(updatedResume);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!resume) return null;

  return (
    <HelmetProvider context={helmetContext}>
      <Outlet />
    </HelmetProvider>
  );
};
