// Ensure BASE URL includes /api prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const apiClient = async (
  endpoint: string,
  options: RequestInit & { auth?: boolean; debug?: boolean } = {}
) => {
  // Get token from localStorage (key is "token" as used in login)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const auth = options.auth !== false;
  const debug = options.debug === true;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  if (debug && typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[apiClient]", options.method || "GET", url, { auth });
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    
    if (debug && typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[apiClient:error]", response.status, url, error);
    }

    // Handle 401 Unauthorized - redirect to login (only for auth-protected calls)
    if (auth && response.status === 401 && typeof window !== "undefined") {
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user_role");
      // Redirect to login page
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    
    throw new Error(error.detail || error.message || "Request failed");
  }

  return response.json();
};

export default apiClient;

