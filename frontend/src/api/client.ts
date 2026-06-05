export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers
    }
  });

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401 || response.status === 403) {
    if (window.location.pathname !== "/") {
      window.history.replaceState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }

  if (!response.ok) {
    const errorValue =
      typeof data === "object" && data && "error" in data
        ? (data as { error?: unknown }).error
        : null;
    const message =
      typeof errorValue === "string"
        ? errorValue
        : typeof errorValue === "object" &&
            errorValue &&
            "message" in errorValue &&
            typeof (errorValue as { message?: unknown }).message === "string"
          ? (errorValue as { message: string }).message
          : "Request failed";

    throw new Error(message);
  }

  return data as T;
}
