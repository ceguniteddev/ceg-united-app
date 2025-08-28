import { GET_USERS } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { Role } from "@/schema";
import { UserPlaid } from "@/schema/registration";
import { getUsers } from "@/service/user";
import { useQuery } from "@tanstack/react-query";

export const useUserQuery = (role?: Role) => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [GET_USERS, role],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getUsers(role)) as UserPlaid[];

      return data;
    },
    enabled: !!user,
  });

  return {
    users,
    isLoading,
  };
};
