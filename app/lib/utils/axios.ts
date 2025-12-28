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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // Handle network errors (backend not running, CORS, etc.)
    const errorMessage = networkError.message?.includes("Failed to fetch") || networkError.message?.includes("NetworkError")
      ? "Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không."
      : `Lỗi kết nối: ${networkError.message || "Unknown error"}`;
    
    if (debug && typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("[apiClient:network-error]", url, errorMessage);
    }
    
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let error: any;
    try {
      error = await response.json();
    } catch {
      // If response is not JSON, create a generic error
      error = { 
        detail: response.status === 404 
          ? "Không tìm thấy tài nguyên" 
          : response.status === 500
          ? "Lỗi máy chủ"
          : `Request failed with status ${response.status}`
      };
    }
    
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

    // For 404 errors on public endpoints (like products), provide a more helpful message
    if (response.status === 404 && !auth) {
      const errorMessage = error.detail || error.message || "Không tìm thấy dữ liệu. Vui lòng kiểm tra kết nối backend.";
      throw new Error(errorMessage);
    }
    
    throw new Error(error.detail || error.message || `Request failed (${response.status})`);
  }

  return response.json();
};

export default apiClient;

