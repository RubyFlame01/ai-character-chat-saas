export const siteConfig = {
  name: "LustTalk AI",
  description:
    "A premium 18+ AI sex chat platform for erotic roleplay, flirty fantasy conversations, and adult AI character experiences.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/images/banners/og-home.svg",
};

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  aiProvider: process.env.AI_PROVIDER ?? "mock",
  // Venice AI — primary chat provider (uncensored roleplay models)
  // Falls back to OpenRouter automatically when Venice fails.
  veniceBaseUrl: "https://api.venice.ai/api/v1",
  veniceFreeModel: process.env.VENICE_FREE_MODEL ?? "venice-uncensored-role-play",
  venicePremiumModel: process.env.VENICE_PREMIUM_MODEL ?? "venice-uncensored-1-2",
  // OpenRouter — fallback chat provider when Venice is unavailable / out of credits
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterBaseUrl: (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, ""),
  openRouterFreeModel:
    process.env.OPENROUTER_FREE_MODEL ?? "openai/gpt-oss-120b:free",
  openRouterModel:
    process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free",
  openRouterPremiumModel: process.env.OPENROUTER_PREMIUM_MODEL ?? "x-ai/grok-4.3",
  openRouterFallbackModel:
    process.env.OPENROUTER_FALLBACK_MODEL ?? "nousresearch/hermes-3-llama-3.1-405b:free",
  openRouterFallbackModels:
    process.env.OPENROUTER_FALLBACK_MODELS?.split(",")
      .map((model) => model.trim())
      .filter(Boolean) ?? [
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "meta-llama/llama-3.3-70b-instruct:free",
    ],
  openRouterTimeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS ?? 30000),
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  ccbillAccount: process.env.CCBILL_ACCOUNT,
  ccbillSubaccount: process.env.CCBILL_SUBACCOUNT,
  ccbillFlexFormId: process.env.CCBILL_FLEXFORM_ID,
  ccbillSalt: process.env.CCBILL_SALT,
  ccbillCurrencyCode: process.env.CCBILL_CURRENCY_CODE ?? "840",
  ccbillWebhookSecret: process.env.CCBILL_WEBHOOK_SECRET,
  paddleApiKey: process.env.PADDLE_API_KEY,
  paddleClientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
  paddleEnvironment: (process.env.PADDLE_ENVIRONMENT ?? "production") as "sandbox" | "production",
  // Local ComfyUI for portrait generation (character builder). Point at a hosted GPU later.
  comfyuiUrl: (process.env.COMFYUI_URL ?? "http://127.0.0.1:8000").replace(/\/$/, ""),
  imageCreditCost: Number(process.env.IMAGE_CREDIT_COST ?? 10),
  // Replicate — kept for portrait generation fallback only.
  replicateApiKey: process.env.REPLICATE_API_TOKEN,
  // Venice AI — uncensored cloud image generation for in-chat photos (lustify-v8, $0.01/image).
  veniceApiKey: process.env.VENICE_API_KEY,
  // Cost in credits for character creation (portrait generation).
  characterCreditCost: Number(process.env.CHARACTER_CREDIT_COST ?? 20),
  // Extra credits charged when a character sends a photo in chat.
  chatImageCreditCost: Number(process.env.CHAT_IMAGE_CREDIT_COST ?? 5),
};

export function hasComfyEnv() {
  return Boolean(env.comfyuiUrl);
}

export function hasReplicateEnv() {
  return Boolean(env.replicateApiKey);
}

export function hasVeniceEnv() {
  return Boolean(env.veniceApiKey);
}

export function hasCcbillEnv() {
  return Boolean(env.ccbillAccount && env.ccbillSubaccount && env.ccbillFlexFormId && env.ccbillSalt);
}

export function hasPaddleEnv() {
  return Boolean(env.paddleApiKey && env.paddleClientToken);
}

export function hasSupabaseBrowserEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseAdminEnv() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
