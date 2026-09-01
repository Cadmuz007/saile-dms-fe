import type { ApiResponse } from "@/types/api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function getApi<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  return (await response.json()) as ApiResponse<T>;
}
