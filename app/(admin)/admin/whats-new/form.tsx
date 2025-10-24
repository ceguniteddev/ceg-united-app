"use client";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import IconMenu from "@/components/icon-menu";
import { CheckIcon, Loader2Icon, SaveIcon, XIcon } from "lucide-react";

import { CustomFormField } from "@/components/CustomFormField";
import { useWhatsNewMutation } from "@/hooks/whats-new";
import { WhatsNew, whatsNewSchema } from "@/schema/whats-new";
import { withAdminGuard } from "@/components/wrapper";
import WhatsNewList from "./list";
import { useCallback, useEffect, useState } from "react";

const defaultValues: WhatsNew = {
  createdAt: new Date(),
  title: "",
  content: "",
  status: false,
};

const AdminWhatsNew = () => {
  const { isRecording, record, update, isUpdating } = useWhatsNewMutation();
  const [editingData, setEditingData] = useState<WhatsNew | null>(null);

  const form = useForm<WhatsNew>({
    resolver: zodResolver(whatsNewSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingData) {
      form.reset(editingData);
    }
  }, [editingData, form]);

  const handleCancelEdit = useCallback(() => {
    setEditingData(null);
    form.reset(defaultValues);
    form.clearErrors();
    setTimeout(() => form.setFocus("title"), 0);
  }, [form]);

  const onSubmit: SubmitHandler<WhatsNew> = useCallback(
    async (values) => {
      if (editingData) {
        await update({ id: editingData.id!, values });
        setEditingData(null);
        form.reset(defaultValues);
      } else {
        await record(values);
        form.reset(defaultValues);
      }
    },
    [record, update, editingData, form]
  );

  const isSubmitting = isRecording || isUpdating;
  const isEditing = !!editingData;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isRecording}>
            <fieldset disabled={isRecording}>
              <main className="max-w-3xl mx-auto space-y-4">
                <CustomFormField name="title" placeholder="" label="* Title" />

                <CustomFormField
                  name="content"
                  editorHeight={500}
                  placeholder=""
                  type="editor"
                  label="* Content"
                />

                <CustomFormField name="status" placeholder="" type="switch" label="Activate" />

                <div className="col-span-2 flex flex-wrap items-center justify-start gap-2 self-end">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      className="disabled:cursor-not-allowed"
                      onClick={handleCancelEdit}
                    >
                      <IconMenu icon={<XIcon className="mr-2 h-4 w-4" />} text="Cancel" />
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSubmitting}
                    className="bg-emerald-200 hover:bg-emerald-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <IconMenu
                        icon={<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                        text={isEditing ? "Updating..." : "Saving..."}
                      />
                    ) : isEditing ? (
                      <IconMenu icon={<CheckIcon className="mr-2 h-4 w-4" />} text="Update" />
                    ) : (
                      <IconMenu icon={<SaveIcon className="mr-2 h-4 w-4" />} text="Save" />
                    )}
                  </Button>
                </div>
              </main>
            </fieldset>
          </form>
        </Form>
      </div>
      <aside className="lg:col-span-5 lg:pl-2 lg:sticky lg:top-24">
        <WhatsNewList
          onEdit={(data) => {
            setEditingData(data);
          }}
        />
      </aside>
    </div>
  );
};
export default AdminWhatsNew;
