/* eslint-disable lingui/no-unlocalized-strings */
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { CaretDown, Flask, MagicWand, Plus } from "@phosphor-icons/react";
import { SelectValue } from "@radix-ui/react-select";
import type { ResumeDto } from "@reactive-resume/dto";
import { createResumeSchema } from "@reactive-resume/dto";
import { idSchema, sampleResume } from "@reactive-resume/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Tooltip,
} from "@reactive-resume/ui";
import { cn, generateRandomName } from "@reactive-resume/utils";
import slugify from "@sindresorhus/slugify";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import {
  useCreateResume,
  useDeleteResume,
  useUpdateResume,
  useUpdateResumeKeywords,
} from "@/client/services/resume";
import { useImportResume } from "@/client/services/resume/import";
import { useDialog } from "@/client/stores/dialog";
import { useResumeStore } from "@/client/stores/resume";

const formSchema = createResumeSchema.extend({ id: idSchema.optional(), slug: z.string() });

type FormValues = z.infer<typeof formSchema>;

export const ResumeDialog = () => {
  const { isOpen, mode, payload, close } = useDialog<ResumeDto>("resume");

  // const oldResume = useResumeStore((state) => state);
  const navigate = useNavigate();
  const setUpdatedResume = useResumeStore((state) => state.setUpdatedResume);

  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isDelete = mode === "delete";
  const isDuplicate = mode === "duplicate";
  const isUpdateResume = mode === "updateResume";

  const { createResume, loading: createLoading } = useCreateResume();
  const { updateResume, loading: updateLoading } = useUpdateResume();
  const { deleteResume, loading: deleteLoading } = useDeleteResume();
  const { updateRsmKeywords, loading: updateRsmKeywordsLoading } = useUpdateResumeKeywords();
  const { importResume: duplicateResume, loading: duplicateLoading } = useImportResume();

  const loading =
    createLoading || updateLoading || deleteLoading || duplicateLoading || updateRsmKeywordsLoading;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", slug: "" },
  });

  const [selectValue, setSelectValue] = useState("Ditto");

  useEffect(() => {
    if (isOpen) onReset();
  }, [isOpen, payload]);

  useEffect(() => {
    const slug = slugify(form.watch("title"));
    form.setValue("slug", slug);
  }, [form.watch("title")]);

  const onSubmit = async (values: FormValues) => {
    if (isCreate) {
      await createResume({ slug: values.slug, title: values.title, visibility: "private" });
    }

    if (isUpdate) {
      if (!payload.item?.id) return;

      await updateResume({
        id: payload.item.id,
        title: values.title,
        slug: values.slug,
      });
    }

    if (isDuplicate) {
      if (!payload.item?.id) return;

      await duplicateResume({
        title: values.title,
        slug: values.slug,
        data: payload.item.data,
      });
    }

    if (isDelete) {
      if (!payload.item?.id) return;

      await deleteResume({ id: payload.item.id });
    }

    close();
  };

  const onReset = () => {
    if (isCreate) form.reset({ title: "", slug: "" });
    if (isUpdate)
      form.reset({ id: payload.item?.id, title: payload.item?.title, slug: payload.item?.slug });
    if (isDuplicate)
      form.reset({ title: `${payload.item?.title} (Copy)`, slug: `${payload.item?.slug}-copy` });
    if (isDelete)
      form.reset({ id: payload.item?.id, title: payload.item?.title, slug: payload.item?.slug });
  };

  const onGenerateRandomName = () => {
    const name = generateRandomName();
    form.setValue("title", name);
    form.setValue("slug", slugify(name));
  };

  const onCreateSample = async () => {
    const randomName = generateRandomName();

    await duplicateResume({
      title: randomName,
      slug: slugify(randomName),
      data: sampleResume,
    });

    close();
  };

  const onResumeUpdate = async () => {
    if (!payload.item?.id) return;
    if (!form.getValues().title) return;
    const res = await updateRsmKeywords({
      jobDesc: form.getValues().title,
      data: payload.item,
      tempType: selectValue,
    });
    setUpdatedResume(res);
    close();
    void navigate(`/builder/${res.id}`);
  };

  if (isDelete) {
    return (
      <AlertDialog open={isOpen} onOpenChange={close}>
        <AlertDialogContent>
          <Form {...form}>
            <form>
              <AlertDialogHeader>
                <AlertDialogTitle>{t`Are you sure you want to delete your resume?`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t`This action cannot be undone. This will permanently delete your resume and cannot be recovered.`}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                <AlertDialogAction variant="error" onClick={form.handleSubmit(onSubmit)}>
                  {t`Delete`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (isUpdateResume) {
    return (
      <AlertDialog open={isOpen} onOpenChange={close}>
        <AlertDialogContent>
          <Form {...form}>
            <form>
              <AlertDialogHeader className="m-2">
                <AlertDialogTitle>{t`Update resume with necessary keywords for job hunt.`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t`Paste job description below to update your resume summary, technical skills and resume points.`}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="m-2">
                <Label>{t`Choose a Resume Template:`}</Label>
                <Select
                  value={selectValue}
                  name="select"
                  onValueChange={(value) => {
                    setSelectValue(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" /> {/* Add this line */}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Ditto">{t`Ditto`}</SelectItem>
                      <SelectItem disabled value="Pikachu-Update">{t`Pikachu-Update`}</SelectItem>

                      {/* Additional SelectItem components */}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="m-2">
                <FormField
                  name="title"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t`Job Description:`}</FormLabel>
                      <FormControl>
                        <textarea {...field} className="w-full flex-1" />
                      </FormControl>
                      <FormDescription>
                        {t`Tip: Enter job description here to update resume with keywords.`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>

                <Button
                  type="button"
                  disabled={loading}
                  className={cn(isCreate && "rounded-r-none")}
                  onClick={() => onResumeUpdate()}
                >
                  {t`Update Resume`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center space-x-2.5">
                  <Plus />
                  <h2>
                    {isCreate && t`Create a new resume`}
                    {isUpdate && t`Update an existing resume`}
                    {isDuplicate && t`Duplicate an existing resume`}
                  </h2>
                </div>
              </DialogTitle>
              <DialogDescription>
                {isCreate && t`Start building your resume by giving it a name.`}
                {isUpdate && t`Changed your mind about the name? Give it a new one.`}
                {isDuplicate && t`Give your old resume a new name.`}
              </DialogDescription>
            </DialogHeader>

            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t`Title`}</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-between gap-x-2">
                      <Input {...field} className="flex-1" />

                      {(isCreate || isDuplicate) && (
                        <Tooltip content={t`Generate a random title for your resume`}>
                          <Button
                            size="icon"
                            type="button"
                            variant="outline"
                            onClick={onGenerateRandomName}
                          >
                            <MagicWand />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t`Tip: You can name the resume referring to the position you are applying for.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="slug"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t`Slug`}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex items-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(isCreate && "rounded-r-none")}
                >
                  {isCreate && t`Create`}
                  {isUpdate && t`Save Changes`}
                  {isDuplicate && t`Duplicate`}
                </Button>

                {isCreate && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon" className="rounded-l-none border-l">
                        <CaretDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="center">
                      <DropdownMenuItem onClick={onCreateSample}>
                        <Flask className="mr-2" />
                        {t`Create Sample Resume`}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
