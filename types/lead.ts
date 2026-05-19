import {
  AuthForm,
  BusinessDetailsForm,
  DocumentUploadForm,
} from "@/schema/new-registration";

export type Lead = Partial<AuthForm> &
  Partial<BusinessDetailsForm> &
  Partial<DocumentUploadForm> & {
    id: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
