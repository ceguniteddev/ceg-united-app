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
import { Textarea } from "@/components/ui/textarea";
import { useGetUserNoteQuery, useUpdateUserNoteMutation } from "@/hooks/user";
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
  userId: string;
};

const ClientNotes = ({ userId }: Props) => {
  const { user } = useAuth();
  // --- STATE MANAGEMENT ---
  const { data: noteData, isLoading, isError } = useGetUserNoteQuery(userId);

  const { mutate: saveNote, isPending: isSaving } =
    useUpdateUserNoteMutation(userId);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // --- FORM HOOKS ---
  const form = useForm<NoteSchema>({
    resolver: zodResolver(noteSchema),
    // Initialize with values from the query or a default empty state
    values: noteData || { description: "", comments: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "comments",
  });

  const newCommentForm = useForm<{ text: string }>({
    resolver: zodResolver(z.object({ text: z.string().min(1) })),
    defaultValues: { text: "" },
  });

  // --- HANDLER FUNCTIONS ---
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
    append({
      id: `comment-${Date.now()}`,
      text: data.text,
      author: user?.displayName ?? "Anonymous",
      authorEmail: user?.email ?? "",
      // avatar: "https://github.com/shadcn.png",
      createdAt: new Date(),
    });
    form.handleSubmit(handleSaveNote)();
    newCommentForm.reset();
  };

  if (isLoading) return <Spinner displayText="Loading notes..." />;
  if (isError) return <div>Error loading notes.</div>;

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 pt-6">
        {/* --- DESCRIPTION SECTION --- */}
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
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
                        <Textarea
                          placeholder="Add a detailed description..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => {
                      form.reset(noteData); // Revert changes to server state
                      setIsEditingDescription(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="cursor-pointer"
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
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {form.watch("description")}
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
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" /> Comments ({fields.length}
            )
          </h3>
          <div className="space-y-4">
            {fields.map((comment, index) =>
              editingCommentId === comment.id ? (
                // EDITING VIEW
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar>
                    {/* <AvatarImage src={comment.avatar} /> */}
                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
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
                                <Textarea {...field} className="w-full" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center justify-end space-x-2 mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => setEditingCommentId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button type="submit" size="sm" disabled={isSaving}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              ) : (
                // DISPLAY VIEW
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar>
                    {/* <AvatarImage src={comment.avatar} /> */}
                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{comment.author}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(
                            new Date(comment.createdAt),
                            "MMM d, yyyy 'at' h:mm a"
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
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCommentDelete(index)}
                            className="text-red-500 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p
                      className="text-sm mt-1"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {comment.text}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Add New Comment */}
          <div className="flex items-start space-x-3 pt-4 border-t">
            <Avatar>
              {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
              <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
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
                          <Textarea
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
                      type="submit"
                      className="cursor-pointer"
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

export default ClientNotes;
