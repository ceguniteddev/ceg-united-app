"use client";

import { useState } from "react";
import HeaderBox from "@/components/HeaderBox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import LetterList from "@/components/letter-stream/list";
import LetterForm from "@/components/letter-stream/form";
import { DisputeLetter } from "@/schema/dispute-letter";
import { ResponsiveDialog } from "@/components/responsive-dialog";

export default function LetterStreamPage() {
  const [open, setOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<DisputeLetter | null>(
    null
  );

  const handleCreateNew = () => {
    setSelectedLetter(null);
    setOpen(true);
  };

  const handleFormSuccess = () => {
    setOpen(false);
    setSelectedLetter(null);
  };

  const handleFormCancel = () => {
    setOpen(false);
    setSelectedLetter(null);
  };

  const handleViewLetter = (letter: DisputeLetter) => {
    setSelectedLetter(letter);
    // TODO: Implement letter detail view
  };

  return (
    <section className="home-content">
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title="Create New Dispute Letter"
        description=""
        className="w-4/6"
      >
        <LetterForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </ResponsiveDialog>

      <div className="home-header flex flex-row justify-between">
        <HeaderBox
          title="Letter Stream"
          subtext="Create and manage your credit dispute letters"
        />
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="bg-green-200 hover:bg-green-400 cursor-pointer"
          onClick={handleCreateNew}
        >
          <FileText className="h-4 w-4" />
          Create New Letter
        </Button>
      </div>

      <div className="space-y-6">
        <section className="flex w-full flex-col gap-6">
          <LetterList
            onViewLetter={handleViewLetter}
            onCreateNew={handleCreateNew}
          />
        </section>
      </div>
    </section>
  );
}
