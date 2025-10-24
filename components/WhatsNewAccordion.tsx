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
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export function WhatsNewAccordion() {
  const { activeItems, isLoading } = useWhatsNewQueryActive();

  const hasActiveItems = (activeItems?.length ?? 0) > 0;

  // To avoid code duplication, we define the trigger's content once.
  const TriggerContent = (
    <>
      <div className="relative size-6">
        <Image src="/icons/bell.svg" alt="What's New" fill />

        {hasActiveItems && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </div>
      <p className="sidebar-label">{`What's New`}</p>
    </>
  );

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center space-x-2 p-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!hasActiveItems) {
    return null;
  }

  return (
    <div className="px-3 py-2">
      <Accordion type="single" collapsible={hasActiveItems} className="w-full">
        <AccordionItem value="whats-new" className="border-none">
          {hasActiveItems ? (
            <>
              <AccordionTrigger
                className="cursor-pointer w-full px-2 py-2 rounded-md text-left select-none
                           hover:no-underline data-[state=open]:bg-muted/30"
              >
                {TriggerContent}
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
            </>
          ) : (
            <div
              className="flex items-center w-full px-2 py-2 rounded-md text-left select-none 
                         opacity-70 cursor-default space-x-2"
            >
              {TriggerContent}
            </div>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
}
