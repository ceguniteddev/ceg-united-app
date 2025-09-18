"use client";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/provider/AuthContext";
import { exchangeAccessToken } from "@/service/plaid";
import { useQueryClient } from "@tanstack/react-query";
import { LandmarkIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { PlaidLinkOptions, usePlaidLink } from "react-plaid-link";
import { toast } from "sonner";

function Search() {
  const searchParams = useSearchParams();
  const oauthStateId = searchParams.get("oauth_state_id");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [receivedRedirectUri, setReceivedRedirectUri] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  React.useEffect(() => {
    if (oauthStateId && user) {
      setToken(localStorage.getItem("link_token"));
      setReceivedRedirectUri(window.location.href);
      setUserId(user.uid);
    }
  }, [oauthStateId, user]);

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        if (!userId) {
          toast.error("User not authenticated. Please try again.");
          console.error("onSuccess called without a userId.");
          return;
        }
        try {
          await exchangeAccessToken(public_token, userId, "ITEM");

          await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEM_LINK", userId] });
          await queryClient.invalidateQueries({
            queryKey: ["GET_HAS_ACCESS_TOKEN", userId, "INCOME_VERIFICATION"],
            exact: false,
          });
          await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEMS", userId] });
          await queryClient.invalidateQueries({ queryKey: ["GET_PLAID_ITEM_ACCOUNT", userId] });
          await queryClient.invalidateQueries({ queryKey: ["USER_LINK_UPDATE_MODE", userId] });
          await queryClient.invalidateQueries({
            queryKey: ["USER_NEW_ACCOUNT_LINK_UPDATE_MODE", userId],
          });

          toast.success("Bank successfully connected.");
        } catch (error) {
          console.error(error);
          toast.error("Failed to connect Bank.");
        }
      };

      exchangePublicTokenForAccessToken();
    },
    [userId, queryClient]
  );

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
    receivedRedirectUri,
  };

  const { open, ready } = usePlaidLink(config);

  React.useEffect(() => {
    if (oauthStateId && ready && userId) {
      open();
    }
  }, [ready, open, oauthStateId, userId]);

  if (oauthStateId && !userId) {
    return <Spinner displayText="Finalizing connection..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800 md:p-12">
        <div className="flex justify-center">
          <LandmarkIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 md:h-16 md:w-16" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 md:text-4xl">
          Welcome Bank!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your account has been successfully linked.
        </p>
        <div className="flex justify-center pt-4">
          <Link
            href="/my-accounts"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800"
          >
            View My Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={<Spinner displayText="Loading..." />}>
      <Search />
    </Suspense>
  );
}
