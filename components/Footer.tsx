"use client";
import { useAuth } from "@/provider/AuthContext";
import { useRouter } from "next/navigation";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator, // Optional: for visual separation
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { CogIcon, LogOutIcon } from "lucide-react";
import IconMenu from "./icon-menu";
import { Avatar, AvatarFallback } from "./ui/avatar"; // Assuming you use shadcn Avatar

// Define props for clarity
interface FooterProps {
  type?: "desktop" | "mobile";
}

const Footer = ({ type = "desktop" }: FooterProps) => {
  const { user, logOut } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogOut = async () => {
    await logOut();
    router.push("/");
  };

  const handleSettings = () => {
    router.push("/settings/personal"); // Navigate to the settings page
  };

  // Use a single initial for mobile view, otherwise use first two letters or 'U'
  const fallbackInitial = user?.displayName
    ? user.displayName.substring(0, 2).toUpperCase()
    : "U";

  return (
    // Use flexbox for robust layout. Add padding and a border for better UI definition.
    <footer className="flex w-full items-center gap-2 border-t border-gray-200 p-2">
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 w-full justify-start hover:bg-gray-100 cursor-pointer p-2 h-auto"
          >
            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-500 text-white">
                {/* For mobile, show only one initial */}
                {type === "mobile"
                  ? fallbackInitial.charAt(0)
                  : fallbackInitial}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 truncate text-left">
              <h1 className="truncate text-sm font-semibold text-gray-900">
                {user?.displayName}
              </h1>
              {type === "desktop" && (
                <p className="truncate text-sm font-normal text-gray-600">
                  {user?.email}
                </p>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {/* IMPROVEMENT: Use onSelect for actions, no nested button needed */}
          <DropdownMenuItem
            onSelect={handleSettings}
            className="cursor-pointer"
          >
            <IconMenu text="Settings" icon={<CogIcon className="h-4 w-4" />} />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogOut}
            className="cursor-pointer text-red-500 focus:text-red-500"
          >
            <IconMenu text="Logout" icon={<LogOutIcon className="h-4 w-4" />} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </footer>
  );
};

export default Footer;
