"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, SettingsIcon, UserCircle2 } from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import Image from "next/image";
import { JSX } from "react";
import { useRouter } from "next/navigation";

export default function UserNav(): JSX.Element | null {
  const { user, logOut } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center transition-colors"
          aria-label="User menu"
        >
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
              priority
            />
          ) : (
            <UserCircle2 className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleProfile}>
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt="User avatar"
                width={40}
                height={40}
                className="rounded-full"
                priority
              />
            ) : (
              <UserCircle2 className="w-10 h-10 text-gray-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 truncate">{user.displayName}</p>
            </div>
          </div>
        </div>

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-sm text-gray-700 hover:bg-gray-100"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
