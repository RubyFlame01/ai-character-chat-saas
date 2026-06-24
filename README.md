# LustTalk AI - 18+ AI Sex Chat SaaS

Responsive web-based 18+ AI sex chat platform built with Next.js App Router, TypeScript, Tailwind CSS, Supabase/PostgreSQL, server-side AI providers, credits, admin tools, and generated character content.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase Auth/PostgreSQL/RLS
- Server-side AI provider abstraction
- Payment provider abstraction
- Mock AI and mock checkout providers first

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run generate:content
npm run catalog:build
npm run seed
```

## Generated content

`npm run generate:content` creates:

- 60 realistic female characters and 10 realistic male characters
- 30 semi-realistic anime female characters and 10 semi-realistic anime male characters
- character metadata JSON
- category and tag datasets
- programmatic image assets under `public/images/characters`, `public/images/anime`, `public/images/banners`, and `public/images/ui`

If `IMAGEN_ENDPOINT` and `IMAGEN_API_KEY` are configured, the script will call the Imagen-compatible endpoint. Without those keys, it produces local generated SVG assets so the app remains runnable.

## Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Copy `.env.example` to `.env.local` and fill the Supabase values.
4. Run `npm run seed` to seed categories and characters.

Set `SAMPLE_USER_ID` to an existing Supabase Auth user UUID before running `npm run seed` if you want sample conversations/messages inserted.

## External character prompts

Use `datasets/comfy_prompts/character_prompts_for_external_rewrite.txt` as the handoff template for externally authored character image prompts. The ComfyUI import and queue tooling will be rebuilt after the completed prompt file is returned.

`npm run catalog:build` reads both external TXT files without rewriting their image prompts, builds the public character catalog, creates temporary portrait placeholders for newly imported characters, and writes server-side AI persona instructions. Apply `supabase/migrations/002_character_personas.sql` before reseeding an existing Supabase project.

## Production notes

- Do not expose service role keys to the browser.
- Keep AI and payment provider calls in server routes only.
- Replace mock providers by adding implementations behind `src/lib/ai` and `src/lib/payments`.
- Review legal copy, refund rules, provider retention policies, and content moderation before launch.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
