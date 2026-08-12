import { describe, expect, it } from "vitest";
import {
  getServiceDetailContent,
  serviceDetailContent,
} from "./serviceContent";

const slugs = [
  "car-detailing",
  "interior-cleaning",
  "car-wrapping",
  "window-tinting",
  "underbody-protection",
  "rust-protection",
];

describe("service detail content", () => {
  it("provides German and English explanations for every service", () => {
    for (const slug of slugs) {
      const content = serviceDetailContent[slug];
      expect(content.descriptionDe.length).toBeGreaterThan(80);
      expect(content.descriptionEn.length).toBeGreaterThan(80);
      expect(content.bulletsDe).toHaveLength(5);
      expect(content.bulletsEn).toHaveLength(5);
    }
  });
  it("includes the neutral tinting legal note", () => {
    const content = getServiceDetailContent("window-tinting");
    expect(content?.legalNoteDe).toContain("gesetzlichen Vorschriften");
    expect(content?.legalNoteEn).toContain("applicable legal requirements");
  });
  it("fails gracefully for unknown slugs", () => {
    expect(getServiceDetailContent("missing")).toBeNull();
  });
  it("does not introduce USD or stock content", () => {
    expect(JSON.stringify(serviceDetailContent)).not.toMatch(
      /\$|USD|stock|Bestand/i,
    );
  });
});
