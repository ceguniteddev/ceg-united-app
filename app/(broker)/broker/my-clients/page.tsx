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
      <div className="flex h-full w-full flex-col p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
          <p className="text-muted-foreground">
            Manage and view all your clients
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
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
                            ? format(new Date(client.createdAt), "MMM dd, yyyy")
                            : "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {client.status}
                      </Badge>
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Start building your client portfolio by adding your first client."}
            </p>
            {!searchTerm && (
              <Button
                size="lg"
                className="gap-2"
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
        className="max-w-[900px]"
      >
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <fieldset disabled={isSubmitting}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
              className="bg-green-400 hover:bg-green-500 text-black-100"
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
