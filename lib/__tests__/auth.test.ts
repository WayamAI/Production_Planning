import { beforeEach, describe, expect, it } from "vitest";
import { isLoggedIn, isValidLoginEmail, isValidLoginPassword, login, logout } from "@/lib/auth";

beforeEach(() => {
  localStorage.clear();
});

describe("isValidLoginEmail", () => {
  it("accepts gmail addresses case-insensitively", () => {
    expect(isValidLoginEmail("someone@gmail.com")).toBe(true);
    expect(isValidLoginEmail("Someone.Else@Gmail.com")).toBe(true);
  });

  it("rejects non-gmail addresses and malformed input", () => {
    expect(isValidLoginEmail("someone@yahoo.com")).toBe(false);
    expect(isValidLoginEmail("not-an-email")).toBe(false);
    expect(isValidLoginEmail("")).toBe(false);
  });
});

describe("isValidLoginPassword", () => {
  it("accepts any non-empty password", () => {
    expect(isValidLoginPassword("x")).toBe(true);
  });

  it("rejects empty or whitespace-only passwords", () => {
    expect(isValidLoginPassword("")).toBe(false);
    expect(isValidLoginPassword("   ")).toBe(false);
  });
});

describe("login/logout/isLoggedIn", () => {
  it("starts logged out", () => {
    expect(isLoggedIn()).toBe(false);
  });

  it("logs in with a valid gmail address and password", () => {
    const result = login("demo.user@gmail.com", "anything123");
    expect(result.ok).toBe(true);
    expect(isLoggedIn()).toBe(true);
  });

  it("refuses to log in with an invalid email", () => {
    const result = login("demo.user@yahoo.com", "anything123");
    expect(result.ok).toBe(false);
    expect(isLoggedIn()).toBe(false);
  });

  it("refuses to log in with an empty password", () => {
    const result = login("demo.user@gmail.com", "");
    expect(result.ok).toBe(false);
    expect(isLoggedIn()).toBe(false);
  });

  it("logs out", () => {
    login("demo.user@gmail.com", "anything123");
    logout();
    expect(isLoggedIn()).toBe(false);
  });
});
