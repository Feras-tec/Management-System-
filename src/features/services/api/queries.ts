import { useQuery } from "@tanstack/react-query";

import { getPublicService, getPublicServices } from "./serviceApi";

export function usePublicServices() {
  return useQuery({
    queryKey: ["public", "services"],
    queryFn: getPublicServices,
  });
}

export function usePublicService(slug: string) {
  return useQuery({
    queryKey: ["public", "services", slug],
    queryFn: () => getPublicService(slug),
  });
}
