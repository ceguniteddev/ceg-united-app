"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  UserRound,
  Mail,
  MessageCircle,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";

export function StickyHelpBar({ pb }: { pb: Playbook }) {
  const help = pb.section13_helpOptions;

  return (
    <div className="sticky bottom-0 z-30 print:hidden">
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 min-w-0 mr-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-gray-900 leading-tight truncate">
                Ready to apply for this product?
              </p>
              <p className="text-[11px] text-gray-500 leading-tight truncate">
                Have a CEG strategist check your fields first.
              </p>
            </div>
          </div>

          <a
            href={`tel:${help.cegSupportPhone}`}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl bg-blue-600 text-white text-[12.5px] font-semibold hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98]"
          >
            <PhoneCall className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Call {help.cegSupportPhone}</span>
          </a>
          <a
            href={help.scheduleConsultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-800 transition-colors shadow-sm active:scale-[0.98]"
          >
            <UserRound className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Book 1-on-1</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function ChatWidget({ pb }: { pb: Playbook }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-[74px] sm:bottom-[80px] z-40 print:hidden">
      {open && (
        <div className="mb-2.5 w-[300px] sm:w-[336px] rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden animate-scale-in origin-bottom-right">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-900 to-[#2a4f7c] text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[11px] font-bold">CEG</span>
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold leading-tight">
                CEG Assistant
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10.5px] text-white/70">Online</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-4 bg-gray-50 space-y-2.5 max-h-[220px] overflow-y-auto">
            <div className="bg-white rounded-2xl rounded-bl-md border border-gray-200 px-3.5 py-2.5 max-w-[88%]">
              <p className="text-[12.5px] text-gray-700 leading-relaxed">
                {pb.section13_helpOptions.aiClosingNote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-white">
            <input
              type="text"
              placeholder="Ask about your playbook…"
              className="flex-1 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[12.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
