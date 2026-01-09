"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CategoryBadge from "@/components/CategoryBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Search, Mail, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface BrokerClientsProps {
  brokerId: string;
}

export default function BrokerClients({ brokerId }: BrokerClientsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["BROKER_CLIENTS", brokerId],
    queryFn: async () => {
      const response = await fetch(`/api/broker/${brokerId}/clients`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return await response.json();
    },
    enabled: !!brokerId,
  });

  const filteredClients =
    clients?.filter(
      (client: any) =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 sm:h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      {filteredClients.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <div className="px-1 mb-2">
              <h3 className="text-lg font-semibold">
                All Clients ({filteredClients.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Clients managed by this broker
              </p>
            </div>
            {filteredClients.map((client: any) => (
              <Card key={client.clientId}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Users className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium text-sm truncate">
                        {client.clientName}
                      </p>
                    </div>
                    <CategoryBadge
                      category={client.clientActiveStatus || "InActive"}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {client.clientEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">
                      {client.createdAt
                        ? format(new Date(client.createdAt), "MMM dd, yyyy")
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>All Clients ({filteredClients.length})</CardTitle>
              <CardDescription>Clients managed by this broker</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: any) => (
                    <TableRow key={client.clientId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-primary" />
                          <p className="font-medium">{client.clientName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{client.clientEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {client.createdAt
                              ? format(
                                  new Date(client.createdAt),
                                  "MMM dd, yyyy"
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategoryBadge
                          category={client.clientActiveStatus || "InActive"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-3 sm:mb-4">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">
              {searchTerm ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "This broker doesn't have any clients yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
