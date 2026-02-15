# generate-pattern

Supabase Edge Function that proxies AI-powered regex pattern generation requests to the Anthropic Claude API.

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (starts with `sk-ant-`) |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided automatically by the Supabase runtime.

## Set the secret

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## Deploy

```bash
supabase functions deploy generate-pattern
```

## Test locally

```bash
supabase functions serve 
```

Then call the function:

```bash
curl -X POST http://localhost:54321/functions/v1/generate-pattern \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "highlightedText": "2024-01-15",
    "surroundingContext": "The event is scheduled for 2024-01-15 at 3pm.",
    "intent": "match dates in YYYY-MM-DD format"
  }'
```

## Request

```json
{
  "highlightedText": "string (required)",
  "surroundingContext": "string (required)",
  "intent": "string (optional)"
}
```

## Response

```json
{
  "pattern": "\\d{4}-\\d{2}-\\d{2}",
  "explanation": "Matches a date in YYYY-MM-DD format...",
  "flags": {
    "global": true,
    "caseInsensitive": false,
    "multiline": false,
    "dotAll": false,
    "unicode": false
  },
  "confidence": "high"
}
```
