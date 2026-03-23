const WEBHOOK_URL = "https://h.albato.ru/wh/38/1lfonus/0PyAmeuUoWKDaUM2etRN4gWuqmUJi7UEF2R__RKAC8E/"

export async function sendToWebhook(data: Record<string, unknown>): Promise<void> {
  const [albato, slack] = await Promise.allSettled([
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error(`Webhook failed: ${res.status} ${res.statusText}`)
    }),
    fetch("/api/slack-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error(`Slack notify failed: ${res.status}`)
    }),
  ])

  if (albato.status === "rejected") throw albato.reason
  if (slack.status === "rejected") console.error("Slack notification failed:", slack.reason)
}
