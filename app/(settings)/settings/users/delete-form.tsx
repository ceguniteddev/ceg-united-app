// "use client";

// import React, { Dispatch, SetStateAction } from "react";

// import { Button } from "@/components/ui/button";
// import { Form } from "@/components/ui/form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Loader2 } from "lucide-react";
// import { useForm } from "react-hook-form";
// import * as z from "zod";
// import { toast } from "sonner";
// import { useDeleteUserMutation } from "@/hooks/settings/user";
// import { useAuth } from "@/provider/AuthContext";
// const formSchema = z.object({
//   docId: z.string(),
// });

// export default function DeleteForm({
//   docId,
//   setIsOpen,
//   refetch,
// }: {
//   readonly docId: string;
//   readonly setIsOpen: Dispatch<SetStateAction<boolean>>;
//   readonly refetch: () => void;
// }) {
//   const { isAdmin } = useAuth();

//   const { mutateAsync: deleteUserMutateAsync, isPending: deleteUserIsPending } =
//     useDeleteUserMutation();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       docId: docId,
//     },
//   });

//   const isLoading = form.formState.isSubmitting;

//   const onSubmit = async () => {
//     try {
//       const response = await deleteUserMutateAsync({ id: docId });
//       if (!response.ok) {
//         const data = await response.json();
//         if (Array.isArray(data.errors)) {
//           data.errors.forEach((err: string) => {
//             toast.error(err);
//           });
//         } else {
//           toast.error(data.message || "Error deleting user");
//         }
//         return;
//       }
//       toast.success("User deleted successfully");
//       setIsOpen(false);
//       refetch();
//     } catch (error) {
//       toast.error("Failed to delete User!");
//       console.log(error);
//     }
//   };

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="space-y-6  sm:px-0 px-4"
//       >
//         <div className="w-full flex justify-center sm:space-x-6">
//           <Button
//             size="lg"
//             variant="outline"
//             disabled={isLoading}
//             className="w-full hidden sm:block"
//             type="button"
//             onClick={() => setIsOpen(false)}
//           >
//             Cancel
//           </Button>
//           {isAdmin && (
//             <Button
//               size="lg"
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-red-500 hover:bg-red-400"
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Deleting
//                 </>
//               ) : (
//                 <span>Delete</span>
//               )}
//             </Button>
//           )}
//         </div>
//       </form>
//     </Form>
//   );
// }
