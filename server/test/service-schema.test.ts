import { describe, expect, it } from "vitest";

import { createServiceSchema, updateServiceSchema } from "../src/modules/services/service.schema.js";
import { validServiceInput } from "./helpers/fake-data-store.js";

describe("service schemas", () => {
  it("accepts integer minor-unit prices and positive durations", () => {
    expect(createServiceSchema.safeParse(validServiceInput).success).toBe(true);
  });

  it("rejects floating prices, invalid slugs, and non-positive durations", () => {
    expect(createServiceSchema.safeParse({ ...validServiceInput, priceFrom: 10.5 }).success).toBe(false);
    expect(createServiceSchema.safeParse({ ...validServiceInput, slug: "Not Valid" }).success).toBe(false);
    expect(createServiceSchema.safeParse({ ...validServiceInput, durationMinutes: 0 }).success).toBe(false);
  });

  it("rejects empty updates and unknown businessId input", () => {
    expect(updateServiceSchema.safeParse({}).success).toBe(false);
    expect(updateServiceSchema.safeParse({ businessId: "attacker-business" }).success).toBe(false);
  });
});
