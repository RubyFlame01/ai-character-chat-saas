import { env } from "@/lib/config";
import { mockAiProvider } from "@/lib/ai/mock";
import { openRouterAiProvider } from "@/lib/ai/openrouter";
import type { AiProvider } from "@/lib/ai/types";

export function getAiProvider(): AiProvider {
  switch (env.aiProvider) {
    case "openrouter":
      return openRouterAiProvider;
    case "mock":
    default:
      return mockAiProvider;
  }
}
