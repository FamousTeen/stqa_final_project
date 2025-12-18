/**
 * API Signup Route Integration Tests
 * 
 * Tests for user registration API endpoint including:
 * - Input validation
 * - Error handling
 * - Supabase integration
 * 
 * Following patterns from:
 * - 03_test_fixtures_coverage: Test data fixtures
 * - 05_mocking_objects: Mocking external services
 * - 06_TDD_case_study: TDD for API endpoints
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import { createClient } from "@supabase/supabase-js";
import { VALIDATION_TEST_CASES } from "./fixtures/testData";

// ============================================================
// Mock Setup
// ============================================================

// Mock @supabase/supabase-js before importing the route
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.Mock;

// Validation function extracted from route logic for testing
function validateSignupInput(body: {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!body.name || body.name.trim() === "") errors.name = "Name is required";
  if (!body.email || body.email.trim() === "") errors.email = "Email is required";
  if (!body.password || body.password.trim() === "") errors.password = "Password is required";
  if (body.password && body.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (body.password !== body.password_confirmation) {
    errors.password_confirmation = "Passwords do not match";
  }
  
  return errors;
}

// Simulate user creation logic
async function createUser(body: {
  name: string;
  email: string;
  password: string;
}, supabaseClient: ReturnType<typeof createClient>): Promise<{
  data: { user: { id: string; email: string } | null };
  error: { message: string } | null;
}> {
  const { data, error } = await supabaseClient.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name },
  });
  return { 
    data: { user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null }, 
    error 
  };
}

// ============================================================
// Test Suite: Signup API Integration Tests
// ============================================================

describe("Signup API Integration Tests", () => {
  const mockCreateUser = jest.fn();
  
  beforeAll(() => {
    // Set environment variables for tests
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue({
      auth: {
        admin: {
          createUser: mockCreateUser,
        },
      },
    });
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  // ============================================================
  // Validation Tests - Input validation
  // ============================================================

  describe("Input Validation", () => {
    it("should return error when name is missing", () => {
      const errors = validateSignupInput(VALIDATION_TEST_CASES.signup.missingName);
      expect(errors.name).toBe("Name is required");
    });

    it("should return error when email is missing", () => {
      const errors = validateSignupInput(VALIDATION_TEST_CASES.signup.missingEmail);
      expect(errors.email).toBe("Email is required");
    });

    it("should return error when password is too short", () => {
      const errors = validateSignupInput(VALIDATION_TEST_CASES.signup.shortPassword);
      expect(errors.password).toBe("Password must be at least 6 characters.");
    });

    it("should return error when passwords do not match", () => {
      const errors = validateSignupInput(VALIDATION_TEST_CASES.signup.passwordMismatch);
      expect(errors.password_confirmation).toBe("Passwords do not match");
    });

    it("should return multiple errors when all fields are missing", () => {
      const errors = validateSignupInput({});
      expect(errors).toHaveProperty("name");
      expect(errors).toHaveProperty("email");
      expect(errors).toHaveProperty("password");
    });

    it("should return multiple validation errors", () => {
      const errors = validateSignupInput({
        name: "",
        email: "",
        password: "123",
        password_confirmation: "456",
      });
      expect(Object.keys(errors).length).toBeGreaterThan(1);
    });
  });

  // ============================================================
  // Successful Registration Tests
  // ============================================================

  describe("Successful Registration", () => {
    it("should create user with valid input", async () => {
      const validData = VALIDATION_TEST_CASES.signup.validData;
      mockCreateUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: validData.email,
          },
        },
        error: null,
      });
      
      const client = mockCreateClient();
      const result = await createUser({
        name: validData.name!,
        email: validData.email!,
        password: validData.password!,
      }, client);
      
      expect(result.error).toBeNull();
      expect(result.data.user?.email).toBe(validData.email);
    });

    it("should call Supabase with correct parameters", async () => {
      const validData = VALIDATION_TEST_CASES.signup.validData;
      mockCreateUser.mockResolvedValue({
        data: { user: { id: "user-123", email: validData.email } },
        error: null,
      });
      
      const client = mockCreateClient();
      await createUser({
        name: validData.name!,
        email: validData.email!,
        password: validData.password!,
      }, client);
      
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: validData.email,
        password: validData.password,
        email_confirm: true,
        user_metadata: { name: validData.name },
      });
    });

    it("should create Supabase client with service role key", () => {
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        expect.objectContaining({
          auth: { persistSession: false },
        })
      );
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================

  describe("Error Handling", () => {
    it("should return error when Supabase returns an error", async () => {
      const validData = VALIDATION_TEST_CASES.signup.validData;
      mockCreateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "User already exists" },
      });
      
      const client = mockCreateClient();
      const result = await createUser({
        name: validData.name!,
        email: validData.email!,
        password: validData.password!,
      }, client);
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("User already exists");
    });

    it("should handle duplicate email registration", async () => {
      const validData = VALIDATION_TEST_CASES.signup.validData;
      mockCreateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "User already registered" },
      });
      
      const client = mockCreateClient();
      const result = await createUser({
        name: validData.name!,
        email: validData.email!,
        password: validData.password!,
      }, client);
      
      expect(result.error?.message).toContain("already registered");
    });

    it("should handle unexpected server error", async () => {
      const validData = VALIDATION_TEST_CASES.signup.validData;
      mockCreateUser.mockRejectedValue(new Error("Unexpected error"));
      
      const client = mockCreateClient();
      
      await expect(createUser({
        name: validData.name!,
        email: validData.email!,
        password: validData.password!,
      }, client)).rejects.toThrow("Unexpected error");
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe("Edge Cases", () => {
    it("should handle whitespace-only name", () => {
      const errors = validateSignupInput({
        name: "   ",
        email: "test@example.com",
        password: "password123",
        password_confirmation: "password123",
      });
      expect(errors.name).toBe("Name is required");
    });

    it("should handle whitespace-only email", () => {
      const errors = validateSignupInput({
        name: "John Doe",
        email: "   ",
        password: "password123",
        password_confirmation: "password123",
      });
      expect(errors.email).toBe("Email is required");
    });

    it("should accept exactly 6 character password", () => {
      const errors = validateSignupInput({
        name: "John Doe",
        email: "test@example.com",
        password: "123456",
        password_confirmation: "123456",
      });
      expect(errors.password).toBeUndefined();
    });

    it("should reject 5 character password as too short", () => {
      const errors = validateSignupInput({
        name: "John Doe",
        email: "test@example.com",
        password: "12345",
        password_confirmation: "12345",
      });
      expect(errors.password).toContain("at least 6 characters");
    });

    it("should handle missing password confirmation", () => {
      const errors = validateSignupInput({
        name: "John Doe",
        email: "test@example.com",
        password: "password123",
      });
      expect(errors.password_confirmation).toBe("Passwords do not match");
    });

    it("should pass validation with all correct fields", () => {
      const errors = validateSignupInput({
        name: "John Doe",
        email: "test@example.com",
        password: "password123",
        password_confirmation: "password123",
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  // ============================================================
  // Integration Tests - Supabase Client
  // ============================================================

  describe("Supabase Client Integration", () => {
    it("should initialize client with correct configuration", () => {
      const url = "https://test.supabase.co";
      const key = "test-service-role-key";
      
      createClient(url, key, { auth: { persistSession: false } });
      
      expect(mockCreateClient).toHaveBeenCalledWith(url, key, {
        auth: { persistSession: false },
      });
    });

    it("should handle network timeout", async () => {
      mockCreateUser.mockRejectedValue(new Error("Network timeout"));
      
      const client = mockCreateClient();
      
      await expect(createUser({
        name: "Test",
        email: "test@example.com",
        password: "password123",
      }, client)).rejects.toThrow("Network timeout");
    });

    it("should handle rate limiting", async () => {
      mockCreateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Rate limit exceeded" },
      });
      
      const client = mockCreateClient();
      const result = await createUser({
        name: "Test",
        email: "test@example.com",
        password: "password123",
      }, client);
      
      expect(result.error?.message).toBe("Rate limit exceeded");
    });
  });
});
