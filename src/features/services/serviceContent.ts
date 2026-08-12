export type ServiceDetailContent = {
  descriptionDe: string;
  descriptionEn: string;
  bulletsDe: string[];
  bulletsEn: string[];
  legalNoteDe?: string;
  legalNoteEn?: string;
};

export const serviceDetailContent: Record<string, ServiceDetailContent> = {
  "car-detailing": {
    descriptionDe:
      "Bei der Fahrzeugaufbereitung kümmern wir uns gründlich um das äußere Erscheinungsbild Ihres Fahrzeugs. Schmutz, Staub und oberflächliche Ablagerungen werden sorgfältig entfernt und die zugänglichen Außenflächen werden gereinigt und gepflegt. Ziel ist ein sauberes, gepflegtes Gesamtbild und eine schonende Behandlung der Fahrzeugoberflächen.",
    descriptionEn:
      "During car detailing, we carefully clean and care for the exterior appearance of your vehicle. Dirt, dust, and surface contamination are removed from accessible exterior areas, with attention to details and sensitive surfaces. The goal is a clean, well-maintained appearance and careful treatment of the vehicle exterior.",
    bulletsDe: [
      "Gründliche Außenreinigung",
      "Pflege zugänglicher Lack- und Außenflächen",
      "Entfernung von oberflächlichem Schmutz und Ablagerungen",
      "Sorgfältige Detailarbeit an schwer erreichbaren Bereichen",
      "Abschlusskontrolle des Fahrzeugzustands",
    ],
    bulletsEn: [
      "Thorough exterior cleaning",
      "Care of accessible paint and exterior surfaces",
      "Removal of surface dirt and contamination",
      "Detailed cleaning of difficult-to-reach areas",
      "Final visual inspection",
    ],
  },
  "interior-cleaning": {
    descriptionDe:
      "Bei der Innenraumreinigung reinigen wir die wichtigsten Bereiche des Fahrzeuginnenraums gründlich und materialschonend. Sitze, Teppiche und zugängliche Innenflächen werden von Staub und typischen Verschmutzungen befreit. Besonderes Augenmerk gilt Bereichen, die bei der normalen Fahrzeugpflege häufig übersehen werden.",
    descriptionEn:
      "Our interior cleaning service focuses on the main areas of the vehicle cabin. Seats, carpets, and accessible interior surfaces are carefully cleaned to remove dust and everyday contamination, including areas that are often missed during routine cleaning.",
    bulletsDe: [
      "Reinigung von Sitzen und zugänglichen Polsterflächen",
      "Reinigung von Teppichen und Fußraum",
      "Pflege zugänglicher Kunststoff- und Innenflächen",
      "Reinigung schwer erreichbarer Bereiche",
      "Entfernung von Staub und typischen Alltagsverschmutzungen",
    ],
    bulletsEn: [
      "Cleaning of seats and accessible upholstery",
      "Carpet and footwell cleaning",
      "Care of accessible interior surfaces",
      "Cleaning of difficult-to-reach areas",
      "Removal of dust and common everyday dirt",
    ],
  },
  "car-wrapping": {
    descriptionDe:
      "Mit einer Fahrzeugfolierung kann das Erscheinungsbild eines Fahrzeugs verändert werden, ohne den Originallack dauerhaft zu ersetzen. Die Folie wird sorgfältig auf geeignete Karosserieflächen aufgebracht und ermöglicht eine individuelle optische Gestaltung. Gleichzeitig kann sie den darunterliegenden Lack vor leichter Beanspruchung im Alltag schützen.",
    descriptionEn:
      "Vehicle wrapping allows the appearance of a car to be changed without permanently replacing the original paint. Film is carefully applied to suitable body surfaces to create a customized visual finish while also providing an additional layer over the original paintwork.",
    bulletsDe: [
      "Vorbereitung und Reinigung der zu folierenden Flächen",
      "Sorgfältige Verarbeitung der Fahrzeugfolie",
      "Anpassung an Kanten und Karosserieformen",
      "Kontrolle von Übergängen und Abschlusskanten",
      "Optische Abschlusskontrolle",
    ],
    bulletsEn: [
      "Preparation and cleaning of wrapping surfaces",
      "Careful application of vehicle film",
      "Adjustment around edges and body contours",
      "Inspection of transitions and finishing edges",
      "Final visual inspection",
    ],
  },
  "window-tinting": {
    descriptionDe:
      "Bei der Scheibentönung wird eine geeignete Tönungsfolie fachgerecht auf Fahrzeugglas angebracht. Sie kann den Fahrzeuginnenraum optisch aufwerten, zusätzliche Privatsphäre schaffen und den direkten Sonneneinfall reduzieren. Die Ausführung erfolgt unter Berücksichtigung der für das Fahrzeug geltenden gesetzlichen Vorgaben.",
    descriptionEn:
      "Window tinting involves the careful installation of suitable tint film on vehicle glass. It can improve privacy, reduce direct sunlight entering the cabin, and change the visual appearance of the vehicle. Installation is carried out with consideration for the legal requirements that apply to the relevant vehicle windows.",
    bulletsDe: [
      "Reinigung und Vorbereitung der Scheiben",
      "Zuschneiden und Anpassen der Tönungsfolie",
      "Sorgfältige Montage auf geeigneten Fahrzeugfenstern",
      "Kontrolle von Kanten und Folienoberfläche",
      "Abschlusskontrolle der Verarbeitung",
    ],
    bulletsEn: [
      "Cleaning and preparation of the glass",
      "Cutting and fitting the tint film",
      "Careful installation on suitable vehicle windows",
      "Inspection of edges and film surface",
      "Final installation check",
    ],
    legalNoteDe:
      "Die zulässige Tönung hängt von der jeweiligen Scheibe und den geltenden gesetzlichen Vorschriften ab.",
    legalNoteEn:
      "Permitted tint levels depend on the specific window and applicable legal requirements.",
  },
  "underbody-protection": {
    descriptionDe:
      "Der Fahrzeugunterboden ist regelmäßig Feuchtigkeit, Straßenschmutz und Streusalz ausgesetzt. Beim Unterbodenschutz werden geeignete zugängliche Bereiche vorbereitet und mit einer Schutzbehandlung versehen, um die Belastung durch äußere Umwelteinflüsse zu reduzieren.",
    descriptionEn:
      "The vehicle underbody is regularly exposed to moisture, road dirt, and road salt. Underbody protection focuses on preparing suitable accessible areas and applying a protective treatment to help reduce the effects of these environmental influences.",
    bulletsDe: [
      "Sichtprüfung zugänglicher Unterbodenbereiche",
      "Reinigung und Vorbereitung geeigneter Flächen",
      "Auftragen der vorgesehenen Schutzbehandlung",
      "Behandlung relevanter Kanten und gefährdeter Bereiche",
      "Abschlusskontrolle",
    ],
    bulletsEn: [
      "Visual inspection of accessible underbody areas",
      "Cleaning and preparation of suitable surfaces",
      "Application of the intended protective treatment",
      "Treatment of relevant edges and exposed areas",
      "Final inspection",
    ],
  },
  "rust-protection": {
    descriptionDe:
      "Rostschutz konzentriert sich auf Fahrzeugbereiche, die besonders anfällig für Feuchtigkeit und Korrosion sind. Zugängliche gefährdete Bereiche werden geprüft, vorbereitet und mit einer geeigneten Schutzbehandlung versehen. Ziel ist es, die vorhandenen Fahrzeugoberflächen besser vor korrosionsfördernden Einflüssen zu schützen.",
    descriptionEn:
      "Rust protection focuses on vehicle areas that are particularly exposed to moisture and corrosion. Accessible vulnerable areas are inspected, prepared, and treated with an appropriate protective coating to help reduce exposure to corrosion-promoting conditions.",
    bulletsDe: [
      "Sichtprüfung korrosionsgefährdeter Bereiche",
      "Vorbereitung zugänglicher Flächen",
      "Behandlung geeigneter gefährdeter Bereiche",
      "Schutz relevanter Unterbodenbereiche, soweit zugänglich und geeignet",
      "Abschlusskontrolle",
    ],
    bulletsEn: [
      "Visual inspection of corrosion-prone areas",
      "Preparation of accessible surfaces",
      "Treatment of suitable vulnerable areas",
      "Protection of relevant underbody areas where accessible and appropriate",
      "Final inspection",
    ],
  },
};

export function getServiceDetailContent(slug: string) {
  return serviceDetailContent[slug] ?? null;
}
