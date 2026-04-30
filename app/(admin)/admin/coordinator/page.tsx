"use client";

import { useState, useEffect } from "react";
import { ClientList } from "@/components/admin/income-funding/ClientList";
import { ClientDetail } from "@/components/admin/income-funding/ClientDetail";
import type { AdminClient, DealOffer } from "@/lib/income-funding-types";
import { withAdminGuard } from "@/components/wrapper";
import { useAdminIncomeFunding } from "@/hooks/admin/income-funding";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

function AdminCoordinator() {
  const { clients: apiClients, isLoading, refetch } = useAdminIncomeFunding();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (apiClients && apiClients.length > 0) {
      setClients(apiClients);
      if (!selectedId) {
        setSelectedId(apiClients[0].uid);
      }
    }
  }, [apiClients, selectedId]);

  const selected = clients.find((c) => c.uid === selectedId) || clients[0];

  const updateClient = (uid: string, fn: (c: AdminClient) => AdminClient) => {
    setClients((cs) => cs.map((c) => (c.uid === uid ? fn(c) : c)));
  };

  const addOffer = async (offer: DealOffer) => {
    if (!selected) return;

    try {
      // Create new offer array. If updating, replace existing offer
      const offerExists = selected.offers.some((o) => o.id === offer.id);
      const newOffers = offerExists
        ? selected.offers.map((o) => (o.id === offer.id ? offer : o))
        : [...selected.offers, offer];

      // Update in backend
      const res = await fetch(
        `/api/user/${selected.uid}/funding-application/${selected.referenceNumber}/offers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offers: newOffers }),
        },
      );

      if (!res.ok) throw new Error("Failed to save offer");

      let updatedStatus = selected.status;
      // Auto-update status to Pre-Approved if there is at least 1 offer
      if (newOffers.length > 0 && selected.status !== "offers-ready") {
        const statusRes = await fetch(
          `/api/user/${selected.uid}/funding-application/${selected.referenceNumber}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Pre-Approved" }),
          },
        );
        if (statusRes.ok) {
          updatedStatus = "offers-ready";
        }
      }

      updateClient(selectedId, (c) => ({
        ...c,
        offers: newOffers,
        status: updatedStatus,
      }));
      toast.success(`Offer from ${offer.lenderName} added`);
    } catch (error) {
      toast.error("Error saving offer");
    }
  };

  const deleteOffer = async (id: string) => {
    if (!selected) return;

    try {
      const newOffers = selected.offers.filter((o) => o.id !== id);

      const res = await fetch(
        `/api/user/${selected.uid}/funding-application/${selected.referenceNumber}/offers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offers: newOffers }),
        },
      );

      if (!res.ok) throw new Error("Failed to delete offer");

      let updatedStatus = selected.status;
      // Revert status to Sent to Brokerage if all offers are removed
      if (newOffers.length === 0 && selected.status !== "under-review") {
        const statusRes = await fetch(
          `/api/user/${selected.uid}/funding-application/${selected.referenceNumber}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Sent to Brokerage" }),
          },
        );
        if (statusRes.ok) {
          updatedStatus = "under-review";
        }
      }

      updateClient(selectedId, (c) => ({
        ...c,
        offers: newOffers,
        status: updatedStatus,
      }));
      toast.success("Offer deleted");
    } catch (error) {
      toast.error("Error deleting offer");
    }
  };

  const notify = async () => {
    if (!selected) return;

    try {
      const res = await fetch(
        `/api/user/${selected.uid}/funding-application/${selected.referenceNumber}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Pre-Approved" }), // "Pre-Approved" maps to "offers-ready" in client view
        },
      );

      if (!res.ok) throw new Error("Failed to update status");

      updateClient(selectedId, (c) => ({ ...c, status: "offers-ready" }));
      toast.success(
        `${selected.firstName} notified — offers are now visible to the client.`,
      );
    } catch (error) {
      toast.error("Error notifying client");
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mt-8">
            Loan Coordinator
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5">
            Deal Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review submitted files, add offers, and notify clients.
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-xl border border-gray-100">
          No income-based funding applications found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          <div className="lg:max-h-[calc(100vh-180px)] lg:sticky lg:top-6">
            <ClientList
              clients={clients}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {selected && (
            <ClientDetail
              client={selected}
              onAddOffer={addOffer}
              onDeleteOffer={deleteOffer}
              onNotify={notify}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default withAdminGuard(AdminCoordinator);
