import type { AiProvider } from "@/lib/ai/types";

export const mockAiProvider: AiProvider = {
  name: "mock",
  async generateReply({ character, userMessage }) {
    const content = `${character.name} leans in with a ${character.mood} smile. "I heard you say: ${userMessage.trim()}. I can turn that into an adult fantasy scene with teasing tension, consent, and exactly the mood you want. Tell me where you want my hands, my voice, or my attention to go first."`;

    return {
      content,
      tokenCount: Math.ceil(content.length / 4),
      provider: "mock",
      suggestions: [
        "Move closer and lower your voice",
        "Tease them and make them wait",
        "Ask what they are really thinking",
      ],
    };
  },
};
