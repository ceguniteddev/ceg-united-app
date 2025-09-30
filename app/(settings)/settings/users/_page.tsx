// "use client";

// import React, { useCallback, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { CircleUserIcon, Trash2Icon } from "lucide-react";
// import { toast } from "sonner";
// import {
//   useInviteUserMutation,
//   useUpdateUserRoleMutation,
//   useUsersQuery,
// } from "@/hooks/settings/user";
// import { withAdminGuard } from "@/components/wrapper";
// import { ResponsiveDialog } from "@/components/responsive-dialog";
// import DeleteForm from "./delete-form";
// import Spinner from "@/components/Spinner";
// import { AppRole, Role, ROLES } from "@/schema";

// const UsersPage = () => {
//   const [inviteEmail, setInviteEmail] = useState("");
//   const [inviteRole, setInviteRole] = useState<AppRole>("Admin");
//   const [open, setOpen] = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [userToDelete, setUserToDelete] = useState<User | null>(null);

//   const { mutateAsync: inviteUserMutateAsync, isPending: inviteUserIsPending } =
//     useInviteUserMutation();

//   const { mutateAsync: updateRoleMutateAsync, isPending: updateRoleIsPending } =
//     useUpdateUserRoleMutation();

//   const { data, isFetching, refetch } = useUsersQuery({
//     enabled: true,
//   });

//   const handleDeleteClick = useCallback(async (user: User) => {
//     setUserToDelete(user);
//     setDeleteOpen(true);
//   }, []);

//   const handleRoleChange = useCallback(
//     async (role: Role, user: User) => {
//       const requestBody = { email: user.email, role: role };
//       const response = await updateRoleMutateAsync(requestBody);
//       if (!response.ok) {
//         const data = await response.json();

//         if (Array.isArray(data.errors)) {
//           data.errors.forEach((err: string) => {
//             toast.error(err);
//           });
//         } else {
//           toast.error(data.message || "Error inviting user");
//         }

//         return;
//       }
//       toast.success("User role updated successfully");
//       await refetch();
//     },
//     [refetch, updateRoleMutateAsync]
//   );

//   const handleInvite = useCallback(async () => {
//     const requestBody = { email: inviteEmail, role: inviteRole };

//     try {
//       const response = await inviteUserMutateAsync(requestBody);

//       if (!response.ok) {
//         const data = await response.json();

//         if (Array.isArray(data.errors)) {
//           data.errors.forEach((err: string) => {
//             toast.error(err);
//           });
//         } else {
//           toast.error(data.message || "Error inviting user");
//         }

//         return;
//       }

//       toast.success("User invited successfully");
//       setInviteEmail("");
//       setInviteRole("Admin");
//       setOpen(false);
//       await refetch();
//     } catch (err: any) {
//       console.log("Generation failed", err);
//       toast.error(err);
//     }
//   }, [inviteEmail, inviteRole, refetch, inviteUserMutateAsync]);

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-4">
//       <div className="flex justify-between items-center">
//         <Label className="text-2xl font-semibold">Users</Label>

//         <Dialog open={open} onOpenChange={setOpen}>
//           <DialogTrigger asChild>
//             <Button variant="outline" className="bg-purple-200 hover:bg-purple-300">
//               <CircleUserIcon className="mr-2 h-4 w-4" />
//               Invite
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-md">
//             <DialogDescription></DialogDescription>
//             <DialogHeader>
//               <DialogTitle>Invite User</DialogTitle>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   placeholder="user@example.com"
//                   value={inviteEmail}
//                   onChange={(e) => setInviteEmail(e.target.value)}
//                   type="email"
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="role">Role</Label>
//                 <Select
//                   value={inviteRole}
//                   onValueChange={(value: AppRole) => {
//                     if (ROLES.includes(value)) {
//                       setInviteRole(value);
//                     } else {
//                       console.error(`Invalid role value: ${value}`);
//                     }
//                   }}
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select role" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {ROLES.map((role: string) => (
//                       <SelectItem key={role} value={role}>
//                         {role}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <Button onClick={handleInvite} disabled={inviteUserIsPending}>
//                 Send Invite
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {userToDelete?.uid && (
//         <ResponsiveDialog
//           isOpen={deleteOpen}
//           setIsOpen={setDeleteOpen}
//           title="Delete User"
//           description={`Are you sure you want to delete this user : ${userToDelete.email}?`}
//           className="w-1/4"
//         >
//           <DeleteForm docId={userToDelete?.uid} setIsOpen={setDeleteOpen} refetch={refetch} />
//         </ResponsiveDialog>
//       )}

//       {isFetching && <Spinner />}

//       {data && !isFetching && (
//         <div className="space-y-4">
//           {data?.map((user, index) => (
//             <div
//               key={`${user.email}-${index}`}
//               className="flex justify-between items-center border-b pb-3"
//             >
//               <div className="flex items-center space-x-4">
//                 <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 text-white flex items-center justify-center font-semibold">
//                   {user.email?.charAt(0).toUpperCase()}
//                 </div>
//                 <div>{user.email && <p className="text-sm text-gray-500">{user.email}</p>}</div>
//               </div>

//               <div className="flex items-center space-x-4">
//                 <Select
//                   defaultValue={user.role}
//                   onValueChange={(value) => {
//                     handleRoleChange(value as Role, user);
//                   }}
//                   disabled={updateRoleIsPending}
//                 >
//                   <SelectTrigger className="w-[120px] h-9">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {ROLES.map((role: string) => (
//                       <SelectItem key={role} value={role}>
//                         {role}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(user)}>
//                   <Trash2Icon />
//                 </Button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default withAdminGuard(UsersPage);
