"use client";

import {
  useGetBrokerClients,
  useSubmitClientApplication,
} from "@/hooks/broker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Plus,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CustomFormField } from "@/components/CustomFormField";
import {
  dateOfBirthSchema,
  GenderEnum,
  genderTypes,
  ROLESEnum,
} from "@/schema";
import { Form } from "@/components/ui/form";
import { ssnSchema } from "@/schema/registration";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { US_STATES } from "@/constant/common";

// Client application schema
const clientApplicationSchema = z.object({
  // Client Information
  firstName: z.string().min(1, { message: "Required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Required" }),
  email: z.string().email().min(1, { message: "Required" }),
  birthdate: dateOfBirthSchema,
  gender: GenderEnum,
  phoneNumber: z.string().min(1, { message: "Required" }),
  role: ROLESEnum.optional(),
  isOnboarded: z.boolean().optional(),
  registrationDate: z.date().optional(),
  ssn: ssnSchema,

  addressStreet: z.string().min(1, { error: "Required" }),
  houseNumber: z.string().optional(),
  addressCity: z.string().min(1, { error: "Required" }),
  addressState: z.string().min(1, { error: "Required" }),
  addressPostal: z.string().min(1, { error: "Required" }),
});

type ClientApplicationForm = z.infer<typeof clientApplicationSchema>;

export default function MyClientsPage() {
  const { clients, isLoading } = useGetBrokerClients();
  const mutation = useSubmitClientApplication();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientApplicationForm>({
    resolver: zodResolver(clientApplicationSchema),
    defaultValues: {
      middleName: "",
    },
  });

  const onSubmit = async (data: ClientApplicationForm) => {
    setIsSubmitting(true);

    try {
      await mutation.mutateAsync({ ...data, password: data.email });
      toast.success("Client registered successfully!", {
        description:
          "Your client will receive an invitation email to create their account.",
      });
      form.reset();
      setIsModalOpen(false);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients =
    clients?.filter(
      (client: any) =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-48 sm:w-64" />
        <Skeleton className="h-64 sm:h-96" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Clients
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and view all your clients
          </p>
        </div>
        <Button
          variant={"outline"}
          className="bg-blue-200 hover:bg-blue-300 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      {filteredClients.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Clients ({filteredClients.length})</CardTitle>
            <CardDescription>
              Click on a client to view their dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <CategoryBadge category={client.clientActiveStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/broker/my-clients/${client.clientId}`}>
                          <Button variant="outline" size="sm">
                            View Dashboard
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredClients.map((client: any) => (
                <Card key={client.clientId} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold text-base">
                              {client.clientName}
                            </p>
                            <div className="mt-1">
                              <CategoryBadge
                                category={client.clientActiveStatus}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.clientEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {client.createdAt
                              ? format(
                                  new Date(client.createdAt),
                                  "MMM dd, yyyy"
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/broker/my-clients/${client.clientId}`}
                        className="block"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          View Dashboard
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">
              {searchTerm ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md mb-6 px-4">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Start building your client portfolio by adding your first client."}
            </p>
            {!searchTerm && (
              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Register First Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Client Modal */}
      <ResponsiveDialog
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        title="Client Registration"
        description="Register a new client to your portfolio"
        className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[900px]"
      >
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <fieldset disabled={isSubmitting}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <CustomFormField
                        name={"firstName"}
                        placeholder={""}
                        label="* First Name"
                      />
                      <CustomFormField
                        name={"middleName"}
                        placeholder={""}
                        label="Middle Name"
                      />
                      <CustomFormField
                        name={"lastName"}
                        placeholder={""}
                        label="* Last Name"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomFormField
                        name={"email"}
                        type="email"
                        placeholder=""
                        label="* Email Address"
                      />
                      <CustomFormField
                        name={"phoneNumber"}
                        placeholder=""
                        label="* Phone Number"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomFormField
                        name={"birthdate"}
                        type="date-picker"
                        placeholder=""
                        label="* Birthdate"
                        dateAfterHidden={new Date()}
                      />
                      <CustomFormField
                        name={"gender"}
                        type="select"
                        placeholder=" "
                        label="* Gender"
                        options={genderTypes()}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField
                        name={"addressStreet"}
                        label={"Street Address"}
                      />
                      <CustomFormField
                        name={"houseNumber"}
                        label={"Apartment/Suite/Unit/House Number"}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <CustomFormField name={"addressCity"} label={"City"} />
                      <CustomFormField
                        name={"addressState"}
                        label={"State"}
                        type="select"
                        placeholder="Select a state"
                        options={US_STATES}
                      />
                      <CustomFormField
                        name={"addressPostal"}
                        label={"Zip Code"}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomFormField
                        name={"ssn"}
                        placeholder="xxx-xx-xxxx"
                        label="* Social Security Number"
                      />
                    </div>
                  </div>
                </fieldset>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
              className="w-full sm:w-auto bg-green-400 hover:bg-green-500 text-black-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Register Client
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </ResponsiveDialog>
    </div>
  );
}
