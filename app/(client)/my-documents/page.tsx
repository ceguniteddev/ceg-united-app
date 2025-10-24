"use client";

import HeaderBox from "@/components/HeaderBox";
import { useAuth } from "@/provider/AuthContext";
import ClientDocuments from "@/components/ClientDocuments";

export default function DocumentsPage() {
  const { user } = useAuth();

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox title="My Documents" subtext="Manage your personal or business documents" />
        </header>

        <ClientDocuments userId={user?.uid ?? ""} />
      </div>
    </section>
  );
}
