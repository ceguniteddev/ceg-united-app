import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlaidLinkOptions, usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGetLinkToken } from "@/hooks/plaid";
import { exchangeAccessToken } from "@/service/plaid";
import { useAuth } from "@/provider/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type PlaidLinkProps = {
  variant?: "primary" | "ghost";
  itemId?: string;
  isNewAccount?: boolean;
};

const PlaidLink = ({ variant, itemId, isNewAccount }: PlaidLinkProps) => {
  const { linkToken, isLoading } = useGetLinkToken({
    itemId,
    isNewAccount,
  });

  useEffect(() => {
    if (linkToken) {
      localStorage.setItem("link_token", linkToken);
    }
  }, [linkToken]);

  // const [token, setToken] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        await exchangeAccessToken(public_token, user?.uid ?? "", "ITEM", itemId, isNewAccount);

        await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEM_LINK", user?.uid] });
        await queryClient.invalidateQueries({
          queryKey: ["GET_HAS_ACCESS_TOKEN", user?.uid, "INCOME_VERIFICATION"],
          exact: false,
        });
        await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEMS", user?.uid] });
        await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid] });
        await queryClient.invalidateQueries({ queryKey: ["USER_LINK_UPDATE_MODE", user?.uid] });
        await queryClient.invalidateQueries({
          queryKey: ["USER_NEW_ACCOUNT_LINK_UPDATE_MODE", user?.uid],
        });

        toast.success("Bank successfully connected.");
      };

      exchangePublicTokenForAccessToken();
    },
    [user?.uid, queryClient, itemId, isNewAccount]
  );

  const config: PlaidLinkOptions = {
    token: linkToken!,
    onSuccess,
    onExit: (error, metadata) => {
      console.log("onExit", error, metadata);
      toast.error("Failed to connect Bank.");
    },
  };

  const { open, ready } = usePlaidLink(config);

  if (!user) return null;

  return (
    <>
      {variant === "primary" ? (
        <Button
          id="plaid-link-button"
          onClick={() => open()}
          disabled={!ready || isLoading}
          className="plaidlink-primary"
        >
          Connect bank
        </Button>
      ) : variant === "ghost" ? (
        <Button
          id="plaid-link-button"
          onClick={() => open()}
          disabled={!ready || isLoading}
          variant="ghost"
          className="plaidlink-ghost"
        >
          <Image src="/icons/connect-bank.svg" alt="connect bank" width={24} height={24} />
          <p className="hiddenl text-[16px] font-semibold text-black-2 xl:block">Connect bank</p>
        </Button>
      ) : (
        <Button
          id="plaid-link-button"
          onClick={() => open()}
          disabled={!ready || isLoading}
          className="plaidlink-default shadow-none px-3 bg-green-100 hover:bg-green-200"
        >
          <Image src="/icons/connect-bank.svg" alt="connect bank" width={24} height={24} />
          <p className="text-[16px] font-semibold text-black-2">
            {itemId && !isNewAccount
              ? "Reconnect bank"
              : isNewAccount
              ? "Connect new account"
              : "Connect bank"}
          </p>
        </Button>
      )}
    </>
  );
};

export default PlaidLink;
