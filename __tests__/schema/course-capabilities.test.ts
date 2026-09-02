/// <reference types="vitest/globals" />
import {
  CourseCapabilityGrantEnum,
  CourseKeyEnum,
  UserCourseCapabilityGrantSchema,
} from "@/schema/educational-materials/course";

describe("course capability schemas", () => {
  it("accepts only stable course keys and closed capability grants", () => {
    expect(CourseKeyEnum.safeParse("first_50k").success).toBe(true);
    expect(CourseKeyEnum.safeParse("How to Raise Your First 50K").success).toBe(
      false,
    );
    expect(CourseCapabilityGrantEnum.safeParse("legacy_pro").success).toBe(
      true,
    );
    expect(CourseCapabilityGrantEnum.safeParse("all_tools").success).toBe(
      false,
    );
  });

  it("requires auditable grant evidence", () => {
    const result = UserCourseCapabilityGrantSchema.safeParse({
      userId: "u1",
      courseId: "c1",
      courseKey: "credit_to_capital",
      capabilityGrant: "dispute",
      source: "dodo_webhook",
      providerPaymentId: "pay_1",
      grantedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});
