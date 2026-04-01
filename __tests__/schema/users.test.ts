import { describe, it, expect } from "vitest";
import { RegistrationTypesEnum } from "@/schema/users";

describe("RegistrationTypesEnum", () => {
  it("accepts Self", () => {
    expect(RegistrationTypesEnum.safeParse("Self").success).toBe(true);
  });

  it("accepts Broker", () => {
    expect(RegistrationTypesEnum.safeParse("Broker").success).toBe(true);
  });

  it("accepts Admin", () => {
    expect(RegistrationTypesEnum.safeParse("Admin").success).toBe(true);
  });

  it("rejects Client", () => {
    expect(RegistrationTypesEnum.safeParse("Client").success).toBe(false);
  });

  it("rejects lowercase self", () => {
    expect(RegistrationTypesEnum.safeParse("self").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(RegistrationTypesEnum.safeParse("").success).toBe(false);
  });

  it("rejects null", () => {
    expect(RegistrationTypesEnum.safeParse(null).success).toBe(false);
  });

  it("rejects undefined", () => {
    expect(RegistrationTypesEnum.safeParse(undefined).success).toBe(false);
  });

  it("rejects arbitrary string", () => {
    expect(RegistrationTypesEnum.safeParse("Partner").success).toBe(false);
  });
});
