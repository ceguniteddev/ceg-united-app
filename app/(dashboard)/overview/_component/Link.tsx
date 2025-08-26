import React, { useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

import { useCreateLinkToken } from "@/hooks/plaid";
import { Button } from "@/components/ui/button";
import IconMenu from "@/components/icon-menu";
import { Link2Icon } from "lucide-react";
import { exchangeAccessToken, recordAccessToken } from "@/service/plaid";
import { useAuth } from "@/provider/AuthContext";

const Link = () => {
  const { user } = useAuth();

  const { createLinkToken, canCreate } = useCreateLinkToken();

  const [linkToken, setLinkToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchLinkToken = async () => {
      const token = await createLinkToken();
      setLinkToken(token);
    };

    if (canCreate && user) fetchLinkToken();
  }, [createLinkToken, canCreate, user]);

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await exchangeAccessToken(public_token);
        await recordAccessToken(user?.uid ?? "", response.accessToken, response.itemId);
      };

      exchangePublicTokenForAccessToken();
    },
    [user?.uid]
  );

  const isOauth = false;
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  //   if (window.location.href.includes("?oauth_state_id=")) {
  //     // TODO: figure out how to delete this ts-ignore
  //     // @ts-ignore
  //     config.receivedRedirectUri = window.location.href;
  //     isOauth = true;
  //   }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  return (
    <Button
      variant={"outline"}
      type="button"
      onClick={() => open()}
      disabled={!ready}
      className="w-full justify-start flex rounded-md p-2 transition-all duration-75 hover:bg-neutral-100 cursor-pointer"
    >
      <IconMenu text="Link Account" icon={<Link2Icon className="h-4 w-4" />} />
    </Button>
  );
};

Link.displayName = "Link";

export default Link;
