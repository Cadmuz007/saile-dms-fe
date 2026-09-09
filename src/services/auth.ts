import type { ApiError, ApiResponse } from "@/types/api";

import type { AuthenticatedUser, SignInCredentials, SignInSession } from "@/features/auth/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiRequestError extends Error {
  readonly code: string;

  constructor(error: ApiError["error"]) {
    super(error.message);
    this.code = error.code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null) as ApiResponse<T> | null;

  if (payload === null) {
    throw new Error("The service returned an invalid response.");
  }
  if (!response.ok || !payload.success) {
    throw new ApiRequestError(payload.success ? {
      code: "HTTP_ERROR",
      message: "The request could not be completed.",
    } : payload.error);
  }

  return payload.data;
}

export function signIn(credentials: SignInCredentials): Promise<SignInSession> {
  return request<SignInSession>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
  return request<AuthenticatedUser>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}
