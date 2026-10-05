const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export type HealthResponse = { data: { status: string; service: string } };

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Backend phản hồi HTTP ${response.status}.`);
  return (await response.json()) as HealthResponse;
}
