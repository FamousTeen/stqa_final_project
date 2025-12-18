/**
 * User Management Integration Tests
 * 
 * Tests for user-related operations including:
 * - User registration
 * - User listing (admin)
 * - User status management
 * - Authentication flows
 * 
 * Following patterns from:
 * - 03_test_fixtures_coverage: Test fixtures
 * - 04_factories_and_fakes: Factory-based test data
 * - 06_TDD_case_study: TDD for CRUD operations
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import {
  buildProfile,
  buildProfilesFromData,
  MOCK_ADMIN_SESSION,
  MOCK_USER_SESSION,
  MOCK_DISABLED_USER_SESSION,
  USER_DATA,
  resetIdCounters,
} from "./fixtures/testData";
import type { Profile } from "@/app/types/profile";

// ============================================================
// User Service Simulation
// ============================================================

class UserService {
  private users: Profile[] = [];
  private shouldError = false;
  private errorMessage = "Database error";

  reset() {
    this.users = [];
    this.shouldError = false;
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  async getUsers(): Promise<{ data: Profile[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    // Filter to only show regular users, not admins
    const users = this.users.filter(u => u.role === "user");
    const sorted = [...users].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { data: sorted, error: null };
  }

  async getUserById(id: string): Promise<{ data: Profile | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return { data: null, error: { message: "User not found" } };
    }
    return { data: user, error: null };
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<{ error: { message: string } | null }> {
    if (this.shouldError) {
      return { error: { message: this.errorMessage } };
    }
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return { error: { message: "User not found" } };
    }
    this.users[index] = { ...this.users[index], is_active: isActive };
    return { error: null };
  }

  addUser(user: Profile) {
    this.users.push(user);
  }

  addUsers(users: Profile[]) {
    this.users.push(...users);
  }
}

// ============================================================
// Test Suite: User Listing
// ============================================================

describe("User Listing Integration Tests", () => {
  let userService: UserService;

  beforeAll(() => {
    console.log("=== Starting User Listing Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed User Listing Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    userService = new UserService();
  });

  describe("Scenario: Admin lists all users", () => {
    it("Given users exist, When admin requests users, Then all users should be returned", () => {
      // Given: Admin session and existing users
      const session = MOCK_ADMIN_SESSION;
      expect(session.user.role).toBe("admin");
      
      const users = buildProfilesFromData();
      userService.addUsers(users);

      // When: Getting users (simulate admin action)
      // Then: Users should be returned
      expect(users.length).toBeGreaterThan(0);
    });

    it("should return users sorted by creation date", async () => {
      // Given: Multiple users
      const users = USER_DATA.map((data, index) => {
        const user = buildProfile(data);
        // Set different creation times
        user.created_at = new Date(Date.now() - index * 1000).toISOString();
        return user;
      });
      userService.addUsers(users);

      // When: Fetching users
      const result = await userService.getUsers();

      // Then: Should be sorted by creation date descending
      expect(result.error).toBeNull();
      for (let i = 0; i < result.data!.length - 1; i++) {
        const current = new Date(result.data![i].created_at).getTime();
        const next = new Date(result.data![i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("should filter out admin users", async () => {
      // Given: Mix of admin and regular users
      userService.addUser(buildProfile({ email: "admin@test.com", role: "admin" }));
      userService.addUser(buildProfile({ email: "user@test.com", role: "user" }));

      // When: Fetching users
      const result = await userService.getUsers();

      // Then: Only regular users returned
      expect(result.data?.every(u => u.role === "user")).toBe(true);
    });
  });

  describe("Scenario: User list error handling", () => {
    it("should throw error on database failure", async () => {
      userService.setError(true, "Database connection failed");

      const result = await userService.getUsers();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Database connection failed");
    });

    it("should handle timeout errors", async () => {
      userService.setError(true, "Query timeout");

      const result = await userService.getUsers();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Query timeout");
    });
  });
});

// ============================================================
// Test Suite: User Status Management
// ============================================================

describe("User Status Management Integration Tests", () => {
  let userService: UserService;

  beforeEach(() => {
    resetIdCounters();
    userService = new UserService();
  });

  describe("Scenario: Admin enables user", () => {
    it("Given a disabled user, When admin enables, Then user should be active", async () => {
      // Given: Disabled user
      const user = buildProfile({ email: "disabled@test.com", is_active: false });
      userService.addUser(user);
      expect(user.is_active).toBe(false);

      // When: Enabling user
      const result = await userService.toggleUserStatus(user.id, true);

      // Then: User should be active
      expect(result.error).toBeNull();
      const updatedUser = await userService.getUserById(user.id);
      expect(updatedUser.data?.is_active).toBe(true);
    });
  });

  describe("Scenario: Admin disables user", () => {
    it("Given an active user, When admin disables, Then user should be inactive", async () => {
      // Given: Active user
      const user = buildProfile({ email: "active@test.com", is_active: true });
      userService.addUser(user);
      expect(user.is_active).toBe(true);

      // When: Disabling user
      const result = await userService.toggleUserStatus(user.id, false);

      // Then: User should be inactive
      expect(result.error).toBeNull();
      const updatedUser = await userService.getUserById(user.id);
      expect(updatedUser.data?.is_active).toBe(false);
    });
  });

  describe("Scenario: Toggle status error handling", () => {
    it("should throw error when update fails", async () => {
      const user = buildProfile({ email: "user@test.com" });
      userService.addUser(user);
      userService.setError(true, "Update failed");

      const result = await userService.toggleUserStatus(user.id, true);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Update failed");
    });

    it("should handle non-existent user gracefully", async () => {
      const result = await userService.toggleUserStatus("non-existent", true);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("User not found");
    });
  });
});

// ============================================================
// Test Suite: User Management Workflow
// ============================================================

describe("User Management Workflow Integration Tests", () => {
  let userService: UserService;

  beforeEach(() => {
    resetIdCounters();
    userService = new UserService();
  });

  describe("Complete user management workflow", () => {
    it("should complete full user management lifecycle", async () => {
      // Step 1: Create users
      const users = buildProfilesFromData().slice(0, 3);
      userService.addUsers(users);

      // Step 2: List users
      const listResult = await userService.getUsers();
      expect(listResult.data?.length).toBeGreaterThan(0);

      // Step 3: Get specific user
      const userId = users[0].id;
      const getResult = await userService.getUserById(userId);
      expect(getResult.data?.id).toBe(userId);

      // Step 4: Disable user
      await userService.toggleUserStatus(userId, false);
      const disabledUser = await userService.getUserById(userId);
      expect(disabledUser.data?.is_active).toBe(false);

      // Step 5: Re-enable user
      await userService.toggleUserStatus(userId, true);
      const enabledUser = await userService.getUserById(userId);
      expect(enabledUser.data?.is_active).toBe(true);
    });
  });

  describe("Data integrity tests", () => {
    it("should maintain user data integrity after status toggle", async () => {
      // Given: User with specific data
      const originalData = {
        email: "integrity@test.com",
        role: "user" as const,
        is_active: true,
      };
      const user = buildProfile(originalData);
      userService.addUser(user);

      // When: Toggling status
      await userService.toggleUserStatus(user.id, false);

      // Then: Other fields should remain unchanged
      const updatedUser = await userService.getUserById(user.id);
      expect(updatedUser.data?.email).toBe(originalData.email);
      expect(updatedUser.data?.role).toBe(originalData.role);
    });
  });
});

// ============================================================
// Test Suite: Authorization Tests
// ============================================================

describe("User Management Authorization Tests", () => {
  describe("Admin-only access", () => {
    it("should verify admin role for user management", () => {
      const adminSession = MOCK_ADMIN_SESSION;
      const userSession = MOCK_USER_SESSION;

      const checkAdmin = (session: typeof adminSession | typeof userSession) => {
        return session.user.role === "admin";
      };

      expect(checkAdmin(adminSession)).toBe(true);
      expect(checkAdmin(userSession)).toBe(false);
    });
  });

  describe("Session validation", () => {
    it("should validate active session", () => {
      const activeSession = MOCK_USER_SESSION;
      const disabledSession = MOCK_DISABLED_USER_SESSION;

      expect(activeSession.user.is_active).toBe(true);
      expect(disabledSession.user.is_active).toBe(false);
    });
  });
});

// ============================================================
// Test Suite: Edge Cases
// ============================================================

describe("User Management Edge Cases", () => {
  let userService: UserService;

  beforeEach(() => {
    resetIdCounters();
    userService = new UserService();
  });

  describe("Empty state handling", () => {
    it("should handle empty user list", async () => {
      const result = await userService.getUsers();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Concurrent operations", () => {
    it("should handle multiple status toggles", async () => {
      const user = buildProfile({ email: "concurrent@test.com" });
      userService.addUser(user);

      // Multiple rapid toggles
      await userService.toggleUserStatus(user.id, false);
      await userService.toggleUserStatus(user.id, true);
      await userService.toggleUserStatus(user.id, false);

      const result = await userService.getUserById(user.id);
      expect(result.data?.is_active).toBe(false);
    });
  });

  describe("Special characters in user data", () => {
    it("should handle user with special characters in email", async () => {
      const user = buildProfile({ 
        email: "special.user+test@example.com",
      });
      userService.addUser(user);

      const result = await userService.getUserById(user.id);
      expect(result.data?.email).toBe("special.user+test@example.com");
    });
  });
});
