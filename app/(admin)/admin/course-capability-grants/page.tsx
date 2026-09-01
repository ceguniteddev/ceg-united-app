"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CourseCapabilityGrantsPage() {
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (active: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/course-capability-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId, reason, active }),
      });
      if (!response.ok) throw new Error("Capability update failed.");
      toast.success(active ? "Capability granted." : "Capability revoked.");
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl space-y-6 bg-white p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Course Capability Grants
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This audited action is separate from course enrollment. Use it only
          for approved access exceptions.
        </p>
      </div>
      <section className="space-y-5 rounded-xl border border-blue-200 bg-blue-50/40 p-6">
        <div className="space-y-2">
          <Label htmlFor="userId">Client user ID</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseId">Configured course ID</Label>
          <Input
            id="courseId"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Required audit reason</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={
              isSubmitting || !userId || !courseId || reason.trim().length < 3
            }
            onClick={() => submit(true)}
          >
            Grant capability
          </Button>
          <Button
            variant="outline"
            className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-900"
            disabled={
              isSubmitting || !userId || !courseId || reason.trim().length < 3
            }
            onClick={() => submit(false)}
          >
            Revoke capability
          </Button>
        </div>
      </section>
    </main>
  );
}
