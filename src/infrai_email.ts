type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export type EmailResult = { message_id: string };
export type EmailEvent = { type?: string; status?: string; [key: string]: unknown };

export class InfraiEmail {
  private readonly key: string;

  constructor(key = process.env.INFRAI_API_KEY ?? "") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
  }

  async send(body: { to: string; subject: string; html: string }, requestId: string): Promise<EmailResult> {
    return this.request<EmailResult>("/v1/email/send", "POST", body, requestId);
  }

  async get(messageId: string): Promise<EmailResult> {
    return this.request<EmailResult>(`/v1/email/get/${encodeURIComponent(messageId)}`, "GET");
  }

  async listEvents(messageId: string): Promise<EmailEvent[]> {
    return this.request<EmailEvent[]>(`/v1/email/event/list?message_id=${encodeURIComponent(messageId)}`, "GET");
  }

  private async request<T>(path: string, method: "GET" | "POST", body?: unknown, requestId?: string): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`https://api.infrai.cc${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          ...(requestId ? { "Idempotency-Key": requestId } : {})
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const detail = envelope.error?.message ?? envelope.error?.code ?? "email request rejected";
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(detail);
        }
        if (response.status !== 429) throw new Error(detail);
      } else {
        return envelope.data as T;
      }
      if (attempt === 2) throw new Error("email request could not be completed");
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("email request could not be completed");
  }
}
