import { describe, expect, it } from "vitest";

import { DEMO_ABOUT_CONTENT } from "./aboutContent";
import { DEMO_BUSINESS, formatDemoAddress } from "./demoBusiness";

describe("final public demo content", () => {
  it("keeps the documented About demo statistics", () => {
    expect(DEMO_ABOUT_CONTENT.founded).toBe(2012);
    expect(DEMO_ABOUT_CONTENT.experienceDe).toContain("14+");
    expect(DEMO_ABOUT_CONTENT.experienceEn).toContain("14+");
    expect(DEMO_ABOUT_CONTENT.servicesDe).toContain("6");
    expect(DEMO_ABOUT_CONTENT.vehiclesEn).toContain("1,000+");
    expect(DEMO_ABOUT_CONTENT.valuesDe).toHaveLength(5);
    expect(DEMO_ABOUT_CONTENT.valuesEn).toHaveLength(5);
  });

  it("shares the same demo contact identity used by legal content", () => {
    expect(DEMO_BUSINESS.legalName).toBe("AutoCare GmbH (DEMO)");
    expect(formatDemoAddress("de")).toContain("Musterstraße 1");
    expect(formatDemoAddress("en")).toContain("Musterstraße 1");
    expect(DEMO_BUSINESS.phone).toBe("0123 456789");
    expect(DEMO_BUSINESS.email).toBe("info@autocare-demo.de");
    expect(DEMO_BUSINESS.openingHours).toHaveLength(3);
  });
});
