import type { SectionKey } from "@reactive-resume/schema";
import type { Template } from "@reactive-resume/utils";
import { useMemo } from "react";

import { Page } from "../components/page";
import type { ArtboardStore } from "../store/artboard";
import { useArtboardStore } from "../store/artboard";
import { getTemplate } from "../templates";

export const PreviewLayout = () => {
  const layout = useArtboardStore((state) => state.resume.metadata.layout);
  const template = useArtboardStore((state) => state.resume.metadata.template as Template);

  const Template = useMemo(() => getTemplate(template), [template]);

  return (
    <>
      {layout.map((columns, pageIndex) => (
        <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
          <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
        </Page>
      ))}
    </>
  );
};
function useEffect(arg0: () => void, arg1: ArtboardStore[]) {
  throw new Error("Function not implemented.");
}
