/**
 * Reset Password Integration Tests
 * 
 * Tests for password reset functionality including:
 * - Forgot password flow (request reset email)
 * - Reset password flow (set new password)
 * - Validation and error handling
 * 
 * Following patterns from:
 * - 05_mocking_objects: Mocking Supabase auth
 * - 07_BDD_behave: Behavior-driven scenarios
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import {
  MOCK_USER_SESSION,
  VALIDATION_TEST_CASES,
  resetIdCounters,
} from "./fixtures/testData";

// ============================================================
// Password Reset Service Simulation
// ============================================================

interface ResetEmailResult {
  error: { message: string } | null;
}

interface UpdatePasswordResult {
  error: { message: string } | null;
  data: { user: { id: string; email: string } } | null;
}

class PasswordResetService {
  private validEmails: Set<string> = new Set();
  private resetTokens: Map<string, string> = new Map(); // email -> token
  private userPasswords: Map<string, string> = new Map(); // email -> password
  private shouldError = false;
  private errorMessage = "Service error";

  reset() {
    this.validEmails.clear();
    this.resetTokens.clear();
    this.userPasswords.clear();
    this.shouldError = false;
  }

  addUser(email: string, password: string) {
    this.validEmails.add(email);
    this.userPasswords.set(email, password);
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  /**
   * Simulate supabase.auth.resetPasswordForEmail
   */
  async requestPasswordReset(
    email: string,
    options?: { redirectTo?: string }
  ): Promise<ResetEmailResult> {
    if (this.shouldError) {
      return { error: { message: this.errorMessage } };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: { message: "Invalid email format" } };
    }

    // Check if email is empty
    if (!email || email.trim() === "") {
      return { error: { message: "Email is required" } };
    }

    // Note: Supabase doesn't reveal if email exists for security
    // It always returns success even if email doesn't exist
    // But we simulate token generation for valid users
    if (this.validEmails.has(email)) {
      const token = `reset_${Date.now()}_${Math.random().toString(36)}`;
      this.resetTokens.set(email, token);
    }

    // Always return success (Supabase behavior for security)
    return { error: null };
  }

  /**
   * Simulate supabase.auth.updateUser with password
   */
  async updatePassword(
    newPassword: string,
    userEmail?: string
  ): Promise<UpdatePasswordResult> {
    if (this.shouldError) {
      return { error: { message: this.errorMessage }, data: null };
    }

    // Validate password length
    if (newPassword.length < 6) {
      return { error: { message: "Password must be at least 6 characters" }, data: null };
    }

    // Validate password not empty
    if (!newPassword || newPassword.trim() === "") {
      return { error: { message: "Password is required" }, data: null };
    }

    // If user email provided, update their password
    if (userEmail && this.validEmails.has(userEmail)) {
      this.userPasswords.set(userEmail, newPassword);
      return {
        error: null,
        data: { user: { id: "user-1", email: userEmail } },
      };
    }

    // Simulate authenticated user context
    const mockEmail = "user@example.com";
    if (this.validEmails.has(mockEmail)) {
      this.userPasswords.set(mockEmail, newPassword);
      return {
        error: null,
        data: { user: { id: "user-1", email: mockEmail } },
      };
    }

    return { error: { message: "User not authenticated" }, data: null };
  }

  /**
   * Verify token validity
   */
  verifyResetToken(email: string, token: string): boolean {
    return this.resetTokens.get(email) === token;
  }

  /**
   * Get current password (for testing)
   */
  getPassword(email: string): string | undefined {
    return this.userPasswords.get(email);
  }
}

// ============================================================
// Forgot Password Form Validation (extracted logic)
// ============================================================

interface ForgotPasswordValidation {
  isValid: boolean;
  error?: string;
}

function validateForgotPasswordInput(email: string): ForgotPasswordValidation {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Please enter your email address." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  return { isValid: true };
}

// ============================================================
// Reset Password Form Validation (extracted logic)
// ============================================================

interface ResetPasswordValidation {
  isValid: boolean;
  error?: string;
}

function validateResetPasswordInput(
  password: string,
  confirmPassword: string
): ResetPasswordValidation {
  if (!password || password.trim() === "") {
    return { isValid: false, error: "Password is required." };
  }

  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match." };
  }

  return { isValid: true };
}

// ============================================================
// Test Suite: Forgot Password Flow
// ============================================================

describe("Forgot Password Integration Tests", () => {
  let passwordService: PasswordResetService;

  beforeAll(() => {
    console.log("=== Starting Forgot Password Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed Forgot Password Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    passwordService = new PasswordResetService();
    passwordService.addUser("user@example.com", "oldpassword123");
    passwordService.addUser("admin@example.com", "adminpass123");
  });

  describe("Scenario: User requests password reset", () => {
    it("Given valid email, When requesting reset, Then should send email", async () => {
      // Given
      const email = "user@example.com";
      const validation = validateForgotPasswordInput(email);

      // When
      expect(validation.isValid).toBe(true);
      const result = await passwordService.requestPasswordReset(email);

      // Then
      expect(result.error).toBeNull();
    });

    it("should accept redirectTo parameter", async () => {
      const email = "user@example.com";
      const redirectTo = "http://localhost:3000/auth/reset-pass";

      const result = await passwordService.requestPasswordReset(email, { redirectTo });

      expect(result.error).toBeNull();
    });

    it("should succeed even for non-existent email (security)", async () => {
      // Supabase doesn't reveal if email exists
      const result = await passwordService.requestPasswordReset("unknown@example.com");

      expect(result.error).toBeNull();
    });
  });

  describe("Scenario: Forgot password form validation", () => {
    it("should reject empty email", () => {
      const validation = validateForgotPasswordInput("");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Please enter your email address.");
    });

    it("should reject whitespace-only email", () => {
      const validation = validateForgotPasswordInput("   ");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Please enter your email address.");
    });

    it("should reject invalid email format", () => {
      const invalidEmails = ["notanemail", "missing@domain", "@nodomain.com", "spaces in@email.com"];

      invalidEmails.forEach((email) => {
        const validation = validateForgotPasswordInput(email);
        expect(validation.isValid).toBe(false);
        expect(validation.error).toBe("Please enter a valid email address.");
      });
    });

    it("should accept valid email formats", () => {
      const validEmails = ["user@example.com", "test.user@domain.co.id", "user+tag@example.org"];

      validEmails.forEach((email) => {
        const validation = validateForgotPasswordInput(email);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe("Scenario: Service error handling", () => {
    it("should handle service errors gracefully", async () => {
      passwordService.setError(true, "Failed to send reset email");

      const result = await passwordService.requestPasswordReset("user@example.com");

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Failed to send reset email");
    });

    it("should handle network timeout simulation", async () => {
      passwordService.setError(true, "Network timeout");

      const result = await passwordService.requestPasswordReset("user@example.com");

      expect(result.error?.message).toBe("Network timeout");
    });
  });
});

// ============================================================
// Test Suite: Reset Password Flow
// ============================================================

describe("Reset Password Integration Tests", () => {
  let passwordService: PasswordResetService;

  beforeEach(() => {
    resetIdCounters();
    passwordService = new PasswordResetService();
    passwordService.addUser("user@example.com", "oldpassword123");
  });

  describe("Scenario: User sets new password", () => {
    it("Given valid password, When updating, Then password should change", async () => {
      // Given
      const newPassword = "newpassword123";
      const confirmPassword = "newpassword123";
      const validation = validateResetPasswordInput(newPassword, confirmPassword);

      // When
      expect(validation.isValid).toBe(true);
      const result = await passwordService.updatePassword(newPassword, "user@example.com");

      // Then
      expect(result.error).toBeNull();
      expect(result.data?.user.email).toBe("user@example.com");
      expect(passwordService.getPassword("user@example.com")).toBe(newPassword);
    });

    it("should update password for authenticated user", async () => {
      const result = await passwordService.updatePassword("securepassword123", "user@example.com");

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
    });
  });

  describe("Scenario: Reset password form validation", () => {
    it("should reject empty password", () => {
      const validation = validateResetPasswordInput("", "");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Password is required.");
    });

    it("should reject password shorter than 6 characters", () => {
      const validation = validateResetPasswordInput("12345", "12345");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Password must be at least 6 characters.");
    });

    it("should reject mismatched passwords", () => {
      const validation = validateResetPasswordInput("password123", "differentpassword");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe("Passwords do not match.");
    });

    it("should accept valid matching passwords", () => {
      const validation = validateResetPasswordInput("validpassword123", "validpassword123");

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it("should accept exactly 6 character password", () => {
      const validation = validateResetPasswordInput("123456", "123456");

      expect(validation.isValid).toBe(true);
    });
  });

  describe("Scenario: Password update error handling", () => {
    it("should handle service errors", async () => {
      passwordService.setError(true, "Failed to update password");

      const result = await passwordService.updatePassword("newpassword123");

      expect(result.error?.message).toBe("Failed to update password");
    });

    it("should reject short passwords at service level", async () => {
      const result = await passwordService.updatePassword("short", "user@example.com");

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("at least 6 characters");
    });
  });
});

// ============================================================
// Test Suite: Complete Password Reset Workflow
// ============================================================

describe("Complete Password Reset Workflow Integration Tests", () => {
  let passwordService: PasswordResetService;

  beforeEach(() => {
    resetIdCounters();
    passwordService = new PasswordResetService();
    passwordService.addUser("user@example.com", "originalpassword");
  });

  describe("Feature: Password Reset", () => {
    it("Scenario: Complete password reset flow", async () => {
      const userEmail = "user@example.com";

      // Step 1: User requests password reset
      const resetRequest = await passwordService.requestPasswordReset(userEmail, {
        redirectTo: "http://localhost:3000/auth/reset-pass",
      });
      expect(resetRequest.error).toBeNull();

      // Step 2: User clicks link (token validated)
      // In real scenario, Supabase handles this via URL

      // Step 3: User sets new password
      const newPassword = "mynewsecurepassword";
      const updateResult = await passwordService.updatePassword(newPassword, userEmail);

      expect(updateResult.error).toBeNull();
      expect(updateResult.data?.user.email).toBe(userEmail);

      // Step 4: Verify password was changed
      expect(passwordService.getPassword(userEmail)).toBe(newPassword);
    });

    it("Scenario: Multiple password reset requests", async () => {
      const userEmail = "user@example.com";

      // First request
      const firstRequest = await passwordService.requestPasswordReset(userEmail);
      expect(firstRequest.error).toBeNull();

      // Second request (should also succeed)
      const secondRequest = await passwordService.requestPasswordReset(userEmail);
      expect(secondRequest.error).toBeNull();
    });

    it("Scenario: Password change after successful reset", async () => {
      const userEmail = "user@example.com";
      const originalPassword = passwordService.getPassword(userEmail);

      // Request reset
      await passwordService.requestPasswordReset(userEmail);

      // Update password
      const newPassword = "completelynewpassword";
      await passwordService.updatePassword(newPassword, userEmail);

      // Verify change
      expect(passwordService.getPassword(userEmail)).not.toBe(originalPassword);
      expect(passwordService.getPassword(userEmail)).toBe(newPassword);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in password", async () => {
      const specialPassword = "P@ssw0rd!#$%";
      
      const validation = validateResetPasswordInput(specialPassword, specialPassword);
      expect(validation.isValid).toBe(true);

      const result = await passwordService.updatePassword(specialPassword, "user@example.com");
      expect(result.error).toBeNull();
    });

    it("should handle unicode characters in password", async () => {
      const unicodePassword = "密码password123";
      
      const result = await passwordService.updatePassword(unicodePassword, "user@example.com");
      expect(result.error).toBeNull();
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(100);
      
      const validation = validateResetPasswordInput(longPassword, longPassword);
      expect(validation.isValid).toBe(true);

      const result = await passwordService.updatePassword(longPassword, "user@example.com");
      expect(result.error).toBeNull();
    });
  });
});
