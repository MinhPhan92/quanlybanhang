// Ensure BASE URL includes /api prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  // Get token from localStorage (key is "token" as used in login)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401 && typeof window !== "undefined") {
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

