"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CustomFormField } from "@/components/CustomFormField";
import { useCourseMutation } from "@/hooks/educational-materials/course";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

const CourseCreatePage = ({
  setOpen,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  const { createCourse, isCreating } = useCourseMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // const response = await axios.post("/api/courses", values);
      // // router.refresh();
      // router.push(`/admin/educational-materials/courses/${response.data.id}`);
      // toast.success("Course created");
      const response = await createCourse({ title: values.title });
      toast.success("Course created");
      // router.refresh();
      router.push(`/admin/educational-materials/courses/${response.id}`);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full">
      <div>
        <h1 className="text-2xl">Name your course</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your course? Don&apos;t worry, you can
          change this later.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <CustomFormField name={"title"} label={"* Course title"} />

            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting || isCreating}
                className="cursor-pointer"
              >
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CourseCreatePage;
