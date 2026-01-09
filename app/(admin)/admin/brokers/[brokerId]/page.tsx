"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useUserQuery } from "@/hooks/user";
import Spinner from "@/components/Spinner";
import BrokerDashboard from "./dashboard";
import BrokerClients from "./clients";
import BrokerClientFunding from "./client-funding";
import { useState } from "react";

const BrokerProfilePage = () => {
  const params = useParams();
  const brokerId = params.brokerId as string;
  const [activeTab, setActiveTab] = useState("dashboard");

  const { userData, isLoading: isUserLoading } = useUserQuery(brokerId);

  // Show loading state while fetching data
  if (isUserLoading) {
    return <Spinner displayText="Loading broker profile..." />;
  }

  // If no user data or not a broker, show error state
  if (!userData || userData.role !== "Broker") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Broker Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The requested broker could not be found.
          </p>
        </div>
      </div>
    );
  }

  const brokerName = `${userData.firstName} ${userData.lastName}`;

  return (
    <div className="w-full flex flex-col items-start justify-start p-4 sm:p-6 md:p-10">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {brokerName}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground truncate">
          {userData.email}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile Dropdown */}
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
              <SelectItem value="client-funding">Client Funding</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tabs */}
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="client-funding">Client Funding</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="w-full">
          <BrokerDashboard brokerId={brokerId} />
        </TabsContent>

        <TabsContent value="clients" className="w-full">
          <BrokerClients brokerId={brokerId} />
        </TabsContent>

        <TabsContent value="client-funding" className="w-full">
          <BrokerClientFunding brokerId={brokerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerProfilePage;
