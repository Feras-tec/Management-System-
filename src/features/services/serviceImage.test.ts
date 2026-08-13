import { describe, expect, it } from "vitest";

import {
  getServiceImage,
  getServicePreviewImage,
  getServicePreviewImageSrcSet,
  serviceImageMap,
} from "./serviceImage";

describe("service image mapping", () => {
  it("maps all six public services to local artwork", () => {
    expect(Object.keys(serviceImageMap)).toHaveLength(6);

    for (const path of Object.values(serviceImageMap)) {
      expect(path).toMatch(/^\/images\/services\/.+\.(?:jpg|jpeg|webp)$/i);
    }
  });

  it("prefers a configured backend image and falls back locally", () => {
    expect(getServiceImage("car-detailing", "/uploaded/service.webp")).toBe(
      "/uploaded/service.webp",
    );

    expect(getServiceImage("window-tinting", null)).toBe(
      "/images/services/window-tinting.jpg",
    );

    expect(getServiceImage("unknown", null)).toBeNull();
  });

  it("provides responsive Home preview sources only for local preview artwork", () => {
    expect(getServicePreviewImage("car-detailing")).toBe(
      "/images/services/car-detailing-400.webp",
    );
    expect(getServicePreviewImageSrcSet("car-detailing")).toContain("400w");
    expect(getServicePreviewImageSrcSet("car-wrapping")).toContain("640w");
    expect(
      getServicePreviewImageSrcSet("car-detailing", "/uploaded/service.webp"),
    ).toBeUndefined();
    expect(getServicePreviewImageSrcSet("window-tinting")).toBeUndefined();
    expect(getServicePreviewImage("window-tinting")).toBe(
      "/images/services/window-tinting.jpg",
    );
  });
});
