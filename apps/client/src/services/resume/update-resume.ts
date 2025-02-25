import type { ResumeDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";

import { axios } from "@/client/libs/axios";

export const updateRsmKeywords = async ({
  jobDesc,
  data,
  tempType,
}: {
  jobDesc: string;
  data: ResumeDto;
  tempType: string;
}): Promise<ResumeDto> => {
  const response = await axios.post<ResumeDto>("/resume/updateResume", { data, jobDesc, tempType });
  return response.data;
};

export const useUpdateResumeKeywords = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: updateRsmKeywordsFn,
  } = useMutation<ResumeDto, Error, { jobDesc: string; data: ResumeDto; tempType: string }>({
    mutationFn: updateRsmKeywords,
    onSuccess: (data) => {
      return data;
      // open modal to show differences between old and new resume.
    },
  });

  return { updateRsmKeywords: updateRsmKeywordsFn, loading, error };
};
