import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { BankTaggingTextarea } from "@/components/notes/BankTaggingTextarea";
import { renderCommentText } from "@/components/notes/renderCommentText";
import { useBankManagementQuery } from "@/hooks/admin/bank-management";
import { useGetNoteQuery, useUpdateNoteMutation } from "@/hooks/apply-funding";
import { useAuth } from "@/provider/AuthContext";
import { NoteSchema, noteSchema } from "@/schema/notes";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Edit,
  MessageCircle,
  MoreHorizontal,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import Spinner from "../Spinner";

type Props = {
  applicationReferenceNumber: string;
};

const FundApplicationNotesV2 = ({ applicationReferenceNumber }: Props) => {
  const { user, userData } = useAuth();
  const { banks } = useBankManagementQuery();
  const {
    data: noteData,
    isLoading,
    isError,
  } = useGetNoteQuery(applicationReferenceNumber);

  const { mutate: saveNote, isPending: isSaving } = useUpdateNoteMutation(
    applicationReferenceNumber,
  );

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // --- FORM HOOKS (THE FIX IS HERE) ---
  const form = useForm<NoteSchema>({
    resolver: zodResolver(noteSchema),
    // Use the 'values' property to handle async default data.
    // Provide a fallback structure that matches the schema for the initial render.
    values: noteData || { description: "", comments: [] },
  });

  // This useEffect is no longer needed because 'values' handles it.
  // React.useEffect(() => {
  //   if (noteData) {
  //     form.reset(noteData);
  //   }
  // }, [noteData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "comments",
  });

  const newCommentForm = useForm<{ text: string }>({
    resolver: zodResolver(z.object({ text: z.string().min(1) })),
    defaultValues: { text: "" },
  });

  const handleSaveNote = async (data: NoteSchema) => {
    saveNote(data);
  };

  const onDescriptionSubmit = async (data: NoteSchema) => {
    await handleSaveNote(data);
    setIsEditingDescription(false);
  };

  const onCommentUpdate = async () => {
    await form.handleSubmit(handleSaveNote)();
    setEditingCommentId(null);
  };

  const onCommentDelete = (index: number) => {
    remove(index);
    form.handleSubmit(handleSaveNote)();
  };

  const onAddNewComment = (data: { text: string }) => {
    const authorName = userData
      ? `${userData.firstName} ${userData.lastName}`.trim()
      : (user?.displayName ?? "Anonymous");
    append({
      id: `comment-${Date.now()}`,
      text: data.text,
      author: authorName,
      authorEmail: user?.email ?? "",
      createdAt: new Date(),
    });
    form.handleSubmit(handleSaveNote)();
    newCommentForm.reset();
  };

  if (isLoading) return <Spinner displayText="Loading notes..." />;
  if (isError) return <div>Error loading notes.</div>;

  // No changes to JSX below this line
  return (
    <Card className="w-full">
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {" "}
        {/* Added pt-6 for padding */}
        {/* --- DESCRIPTION SECTION --- */}
        <div>
          <h3 className="font-semibold text-sm sm:text-base mb-2">
            Description
          </h3>
          {isEditingDescription ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onDescriptionSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BankTaggingTextarea
                          placeholder="Add a detailed description..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="cursor-pointer w-full sm:w-auto h-10 sm:h-9"
                    onClick={() => {
                      // Reset to the original data from the server
                      form.reset(noteData);
                      setIsEditingDescription(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="cursor-pointer w-full sm:w-auto h-10 sm:h-9"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div
              className="prose dark:prose-invert max-w-none p-3 bg-muted rounded-md min-h-[80px] cursor-pointer hover:bg-muted/80"
              onClick={() => setIsEditingDescription(true)}
            >
              {form.watch("description") ? (
                // Use a whitespace-preerving style to show line breaks
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {renderCommentText(form.watch("description") || "", banks)}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Click to add a description...
                </p>
              )}
            </div>
          )}
        </div>
        {/* --- COMMENTS SECTION --- */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-semibold text-sm sm:text-base flex items-center">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Comments (
            {fields.length})
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {fields.map((comment, index) =>
              editingCommentId === comment.id ? (
                <div
                  key={comment.id}
                  className="flex items-start gap-2 sm:gap-3"
                >
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    {/* <AvatarImage src={comment.avatar} /> */}
                    <AvatarFallback className="text-xs sm:text-sm">
                      {comment.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full">
                    <Form {...form}>
                      <form onSubmit={onCommentUpdate}>
                        <FormField
                          control={form.control}
                          name={`comments.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <BankTaggingTextarea
                                  {...field}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer h-9"
                            onClick={() => setEditingCommentId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSaving}
                            className="cursor-pointer h-9"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              ) : (
                <div
                  key={comment.id}
                  className="flex items-start gap-2 sm:gap-3"
                >
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    {/* <AvatarImage src={comment.avatar} /> */}
                    <AvatarFallback className="text-xs sm:text-sm">
                      {comment.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-xs sm:text-sm break-words">
                          {comment.author}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2 block sm:inline">
                          {format(
                            new Date(comment.createdAt),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setEditingCommentId(comment.id)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCommentDelete(index)}
                            className="text-red-500 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p
                      className="text-xs sm:text-sm mt-1 break-words"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {renderCommentText(comment.text, banks)}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
          {/* Add New Comment Form */}
          <div className="flex items-start gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
              <AvatarFallback className="text-xs sm:text-sm">
                {user?.displayName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="w-full">
              <Form {...newCommentForm}>
                <form onSubmit={newCommentForm.handleSubmit(onAddNewComment)}>
                  <FormField
                    control={newCommentForm.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <BankTaggingTextarea
                            {...field}
                            placeholder="Add a comment..."
                            className="w-full"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      className="cursor-pointer w-full sm:w-auto h-10 sm:h-9"
                      type="submit"
                      disabled={!newCommentForm.formState.isValid || isSaving}
                    >
                      Comment
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FundApplicationNotesV2;
