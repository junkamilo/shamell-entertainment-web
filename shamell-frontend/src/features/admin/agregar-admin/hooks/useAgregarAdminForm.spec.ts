/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_FULL_NAME,
  FIXTURE_ADMIN_PASSWORD,
  FIXTURE_INVITE_CODE,
} from "../test/fixtures/uuids.fixture";
import { useAgregarAdminForm } from "./useAgregarAdminForm";

describe("useAgregarAdminForm", () => {
  it("defaults to phase 1 with empty fields", () => {
    const { result } = renderHook(() => useAgregarAdminForm());

    expect(result.current.phase).toBe(1);
    expect(result.current.email).toBe("");
    expect(result.current.fullName).toBe("");
    expect(result.current.code).toBe("");
    expect(result.current.password).toBe("");
    expect(result.current.emailDisplay).toBe("");
    expect(result.current.isSending).toBe(false);
    expect(result.current.isVerifying).toBe(false);
  });

  it("emailDisplay lowercases and trims email", () => {
    const { result } = renderHook(() => useAgregarAdminForm());

    act(() => {
      result.current.setEmail(`  ${FIXTURE_ADMIN_EMAIL.toUpperCase()}  `);
    });

    expect(result.current.emailDisplay).toBe(FIXTURE_ADMIN_EMAIL);
  });

  it("resetFlow clears fields and sets phase 1", () => {
    const { result } = renderHook(() => useAgregarAdminForm());

    act(() => {
      result.current.setPhase(2);
      result.current.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.setFullName(FIXTURE_ADMIN_FULL_NAME);
      result.current.setCode(FIXTURE_INVITE_CODE);
      result.current.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    act(() => {
      result.current.resetFlow();
    });

    expect(result.current.phase).toBe(1);
    expect(result.current.email).toBe("");
    expect(result.current.fullName).toBe("");
    expect(result.current.code).toBe("");
    expect(result.current.password).toBe("");
  });

  it("goToPhase1 clears code and password but keeps email", () => {
    const { result } = renderHook(() => useAgregarAdminForm());

    act(() => {
      result.current.setPhase(2);
      result.current.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.setFullName(FIXTURE_ADMIN_FULL_NAME);
      result.current.setCode(FIXTURE_INVITE_CODE);
      result.current.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    act(() => {
      result.current.goToPhase1();
    });

    expect(result.current.phase).toBe(1);
    expect(result.current.email).toBe(FIXTURE_ADMIN_EMAIL);
    expect(result.current.fullName).toBe(FIXTURE_ADMIN_FULL_NAME);
    expect(result.current.code).toBe("");
    expect(result.current.password).toBe("");
  });

  it("clearVerifyFields only clears code and password", () => {
    const { result } = renderHook(() => useAgregarAdminForm());

    act(() => {
      result.current.setPhase(2);
      result.current.setEmail(FIXTURE_ADMIN_EMAIL);
      result.current.setFullName(FIXTURE_ADMIN_FULL_NAME);
      result.current.setCode(FIXTURE_INVITE_CODE);
      result.current.setPassword(FIXTURE_ADMIN_PASSWORD);
    });

    act(() => {
      result.current.clearVerifyFields();
    });

    expect(result.current.phase).toBe(2);
    expect(result.current.email).toBe(FIXTURE_ADMIN_EMAIL);
    expect(result.current.fullName).toBe(FIXTURE_ADMIN_FULL_NAME);
    expect(result.current.code).toBe("");
    expect(result.current.password).toBe("");
  });
});
