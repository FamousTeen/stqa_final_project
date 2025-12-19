import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "@/app/components/ForgotPasswordForm";
import { supabase } from "@/app/lib/supabaseClient";

jest.mock("@/app/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

describe("ForgotPasswordForm", () => {
  const user = userEvent.setup();
  const resetPassword = (supabase as unknown as {
    auth: { resetPasswordForEmail: jest.Mock };
  }).auth.resetPasswordForEmail;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates missing email", async () => {
    render(<ForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText(/please enter your email/i)
    ).toBeInTheDocument();
  });

  it("shows error when supabase returns an error", async () => {
    resetPassword.mockResolvedValue({
      error: { message: "Bad email" },
    });

    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/email/i), "bad@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(resetPassword).toHaveBeenCalled();
    expect(await screen.findByText(/bad email/i)).toBeInTheDocument();
  });

  it("shows success message on success", async () => {
    resetPassword.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(resetPassword).toHaveBeenCalledWith("user@example.com", {
      redirectTo: expect.any(String),
    });
    expect(
      await screen.findByText(/check your email for password reset/i)
    ).toBeInTheDocument();
  });
});