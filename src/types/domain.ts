export type CharacterMode = "realistic" | "anime";

export type CharacterGender = "female" | "male";

export type SubscriptionTier = "free" | "silver" | "gold" | "platinum";

export type CharacterCategory =
  | "romance"
  | "companion"
  | "fantasy"
  | "slice-of-life"
  | "mystery"
  | "anime";

export type Character = {
  id: string;
  slug: string;
  name: string;
  age: number;
  gender: CharacterGender;
  mode: CharacterMode;
  category: CharacterCategory;
  shortDescription: string;
  backstory: string;
  relationship: string;
  scenario: string;
  occupation: string;
  imagePromptKey: string;
  localizations?: Partial<Record<string, CharacterLocalizedContent>>;
  personality: string;
  greeting: string;
  tags: string[];
  imagePath: string;
  heroImagePath?: string;
  gallery?: string[];
  featured: boolean;
  visible: boolean;
  mood: string;
  creditCost: number;
};

export type CharacterLocalizedContent = {
  shortDescription: string;
  backstory: string;
  relationship: string;
  scenario: string;
  occupation: string;
  personality: string;
  greeting: string;
};

export type Category = {
  id: string;
  slug: CharacterCategory;
  name: string;
  description: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type PricingPlan = {
  id: SubscriptionTier;
  name: string;
  price: string;
  originalPrice?: string;
  discountLabel?: string;
  credits: number;
  tierLabel: string;
  description: string;
  features: string[];
  modelAccess: string;
  memory: string;
  badge?: string;
  highlighted?: boolean;
};
