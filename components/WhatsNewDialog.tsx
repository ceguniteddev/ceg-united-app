"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = { heading: string; body: React.ReactNode };

export function WhatsNewDialog({
  title = "No more limits of active workflows.",
  date = "9 September, 2025",
  sections = [],
  trigger,
  className,
  content,
}: {
  title?: string;
  date?: string;
  sections?: Section[];
  trigger?: React.ReactNode; // your button/icon to open the modal
  className?: string;
  content: string;
}) {
  return (
    <Dialog modal>
      {/* Use your own trigger — e.g., a sidebar item */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        // remove default padding so we can have a custom header + scroll area
        className={cn(
          "sm:max-w-[880px] p-0 overflow-hidden",
          // card look similar to the screenshot (works in light/dark)
          "bg-card text-card-foreground border shadow-2xl",
          className
        )}
      >
        <DialogTitle>
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="relative mt-1">
                <Bell className="h-5 w-5" />
                {/* red dot */}
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-snug">{title}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{date}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogTitle>

        <div className="max-h-[70vh] overflow-y-auto pb-6 pl-6 pr-6">
          <RichHtml html={content} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RichHtml({ html }: { html: string }) {
  const clean = useMemo(() => DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel"] }), [html]);

  return (
    <div
      className="max-w-none text-[15px] leading-[1.6] [&>p]:my-4
             [&_a]:text-blue-600 [&_a]:underline
             [&_strong]:font-semibold"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
