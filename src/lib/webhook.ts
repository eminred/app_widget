const WEBHOOK_URL = "https://h.albato.ru/wh/38/1lfonus/0PyAmeuUoWKDaUM2etRN4gWuqmUJi7UEF2R__RKAC8E/"

export async function sendToWebhook(data: Record<string, unknown>): Promise<void> {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
  }
}
