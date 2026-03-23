import { task } from "@trigger.dev/sdk/v3"

interface SlackNotifyPayload {
  apiUrl?: string
  apiContent?: string
  useCasesText?: string
}

export const slackNotifyTask = task({
  id: "slack-notify",
  run: async (payload: SlackNotifyPayload) => {
    const token = process.env.SLACK_BOT_TOKEN
    const channel = process.env.SLACK_CHANNEL_ID

    if (!token || !channel) {
      throw new Error("SLACK_BOT_TOKEN or SLACK_CHANNEL_ID env vars are missing")
    }

    const text = [
      "*New Integration Request*",
      payload.apiUrl ? `*API URL:* ${payload.apiUrl}` : "*API Docs:* (pasted content)",
      payload.useCasesText
        ? `*Use Cases:* ${payload.useCasesText.split(";").map((uc, i) => `\n  ${i + 1}. ${uc}`).join("")}`
        : null,
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
      throw new Error(`Slack API error: ${result.error}`)
    }

    return { success: true }
  },
})
