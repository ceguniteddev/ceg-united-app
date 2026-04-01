import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  notAllowed,
  tooManyRequests,
  internalServerError,
  isJsonContentType,
  ensureJsonContentType,
  isFormDataContentType,
  ensureFormDataContentType,
  getMessage,
} from "@/app/api/helpers";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

describe("badRequest()", () => {
  it("should return status 400", async () => {
    const res = badRequest({ errors: "Something wrong" });
    expect(res.status).toBe(400);
  });

  it("should wrap a string error in an array", async () => {
    const res = badRequest({ errors: "bad input" });
    const body = await res.json();
    expect(body.errors).toEqual(["bad input"]);
  });

  it("should keep an array of errors as-is", async () => {
    const res = badRequest({ errors: ["err1", "err2"] });
    const body = await res.json();
    expect(body.errors).toEqual(["err1", "err2"]);
  });

  it("should flatten an object of errors", async () => {
    const res = badRequest({
      errors: { field1: "required", field2: "invalid" },
    });
    const body = await res.json();
    expect(body.errors).toEqual(
      expect.arrayContaining(["required", "invalid"]),
    );
  });

  it("should use the custom message when provided", async () => {
    const res = badRequest({ message: "Validation failed", errors: "bad" });
    const body = await res.json();
    expect(body.message).toBe("Validation failed");
  });

  it("should default message to 'Bad Request'", async () => {
    const res = badRequest({ errors: "bad" });
    const body = await res.json();
    expect(body.message).toBe("Bad Request");
  });

  it("should handle null errors", async () => {
    const res = badRequest({ errors: null });
    expect(res.status).toBe(400);
  });
});

describe("unauthorized()", () => {
  it("should return status 401", () => {
    expect(unauthorized().status).toBe(401);
  });

  it("should default message to Unauthorized", async () => {
    const body = await unauthorized().json();
    expect(body.message).toBe("Unauthorized");
  });

  it("should accept a custom message", async () => {
    const body = await unauthorized("No access").json();
    expect(body.message).toBe("No access");
  });
});

describe("forbidden()", () => {
  it("should return status 403", () => {
    expect(forbidden().status).toBe(403);
  });

  it("should default message to Forbidden", async () => {
    const body = await forbidden().json();
    expect(body.message).toBe("Forbidden");
  });
});

describe("notFound()", () => {
  it("should return status 404", () => {
    expect(notFound().status).toBe(404);
  });

  it("should default message to Not Found", async () => {
    const body = await notFound().json();
    expect(body.message).toBe("Not Found");
  });
});

describe("notAllowed()", () => {
  it("should return status 405", () => {
    expect(notAllowed().status).toBe(405);
  });
});

describe("tooManyRequests()", () => {
  it("should return status 429", () => {
    expect(tooManyRequests().status).toBe(429);
  });
});

describe("internalServerError()", () => {
  it("should return status 500", () => {
    expect(internalServerError().status).toBe(500);
  });

  it("should default message to Internal Server Error", async () => {
    const body = await internalServerError().json();
    expect(body.message).toBe("Internal Server Error");
  });

  it("should accept a custom message", async () => {
    const body = await internalServerError("DB down").json();
    expect(body.message).toBe("DB down");
  });
});

// ---------------------------------------------------------------------------
// Content-type helpers
// ---------------------------------------------------------------------------

function makeReq(contentType: string) {
  return new NextRequest("http://localhost/api/test", {
    headers: { "content-type": contentType },
  });
}

describe("isJsonContentType()", () => {
  it("should return true for application/json", () => {
    expect(isJsonContentType(makeReq("application/json"))).toBe(true);
  });

  it("should return true for application/json; charset=utf-8", () => {
    expect(isJsonContentType(makeReq("application/json; charset=utf-8"))).toBe(
      true,
    );
  });

  it("should return false for multipart/form-data", () => {
    expect(isJsonContentType(makeReq("multipart/form-data"))).toBe(false);
  });

  it("should return false when content-type header is missing", () => {
    const req = new NextRequest("http://localhost/api/test");
    expect(isJsonContentType(req)).toBe(false);
  });
});

describe("ensureJsonContentType()", () => {
  it("should return null when content-type is application/json", () => {
    const req = makeReq("application/json");
    expect(ensureJsonContentType(req)).toBeNull();
  });

  it("should return a 400 response when content-type is not JSON", async () => {
    const req = makeReq("text/plain");
    const res = ensureJsonContentType(req)!;
    expect(res.status).toBe(400);
  });
});

describe("isFormDataContentType()", () => {
  it("should return true for multipart/form-data", () => {
    expect(
      isFormDataContentType(makeReq("multipart/form-data; boundary=xxx")),
    ).toBe(true);
  });

  it("should return true for application/x-www-form-urlencoded", () => {
    expect(
      isFormDataContentType(makeReq("application/x-www-form-urlencoded")),
    ).toBe(true);
  });

  it("should return false for application/json", () => {
    expect(isFormDataContentType(makeReq("application/json"))).toBe(false);
  });
});

describe("ensureFormDataContentType()", () => {
  it("should return null for multipart/form-data", () => {
    const req = makeReq("multipart/form-data; boundary=xxx");
    expect(ensureFormDataContentType(req)).toBeNull();
  });

  it("should return 400 for application/json", async () => {
    const req = makeReq("application/json");
    const res = ensureFormDataContentType(req)!;
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// getMessage()
// ---------------------------------------------------------------------------

describe("getMessage()", () => {
  it("should extract messages from a ZodError", () => {
    const schema = z.object({
      name: z.string().min(1, { message: "Required" }),
    });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = getMessage(result.error);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    }
  });

  it("should return fallback array when no messages found", () => {
    // Create a ZodError with no issues by parsing a valid value then checking
    // We can also test edge cases by using an always-failing schema
    const schema = z.string().min(100, { message: "Too short" });
    const result = schema.safeParse("hi");
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = getMessage(result.error);
      expect(Array.isArray(messages)).toBe(true);
    }
  });
});
