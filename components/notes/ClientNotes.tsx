import { CustomFormField } from "@/components/CustomFormField";
import IconMenu from "@/components/icon-menu";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAddUserNotesMutation, useUserNotesQuery } from "@/hooks/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Save, Trash2, XCircle } from "lucide-react";
import React, { use, useCallback, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type Props = {
  userId: string;
};

const notesSchema = z.object({
  notes: z.array(
    z.object({
      note: z.string().min(1, "Required"),
    })
  ),
});

const ClientNotes = ({ userId }: Props) => {
  const { notes, isLoading } = useUserNotesQuery(userId);

  const { addUserNotes, isRecording } = useAddUserNotesMutation();
  const form = useForm<z.infer<typeof notesSchema>>({
    defaultValues: { notes: [] },
    resolver: zodResolver(notesSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "notes",
  });

  useEffect(() => {
    if (notes) {
      const formattedNotes: { note: string }[] = (notes as string[]).flatMap((item) => {
        const n = item;
        if (Array.isArray(n)) return n.map((s) => ({ note: s }));
        if (n != null) return [{ note: String(n) }];
        return [];
      });

      form.reset({ notes: formattedNotes });
    }
  }, [notes, form]);

  const onSubmit = useCallback(
    async (values: z.infer<typeof notesSchema>) => {
      try {
        await addUserNotes({ userId, notes: values.notes.map((n) => n.note) });
      } catch (error) {
        toast.error("Error updating document!");
        console.log(error);
      }
    },
    [addUserNotes, userId]
  );

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <fieldset disabled={isRecording}>
            <div className="flex flex-row space-x-2 items-center justify-between mb-2">
              <Button
                type="button"
                variant={"outline"}
                className="hover:bg-purple-300 bg-purple-200 cursor-pointer"
                onClick={() => append({ note: "" })}
              >
                <PlusIcon /> ADD NOTE
              </Button>

              <Button
                type="submit"
                variant={"outline"}
                className="hover:bg-blue-300 bg-blue-200 cursor-pointer"
              >
                <IconMenu text="Save Notes" icon={<Save className="h-4 w-4" />} />
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-row space-x-2 space-y-2 items-start">
                <CustomFormField
                  name={`notes.${index}.note`}
                  className="col-span-3 w-full"
                  type="textarea"
                />
                <Button variant={"destructive"} type="button" onClick={() => remove(index)}>
                  <Trash2 color="black" />
                </Button>
              </div>
            ))}
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default ClientNotes;
