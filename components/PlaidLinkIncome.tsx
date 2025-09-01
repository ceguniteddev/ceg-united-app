import React, { useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

import { useCreateLinkToken, useHasAccessToken } from "@/hooks/plaid";
import { Button } from "@/components/ui/button";
import { exchangeAccessToken, recordAccessToken } from "@/service/plaid";
import { useAuth } from "@/provider/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { getPlaidUserToken, recordPlaidUserToken } from "@/service/plaid/data";
import { BadgeDollarSignIcon, CheckIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";

const PlaidIncomeLink = () => {
  const { user } = useAuth();

  const { createLinkToken, canCreate } = useCreateLinkToken();
  const { hasToken, isLoading } = useHasAccessToken("INCOME_VERIFICATION");
  const queryClient = useQueryClient();
  const [linkToken, setLinkToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchLinkToken = async () => {
      const userToken = await recordPlaidUserToken(user?.uid ?? "");

      const token = await createLinkToken(userToken?.user_token);
      setLinkToken(token!);
    };

    if (canCreate && user && !hasToken) fetchLinkToken();
  }, [createLinkToken, canCreate, user, hasToken]);

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await exchangeAccessToken(public_token);
        await recordAccessToken(
          user?.uid ?? "",
          response.accessToken,
          response.itemId,
          "INCOME_VERIFICATION"
        );
        queryClient.invalidateQueries({
          queryKey: ["GET_PLAID_INCOME_LINK", user?.uid],
        });
        queryClient.invalidateQueries({
          queryKey: ["GET_HAS_ACCESS_TOKEN", user?.uid, "INCOME_VERIFICATION"],
          exact: false,
        });
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
      className="plaidlink-default"
      aria-busy={!ready}
      disabled={!ready || hasToken}
      onClick={() => open()}
    >
      {/* <BadgeDollarSignIcon className="mr-2 h-4 w-4" /> */}
      <Image src="/icons/connect-bank.svg" alt="income verification" width={24} height={24} />

      <p className="text-[16px] font-semibold text-black-2">Income Verification</p>
      {/* {!ready && !hasToken && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />} */}
      {hasToken && <CheckIcon className="ml-2 h-4 w-4 text-green-600" />}
    </Button>
  );
};

// PlaidIncomeLink.displayName = "PlaidIncomeLink";

export default PlaidIncomeLink;
