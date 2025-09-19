"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { useAuth } from "@/provider/AuthContext";

// Helper component for required labels
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="flex items-center font-medium text-gray-700">
    {children}
    <span className="ml-1 text-red-500">*</span>
  </Label>
);

export default function PersonalSettingsPage() {
  const { user } = useAuth();
  // const [firstName, setFirstName] = useState("CEG");
  // const [lastName, setLastName] = useState("United");
  // const [email, setEmail] = useState("ceguniteddev@gmail.com");
  const [openChangePassword, setOpenChangePassword] = useState(false);

  if (!user) {
    return null;
  }

  console.log("user", user);
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 lg:p-8">
      <ResponsiveDialog
        isOpen={openChangePassword}
        setIsOpen={setOpenChangePassword}
        title={`Change password`}
        description=""
        className="w-3/12 flex flex-col  "
      >
        <ChangePasswordModal setOpen={setOpenChangePassword} />
      </ResponsiveDialog>
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Personal Settings</h1>
        </header>

        <main className="space-y-10">
          {/* <section>
            <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>

            <Separator className="my-4 bg-gray-200" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <RequiredLabel>First Name</RequiredLabel>

                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel>Last Name</RequiredLabel>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <RequiredLabel>Email</RequiredLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
          </section> */}

          {/* Security Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800">Security</h2>
            <Separator className="my-4 bg-gray-200" />
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-medium">Password</Label>

                <Button
                  variant="link"
                  className="px-0 text-red-500 hover:text-red-400"
                  onClick={() => setOpenChangePassword(true)}
                >
                  Change password
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* <footer className="mt-12 flex justify-end">
          <Button className="bg-red-600 hover:bg-red-700 text-white">Save</Button>
        </footer> */}
      </div>
    </div>
  );
}
