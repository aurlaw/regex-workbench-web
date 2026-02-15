import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20250929";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are a regex expert. Given highlighted text and its surrounding context, generate a regular expression pattern that matches the highlighted text.

Rules:
- Consider the surrounding context to infer the pattern's purpose
- If the user provides an intent, use it to disambiguate what the pattern should match
- Prefer precise patterns over overly greedy ones
- Use named groups where it improves readability
- Return ONLY valid JSON with no markdown fences, backticks, or preamble
- JSON shape: { "pattern": string, "explanation": string, "flags": { "global": boolean, "caseInsensitive": boolean, "multiline": boolean, "dotAll": boolean, "unicode": boolean }, "confidence": "high" | "medium" | "low" }
- The explanation should describe what each part of the regex does in plain English`;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Validate Supabase JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  // Parse request body
  let body: {
    highlightedText?: string;
    surroundingContext?: string;
    intent?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { highlightedText, surroundingContext, intent } = body;

  if (!highlightedText || !surroundingContext) {
    return jsonResponse(
      { error: "highlightedText and surroundingContext are required" },
      400,
    );
  }

  // Call Anthropic API
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    return jsonResponse({ error: "Anthropic API key not configured" }, 500);
  }

  let userMessage = `Highlighted text:\n"""\n${highlightedText}\n"""\n\nSurrounding context:\n"""\n${surroundingContext}\n"""`;
  if (intent) {
    userMessage += `\n\nUser intent: ${intent}`;
  }

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (err) {
    return jsonResponse(
      { error: "Failed to reach Anthropic API", details: String(err) },
      502,
    );
  }

  if (!anthropicResponse.ok) {
    const status = anthropicResponse.status;
    let details: string;
    try {
      const errBody = await anthropicResponse.json();
      details = errBody.error?.message ?? JSON.stringify(errBody);
    } catch {
      details = await anthropicResponse.text();
    }

    if (status === 429) {
      return jsonResponse(
        { error: "Rate limited by Anthropic API", details },
        429,
      );
    }
    if (status === 529) {
      return jsonResponse(
        { error: "Anthropic API is overloaded", details },
        529,
      );
    }
    return jsonResponse(
      { error: "Anthropic API error", details },
      status >= 500 ? 502 : status,
    );
  }

  // Parse Anthropic response
  let data: { content: { type: string; text: string }[] };
  try {
    data = await anthropicResponse.json();
  } catch {
    return jsonResponse({ error: "Invalid response from Anthropic API" }, 502);
  }

  const rawText = data.content?.[0]?.text;
  if (!rawText) {
    return jsonResponse(
      { error: "Empty response from Anthropic API" },
      502,
    );
  }

  let result: unknown;
  try {
    result = JSON.parse(stripCodeFences(rawText));
  } catch {
    return jsonResponse(
      { error: "Failed to parse AI response as JSON", raw: rawText },
      502,
    );
  }

  return jsonResponse(result);
});
