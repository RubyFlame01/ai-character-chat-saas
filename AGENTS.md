<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# i18n rule

UI copy lives in `src/lib/dictionaries/` — one file per locale, all implementing the `Dictionary` type in `types.ts`. English (`en.ts`) is the source of truth. When adding or changing any user-facing string: add the key to `types.ts`, write polished English in `en.ts`, then translate it into ALL other locale files (tr, es, fr, de, it, pt, nl, pl, ru, ar, hi, id, ja, ko, zh). TypeScript fails the build if any locale is missing a key — never silence this by spreading `en`.
