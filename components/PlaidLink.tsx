import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlaidLinkOptions, usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCreateLinkToken } from "@/hooks/plaid";
import { exchangeAccessToken, recordAccessToken } from "@/service/plaid";
import { useAuth } from "@/provider/AuthContext";
import { useCreateAssetReport } from "@/hooks/plaid/asset";
import { useQueryClient } from "@tanstack/react-query";

const PlaidLink = ({ variant }: { variant?: "primary" | "ghost" }) => {
  const router = useRouter();
  const { createLinkToken, canCreate } = useCreateLinkToken();
  const { createAssetReport, isCreating } = useCreateAssetReport();
  const [token, setToken] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getLinkToken = async () => {
      const linkToken = await createLinkToken("");

      setToken(linkToken!);
    };

    getLinkToken();
  }, [createLinkToken]);

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await exchangeAccessToken(public_token);
        await recordAccessToken(user?.uid ?? "", response.accessToken, response.itemId, "ITEM");

        await createAssetReport(response.itemId);

        await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEM_LINK", user?.uid] });
        await queryClient.invalidateQueries({
          queryKey: ["GET_HAS_ACCESS_TOKEN", user?.uid, "INCOME_VERIFICATION"],
          exact: false,
        });
        await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEMS", user?.uid] });
        await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid] });

        router.refresh();
        router.push("/overview");
      };

      exchangePublicTokenForAccessToken();
    },
    [user?.uid, queryClient, createAssetReport, router]
  );

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <>
      {variant === "primary" ? (
        <Button onClick={() => open()} disabled={!ready} className="plaidlink-primary">
          Connect bank
        </Button>
      ) : variant === "ghost" ? (
        <Button onClick={() => open()} variant="ghost" className="plaidlink-ghost">
          <Image src="/icons/connect-bank.svg" alt="connect bank" width={24} height={24} />
          <p className="hiddenl text-[16px] font-semibold text-black-2 xl:block">Connect bank</p>
        </Button>
      ) : (
        <Button onClick={() => open()} className="plaidlink-default shadow-none px-3">
          <Image src="/icons/connect-bank.svg" alt="connect bank" width={24} height={24} />
          <p className="text-[16px] font-semibold text-black-2">Connect bank</p>
        </Button>
      )}
    </>
  );
};

export default PlaidLink;
