"use client";

import Image from "next/image";
import { useState } from "react";

export function CharacterGallery({
  mainImage,
  gallery,
  name,
}: {
  mainImage: string;
  gallery: string[];
  name: string;
}) {
  const [active, setActive] = useState(mainImage);

  return (
    <>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <Image
          key={active}
          src={active}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 430px, 100vw"
          className="object-cover transition-opacity duration-300"
        />
      </div>
      {gallery.length > 1 ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {gallery.map((image) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(image)}
              className={`relative aspect-square overflow-hidden rounded-xl border bg-zinc-900 transition duration-200 hover:scale-[1.03] ${
                active === image
                  ? "border-fuchsia-400 ring-2 ring-fuchsia-400/40"
                  : "border-white/10"
              }`}
            >
              <Image
                src={image}
                alt={name}
                fill
                sizes="(min-width: 1024px) 140px, 33vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
