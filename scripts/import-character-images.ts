import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Character } from "../src/types/domain";

// Imports generated ComfyUI variants into the project and points the catalog
// at them. For every character that has all three variants rendered:
//   v1 → avatar (imagePath), v2 → hero (heroImagePath), v3 → gallery
// PNGs are converted to JPEG (sips, macOS) to keep the repo light, and the
// character's previous image file is deleted. Characters without rendered
// variants keep their old image untouched — re-run after the next batch.
//
//   npx tsx scripts/import-character-images.ts

const root = process.cwd();
const comfyOutput = "/Volumes/TolgaSSD/ComfyUI/output/lusttalk";
const catalogPath = path.join(root, "public", "generated", "characters.json");
const targetRoot = path.join(root, "public", "images", "characters");

function findVariant(slug: string, mode: string, variant: number): string | null {
  const dir = path.join(comfyOutput, mode);
  if (!existsSync(dir)) return null;
  const prefix = `${slug}--v${variant}_`;
  const candidates = readdirSync(dir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".png"))
    .sort();
  // Highest counter = most recent render of this variant.
  return candidates.length > 0 ? path.join(dir, candidates[candidates.length - 1]) : null;
}

function convertToJpeg(source: string, target: string) {
  mkdirSync(path.dirname(target), { recursive: true });
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", source, "--out", target], {
    stdio: "ignore",
  });
}

function main() {
  const characters = JSON.parse(readFileSync(catalogPath, "utf-8")) as Character[];
  let imported = 0;
  let removedOld = 0;

  const next = characters.map((character) => {
    const sources = [1, 2, 3].map((variant) => findVariant(character.slug, character.mode, variant));
    if (sources.some((source) => !source)) return character;

    const dir = path.join(targetRoot, character.slug);
    const names = ["avatar.jpg", "hero.jpg", "gallery-1.jpg"];
    names.forEach((name, index) => convertToJpeg(sources[index]!, path.join(dir, name)));

    const oldImage = path.join(root, "public", character.imagePath.replace(/^\//, ""));
    if (existsSync(oldImage) && !oldImage.startsWith(dir + path.sep)) {
      rmSync(oldImage);
      removedOld += 1;
    }

    imported += 1;
    return {
      ...character,
      imagePath: `/images/characters/${character.slug}/avatar.jpg`,
      heroImagePath: `/images/characters/${character.slug}/hero.jpg`,
      gallery: [
        `/images/characters/${character.slug}/avatar.jpg`,
        `/images/characters/${character.slug}/hero.jpg`,
        `/images/characters/${character.slug}/gallery-1.jpg`,
      ],
    };
  });

  writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`imported ${imported} characters (avatar+hero+gallery), removed ${removedOld} old images`);
  console.log(`characters still on old images: ${characters.length - imported}`);
}

main();
