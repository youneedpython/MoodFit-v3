// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";

it("rewrites only known SPA paths and preserves query strings", () => {
  const template = readFileSync(new URL("../../../infra/cloudformation/frontend.yaml", import.meta.url), "utf-8");
  const source = template.split("FunctionCode: |")[1]!.split("  StaticBucket:")[0]!;
  const handler = runInNewContext(source + "\nhandler") as (event: { request: { uri: string; querystring: object } }) => { uri: string; querystring: object };
  const querystring = { error: { value: "oauth" } };
  for (const uri of ["/check-in", "/history", "/login", "/privacy"]) {
    const result = handler({ request: { uri, querystring } });
    expect(result.uri).toBe("/index.html"); expect(result.querystring).toBe(querystring);
  }
  for (const uri of ["/api", "/api/auth/me", "/assets/main.js", "/favicon.svg", "/unknown"]) {
    expect(handler({ request: { uri, querystring } }).uri).toBe(uri);
  }
});
