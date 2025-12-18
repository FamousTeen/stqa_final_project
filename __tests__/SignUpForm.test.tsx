import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpForm from "@/app/components/SignUpForm";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("SignUpForm", () => {
  const user = userEvent.setup();
  const push = jest.fn();
  const mockedSignIn = signIn as jest.Mock;
  const mockedUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push });
    mockedSignIn.mockResolvedValue({ error: undefined });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const fillForm = async () => {
    await user.type(screen.getByLabelText(/name/i), "Jane Tester");
    await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "secret123"
    );
  };

  it("shows server-side validation errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ errors: { email: "Invalid email" } }),
    } as Response);

    render(<SignUpForm />);
    await fillForm();
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(
      await screen.findByText(/invalid email/i)
    ).toBeInTheDocument();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("auto-logs in on success and redirects home", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    mockedSignIn.mockResolvedValue({ error: undefined });

    render(<SignUpForm />);
    await fillForm();
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() =>
      expect(mockedSignIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          redirect: false,
          email: "jane@example.com",
          password: "secret123",
        })
      )
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("redirects to login when auto-login fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    mockedSignIn.mockResolvedValue({ error: "CredentialsSignin" });

    render(<SignUpForm />);
    await fillForm();
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("shows a general error on unexpected failures", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network down"));

    render(<SignUpForm />);
    await fillForm();
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(
      await screen.findByText(/unexpected error: network down/i)
    ).toBeInTheDocument();
  });
});
