import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
  console.log("full body:", JSON.stringify(body))
  const apiUrl = body?.apiDocumentation?.url as string | undefined
  const apiContent = body?.apiDocumentation?.content as string | undefined
  const useCasesText = body?.useCasesText as string | undefined
  const useCases = body?.useCases as Array<{
    id: string
    title: string
    description: string
    endpoints?: Array<{ method: string; path: string; url: string; description: string }>
  }> | undefined

  const token = process.env.SLACK_BOT_TOKEN
  const channel = process.env.SLACK_CHANNEL_ID

  if (!token || !channel) {
    return res.status(500).json({ error: "Slack credentials not configured" })
  }

  let useCasesFormatted: string | null = null
  if (useCases && useCases.length > 0) {
    useCasesFormatted = `*Use Cases:*${useCases
      .map((uc, i) => {
        let line = `\n  ${i + 1}. ${uc.title} - ${uc.description}`
        if (uc.endpoints && uc.endpoints.length > 0) {
          const links = uc.endpoints
            .map((ep) => `<${ep.url}|${ep.method} ${ep.path}>`)
            .join(", ")
          line += `. Endpoint: ${links}`
        }
        return line
      })
      .join("")}`
  } else if (useCasesText) {
    useCasesFormatted = `*Use Cases:*${useCasesText.split(";").map((uc: string, i: number) => `\n  ${i + 1}. ${uc}`).join("")}`
  }

  const text = [
    "*New Integration Request*",
    apiUrl ? `*API URL:* ${apiUrl}` : apiContent ? `*API Docs:* (pasted content)` : null,
    useCasesFormatted,
  ]
    .filter(Boolean)
    .join("\n")

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, text }),
  })

  const result = await response.json() as { ok: boolean; error?: string }

  if (!result.ok) {
    return res.status(500).json({ error: `Slack API error: ${result.error}` })
  }

  return res.status(200).json({ success: true })
}
