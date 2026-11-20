import { Writable } from "node:stream";
import Fastify from "fastify";
import { expect, it } from "vitest";
import { registerErrorHandling, serializeRequestForLog } from "../src/plugins/error-handler.plugin.js";

it("retains request correlation and database codes without logging or returning submitted data or credentials", async () => {
  const logs: string[] = [];
  const app = Fastify({
    requestIdHeader: false,
    logger: { level: "info", serializers: { req: serializeRequestForLog }, stream: new Writable({
      write(chunk: Buffer, _encoding, next) { logs.push(chunk.toString()); next(); },
    }) },
  });
  registerErrorHandling(app);
  const sensitive = [
    "Synthetic Customer Name", "synthetic.email@example.test", "55501828800",
    "Private contact message marker", "synthetic-bearer-secret", "synthetic-cookie-secret",
    "untrusted-correlation-token", "synthetic-route-value", "synthetic-query-token",
  ];
  app.post("/logs/:id", () => {
    throw Object.assign(new Error(sensitive.join(" "), { cause: new Error(sensitive.join(" ")) }), {
      code: "P2024", meta: { payload: sensitive }, stack: sensitive.join(" "),
    });
  });
  try {
    const reply = await app.inject({
      method: "POST",
      url: "/logs/synthetic-route-value?token=synthetic-query-token",
      payload: { name: sensitive[0], email: sensitive[1], phone: sensitive[2], message: sensitive[3] },
      headers: { authorization: "Bearer " + sensitive[4], cookie: "session=" + sensitive[5], "request-id": sensitive[6] },
    });
    expect(reply.statusCode).toBe(500);
    expect(reply.json<{ error: { code: string } }>().error.code).toBe("INTERNAL_ERROR");
    const lines = logs.flatMap(chunk => chunk.trim().split("\n")).map(line =>
      JSON.parse(line) as { msg?: string; reqId?: string; req?: { route?: string } });
    const failure = lines.find(line => line.msg === "Unhandled request error");
    expect(typeof failure?.reqId).toBe("string");
    expect(failure).toMatchObject({ route: "/logs/:id", method: "POST", failure: { kind: "database", code: "P2024" } });
    expect(lines.some(line => line.req?.route === "/logs/:id" && line.reqId === failure?.reqId)).toBe(true);
    for (const value of sensitive) {
      expect(logs.join("")).not.toContain(value);
      expect(reply.body).not.toContain(value);
    }
  } finally {
    await app.close();
  }
});
