#!/usr/bin/env python3
"""Queue static externally-authored character prompts to the local ComfyUI API."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import secrets
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROMPT_FILE = ROOT / "datasets" / "comfy_prompts" / "character_prompts_for_external_rewrite.txt"
CATALOG_FILE = ROOT / "datasets" / "character_catalog" / "image-prompts.json"
QUEUE_LOG = ROOT / "datasets" / "comfy_prompts" / "queued_jobs.json"
PREVIEW_LOG = ROOT / "datasets" / "comfy_prompts" / "queued_prompt_preview.json"
HEADER = re.compile(
    r"^##\s+(?P<slug>[a-z0-9-]+)\s+\|\s+(?P<name>[^|]+?)\s+\|\s+"
    r"(?P<mode>realistic|anime)\s+\|\s+(?P<gender>female|male)\s+\|\s+(?P<category>[a-z0-9-]+)\s*$"
)
NUMBERED_HEADER = re.compile(r"^(?P<number>\d+)\.\s+(?P<name>.+?)\s*$")
NEGATIVE_BASE = (
    "minor, child, teen, underage, youthful childlike appearance, explicit nudity, "
    "(bare breasts:1.6), (exposed nipples:1.7), (visible nipples:1.6), (topless:1.6), (naked breasts:1.6), (areola:1.5), "
    "(bare nipples:1.4), nude breasts, no top, removed top, slipped top exposing breast, open shirt bare chest, "
    "uncovered breasts, fully undressed, open robe with bare chest, "
    "exposed genitals, visible vulva, visible labia, exposed pubic area, pubic hair, "
    "pornographic sex act, penetration, cum, violence, deformed anatomy, extra fingers, "
    "bad hands, bad face, cross-eye, low resolution, blurry, watermark, text, logo, jpeg artifacts, "
    "duplicate body, mutated limbs, sci-fi, cyberpunk, futuristic setting, fantasy costume"
)
NEGATIVE_REALISTIC = NEGATIVE_BASE + ", anime, manga, cartoon, illustration, cel shading, chibi, Ghibli"
NEGATIVE_ANIME = (
    NEGATIVE_BASE
    + ", photorealistic photo, real person, live action, 3d render, CGI, doll, plastic skin, "
    "Ghibli, Studio Ghibli, chibi, childish proportions, flat cartoon, western cartoon"
)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def sanitize_for_catalog(prompt: str) -> str:
    replacements = {
        r"\bNSFW\b": "sensual non-explicit adult promo portrait",
        r"\bmicro bikini top that is slipping off\b": "secure lined bikini top with opaque cups",
        r"\bmicro bikini\b": "secure lined bikini",
        r"\btiny ([a-z ]*?)bikini\b": r"secure lined \1bikini",
        r"breasts barely contained in": "full bust securely covered by",
        r"breasts barely held by": "full bust securely covered by",
        r"breasts spilling out of": "full bust securely covered by",
        r"spilling from": "securely framed by",
        r"slipping off": "securely fitted",
        r"half open": "styled with a secure inner bra",
        r"pulled down": "properly fitted",
        r"pulled low": "properly fitted",
        r"top only": "lined fitted top",
        r"nothing underneath": "with a secure opaque bikini top underneath",
        r"schoolgirl uniform": "adult fashion uniform-inspired outfit",
        r"classroom setting": "private studio setting",
        r"\bsheer\b": "lined semi-sheer",
        r"\btransparent\b": "translucent outer layer over opaque lining",
        r"\bsee-through\b": "translucent outer layer over opaque lining",
        r"\bteddy\b": "lined bodysuit with opaque cups",
        r"\bharness\b": "structured leather bra-style top with opaque cups",
        r"open pink transparent kimono, nothing underneath": (
            "open pink robe over a secure matching lined bikini top"
        ),
        r"white fur coat that is open revealing only a tiny white thong": (
            "open white fur coat over a secure white bandeau top and fitted bikini bottoms"
        ),
        r"\bthong\b": "bikini bottoms",
    }
    for pattern, replacement in replacements.items():
        prompt = re.sub(pattern, replacement, prompt, flags=re.IGNORECASE)
    return (
        f"{prompt.strip().rstrip(',')}, adult-only non-explicit catalog portrait, "
        "nipples, areola, and genitals fully covered, opaque lined cups or secure bikini/bra coverage, "
        "no wardrobe malfunction"
    )


def parse_hash_prompts(source: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    lines: list[str] = []

    def finish() -> None:
        nonlocal current, lines
        if current is None:
            return
        prompt = " ".join(line.strip() for line in lines if line.strip())
        if not prompt:
            raise ValueError(f"Prompt is empty for {current['slug']}.")
        if "adult" not in prompt.lower():
            raise ValueError(f"Prompt must explicitly describe an adult character: {current['slug']}.")
        records.append({**current, "positive_prompt": prompt})
        current = None
        lines = []

    for line_number, line in enumerate(source.read_text(encoding="utf-8").splitlines(), start=1):
        if line.startswith("## "):
            finish()
            match = HEADER.fullmatch(line)
            if not match:
                raise ValueError(f"Invalid header at line {line_number}: {line}")
            current = {key: value.strip() for key, value in match.groupdict().items()}
        elif current is not None and line.strip() and not line.startswith("#"):
            lines.append(line)

    finish()
    return records


def parse_numbered_prompts(source: Path, limit: int | None = None) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    lines: list[str] = []

    def finish() -> None:
        nonlocal current, lines
        if current is None:
            return
        prompt = " ".join(line.strip() for line in lines if line.strip())
        if not prompt:
            raise ValueError(f"Prompt is empty for {current['slug']}.")
        if "adult" not in prompt.lower() and not re.search(r"\b(?:2[1-9]|[3-9]\d)-year-old\b", prompt):
            raise ValueError(f"Prompt must explicitly describe an adult character: {current['slug']}.")
        records.append({**current, "positive_prompt": sanitize_for_catalog(prompt)})
        current = None
        lines = []

    for line in source.read_text(encoding="utf-8").splitlines():
        match = NUMBERED_HEADER.fullmatch(line)
        if match:
            finish()
            if limit is not None and len(records) >= limit:
                break
            number = int(match["number"])
            name = match["name"].strip()
            current = {
                "slug": f"external-{number:03d}-{slugify(name)}",
                "name": name,
                "mode": "anime" if "anime" in name.lower() else "realistic",
                "gender": "female",
                "category": "external",
            }
        elif current is not None and line.strip() and not line.startswith("#"):
            lines.append(line)

    finish()
    return records


def parse_catalog_prompts(source: Path, limit: int | None = None) -> list[dict[str, str]]:
    payload = json.loads(source.read_text(encoding="utf-8"))
    records: list[dict[str, str]] = []
    for item in payload:
        prompt = str(item.get("prompt", "")).strip()
        slug = str(item.get("slug", "")).strip()
        name = str(item.get("name", "")).strip()
        if not prompt or not slug or not name:
            raise ValueError(f"Invalid catalog prompt record: {item!r}")
        records.append(
            {
                "slug": slug,
                "name": name,
                "mode": str(item.get("mode", "realistic")),
                "gender": str(item.get("gender", "female")),
                "category": str(item.get("category", "external")),
                "positive_prompt": sanitize_for_catalog(prompt),
            }
        )
        if limit is not None and len(records) >= limit:
            break
    return records


def parse_prompts(source: Path, limit: int | None = None, skip: int = 0) -> list[dict[str, str]]:
    if source.suffix.lower() == ".json":
        return parse_catalog_prompts(source, limit)
    text = source.read_text(encoding="utf-8")
    if any(line.startswith("## ") for line in text.splitlines()):
        records = parse_hash_prompts(source)[skip:]
        return records[:limit] if limit is not None else records
    return parse_numbered_prompts(source, limit)


def seed_for(slug: str, variation: int) -> int:
    digest = hashlib.sha256(f"{variation}:{slug}".encode("utf-8")).hexdigest()
    return int(digest[:12], 16) % 1_000_000_000_000


def dimensions_for(profile: str) -> tuple[int, int, int]:
    if profile == "preview":
        return 512, 512, 4
    if profile == "full":
        return 1024, 1024, 9
    return 832, 832, 6


def workflow(record: dict[str, str], variation: int, profile: str) -> dict[str, Any]:
    width, height, steps = dimensions_for(profile)
    negative = NEGATIVE_ANIME if record["mode"] == "anime" else NEGATIVE_REALISTIC
    if record.get("gender") == "male":
        # Stop the model from drawing female anatomy on male characters.
        negative += ", (breasts:1.6), (cleavage:1.5), (female body:1.5), woman, feminine chest, makeup"
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "z_image_turbo-Q5_K_M.gguf"}},
        "2": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.0}},
        "3": {
            "class_type": "CLIPLoaderGGUF",
            "inputs": {"clip_name": "Qwen3-4B-Q4_K_M.gguf", "type": "qwen_image"},
        },
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": record["positive_prompt"]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": negative}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "7": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["2", 0],
                "positive": ["4", 0],
                "negative": ["5", 0],
                "latent_image": ["6", 0],
                "seed": seed_for(record["slug"], variation),
                "steps": steps,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
            },
        },
        "8": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["8", 0]}},
        "10": {
            "class_type": "SaveImage",
            "inputs": {"images": ["9", 0], "filename_prefix": f"lusttalk/{record['mode']}/{record['slug']}"},
        },
    }


def submit(server: str, prompt: dict[str, Any]) -> dict[str, Any]:
    request = urllib.request.Request(
        f"{server.rstrip('/')}/prompt",
        data=json.dumps({"prompt": prompt}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--skip", type=int, default=0, help="Skip the first N prompts (resume support).")
    parser.add_argument("--server", default="http://127.0.0.1:8000")
    parser.add_argument("--source", type=Path, default=PROMPT_FILE)
    parser.add_argument("--catalog", action="store_true", help="Queue from the combined generated image prompt catalog.")
    parser.add_argument("--profile", choices=["preview", "balanced", "full"], default="balanced")
    parser.add_argument("--full-quality", action="store_true")
    args = parser.parse_args()
    profile = "full" if args.full_quality else args.profile

    source = CATALOG_FILE if args.catalog else args.source
    records = parse_prompts(source, args.limit, args.skip)
    variation = secrets.randbits(48)
    jobs = []
    for record in records:
        result = submit(args.server, workflow(record, variation, profile))
        jobs.append({"slug": record["slug"], "prompt_id": result.get("prompt_id")})

    QUEUE_LOG.write_text(json.dumps({"variation": variation, "jobs": jobs}, indent=2), encoding="utf-8")
    PREVIEW_LOG.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    width, height, steps = dimensions_for(profile)
    print(f"Queued {len(jobs)} static prompts with profile {profile} ({width}x{height} / {steps} steps).")
    print(", ".join(job["slug"] for job in jobs))


if __name__ == "__main__":
    main()
