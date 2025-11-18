"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserCheck } from "lucide-react";
import { useMapDenefitsContractToUser } from "@/hooks/denefits";
import { useUsersQuery } from "@/hooks/user";
import { UserWithId } from "@/schema/registration";
import { DenefitsPayment } from "./list";

const DisplayField = ({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <div className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
      {value || "-"}
    </div>
  </div>
);

type Props = {
  contract: DenefitsPayment;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const MapDenefitsContractForm = ({ contract, setOpen }: Props) => {
  const { mapContract, isMapping } = useMapDenefitsContractToUser();
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
    if (!selectedUser) {
      return;
    }

    await mapContract({
      contractId: contract.id,
      userId: selectedUser.id,
    });

    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Contract Details */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contract Details
          </h3>
          <DisplayField label="Contract Code" value={contract.contract_code} />
          <DisplayField label="Email" value={contract.customer_email} />
          <DisplayField
            label="First Name"
            value={contract.customer_first_name}
          />
          <DisplayField label="Last Name" value={contract.customer_last_name} />
          {contract.userId && (
            <DisplayField label="Current User ID" value={contract.userId} />
          )}
        </div>

        {/* Right Side: User Search and Mapping */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Map to Client
          </h3>

          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Clients
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div className="mb-4 max-h-64 overflow-y-auto border rounded-md">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
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

          {/* Selected User Display */}
          {selectedUser && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Selected: {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!selectedUser || isMapping}
          className="w-full md:w-auto"
        >
          {isMapping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isMapping ? "Saving..." : "Save Mapping"}
        </Button>
      </div>
    </div>
  );
};

export default MapDenefitsContractForm;
