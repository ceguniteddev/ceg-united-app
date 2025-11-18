"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { useUserQuery } from "@/hooks/user";
import Spinner from "@/components/Spinner";
import BrokerDashboard from "./dashboard";
import BrokerClients from "./clients";
import BrokerClientFunding from "./client-funding";

const BrokerProfilePage = () => {
  const params = useParams();
  const brokerId = params.brokerId as string;

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
    <div className="w-full flex flex-col items-start justify-start p-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{brokerName}</h1>
        <p className="text-muted-foreground">{userData.email}</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
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
