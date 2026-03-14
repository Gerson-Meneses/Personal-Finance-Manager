import { useQuery } from "@tanstack/react-query"
import {apiFetch} from "../../shared/api"
import type { Data } from "../../shared/dataApiInterface"

export const useDashboard = () => {

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {

      const { data } = await apiFetch<Data<{}>>("/dashboard")
      return data
    }
  })

  return {
    data: query.data,
    loading: query.isLoading
  }

}