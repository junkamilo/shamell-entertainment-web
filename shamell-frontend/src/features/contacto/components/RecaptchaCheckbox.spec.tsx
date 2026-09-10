/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useEffect } from "react";

const siteKey = vi.hoisted(() => ({ value: "site-key-test" }));

vi.mock("@/lib/recaptchaSiteKey", () => ({
  getRecaptchaSiteKey: () => siteKey.value,
}));

vi.mock("next/script", () => ({
  default: function ScriptStub({ onLoad }: { onLoad?: () => void }) {
    useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return null;
  },
}));

import RecaptchaCheckbox from "./RecaptchaCheckbox";

describe("RecaptchaCheckbox", () => {
  beforeEach(() => {
    siteKey.value = "site-key-test";
    delete window.grecaptcha;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows an alert when the site key is missing", () => {
    siteKey.value = "";
    render(<RecaptchaCheckbox onToken={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/not configured/i);
    expect(screen.queryByTestId("recaptcha-checkbox")).not.toBeInTheDocument();
  });

  it("renders the widget and forwards the token", async () => {
    const onToken = vi.fn();
    window.grecaptcha = {
      render: (_el, params) => {
        params.callback("token-from-google");
        return 7;
      },
      reset: vi.fn(),
    };
    render(<RecaptchaCheckbox onToken={onToken} />);
    expect(screen.getByTestId("recaptcha-checkbox")).toBeInTheDocument();
    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith("token-from-google");
    });
  });

  it("clears the token on expire and error", async () => {
    const onToken = vi.fn();
    window.grecaptcha = {
      render: (_el, params) => {
        params["expired-callback"]();
        params["error-callback"]();
        return 1;
      },
      reset: vi.fn(),
    };
    render(<RecaptchaCheckbox onToken={onToken} />);
    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
    });
    expect(onToken).toHaveBeenCalledTimes(2);
  });

  it("covers the widget while locked and ignores a Google callback", async () => {
    const onToken = vi.fn();
    window.grecaptcha = {
      render: (_el, params) => {
        params.callback("should-ignore");
        return 4;
      },
      reset: vi.fn(),
    };
    render(<RecaptchaCheckbox onToken={onToken} enabled={false} />);
    expect(screen.getByTestId("recaptcha-lock")).toBeInTheDocument();
    expect(
      screen.getByText(/complete the required fields to unlock verification/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("recaptcha-checkbox")).toBeInTheDocument();
    });
    expect(onToken).not.toHaveBeenCalledWith("should-ignore");
  });

  it("resets the widget when it becomes locked after a pass", async () => {
    const onToken = vi.fn();
    const reset = vi.fn();
    window.grecaptcha = {
      render: (_el, params) => {
        params.callback("token-from-google");
        return 9;
      },
      reset,
    };
    const { rerender } = render(<RecaptchaCheckbox onToken={onToken} enabled />);
    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith("token-from-google");
    });
    rerender(<RecaptchaCheckbox onToken={onToken} enabled={false} />);
    expect(onToken).toHaveBeenCalledWith(null);
    expect(reset).toHaveBeenCalledWith(9);
    expect(screen.getByTestId("recaptcha-lock")).toBeInTheDocument();
  });

  it("does not show a load error when Google already painted the widget", async () => {
    vi.useFakeTimers();
    window.grecaptcha = {
      render: (el) => {
        const iframe = document.createElement("iframe");
        iframe.src = "https://www.google.com/recaptcha/api2/anchor";
        el.appendChild(iframe);
        throw new Error("already rendered");
      },
      reset: vi.fn(),
    };
    render(<RecaptchaCheckbox onToken={vi.fn()} />);
    await act(async () => {
      vi.advanceTimersByTime(8_000);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("recaptcha-checkbox").querySelector("iframe")).toBeTruthy();
    vi.useRealTimers();
  });

  it("shows a load error only when the widget never appears", async () => {
    vi.useFakeTimers();
    render(<RecaptchaCheckbox onToken={vi.fn()} />);
    await act(async () => {
      vi.advanceTimersByTime(8_000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/did not load/i);
    vi.useRealTimers();
  });
});
