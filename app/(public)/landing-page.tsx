"use client";

import React from "react";
import AuthHero from "@/components/AuthHero";
import AuthCard from "@/components/AuthCard";
import "@/styles/auth.css";

const Landing = () => {
  return (
    <main className="auth-shell">
      <div className="auth-grid">
        <AuthHero />
        <AuthCard />
      </div>
    </main>
  );
};

export default Landing;
