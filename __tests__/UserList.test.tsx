import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserList } from "@/app/admin/users/UserList";
import { toggleUserStatus } from "@/app/admin/actions";
import { Profile } from "@/app/types/profile";

jest.mock("@/app/admin/actions", () => ({
  toggleUserStatus: jest.fn(),
}));

const buildProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "user-1",
  email: "user@example.com",
  role: "user",
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("UserList (admin)", () => {
  const user = userEvent.setup();
  const mockToggle = toggleUserStatus as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders users and calls toggleUserStatus on click", async () => {
    render(<UserList users={[buildProfile()]} />);

    expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /disable/i }));

    expect(mockToggle).toHaveBeenCalledWith("user-1", false);
  });

  it("shows enable label for disabled users", () => {
    render(<UserList users={[buildProfile({ id: "user-2", is_active: false })]} />);

    expect(screen.getByRole("button", { name: /enable/i })).toBeInTheDocument();
  });
});
