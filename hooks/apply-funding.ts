import AppError from "@/error/AppError";
import { ApplyFunding, ApplyFundingWithUser } from "@/schema/apply-funding";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addFundApplicationNotes,
  applyFunding,
  deleteApplyFunding,
  getApplyFunding,
  getApplyFundingByReferenceNumber,
  getFundApplicationNotes,
  getFundingApplications,
} from "@/service/apply-funding";
import { useAuth } from "@/provider/AuthContext";
import { NoteSchema } from "@/schema/notes";

export const useGetUserApplyFunding = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_USER_APPLY_FUNDING", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getApplyFunding(user.uid)) as ApplyFunding[];

      return data;
    },
    enabled: !!user,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useGetClientApprovedMappedFunding = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["useGetClientApprovedMappedFunding", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getApplyFunding(user.uid)) as ApplyFunding[];

      return data;
    },
    enabled: !!user,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useGetFundingApplications = ({ state }: { state?: string }) => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATIONS", state],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getFundingApplications({
        state,
      })) as ApplyFundingWithUser[];

      return data;
    },
    enabled: !!user,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useGetApplyFundingByReferenceNumber = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATIONS", referenceNumber],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getApplyFundingByReferenceNumber({
        referenceNumber,
      })) as ApplyFunding;

      return data;
    },
    enabled: !!user && !!referenceNumber,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useGetFundingApplicationsIsNew = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATIONS_NEW"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getFundingApplications({
        status: "New",
      })) as ApplyFundingWithUser[];

      return data;
    },
    enabled: !!user,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useApplyFunding = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({ values }: { values: ApplyFunding }) => {
      if (!user) throw new Error("User not authenticated");

      await applyFunding({ value: values });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_APPLY_FUNDING", user?.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_FUNDING_APPLICATIONS"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_FUNDING_APPLICATIONS_NEW"],
      });
    },
    onError: (error: any) => {
      if (error instanceof AppError) {
        toast.warning(error.message);
      } else {
        toast.warning(error.message);
        console.error(error);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (referenceNumber: string) => {
      await deleteApplyFunding(referenceNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_APPLY_FUNDING", user?.uid],
      });
    },
    onError: (error: any) => {
      if (error instanceof AppError) {
        toast.warning(error.message);
      } else {
        toast.warning(error.message);
        console.error(error);
      }
    },
  });

  return {
    applyFunding: createMutation.mutateAsync,
    isRecording: createMutation.isPending,

    deleteAppliedFunding: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

export const useAddFundApplicationNotesMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addUserNotesMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      notes,
    }: {
      referenceNumber: string;
      notes: string[];
    }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await addFundApplicationNotes({ referenceNumber, notes });
    },
    onSuccess: (data, _variable) => {
      toast.success("Notes successfully added.");
      queryClient.invalidateQueries({
        queryKey: ["GET_FUND_APPLICATION_NOTES", _variable.referenceNumber],
      });
    },

    onError: (error: any) => {
      console.log("Error adding notes:", error);
      toast.error("Failed to add notes. Please try again.");
    },
  });

  return {
    addNotes: addUserNotesMutation.mutateAsync,
    isRecording: addUserNotesMutation.isPending,
  };
};

export const useAddFundApplicationNotesQuery = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const { user } = useAuth();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["GET_FUND_APPLICATION_NOTES", referenceNumber],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getFundApplicationNotes(referenceNumber)) as string[];

      return data;
    },
    enabled: !!user && !!referenceNumber,
  });

  return {
    notes,
    isLoading,
  };
};

const getNote = async (referenceNumber: string): Promise<NoteSchema> => {
  const response = await fetch(
    `/api/funding-application/${referenceNumber}/notes`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch note");
  }
  return response.json();
};

const updateNote = async ({
  referenceNumber,
  note,
}: {
  referenceNumber: string;
  note: NoteSchema;
}): Promise<void> => {
  const response = await fetch(
    `/api/funding-application/${referenceNumber}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to save note");
  }
};

// =================================
// TanStack Query Hooks
// =================================

/**
 * Hook to fetch the note data for a specific application.
 */
export const useGetNoteQuery = (referenceNumber: string) => {
  return useQuery<NoteSchema, Error>({
    // The query key is an array that uniquely identifies this data
    queryKey: ["note", referenceNumber],
    // The query function is the async function that fetches the data
    queryFn: () => getNote(referenceNumber),
    // This option prevents the query from running if referenceNumber is falsy
    enabled: !!referenceNumber,
    // You might want to set staleTime if you don't need to refetch constantly
    // staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update the note data.
 */
export const useUpdateNoteMutation = (referenceNumber: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    // The mutation function
    mutationFn: (note: NoteSchema) => updateNote({ referenceNumber, note }),

    // Handlers for different outcomes of the mutation
    onSuccess: () => {
      toast.success("Note saved successfully!");
      // After a successful mutation, invalidate the query for this note.
      // This will cause TanStack Query to refetch the data, ensuring the
      // UI is consistent with the database state.
      queryClient.invalidateQueries({ queryKey: ["note", referenceNumber] });
    },
    onError: (error: Error) => {
      toast.error("Failed to save note.");
      console.error("Error updating note:", error);
    },
  });
};
