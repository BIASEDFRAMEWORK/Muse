import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

export interface AIConfig {
  provider: string
  model: string
}

interface GenerationMeta {
  label?: string
  maxTokens?: number
}

interface LlmUsageRecord {
  timestamp: string
  provider: string
  model: string
  label: string
  usedAi: boolean
  fallbackReason: string | null
  message: string | null
  durationMs: number
  itemCount: number
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
}

export class LlmClient {
  private readonly client: Anthropic | null

  private appendUsageLog(record: LlmUsageRecord): void {
    const logsDir = path.resolve('logs')
    fs.mkdirSync(logsDir, { recursive: true })
    const logPath = path.join(logsDir, 'llm-usage.jsonl')
    fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf8')
  }

  private classifyError(message: string): string {
    const text = message.toLowerCase()
    if (text.includes('rate limit')) return 'rate_limit'
    if (text.includes('max_tokens') || text.includes('too many tokens') || text.includes('token')) return 'token_limit'
    if (text.includes('authentication') || text.includes('api key') || text.includes('unauthorized')) return 'auth_error'
    if (text.includes('timeout')) return 'timeout'
    if (text.includes('network')) return 'network_error'
    return 'api_error'
  }

  private resolveApiKey(): string | null {
    const fromEnv = process.env.ANTHROPIC_API_KEY?.trim()
    if (fromEnv) {
      return fromEnv
    }

    const envPath = path.resolve('.env')
    if (!fs.existsSync(envPath)) {
      return null
    }

    const raw = fs.readFileSync(envPath, 'utf8')
    const line = raw
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith('ANTHROPIC_API_KEY='))

    if (!line) {
      return null
    }

    const value = line.slice('ANTHROPIC_API_KEY='.length).trim().replace(/^['\"]|['\"]$/g, '')
    return value || null
  }

  constructor(private readonly config: AIConfig) {
    const apiKey = this.resolveApiKey()
    if (config.provider === 'anthropic' && apiKey) {
      this.client = new Anthropic({ apiKey })
      return
    }

    this.client = null
  }

  async generateJsonArray<T>(prompt: string, fallback: T[], meta: GenerationMeta = {}): Promise<T[]> {
    const label = meta.label || 'unnamed'
    const maxTokens = meta.maxTokens ?? 3500
    const started = Date.now()

    if (!this.client) {
      this.appendUsageLog({
        timestamp: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        label,
        usedAi: false,
        fallbackReason: 'no_client',
        message: 'AI client not configured; using fallback.',
        durationMs: Date.now() - started,
        itemCount: fallback.length,
      })
      process.stdout.write(`[llm:${label}] fallback(no_client)\n`)
      return fallback
    }

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: maxTokens,
        system: 'Return only valid JSON arrays. No prose or markdown.',
        messages: [{ role: 'user', content: prompt }],
      })
      const first = response.content[0]
      if (!first || first.type !== 'text') {
        this.appendUsageLog({
          timestamp: new Date().toISOString(),
          provider: this.config.provider,
          model: this.config.model,
          label,
          usedAi: false,
          fallbackReason: 'invalid_response',
          message: 'First content block was missing or not text.',
          durationMs: Date.now() - started,
          itemCount: fallback.length,
          usage: {
            inputTokens: response.usage?.input_tokens,
            outputTokens: response.usage?.output_tokens,
          },
        })
        process.stdout.write(`[llm:${label}] fallback(invalid_response)\n`)
        return fallback
      }

      const jsonMatch = first.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        this.appendUsageLog({
          timestamp: new Date().toISOString(),
          provider: this.config.provider,
          model: this.config.model,
          label,
          usedAi: false,
          fallbackReason: 'json_not_found',
          message: 'No JSON array found in model response.',
          durationMs: Date.now() - started,
          itemCount: fallback.length,
          usage: {
            inputTokens: response.usage?.input_tokens,
            outputTokens: response.usage?.output_tokens,
          },
        })
        process.stdout.write(`[llm:${label}] fallback(json_not_found)\n`)
        return fallback
      }

      const parsed = JSON.parse(jsonMatch[0]) as unknown
      if (!Array.isArray(parsed)) {
        this.appendUsageLog({
          timestamp: new Date().toISOString(),
          provider: this.config.provider,
          model: this.config.model,
          label,
          usedAi: false,
          fallbackReason: 'json_not_array',
          message: 'Parsed JSON was not an array.',
          durationMs: Date.now() - started,
          itemCount: fallback.length,
          usage: {
            inputTokens: response.usage?.input_tokens,
            outputTokens: response.usage?.output_tokens,
          },
        })
        process.stdout.write(`[llm:${label}] fallback(json_not_array)\n`)
        return fallback
      }

      this.appendUsageLog({
        timestamp: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        label,
        usedAi: true,
        fallbackReason: null,
        message: null,
        durationMs: Date.now() - started,
        itemCount: parsed.length,
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
        },
      })
      process.stdout.write(`[llm:${label}] ai(items=${parsed.length})\n`)
      return parsed as T[]
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const reason = this.classifyError(message)
      this.appendUsageLog({
        timestamp: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        label,
        usedAi: false,
        fallbackReason: reason,
        message,
        durationMs: Date.now() - started,
        itemCount: fallback.length,
      })
      process.stdout.write(`[llm:${label}] fallback(${reason})\n`)
      return fallback
    }
  }

  async generateText(prompt: string, fallback: string, meta: GenerationMeta = {}): Promise<string> {
    const label = meta.label || 'unnamed-text'
    const maxTokens = meta.maxTokens ?? 2200
    const started = Date.now()

    if (!this.client) {
      this.appendUsageLog({
        timestamp: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        label,
        usedAi: false,
        fallbackReason: 'no_client',
        message: 'AI client not configured; using fallback text.',
        durationMs: Date.now() - started,
        itemCount: 1,
      })
      process.stdout.write(`[llm:${label}] fallback(no_client)\n`)
      return fallback
    }

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('\n')
        .trim()

      if (!text) {
        this.appendUsageLog({
          timestamp: new Date().toISOString(),
          provider: this.config.provider,
          model: this.config.model,
          label,
          usedAi: false,
          fallbackReason: 'invalid_response',
          message: 'No text content in model response.',
          durationMs: Date.now() - started,
          itemCount: 1,
          usage: {
            inputTokens: response.usage?.input_tokens,
            outputTokens: response.usage?.output_tokens,
          },
        })
        process.stdout.write(`[llm:${label}] fallback(invalid_response)\n`)
        return fallback
      }

      this.appendUsageLog({
        timestamp: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        label,
        usedAi: true,
        fallbackReason: null,
        message: null,
        durationMs: Date.now() - started,
        itemCount: 1,
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
        },
      })
      process.stdout.write(`[llm:${label}] ai(text)\n`)
      return text
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const reason = this.classifyError(message)
      this.appendUsageLog({
        timestamp: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        label,
        usedAi: false,
        fallbackReason: reason,
        message,
        durationMs: Date.now() - started,
        itemCount: 1,
      })
      process.stdout.write(`[llm:${label}] fallback(${reason})\n`)
      return fallback
    }
  }
}
