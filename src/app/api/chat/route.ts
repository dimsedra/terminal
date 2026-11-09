import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  UIMessage,
} from "ai";
import { getAiModel } from "@/config/ai";
import { buildAiSystemPrompt } from "@/data/aiContext";
import type { SupportedLanguage } from "@/content/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: UIMessage[] = body.messages || [];
    const lang: SupportedLanguage = body.lang === "id" ? "id" : "en";

    // Check if Google API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env.local. Please copy .env.example to .env.local and add your Gemini API key from Google AI Studio (https://aistudio.google.com/).",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildAiSystemPrompt(lang);

    const result = streamText({
      model: getAiModel(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error: any) {
    console.error("API /api/chat error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Internal server error occurred while contacting AI model.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
