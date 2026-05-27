/**
 * Free AI using Groq (llama-3.1-8b-instant) — no credit card needed.
 * Sign up at https://console.groq.com to get a free API key.
 *
 * Key is read fresh on every call so runtime updates via Settings work.
 */
import Groq from "groq-sdk";

function getGroqKey(): string {
  return process.env.GROQ_API_KEY || "";
}

export function hasGroqKey(): boolean {
  const k = getGroqKey();
  return k.length > 0 && k !== "your_groq_api_key_here";
}

export async function callFreeAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<string> {
  const key = getGroqKey();
  if (!key || key === "your_groq_api_key_here") throw new Error("NO_FREE_KEY");

  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function callFreeAIJson(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 3500
): Promise<string> {
  const key = getGroqKey();
  if (!key || key === "your_groq_api_key_here") throw new Error("NO_FREE_KEY");

  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    temperature: 0.6,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message?.content?.trim() || "{}";
}
