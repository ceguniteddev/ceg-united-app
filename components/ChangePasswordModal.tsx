"use-client";

import React, { useState } from "react";
import {
  useForm,
  useWatch,
  useFormContext,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react"; // Import a loader icon
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

import { PasswordStrength } from "./PasswordStrength";
import { CustomFormField } from "./CustomFormField";
import { Form } from "./ui/form";
import { Button } from "./ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePassword, changePasswordSchema } from "@/schema";
import { changePassword } from "@/service/user";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";

// PasswordInput component remains the same...
const PasswordInput = ({
  label = "Password",
  name,
  valueToMatch,
}: {
  label?: string;
  name: string;
  valueToMatch?: string;
}) => {
  const { control } = useFormContext();
  const currentValue = useWatch({ control, name });
  const passwordsMatch =
    valueToMatch && currentValue && valueToMatch === currentValue;

  return (
    <div className="relative">
      <CustomFormField
        name={name}
        type={"password"}
        label={label}
        placeholder={label}
        className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500"
      />
      {passwordsMatch && (
        <CheckCircle2 className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-green-500" />
      )}
    </div>
  );
};

type Props = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChangePasswordModal = ({ setOpen }: Props) => {
  const { user, logOut } = useAuth();

  // State for the confirmation dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // State for the actual async operation loading status
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  // State to hold the form data between validation and confirmation
  const [formData, setFormData] = useState<ChangePassword | null>(null);

  const form = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const newPasswordValue = useWatch({
    control: form.control,
    name: "newPassword",
    defaultValue: "",
  });

  // Stage 1: Validate the form and open the confirmation dialog
  const onFormSubmit: SubmitHandler<ChangePassword> = (values) => {
    setFormData(values); // Store the valid form data
    setIsConfirmOpen(true); // Open the confirmation dialog
  };

  // Stage 2: Handle the final password change after confirmation
  const handleConfirmPasswordChange = async () => {
    if (!formData || !user || !user.email) {
      toast.error("An unexpected error occurred. Please try again.");
      return;
    }

    setIsChangingPassword(true); // Start loading state

    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Call the service to change the password
      await changePassword(formData);

      toast.success(
        "Password updated successfully! You will now be logged out.",
      );

      // Log out the user for security
      await logOut();

      // Close both modals
      setIsConfirmOpen(false);
      setOpen(false);
    } catch (error: any) {
      console.error("Password change error:", error);
      if (error.code === "auth/wrong-password") {
        toast.error("The current password you entered is incorrect.");
        form.setError("currentPassword", {
          type: "manual",
          message: "Incorrect password",
        });
      } else {
        toast.error("Failed to change password. Please try again.");
      }
      // Close only the confirmation dialog on failure, allowing the user to try again
      setIsConfirmOpen(false);
    } finally {
      setIsChangingPassword(false); // End loading state regardless of outcome
    }
  };

  return (
    <>
      <Card className="py-2 border-none shadow-none">
        <CardContent className="p-0">
          <Form {...form}>
            {/* The form now triggers the first stage of submission */}
            <form onSubmit={form.handleSubmit(onFormSubmit)} method="post">
              <fieldset
                disabled={form.formState.isSubmitting}
                className="space-y-6"
              >
                <PasswordInput
                  name="currentPassword"
                  label="Current password"
                />

                <div className="space-y-2">
                  <PasswordInput name="newPassword" label="New password" />
                  <PasswordStrength password={newPasswordValue} />
                </div>

                <PasswordInput
                  name="confirmPassword"
                  label="Re-enter new password"
                  valueToMatch={newPasswordValue}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Change password
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing your password will log you out from all of your devices,
              including this one. You will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingPassword}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPasswordChange}
              disabled={isChangingPassword}
              className="bg-red-600 hover:bg-red-700"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm & Log Out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChangePasswordModal;
