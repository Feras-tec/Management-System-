export const serviceImageMap = {
  "car-detailing": "/images/services/car-detailing.jpg",
  "interior-cleaning": "/images/services/interior-cleaning.jpg",
  "car-wrapping": "/images/services/car-wrapping.jpg",
  "window-tinting": "/images/services/window-tinting.jpg",
  "underbody-protection": "/images/services/underbody-protection.webp",
  "rust-protection": "/images/services/rust-protection.webp",
} as const;

export function getServiceImage(slug: string, imageUrl?: string | null) {
  return (
    imageUrl || serviceImageMap[slug as keyof typeof serviceImageMap] || null
  );
}
