import { getAuthToken, logout } from "./auth-client.ts";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers = {
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  } as Record<string, string>;

  // Only set Content-Type if not already specified and not FormData
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("Unauthorized API call:", url);
    const localToken = sessionStorage.getItem("app_token");
    if (localToken && localToken !== "local_admin_token") {
      logout().catch(() => {});
    }
  }

  return response;
}
