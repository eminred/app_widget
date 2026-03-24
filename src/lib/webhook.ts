const WEBHOOK_URL = "https://h.albato.ru/wh/38/1lfonus/0PyAmeuUoWKDaUM2etRN4gWuqmUJi7UEF2R__RKAC8E/"

export async function sendToWebhook(data: Record<string, unknown>): Promise<void> {
  // Step 1: Enrich use cases with Claude (find matching API endpoints)
  let enrichedData = data
  try {
    const enrichRes = await fetch("/api/claude-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (enrichRes.ok) {
      const enriched = await enrichRes.json()
      enrichedData = { ...data, ...enriched }
    } else {
      console.error("Claude enrichment failed:", enrichRes.status)
    }
  } catch (err) {
    console.error("Claude enrichment failed, proceeding with original data:", err)
  }

  // Step 2: Send enriched payload to Albato + Slack in parallel
  const [albato, slack] = await Promise.allSettled([
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedData),
    }).then((res) => {
      if (!res.ok) throw new Error(`Webhook failed: ${res.status} ${res.statusText}`)
    }),
    fetch("/api/slack-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedData),
    }).then((res) => {
      if (!res.ok) throw new Error(`Slack notify failed: ${res.status}`)
    }),
  ])

  if (albato.status === "rejected") throw albato.reason
  if (slack.status === "rejected") console.error("Slack notification failed:", slack.reason)
}
