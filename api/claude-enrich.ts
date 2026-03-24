import type { VercelRequest, VercelResponse } from "@vercel/node"

interface UseCase {
  id: string
  title: string
  description: string
}

interface Endpoint {
  method: string
  path: string
  url: string
  description: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
  const apiUrl = body?.apiDocumentation?.url as string | undefined
  const apiContent = body?.apiDocumentation?.content as string | undefined
  const useCases = body?.useCases as UseCase[] | undefined

  if (!useCases || useCases.length === 0) {
    return res.status(400).json({ error: "No use cases provided" })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" })
  }

  // Fetch docs content from URL if not pasted
  let docsContent = apiContent || ""
  if (apiUrl && !docsContent) {
    try {
      const docsRes = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; IntegrationBot/1.0)" },
      })
      if (docsRes.ok) {
        const text = await docsRes.text()
        docsContent = text.slice(0, 100000) // limit to avoid token overflow
      }
    } catch (err) {
      console.error("Failed to fetch API docs:", err)
    }
  }

  const useCasesText = useCases
    .map((uc) => `ID: ${uc.id}\nTitle: ${uc.title}\nDescription: ${uc.description}`)
    .join("\n\n")

  const prompt = `You are an API integration specialist. Given API documentation and a list of use cases, identify the most relevant API endpoints for each use case.

${apiUrl ? `API Documentation URL: ${apiUrl}` : ""}${docsContent ? `\n\nAPI Documentation Content:\n${docsContent}` : ""}

Use Cases:
${useCasesText}

For each use case, find the most relevant API endpoints. For the "url" field, construct a direct link to the specific endpoint in the documentation using anchor links or known URL patterns. If you cannot determine a specific link, use the main docs URL.

Return ONLY valid JSON with no markdown formatting:
{
  "useCases": [
    {
      "id": "the-exact-use-case-id",
      "endpoints": [
        {
          "method": "POST",
          "path": "/api/3/contacts",
          "url": "https://direct-link-to-endpoint-in-docs",
          "description": "Brief description of what this endpoint does"
        }
      ]
    }
  ]
}`

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!openaiRes.ok) {
    const err = await openaiRes.text()
    console.error("OpenAI API error:", err)
    return res.status(500).json({ error: "OpenAI API error" })
  }

  const openaiData = (await openaiRes.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  const responseText = openaiData.choices[0]?.message?.content || ""

  let enrichedMap: Record<string, Endpoint[]> = {}
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        useCases: Array<{ id: string; endpoints: Endpoint[] }>
      }
      for (const uc of parsed.useCases || []) {
        enrichedMap[uc.id] = uc.endpoints || []
      }
    }
  } catch (err) {
    console.error("Failed to parse Claude response:", err, responseText)
    return res.status(500).json({ error: "Failed to parse Claude response" })
  }

  const enrichedUseCases = useCases.map((uc) => ({
    ...uc,
    endpoints: enrichedMap[uc.id] || [],
  }))

  return res.status(200).json({
    useCases: enrichedUseCases,
    claudeEnriched: true,
    enrichedAt: new Date().toISOString(),
  })
}
