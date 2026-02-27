import { useState } from "react"
import { Plus, Trash2, FileCode2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UseCase {
  id: string
  title: string
  description: string
}

export interface IntegrationRequirements {
  apiDocumentation: {
    content: string
    url: string
  }
  useCases: UseCase[]
}

export default function IntegrationRequirementsWidget() {
  const [apiContent, setApiContent] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const [useCases, setUseCases] = useState<UseCase[]>([
    { id: crypto.randomUUID(), title: "", description: "" },
  ])

  const addUseCase = () => {
    setUseCases([
      ...useCases,
      { id: crypto.randomUUID(), title: "", description: "" },
    ])
  }

  const removeUseCase = (id: string) => {
    if (useCases.length === 1) return
    setUseCases(useCases.filter((uc) => uc.id !== id))
  }

  const updateUseCase = (
    id: string,
    field: keyof Omit<UseCase, "id">,
    value: string
  ) => {
    setUseCases(
      useCases.map((uc) => (uc.id === id ? { ...uc, [field]: value } : uc))
    )
  }

  const handleSubmit = () => {
    const requirements: IntegrationRequirements = {
      apiDocumentation: { content: apiContent, url: apiUrl },
      useCases,
    }
    console.log("Integration Requirements:", requirements)
  }

  const filledUseCases = useCases.filter((uc) => uc.title.trim()).length
  const hasApiDocs = apiContent.trim() || apiUrl.trim()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Integration Requirements
          </h1>
          <p className="text-muted-foreground text-sm">
            Provide the API documentation and use-cases to generate your
            integration.
          </p>
        </div>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCode2 className="size-4" />
              API Documentation
            </CardTitle>
            <CardDescription>
              Paste the raw API docs, OpenAPI spec, or provide a URL to the
              documentation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paste">
              <TabsList className="mb-4">
                <TabsTrigger value="paste">Paste content</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>

              <TabsContent value="paste">
                <div className="space-y-2">
                  <Label htmlFor="api-content">API Documentation</Label>
                  <Textarea
                    id="api-content"
                    placeholder="Paste your API documentation, OpenAPI/Swagger spec, or any relevant technical content here..."
                    className="min-h-48 font-mono text-sm"
                    value={apiContent}
                    onChange={(e) => setApiContent(e.target.value)}
                  />
                  {apiContent && (
                    <p className="text-muted-foreground text-xs">
                      {apiContent.length.toLocaleString()} characters
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url">
                <div className="space-y-2">
                  <Label htmlFor="api-url">Documentation URL</Label>
                  <Input
                    id="api-url"
                    type="url"
                    placeholder="https://docs.example.com/api"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Link to an OpenAPI spec, Swagger UI, or any public API
                    reference page.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4" />
                  Use Cases
                  {filledUseCases > 0 && (
                    <Badge variant="secondary">{filledUseCases}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  Describe what you want to achieve with this integration.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addUseCase}>
                <Plus />
                Add use case
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {useCases.map((uc, index) => (
              <div
                key={uc.id}
                className="group relative space-y-3 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Use case {index + 1}
                  </span>
                  {useCases.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removeUseCase(uc.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`uc-title-${uc.id}`}>Title</Label>
                  <Input
                    id={`uc-title-${uc.id}`}
                    placeholder="e.g. Sync customer data on signup"
                    value={uc.title}
                    onChange={(e) =>
                      updateUseCase(uc.id, "title", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`uc-desc-${uc.id}`}>Description</Label>
                  <Textarea
                    id={`uc-desc-${uc.id}`}
                    placeholder="Describe the expected behavior, inputs, outputs, and any relevant constraints..."
                    className="min-h-20 text-sm"
                    value={uc.description}
                    onChange={(e) =>
                      updateUseCase(uc.id, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={!hasApiDocs}>
            Generate Integration
          </Button>
        </div>
      </div>
    </div>
  )
}
