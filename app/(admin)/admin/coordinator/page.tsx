"use client";

import { useState } from "react";
import { ClientList } from "@/components/admin/income-funding/ClientList";
import { ClientDetail } from "@/components/admin/income-funding/ClientDetail";
import { mockAdminClients } from "@/lib/income-funding-mock";
import type { AdminClient, DealOffer } from "@/lib/income-funding-types";
import { withAdminGuard } from "@/components/wrapper";

function AdminCoordinator() {
  const [clients, setClients] = useState<AdminClient[]>(mockAdminClients);
  const [selectedId, setSelectedId] = useState<string>(mockAdminClients[0].uid);
  const [toast, setToast] = useState<string | null>(null);

  const selected = clients.find((c) => c.uid === selectedId) || clients[0];

  const updateClient = (uid: string, fn: (c: AdminClient) => AdminClient) => {
    setClients((cs) => cs.map((c) => (c.uid === uid ? fn(c) : c)));
  };

  const addOffer = (offer: DealOffer) => {
    updateClient(selectedId, (c) => ({ ...c, offers: [...c.offers, offer] }));
    showToast(`Offer from ${offer.lenderName} added`);
  };

  const deleteOffer = (id: string) => {
    updateClient(selectedId, (c) => ({
      ...c,
      offers: c.offers.filter((o) => o.id !== id),
    }));
  };

  const notify = () => {
    updateClient(selectedId, (c) => ({ ...c, status: "offers-ready" }));
    showToast(
      `${selected.firstName} notified — offers are now visible to the client.`,
    );
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Loan Coordinator
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5">
            Deal Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review submitted files, add offers, and notify clients.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold">
            {clients.length} active clients
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 font-semibold">
            {clients.filter((c) => c.status === "under-review").length} in
            underwriting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="lg:max-h-[calc(100vh-180px)] lg:sticky lg:top-6">
          <ClientList
            clients={clients}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <ClientDetail
          client={selected}
          onAddOffer={addOffer}
          onDeleteOffer={deleteOffer}
          onNotify={notify}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in-up max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

export default withAdminGuard(AdminCoordinator);
