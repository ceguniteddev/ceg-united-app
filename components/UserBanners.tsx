"use client";

import {
  Banner,
  BannerIcon,
  BannerTitle,
  BannerClose,
} from "@/components/ui/shadcn-io/banner";
import { CircleAlert } from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import { useMemo } from "react";

export default function UserBanners() {
  const { user } = useAuth();

  if (!user) return null;

  return null;
}
