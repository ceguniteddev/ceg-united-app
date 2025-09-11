"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWhatsNewQueryActive } from "@/hooks/whats-new";
import Image from "next/image";
import { WhatsNewDialog } from "./WhatsNewDialog";
import { formatDate } from "date-fns";

export function WhatsNewAccordion() {
  const { activeItems, isLoading } = useWhatsNewQueryActive();

  return (
    <div className="px-3 py-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="whats-new" className="border-none">
          <AccordionTrigger
            className="cursor-pointer w-full px-2 py-2 rounded-md text-left select-none
                     hover:no-underline data-[state=open]:bg-muted/30"
          >
            <div className="relative size-6">
              <Image src="/icons/bell.svg" alt="What's New" fill />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
            </div>
            <p className="sidebar-label">What’s New</p>
          </AccordionTrigger>

          <AccordionContent className="pl-9 pr-2 pb-2">
            <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
              {activeItems?.map((it) => (
                <li key={it.id} className="truncate">
                  <WhatsNewDialog
                    content={it.content}
                    title={it.title}
                    date={formatDate(it.createdAt, "PPP")}
                    trigger={
                      <span className="inline-flex w-full truncate hover:underline cursor-pointer">
                        {it.title}
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
