import { describe, expect, it } from "vitest";
import { formatEurMinor } from "./currency";

describe("EUR formatting", () => {
  it("formats integer minor units as EUR for German and English", () => {
    expect(formatEurMinor(12_500, "de")).toContain("125,00");
    expect(formatEurMinor(12_500, "de")).toContain("€");
    expect(formatEurMinor(12_500, "en")).toContain("€125.00");
  });

  it("never introduces USD", () => {
    expect(formatEurMinor(1_299, "de")).not.toContain("$");
    expect(formatEurMinor(1_299, "en")).not.toContain("$");
    expect(formatEurMinor(1_299, "en")).not.toContain("USD");
  });
});
