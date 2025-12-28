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
    let error: any;
    try {
      error = await response.json();
    } catch {
      error = { detail: "An error occurred" };
    }
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401 && typeof window !== "undefined") {
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user_role");
      // Redirect to login page
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    
    // Handle 404 Not Found - provide more context
    if (response.status === 404) {
      const errorMessage = error.detail || error.message || "Không tìm thấy dữ liệu";
      // For public endpoints (products, categories), log as warning instead of error
      if (endpoint.includes("/sanpham") || endpoint.includes("/danhmuc")) {
        console.warn(`[apiClient] 404 ${endpoint}: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      // For other endpoints, log error but don't spam console
      console.error(`[apiClient] 404 ${endpoint}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Handle other errors
    const errorMessage = error.detail || error.message || "Request failed";
    console.error(`[apiClient] ${response.status} ${endpoint}: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  return response.json();
};

export default apiClient;

