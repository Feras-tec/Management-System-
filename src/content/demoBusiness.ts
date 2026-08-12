export const DEMO_BUSINESS = {
  isDemo: true,
  legalName: "AutoCare GmbH (DEMO)",
  address: {
    street: "Musterstraße 1",
    postalCode: "12345",
    city: "Musterstadt",
    country: "Deutschland",
  },
  phone: "0123 456789",
  email: "info@autocare-demo.de",
  representative: "Max Mustermann (DEMO)",
  vatId: "DE123456789 (DEMO)",
  openingHours: [
    { de: "Mo–Fr: 08:00–18:00", en: "Mon–Fri: 08:00–18:00" },
    { de: "Sa: 09:00–14:00", en: "Sat: 09:00–14:00" },
    { de: "So: Geschlossen", en: "Sun: Closed" },
  ],
} as const;

export function formatDemoAddress(language: "de" | "en") {
  const { street, postalCode, city, country } = DEMO_BUSINESS.address;
  return language === "de"
    ? [street, `${postalCode} ${city}`, country].join(", ")
    : [street, `${postalCode} ${city}`, "Germany"].join(", ");
}
