import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/components/LoginForm";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("next-auth/react");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockedUseSession = useSession as jest.Mock;
const mockedSignIn = signIn as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;

describe("LoginForm", () => {
  const user = userEvent.setup();
  const push = jest.fn();
  const fetchMock = () => globalThis.fetch as jest.Mock;

  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    mockedUseRouter.mockReturnValue({ push });
    mockedUseSearchParams.mockReturnValue(new URLSearchParams());
    globalThis.fetch = jest.fn();
    fetchMock().mockResolvedValue({
      json: async () => ({ user: { role: "user" } }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("shows validation error when fields are empty", async () => {
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/please provide both email and password/i)
    ).toBeInTheDocument();
  });

  it("displays invalid credentials error", async () => {
    mockedSignIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "wrongpass"
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockedSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({
        redirect: false,
        email: "user@example.com",
        password: "wrongpass",
      })
    );

    expect(
      await screen.findByText(/invalid credentials/i)
    ).toBeInTheDocument();
  });

  it("redirects admin users to /admin on success", async () => {
    mockedSignIn.mockResolvedValue({ ok: true, error: undefined });
    fetchMock().mockResolvedValueOnce({
      json: async () => ({ user: { role: "admin" } }),
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "secret123"
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin");
    });
  });

  it("redirects to callbackUrl for non-admin users when provided", async () => {
    mockedSignIn.mockResolvedValue({ ok: true, error: undefined });
    mockedUseSearchParams.mockReturnValue(
      new URLSearchParams("callbackUrl=/tickets/123")
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "secret123"
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/tickets/123");
    });
  });

  it("toggles password visibility", async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i, {
      selector: "input",
    }) as HTMLInputElement;

    expect(passwordInput.type).toBe("password");

    await user.click(screen.getByLabelText(/show password/i));
    expect(passwordInput.type).toBe("text");

    await user.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput.type).toBe("password");
  });
});
