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
import IconMenu from "@/components/icon-menu";
import { X, ArrowRight, Loader2 } from "lucide-react";

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
    <div className="w-full p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
            Name your course
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            What would you like to name your course? Don&apos;t worry, you can
            change this later.
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <CustomFormField name={"title"} label={"* Course title"} />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto h-10 sm:h-9 order-2 sm:order-1 cursor-pointer"
              >
                <IconMenu icon={<X className="h-4 w-4" />} text="Cancel" />
              </Button>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting || isCreating}
                className="cursor-pointer w-full sm:w-auto h-10 sm:h-9 bg-green-600 hover:bg-green-700 text-white order-1 sm:order-2"
              >
                {isCreating ? (
                  <IconMenu
                    icon={<Loader2 className="h-4 w-4 animate-spin" />}
                    text="Creating..."
                  />
                ) : (
                  <IconMenu
                    icon={<ArrowRight className="h-4 w-4" />}
                    text="Continue"
                  />
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CourseCreatePage;
