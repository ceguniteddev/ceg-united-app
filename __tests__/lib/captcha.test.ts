import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockProjectPath = vi.fn().mockReturnValue("projects/test-project");
const mockCreateAssessment = vi.fn();

vi.mock("@google-cloud/recaptcha-enterprise", () => ({
  RecaptchaEnterpriseServiceClient: vi.fn().mockImplementation(function (
    this: any,
  ) {
    this.projectPath = mockProjectPath;
    this.createAssessment = mockCreateAssessment;
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

process.env.RECAPTCHA_SECRET_KEY = "test-secret";
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";

describe("captcha", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockCreateAssessment.mockReset();
    mockProjectPath.mockReturnValue("projects/test-project");
  });

  describe("verifyCaptchaToken", () => {
    it("returns captcha data on success", async () => {
      const { verifyCaptchaToken } = await import("@/lib/captcha/captcha");
      const mockCaptchaData = {
        success: true,
        challenge_ts: "2026-04-01T00:00:00Z",
        hostname: "localhost",
        score: 0.9,
        action: "login",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCaptchaData,
      });

      const result = await verifyCaptchaToken("test-token");

      expect(result).toEqual(mockCaptchaData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining("recaptcha/api/siteverify"),
        }),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("returns null when API response is not ok", async () => {
      const { verifyCaptchaToken } = await import("@/lib/captcha/captcha");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ "error-codes": ["invalid-input-secret"] }),
      });

      const result = await verifyCaptchaToken("bad-token");

      expect(result).toBeNull();
    });

    it("throws when RECAPTCHA_SECRET_KEY is not set", async () => {
      vi.resetModules();
      const savedKey = process.env.RECAPTCHA_SECRET_KEY;
      delete process.env.RECAPTCHA_SECRET_KEY;

      const { verifyCaptchaToken } = await import("@/lib/captcha/captcha");

      await expect(verifyCaptchaToken("test-token")).rejects.toThrow(
        "No secret key found",
      );

      process.env.RECAPTCHA_SECRET_KEY = savedKey;
      vi.resetModules();
    });
  });

  describe("createEnterpriseAssessment", () => {
    const validAssessmentResponse = {
      tokenProperties: {
        valid: true,
        action: "login",
      },
      riskAnalysis: {
        score: 0.9,
      },
    };

    it("returns score on valid token and matching action", async () => {
      vi.resetModules();
      const { createEnterpriseAssessment } =
        await import("@/lib/captcha/captcha");
      mockCreateAssessment.mockResolvedValueOnce([validAssessmentResponse]);

      const result = await createEnterpriseAssessment("valid-token", "login");

      expect(result).toEqual({ score: 0.9 });
    });

    it("throws when token is invalid", async () => {
      vi.resetModules();
      const { createEnterpriseAssessment } =
        await import("@/lib/captcha/captcha");
      mockCreateAssessment.mockResolvedValueOnce([
        {
          tokenProperties: {
            valid: false,
            invalidReason: "EXPIRED",
          },
          riskAnalysis: { score: 0.9 },
        },
      ]);

      await expect(
        createEnterpriseAssessment("expired-token", "login"),
      ).rejects.toThrow("The reCAPTCHA token was invalid: EXPIRED");
    });

    it("throws when action does not match", async () => {
      vi.resetModules();
      const { createEnterpriseAssessment } =
        await import("@/lib/captcha/captcha");
      mockCreateAssessment.mockResolvedValueOnce([
        {
          tokenProperties: {
            valid: true,
            action: "register", // different from expected "login"
          },
          riskAnalysis: { score: 0.9 },
        },
      ]);

      await expect(
        createEnterpriseAssessment("valid-token", "login"),
      ).rejects.toThrow("reCAPTCHA action mismatch");
    });

    it("throws when score is below threshold (0.5)", async () => {
      vi.resetModules();
      const { createEnterpriseAssessment } =
        await import("@/lib/captcha/captcha");
      mockCreateAssessment.mockResolvedValueOnce([
        {
          tokenProperties: {
            valid: true,
            action: "login",
          },
          riskAnalysis: { score: 0.3 },
        },
      ]);

      await expect(
        createEnterpriseAssessment("bot-token", "login"),
      ).rejects.toThrow("Captcha validation failed. Please try again.");
    });

    it("throws when FIREBASE_PROJECT_ID is not set", async () => {
      const savedProject = process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PROJECT_ID;
      vi.resetModules();

      const { createEnterpriseAssessment } =
        await import("@/lib/captcha/captcha");

      await expect(
        createEnterpriseAssessment("valid-token", "login"),
      ).rejects.toThrow(
        "Missing Google Cloud or reCAPTCHA Enterprise configuration.",
      );

      process.env.FIREBASE_PROJECT_ID = savedProject;
      vi.resetModules();
    });

    it("throws when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set", async () => {
      const savedKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      vi.resetModules();

      const { createEnterpriseAssessment } =
        await import("@/lib/captcha/captcha");

      await expect(
        createEnterpriseAssessment("valid-token", "login"),
      ).rejects.toThrow(
        "Missing Google Cloud or reCAPTCHA Enterprise configuration.",
      );

      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = savedKey;
      vi.resetModules();
    });
  });
});
