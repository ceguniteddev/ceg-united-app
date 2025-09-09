import React, { useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

import { useGetLinkToken, useHasAccessToken } from "@/hooks/plaid";
import { Button } from "@/components/ui/button";
import { exchangeAccessToken } from "@/service/plaid";
import { useAuth } from "@/provider/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { IncomeVerificationSourceType } from "plaid";

const PlaidIncomeLinkBank = () => {
  const { user } = useAuth();

  const { hasToken, isLoading } = useHasAccessToken("INCOME_VERIFICATION_BANK");

  const { linkToken, isLoading: isLoadingLinkToken } = useGetLinkToken({
    incomeSourceType: IncomeVerificationSourceType.Bank,
    hasToken,
  });

  const queryClient = useQueryClient();

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        await exchangeAccessToken(public_token, user?.uid ?? "", "INCOME_VERIFICATION_BANK");

        queryClient.invalidateQueries({
          queryKey: ["GET_PLAID_INCOME_LINK", user?.uid],
        });
        queryClient.invalidateQueries({
          queryKey: ["GET_HAS_ACCESS_TOKEN", user?.uid, "INCOME_VERIFICATION_BANK"],
        });
        toast.success("Income Verification is complete.");
      };

      exchangePublicTokenForAccessToken();
    },
    [user?.uid, queryClient]
  );

  const isOauth = false;
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  return (
    <Button
      id="plaid-link-income-bank-button"
      className="plaidlink-default shadow-none px-3  bg-green-100 hover:bg-green-200"
      aria-busy={!ready}
      disabled={!ready || hasToken}
      onClick={() => open()}
    >
      {/* <BadgeDollarSignIcon className="mr-2 h-4 w-4" /> */}
      <Image src="/icons/connect-bank.svg" alt="income verification" width={24} height={24} />

      <p className="text-[16px] font-semibold text-black-2">Bank Verification</p>
      {/* {!ready && !hasToken && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />} */}
      {hasToken && <CheckIcon className="ml-2 h-4 w-4 text-green-600" />}
    </Button>
  );
};

// PlaidIncomeLink.displayName = "PlaidIncomeLink";

export default PlaidIncomeLinkBank;
