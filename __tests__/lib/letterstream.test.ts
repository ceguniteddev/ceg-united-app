import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

process.env.LETTERSTREAM_API_KEY = "test-api-key";

const mockAddress = {
  name: "John Doe",
  address_line1: "123 Main St",
  city: "Anytown",
  state: "CA",
  postal_code: "90210",
};

const mockLetterResponse = {
  id: "ltr_test123",
  object: "letter" as const,
  status: "created" as const,
  to: mockAddress,
  from: mockAddress,
  color: false,
  double_sided: true,
  certified: false,
  return_receipt: false,
  expected_delivery_date: "2026-04-10",
  created_at: "2026-04-01T00:00:00Z",
  price: 199,
  url: "https://app.letterstream.com/letters/ltr_test123",
};

describe("letterstream", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("sendLetter", () => {
    it("sends a letter and returns letter response on success", async () => {
      const { sendLetter } = await import("@/lib/letterstream");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLetterResponse,
      });

      const result = await sendLetter({
        to: mockAddress,
        from: mockAddress,
        html: "<p>Hello</p>",
      });

      expect(result).toEqual(mockLetterResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/letters"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        }),
      );
    });

    it("throws on API error response", async () => {
      const { sendLetter } = await import("@/lib/letterstream");
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ message: "Invalid address" }),
      });

      await expect(
        sendLetter({ to: mockAddress, from: mockAddress }),
      ).rejects.toThrow("Letterstream API error: Invalid address");
    });
  });

  describe("getLetter", () => {
    it("retrieves a letter by ID", async () => {
      const { getLetter } = await import("@/lib/letterstream");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLetterResponse,
      });

      const result = await getLetter("ltr_test123");

      expect(result).toEqual(mockLetterResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/letters/ltr_test123"),
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("listLetters", () => {
    const mockListResponse = {
      object: "list" as const,
      data: [mockLetterResponse],
      has_more: false,
      count: 1,
    };

    it("lists letters without params", async () => {
      const { listLetters } = await import("@/lib/letterstream");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      const result = await listLetters();

      expect(result).toEqual(mockListResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/letters"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("lists letters with params", async () => {
      const { listLetters } = await import("@/lib/letterstream");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      const result = await listLetters({ limit: 10, status: "sent" });

      expect(result).toEqual(mockListResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.anything(),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=sent"),
        expect.anything(),
      );
    });
  });

  describe("cancelLetter", () => {
    it("cancels a letter by ID", async () => {
      const { cancelLetter } = await import("@/lib/letterstream");
      const cancelledLetter = {
        ...mockLetterResponse,
        status: "failed" as const,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => cancelledLetter,
      });

      const result = await cancelLetter("ltr_test123");

      expect(result).toEqual(cancelledLetter);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/letters/ltr_test123/cancel"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("formatLetterHTML", () => {
    it("includes date by default", async () => {
      const { formatLetterHTML } = await import("@/lib/letterstream");
      const html = await formatLetterHTML("<p>Content</p>");

      expect(html).toContain("<p>Content</p>");
      // Should include a date paragraph since includeDate defaults to true
      expect(html).toMatch(/\d{4}/); // contains year
    });

    it("includes signature when signatureName provided", async () => {
      const { formatLetterHTML } = await import("@/lib/letterstream");
      const html = await formatLetterHTML("<p>Content</p>", {
        includeSignature: true,
        signatureName: "Jane Smith",
      });

      expect(html).toContain("Jane Smith");
      expect(html).toContain("Sincerely");
    });

    it("excludes date when includeDate=false", async () => {
      const { formatLetterHTML } = await import("@/lib/letterstream");
      const currentYear = new Date().getFullYear().toString();
      // With includeDate=false, the date paragraph should not be present
      const html = await formatLetterHTML("<p>Content</p>", {
        includeDate: false,
      });

      // The date variable should be empty string, so no margin-bottom date paragraph
      expect(html).not.toContain("margin-bottom: 20px");
    });

    it("returns HTML string with the content", async () => {
      const { formatLetterHTML } = await import("@/lib/letterstream");
      const html = await formatLetterHTML("<p>Hello World</p>");

      expect(typeof html).toBe("string");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<p>Hello World</p>");
    });
  });
});
