import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GET_CONSUMER_REPORTING_AGENCIES } from "@/constant/react-query-keys";
import {
  addConsumerReportingAgency,
  deleteConsumerReportingAgency,
  getConsumerReportingAgencies,
  updateConsumerReportingAgency,
} from "@/service/consumer-reporting-agency";
import { AgencySchemaForm } from "@/schema/consumer-reporting-agency";

export const useGetConsumerReportingAgencies = () => {
  return useQuery({
    queryKey: [GET_CONSUMER_REPORTING_AGENCIES],
    queryFn: async () => {
      const response = await getConsumerReportingAgencies();
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch agencies");
      }
      return response.data || [];
    },
  });
};

export const useCreditAgenciesData = () => {
  const {
    data: allAgencies = [],
    isLoading,
    error,
  } = useGetConsumerReportingAgencies();

  const bureausList = allAgencies.filter(
    (a) => a.category === "bureau" && a.isActive !== false,
  );
  const craList = allAgencies.filter(
    (a) => a.category === "cra" && a.isActive !== false,
  );

  const bureauRecord = bureausList.reduce(
    (acc, curr) => {
      acc[curr.key as any] = curr;
      return acc;
    },
    {} as Record<string, AgencySchemaForm>,
  );

  const getAgency = (key: string) => allAgencies.find((a) => a.key === key);

  return {
    allAgencies,
    bureausList,
    craList,
    bureauRecord,
    getAgency,
    isLoading,
    error,
  };
};

export const useAddConsumerReportingAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AgencySchemaForm) => addConsumerReportingAgency(data),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: [GET_CONSUMER_REPORTING_AGENCIES],
        });
      }
    },
  });
};

export const useUpdateConsumerReportingAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgencySchemaForm }) =>
      updateConsumerReportingAgency(id, data),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: [GET_CONSUMER_REPORTING_AGENCIES],
        });
      }
    },
  });
};

export const useDeleteConsumerReportingAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteConsumerReportingAgency(id),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: [GET_CONSUMER_REPORTING_AGENCIES],
        });
      }
    },
  });
};
