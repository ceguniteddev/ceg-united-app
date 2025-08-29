import React, { useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

import { useCreateLinkToken } from "@/hooks/plaid";
import { Button } from "@/components/ui/button";
import { exchangeAccessToken, getAccessToken, recordAccessToken } from "@/service/plaid";
import { useAuth } from "@/provider/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

import { BanknoteIcon, Loader2Icon, CheckIcon } from "lucide-react";

const ItemLink = () => {
  const { user } = useAuth();

  const { createLinkToken, canCreate } = useCreateLinkToken();
  const [hasToken, setHasToken] = React.useState(false);
  const queryClient = useQueryClient();
  const [linkToken, setLinkToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchLinkToken = async () => {
      const token = await createLinkToken("");
      setLinkToken(token);
    };

    if (canCreate && user) fetchLinkToken();
  }, [createLinkToken, canCreate, user, hasToken]);

  React.useEffect(() => {
    const getToken = async () => {
      if (!user) return;
      const userToken = await getAccessToken(user?.uid, "ITEM");
      if (userToken) {
        setHasToken(true);
      }
    };

    if (user) getToken();
  }, [user, setHasToken]);

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await exchangeAccessToken(public_token);
        await recordAccessToken(user?.uid ?? "", response.accessToken, response.itemId, "ITEM");
        queryClient.invalidateQueries({
          queryKey: ["GET_PLAID_ITEM_LINK", user?.uid],
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
      variant="ghost"
      className="justify-start"
      aria-busy={!ready}
      disabled={!ready}
      onClick={() => open()}
    >
      <BanknoteIcon className="mr-2 h-4 w-4" />
      <span>Bank Account</span>
      {!ready && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
      {hasToken && <CheckIcon className="ml-2 h-4 w-4 text-green-600" />}
    </Button>
  );
};

ItemLink.displayName = "ItemLink";

export default ItemLink;
