import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { demoCharacters } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const staticRoutes = [
    "",
    "/characters",
    "/pricing",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/content-policy",
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const characterRoutes = demoCharacters.map((character) => ({
    url: `${base}/characters/${character.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...characterRoutes];
}
