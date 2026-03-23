const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function requestJson<T>(input: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(input, {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new HttpError(message || `Request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
