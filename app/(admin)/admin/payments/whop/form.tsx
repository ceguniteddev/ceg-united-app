"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserCheck, X, Save } from "lucide-react";
import { useUsersQuery } from "@/hooks/user";
import { UserWithId } from "@/schema/registration";
import IconMenu from "@/components/icon-menu";
import { WhopPayment } from "@/schema/payments";
import { useMapWhopPayment } from "@/hooks/admin/payments/whop";
import { currency } from "@/lib/utils";

const DisplayField = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <div className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
      {value || "-"}
    </div>
  </div>
);

type Props = {
  payment: WhopPayment;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const MapWhopPaymentForm = ({ payment, setOpen }: Props) => {
  const { mapPayment, isMapping } = useMapWhopPayment();
  const { users, isLoading: isLoadingUsers } = useUsersQuery("Client");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);

  const filteredUsers = users?.filter((user: UserWithId) => {
    const search = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const handleSave = async () => {
    if (!selectedUser) return;
    await mapPayment({
      docId: payment.docId!,
      userId: selectedUser.id,
    });
    setOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-lg sm:rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Payment Details
          </h3>
          <DisplayField label="Customer Email" value={payment.user?.email} />
          <DisplayField label="Amount" value={`${currency(payment.total)}`} />
          <DisplayField label="Product" value={payment.product?.title} />
          {payment.userId && (
            <DisplayField label="Current User ID" value={payment.userId} />
          )}
        </div>

        <div className="rounded-lg sm:rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Map to Client
          </h3>
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Search Clients
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-9"
              />
            </div>
          </div>
          <div className="mb-3 sm:mb-4 max-h-48 sm:max-h-64 overflow-y-auto border rounded-md">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="divide-y">
                {filteredUsers.map((user: UserWithId) => (
                  <div
                    key={user.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 break-words">
                          {user.email}
                        </p>
                      </div>
                      {selectedUser?.id === user.id && (
                        <UserCheck className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 p-4">
                No users found
              </p>
            )}
          </div>
          {selectedUser && (
            <div className="mt-3 sm:mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                    Selected: {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 break-words">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isMapping}
          className="w-full sm:w-auto h-10 sm:h-9 cursor-pointer"
        >
          <IconMenu icon={<X className="h-4 w-4" />} text="Close" />
        </Button>
        <Button
          onClick={handleSave}
          disabled={!selectedUser || isMapping}
          className="w-full sm:w-auto h-10 sm:h-9 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
        >
          {isMapping ? (
            <IconMenu
              icon={<Loader2 className="h-4 w-4 animate-spin" />}
              text="Saving..."
            />
          ) : (
            <IconMenu icon={<Save className="h-4 w-4" />} text="Save Mapping" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MapWhopPaymentForm;
