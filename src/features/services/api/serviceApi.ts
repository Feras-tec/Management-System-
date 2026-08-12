export interface PublicService {
  id: string;
  slug: string;
  nameDe: string;
  nameEn: string;
  shortDescriptionDe: string;
  shortDescriptionEn: string;
  descriptionDe: string;
  descriptionEn: string;
  priceFrom: number;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function publicApiUrl(path: string) {
  if (!apiBaseUrl) throw new Error("Missing VITE_API_BASE_URL.");
  return new URL(path, apiBaseUrl);
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Services request failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export async function getPublicServices(): Promise<PublicService[]> {
  const response = await fetch(publicApiUrl("/api/v1/public/services"));
  return readJson<PublicService[]>(response);
}

export async function getPublicService(slug: string): Promise<PublicService> {
  const response = await fetch(
    publicApiUrl(`/api/v1/public/services/${encodeURIComponent(slug)}`),
  );
  return readJson<PublicService>(response);
}
