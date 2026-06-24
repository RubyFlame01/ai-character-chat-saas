import type { Character, ChatMessage } from "@/types/domain";

export type AiChatInput = {
  character: Character;
  personaInstructions: string;
  userMessage: string;
  history: ChatMessage[];
  userName?: string | null;
  modelTier?: "free" | "standard" | "premium";
  action?: "message" | "regenerate" | "continue";
  memory?: string | null;
};

export type AiChatResult = {
  content: string;
  tokenCount: number;
  provider: string;
  // 3-4 short first-person next-move suggestions shown to the user as quick-reply chips.
  suggestions?: string[];
};

export interface AiProvider {
  name: string;
  generateReply(input: AiChatInput): Promise<AiChatResult>;
}
