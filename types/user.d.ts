import { Role } from "@/types/roles";
export {};

declare global {
  type User = {
    id?: string;
    uid: string;
    email: string;
    role: Role;
    emailVerified: boolean;
    disabled: boolean;
    metadata: {
      creationTime: string;
      lastSignInTime: string;
      lastRefreshTime?: string | null | undefined;
    };
  };
}
