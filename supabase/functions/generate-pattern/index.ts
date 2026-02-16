import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;
const RATE_LIMIT = 50;
const RATE_WINDOW_HOURS = 24;

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

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function rateLimitHeaders(
  remaining: number,
  resetAt: string,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": resetAt,
  };
}

/** Decode the JWT payload without verification.
 *  The Supabase edge runtime already verifies the token before
 *  the function is invoked, so we only need to extract claims. */
function decodeJwtPayload(
  token: string,
): { sub: string; exp: number; [k: string]: unknown } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Extract user from JWT
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const jwtPayload = decodeJwtPayload(token);

  if (!jwtPayload) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  // Check token expiry
  if (jwtPayload.exp && jwtPayload.exp < Math.floor(Date.now() / 1000)) {
    return jsonResponse({ error: "Token has expired" }, 401);
  }

  const userId = jwtPayload.sub;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Use service role client for all database operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // --- Rate limit check ---
  const windowStart = new Date(
    Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data: usageData, error: usageError } = await supabaseAdmin
    .from("ai_usage")
    .select("id, created_at")
    .eq("user_id", userId)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  if (usageError) {
    return jsonResponse(
      { error: "Failed to check rate limit", details: usageError.message },
      500,
    );
  }

  const usageCount = usageData?.length ?? 0;
  const remaining = RATE_LIMIT - usageCount;

  // Calculate reset time from the earliest record in the window
  const resetAt =
    usageData && usageData.length > 0
      ? new Date(
          new Date(usageData[0].created_at).getTime() +
            RATE_WINDOW_HOURS * 60 * 60 * 1000,
        ).toISOString()
      : new Date(
          Date.now() + RATE_WINDOW_HOURS * 60 * 60 * 1000,
        ).toISOString();

  if (remaining <= 0) {
    return jsonResponse(
      {
        error: "Rate limit exceeded",
        message: `You have exceeded ${RATE_LIMIT} requests in the last ${RATE_WINDOW_HOURS} hours.`,
        resetAt,
      },
      429,
      rateLimitHeaders(0, resetAt),
    );
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
  let data: {
    content: { type: string; text: string }[];
    usage?: { input_tokens: number; output_tokens: number };
  };
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

  // Record usage after successful API call
  const tokensUsed =
    (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

  await supabaseAdmin.from("ai_usage").insert({
    user_id: userId,
    tokens_used: tokensUsed,
  });

  let result: unknown;
  try {
    result = JSON.parse(stripCodeFences(rawText));
  } catch {
    return jsonResponse(
      { error: "Failed to parse AI response as JSON", raw: rawText },
      502,
    );
  }

  // Recalculate remaining after this request
  const updatedResetAt =
    usageData && usageData.length > 0
      ? new Date(
          new Date(usageData[0].created_at).getTime() +
            RATE_WINDOW_HOURS * 60 * 60 * 1000,
        ).toISOString()
      : new Date(
          Date.now() + RATE_WINDOW_HOURS * 60 * 60 * 1000,
        ).toISOString();

  return jsonResponse(result, 200, rateLimitHeaders(remaining - 1, updatedResetAt));
});
