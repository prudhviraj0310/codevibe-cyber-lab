import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function callAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

export function isConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
