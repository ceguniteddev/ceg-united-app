"use client";
import React, { useEffect } from "react";
import { Footer } from "react-day-picker";
import Landing from "./landing-page";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import { usePathname, useRouter } from "next/navigation";
const Home = () => {
  const { user, loading, role } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || !role) return;

    const dest = role === "Client" ? "/overview" : "/admin";
    if (pathname !== dest) {
      router.replace(dest);
    }
  }, [loading, user, role, router, pathname]);

  if (loading) return <Spinner displayText="" />;

  if (user && role) return <Spinner displayText="" />;

  return (
    <div className="nondashboard-layout">
      <main className="nondashboard-layout__main">
        <Landing />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
