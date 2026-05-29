"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/provider/AuthContext";

export function Step1Welcome() {
  const { userData } = useAuth();

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Welcome to CEG United!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-lg">
          Hi {userData?.firstName ? userData.firstName : "there"},
        </p>
        <p className="text-muted-foreground">
          You've successfully created your account. We're excited to help you
          find the best funding options tailored to your needs.
        </p>
        <p className="text-sm font-medium mt-4">
          Click "Continue to Application" below to complete your profile and
          check your eligibility.
        </p>
      </CardContent>
    </Card>
  );
}
