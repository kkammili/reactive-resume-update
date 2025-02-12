import type { ResumeDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";

import { axios } from "@/client/libs/axios";

export const updateRsmKeywords = async ({
  jobDesc,
  data,
}: {
  jobDesc: string;
  data: ResumeDto;
}): Promise<ResumeDto> => {
  const response = await axios.post<ResumeDto>("/resume/updateResume", { data, jobDesc });
  return response.data;
};

export const useUpdateResumeKeywords = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: updateRsmKeywordsFn,
  } = useMutation<ResumeDto, Error, { jobDesc: string; data: ResumeDto }>({
    mutationFn: updateRsmKeywords,
    onSuccess: (data) => {
      console.log(data, '<------ getting resp back from endpoint')
      // queryClient.setQueryData<ResumeDto>(["resume", { id: data.id }], data);
      // Uncomment if you want to update the resumes list
      // queryClient.setQueryData<ResumeDto[]>(["resumes"], (cache) => {
      //   return cache ? [...cache, data] : [data];
      // });
    },
  });

  return { updateRsmKeywords: updateRsmKeywordsFn, loading, error };
};
