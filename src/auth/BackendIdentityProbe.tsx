import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { createBackendClient } from "../api/backendClient";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export default function BackendIdentityProbe() {
  const { auth } = useRouteContext({ from: "__root__" });

  useQuery({
    queryKey: ["backend", "identity"],
    enabled: Boolean(apiBaseUrl),
    retry: false,
    staleTime: 1000 * 60 * 5,
    queryFn: () => {
      if (!apiBaseUrl) {
        throw new Error("Missing VITE_API_BASE_URL.");
      }

      return createBackendClient({
        baseUrl: apiBaseUrl,
        getAccessToken: auth.getAccessToken,
      }).getCurrentIdentity();
    },
  });

  return null;
}
