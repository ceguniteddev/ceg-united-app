"use client";
import { useAuth } from "@/provider/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Spinner from "./Spinner";

type ExtraInfoType = {
  extraInfo: string;
};

export function withAdminGuard<P>(
  WrappedComponent: React.ComponentType<P & ExtraInfoType>,
) {
  const ComponentWithExtraInfo = (props: P) => {
    const { role, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || role === "Client")) {
        router.push("/");
      }
    }, [loading, user, role, router]);

    if (loading || !user || role === "Client") {
      return <Spinner />;
    }

    return <WrappedComponent {...props} extraInfo="" />;
  };

  return ComponentWithExtraInfo;
}

export function withBrokerGuard<P>(
  WrappedComponent: React.ComponentType<P & ExtraInfoType>,
) {
  const ComponentWithExtraInfo = (props: P) => {
    const { role, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || role !== "Broker")) {
        router.push("/");
      }
    }, [loading, user, role, router]);

    if (loading || !user || role !== "Broker") {
      return <Spinner />;
    }

    return <WrappedComponent {...props} extraInfo="" />;
  };

  return ComponentWithExtraInfo;
}

export function withClientGuard<P>(
  WrappedComponent: React.ComponentType<P & ExtraInfoType>,
) {
  const ComponentWithExtraInfo = (props: P) => {
    const { role, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || role !== "Client")) {
        router.push("/");
      }
    }, [loading, user, role, router]);

    if (loading || !user || role !== "Client") {
      return <Spinner />;
    }

    return <WrappedComponent {...props} extraInfo="" />;
  };

  return ComponentWithExtraInfo;
}
