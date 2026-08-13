export const serviceImageMap = {
  "car-detailing": "/images/services/car-detailing.jpg",
  "interior-cleaning": "/images/services/interior-cleaning.jpg",
  "car-wrapping": "/images/services/car-wrapping.webp",
  "window-tinting": "/images/services/window-tinting.jpg",
  "underbody-protection": "/images/services/underbody-protection.webp",
  "rust-protection": "/images/services/rust-protection.webp",
} as const;

const servicePreviewImageMap = {
  "car-detailing": "/images/services/car-detailing-400.webp",
  "interior-cleaning": "/images/services/interior-cleaning-400.webp",
  "car-wrapping": "/images/services/car-wrapping-400.webp",
} as const;

const servicePreviewImageSrcSetMap = {
  "car-detailing":
    "/images/services/car-detailing-400.webp 400w, /images/services/car-detailing-640.webp 640w, /images/services/car-detailing.jpg 840w",
  "interior-cleaning":
    "/images/services/interior-cleaning-400.webp 400w, /images/services/interior-cleaning-640.webp 640w, /images/services/interior-cleaning.jpg 840w",
  "car-wrapping":
    "/images/services/car-wrapping-400.webp 400w, /images/services/car-wrapping-640.webp 640w, /images/services/car-wrapping.webp 840w",
} as const;

export function getServiceImage(slug: string, imageUrl?: string | null) {
  return (
    imageUrl || serviceImageMap[slug as keyof typeof serviceImageMap] || null
  );
}

/**
 * Local service artwork can offer smaller sources for the Home preview cards.
 * Uploaded backend images intentionally retain their original URL as we do not
 * control their available derivatives.
 */
export function getServicePreviewImage(
  slug: string,
  imageUrl?: string | null,
) {
  if (imageUrl) return imageUrl;

  return (
    servicePreviewImageMap[slug as keyof typeof servicePreviewImageMap] ??
    getServiceImage(slug)
  );
}

export function getServicePreviewImageSrcSet(
  slug: string,
  imageUrl?: string | null,
) {
  if (imageUrl) return undefined;

  return servicePreviewImageSrcSetMap[
    slug as keyof typeof servicePreviewImageSrcSetMap
  ];
}
