import z from "zod";

const RolesEnum = z.enum(["Admin", "Client", "Broker"]);
