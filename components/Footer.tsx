"use client";
import { useAuth } from "@/provider/AuthContext";
import Image from "next/image";
import React from "react";

const Footer = ({ type = "desktop" }: FooterProps) => {
  const { user, logOut } = useAuth();

  if (!user) return null;

  const handleLogOut = async () => {
    await logOut();
  };

  return (
    <footer className="footer">
      <div className={type === "mobile" ? "footer_name-mobile" : "footer_name"}>
        <p className="text-xl font-bold text-gray-700">
          {user?.displayName ? user?.displayName[0] : ""}
        </p>
      </div>

      <div className={type === "mobile" ? "footer_email-mobile" : "footer_email"}>
        <h1 className="text-14 truncate text-gray-700 font-semibold">{user?.displayName}</h1>
        <p className="text-14 truncate font-normal text-gray-600">{user?.email}</p>
      </div>

      <div className="footer_image" onClick={handleLogOut}>
        <Image src="/icons/logout.svg" fill alt="ceg" />
      </div>
    </footer>
  );
};

export default Footer;
