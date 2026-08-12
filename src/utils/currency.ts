export function currencyLocale(language: string) {
  return language === "de" ? "de-DE" : "en-IE";
}

export function formatEurMinor(minor: number, language: string) {
  return new Intl.NumberFormat(currencyLocale(language), {
    style: "currency",
    currency: "EUR",
  }).format(minor / 100);
}
