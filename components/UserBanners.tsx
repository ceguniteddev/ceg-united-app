"use client";

import { Banner, BannerIcon, BannerTitle, BannerClose } from "@/components/ui/shadcn-io/banner";
import { CircleAlert } from "lucide-react";
import PlaidLink from "@/components/PlaidLink";
import { useGetNewAccountFlags, useUserFlags } from "@/hooks/plaid/item";

export default function UserBanners() {
  const { flags } = useUserFlags();
  const { flags: newAccountFlags } = useGetNewAccountFlags();

  // Merge both sets into one list with type annotation
  const allFlags = [
    ...flags.map((f) => ({ ...f, type: "disconnect" as const })),
    ...newAccountFlags.map((f) => ({ ...f, type: "new-account" as const })),
  ];
  if (allFlags.length === 0) return null;

  return (
    <>
      {allFlags.map((flag, idx) => (
        <Banner
          key={`${flag.type}-${flag.id}`}
          className={`fixed left-0 right-0 z-50 border-b text-sm ${
            flag.type === "disconnect"
              ? "bg-blue-100 border-blue-400 text-blue-800"
              : "bg-green-100 border-green-400 text-green-800"
          }`}
          style={{ top: `${idx * 55}px` }} // stack each banner
        >
          <BannerIcon
            icon={CircleAlert}
            className={flag.type === "disconnect" ? "text-blue-600" : "text-green-600"}
          />

          <BannerTitle>
            {flag.type === "disconnect" ? (
              <>
                Info: Please update your connection to{" "}
                <span className="font-semibold">{flag.institution_name ?? "your bank"}</span>
              </>
            ) : (
              <>
                🎉 New accounts available at{" "}
                <span className="font-semibold">{flag.institution_name ?? "your bank"}</span>
              </>
            )}
          </BannerTitle>

          {flag.type === "disconnect" ? (
            <PlaidLink itemId={flag.item_id} />
          ) : (
            <PlaidLink itemId={flag.item_id} isNewAccount />
          )}

          <BannerClose
            className={
              flag.type === "disconnect"
                ? "text-blue-700 hover:text-blue-900"
                : "text-green-700 hover:text-green-900"
            }
          />
        </Banner>
      ))}
    </>
  );
}
