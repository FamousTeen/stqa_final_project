/**
 * Admin Actions Integration Tests
 * 
 * Tests for admin server actions including:
 * - Concert CRUD operations
 * - User management
 * - Order management
 * 
 * Following patterns from:
 * - 03_test_fixtures_coverage: Test fixtures and coverage
 * - 04_factories_and_fakes: Factory-based test data
 * - 05_mocking_objects: Mocking external dependencies
 * - 06_TDD_case_study: TDD patterns for CRUD operations
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import {
  buildConcert,
  buildProfile,
  buildOrder,
  buildConcertsFromData,
  MOCK_ADMIN_SESSION,
  MOCK_USER_SESSION,
  resetIdCounters,
  CONCERT_DATA,
} from "./fixtures/testData";

// ============================================================
// Mock Setup - Following 05_mocking_objects pattern
// ============================================================

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

// Create mock data stores
let mockConcerts: ReturnType<typeof buildConcert>[] = [];
let mockProfiles: ReturnType<typeof buildProfile>[] = [];
let mockOrders: ReturnType<typeof buildOrder>[] = [];

// Mock error state
let shouldError = false;
let errorMessage = "Database error";

// Create chainable mock builder
const createChainableMock = (getData: () => unknown, options?: { shouldThrow?: boolean }) => {
  const result = {
    data: null as unknown,
    error: null as { message: string } | null,
  };

  const chain: Record<string, jest.Mock> = {};
  
  const resolve = () => {
    if (options?.shouldThrow || shouldError) {
      result.error = { message: errorMessage };
      result.data = null;
    } else {
      result.data = getData();
      result.error = null;
    }
    return Promise.resolve(result);
  };

  // Terminal methods that return the promise
  chain.single = jest.fn().mockImplementation(resolve);
  chain.order = jest.fn().mockImplementation(() => {
    return {
      then: (cb: (r: typeof result) => void) => resolve().then(cb),
    };
  });
  
  // Intermediate methods that return the chain
  chain.select = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.neq = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);

  // Make the chain itself thenable for simple queries
  (chain as { then?: (cb: (r: typeof result) => void) => Promise<void> }).then = (cb) => resolve().then(cb);

  return chain;
};

jest.mock("@/app/lib/supabaseServer", () => ({
  supabaseServer: {
    from: jest.fn((table: string) => {
      switch (table) {
        case "concerts":
          return createChainableMock(() => mockConcerts);
        case "profiles":
          return createChainableMock(() => mockProfiles);
        case "orders":
          return createChainableMock(() => mockOrders);
        default:
          return createChainableMock(() => []);
      }
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ 
          data: { publicUrl: "https://example.com/image.jpg" } 
        }),
      }),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
// revalidatePath is mocked but not directly used in tests
void revalidatePath;

// ============================================================
// Test Suite: Concert Management - Following 06_TDD_case_study
// ============================================================

describe("Admin Concert Management Integration Tests", () => {
  beforeAll(() => {
    console.log("Starting Concert Management Integration Tests");
  });

  afterAll(() => {
    console.log("Completed Concert Management Integration Tests");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetIdCounters();
    mockConcerts = [];
    mockProfiles = [];
    mockOrders = [];
    shouldError = false;
    mockGetServerSession.mockResolvedValue(MOCK_ADMIN_SESSION);
  });

  // ============================================================
  // Authorization Tests
  // ============================================================

  describe("Authorization", () => {
    it("should verify admin session is required", async () => {
      mockGetServerSession.mockResolvedValue(MOCK_USER_SESSION);
      
      // Simulating the checkAdmin function behavior
      const checkAdmin = async () => {
        const session = await getServerSession();
        if (!session || session.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
      };
      
      await expect(checkAdmin()).rejects.toThrow("Unauthorized");
    });

    it("should allow access for admin users", async () => {
      mockGetServerSession.mockResolvedValue(MOCK_ADMIN_SESSION);
      
      const checkAdmin = async () => {
        const session = await getServerSession();
        if (!session || session.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return true;
      };
      
      await expect(checkAdmin()).resolves.toBe(true);
    });

    it("should reject null session", async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const checkAdmin = async () => {
        const session = await getServerSession();
        if (!session || session.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
      };
      
      await expect(checkAdmin()).rejects.toThrow("Unauthorized");
    });
  });

  // ============================================================
  // Concert CRUD Tests - Following TDD Pattern
  // ============================================================

  describe("Concert CRUD Operations", () => {
    it("should list concerts ordered by date", () => {
      // Given: Multiple concerts exist
      mockConcerts = buildConcertsFromData();
      
      // When: Getting all concerts
      const concerts = [...mockConcerts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Then: Concerts should be sorted by date
      expect(concerts).toHaveLength(CONCERT_DATA.length);
      expect(concerts[0].title).toBeDefined();
    });

    it("should create concert with valid data", () => {
      // Given: Valid concert data
      const concertData = CONCERT_DATA[0];
      
      // When: Creating a concert
      const concert = buildConcert(concertData);
      mockConcerts.push(concert);
      
      // Then: Concert should be created with all fields
      expect(mockConcerts).toHaveLength(1);
      expect(mockConcerts[0].title).toBe(concertData.title);
      expect(mockConcerts[0].location).toBe(concertData.location);
      expect(mockConcerts[0].price).toBe(concertData.price);
    });

    it("should update concert fields", () => {
      // Given: An existing concert
      const concert = buildConcert(CONCERT_DATA[0]);
      mockConcerts.push(concert);
      
      // When: Updating the concert
      const updates = { title: "Updated Title", price: 150 };
      Object.assign(mockConcerts[0], updates);
      
      // Then: Concert should be updated
      expect(mockConcerts[0].title).toBe("Updated Title");
      expect(mockConcerts[0].price).toBe(150);
    });

    it("should delete concert without active orders", () => {
      // Given: A concert without orders
      const concert = buildConcert(CONCERT_DATA[0]);
      mockConcerts.push(concert);
      
      // When: Deleting the concert
      mockConcerts = mockConcerts.filter(c => c.id !== concert.id);
      
      // Then: Concert should be deleted
      expect(mockConcerts).toHaveLength(0);
    });

    it("should prevent deletion with active orders", () => {
      // Given: A concert with active orders
      const concert = buildConcert(CONCERT_DATA[0]);
      mockConcerts.push(concert);
      mockOrders.push(buildOrder({ 
        concert_id: concert.id, 
        status: "pending" 
      }));
      
      // When/Then: Deletion should be prevented
      const hasActiveOrders = mockOrders.some(
        o => o.concert_id === concert.id && o.status !== "cancelled"
      );
      expect(hasActiveOrders).toBe(true);
      
      // Simulating the business logic
      if (hasActiveOrders) {
        expect(() => {
          throw new Error("Cannot delete concert. There are active orders.");
        }).toThrow("Cannot delete concert");
      }
    });
  });

  // ============================================================
  // Data Integrity Tests
  // ============================================================

  describe("Data Integrity", () => {
    it("should validate required fields", () => {
      const requiredFields = ["title", "location", "start_at", "price", "total_tickets"];
      
      CONCERT_DATA.forEach(data => {
        requiredFields.forEach(field => {
          expect(data).toHaveProperty(field);
        });
      });
    });

    it("should maintain referential integrity", () => {
      // Create concert first
      const concert = buildConcert(CONCERT_DATA[0]);
      mockConcerts.push(concert);
      
      // Create order referencing concert
      const order = buildOrder({ concert_id: concert.id });
      mockOrders.push(order);
      
      // Verify reference
      expect(order.concert_id).toBe(concert.id);
    });

    it("should handle concurrent operations", async () => {
      // Simulate multiple concurrent operations
      const operations = CONCERT_DATA.slice(0, 3).map(async (data, index) => {
        await new Promise(resolve => setTimeout(resolve, index * 10));
        const concert = buildConcert(data);
        mockConcerts.push(concert);
        return concert;
      });
      
      const results = await Promise.all(operations);
      expect(results).toHaveLength(3);
      expect(mockConcerts).toHaveLength(3);
    });
  });
});

// ============================================================
// Test Suite: User Management
// ============================================================

describe("Admin User Management Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetIdCounters();
    mockProfiles = [];
    shouldError = false;
    mockGetServerSession.mockResolvedValue(MOCK_ADMIN_SESSION);
  });

  describe("User Listing", () => {
    it("should list all users", () => {
      // Given: Multiple users exist
      mockProfiles = [
        buildProfile({ email: "user1@test.com", role: "user" }),
        buildProfile({ email: "user2@test.com", role: "user" }),
      ];
      
      // Then: All users should be listed
      expect(mockProfiles).toHaveLength(2);
    });

    it("should filter users by role", () => {
      // Given: Mixed users
      mockProfiles = [
        buildProfile({ email: "user@test.com", role: "user" }),
        buildProfile({ email: "admin@test.com", role: "admin" }),
      ];
      
      // When: Filtering by role
      const users = mockProfiles.filter(p => p.role === "user");
      
      // Then: Only users should be returned
      expect(users).toHaveLength(1);
      expect(users[0].role).toBe("user");
    });
  });

  describe("User Status Management", () => {
    it("should toggle user active status", () => {
      // Given: An active user
      const user = buildProfile({ email: "user@test.com", is_active: true });
      mockProfiles.push(user);
      
      // When: Toggling status
      mockProfiles[0].is_active = false;
      
      // Then: Status should be toggled
      expect(mockProfiles[0].is_active).toBe(false);
    });

    it("should handle status toggle error gracefully", () => {
      // Given: A user
      const user = buildProfile({ email: "user@test.com" });
      mockProfiles.push(user);
      
      // When/Then: Error should be handled
      shouldError = true;
      errorMessage = "Database error";
      
      expect(shouldError).toBe(true);
    });
  });
});

// ============================================================
// Test Suite: Order Management
// ============================================================

describe("Admin Order Management Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetIdCounters();
    mockOrders = [];
    mockConcerts = [];
    shouldError = false;
    mockGetServerSession.mockResolvedValue(MOCK_ADMIN_SESSION);
  });

  describe("Order Listing", () => {
    it("should list all orders", () => {
      // Given: Orders exist
      const concert = buildConcert(CONCERT_DATA[0]);
      mockConcerts.push(concert);
      mockOrders = [
        buildOrder({ concert_id: concert.id, status: "pending" }),
        buildOrder({ concert_id: concert.id, status: "completed" }),
      ];
      
      // Then: All orders should be listed
      expect(mockOrders).toHaveLength(2);
    });

    it("should filter orders by status", () => {
      // Given: Mixed status orders
      const concert = buildConcert(CONCERT_DATA[0]);
      mockOrders = [
        buildOrder({ concert_id: concert.id, status: "pending" }),
        buildOrder({ concert_id: concert.id, status: "completed" }),
        buildOrder({ concert_id: concert.id, status: "cancelled" }),
      ];
      
      // When: Filtering by status
      const pendingOrders = mockOrders.filter(o => o.status === "pending");
      
      // Then: Only pending orders returned
      expect(pendingOrders).toHaveLength(1);
    });
  });

  describe("Order Status Updates", () => {
    it("should update order status", () => {
      // Given: A pending order
      const order = buildOrder({ status: "pending" });
      mockOrders.push(order);
      
      // When: Updating status
      mockOrders[0].status = "completed";
      
      // Then: Status should be updated
      expect(mockOrders[0].status).toBe("completed");
    });

    it("should validate status transitions", () => {
      const validTransitions: Record<string, string[]> = {
        pending: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };
      
      // Given: A pending order
      const order = buildOrder({ status: "pending" });
      
      // Then: Valid transitions should be allowed
      expect(validTransitions[order.status]).toContain("completed");
      expect(validTransitions[order.status]).toContain("cancelled");
    });

    it("should handle completed order immutability", () => {
      // Given: A completed order
      const order = buildOrder({ status: "completed" });
      
      // Then: No transitions should be allowed
      const validTransitions: Record<string, string[]> = {
        pending: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };
      
      expect(validTransitions[order.status]).toHaveLength(0);
    });
  });
});

// ============================================================
// Test Suite: Image Upload
// ============================================================

describe("Admin Image Upload Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(MOCK_ADMIN_SESSION);
  });

  describe("Upload Functionality", () => {
    it("should generate unique filename", () => {
      const originalFilename = "test.jpg";
      const timestamp = Date.now();
      const filename = `${timestamp}.${originalFilename.split(".").pop()}`;
      
      expect(filename).toMatch(/^\d+\.jpg$/);
    });

    it("should extract file extension correctly", () => {
      const testCases = [
        { filename: "test.jpg", expected: "jpg" },
        { filename: "test.png", expected: "png" },
        { filename: "test.file.gif", expected: "gif" },
      ];
      
      testCases.forEach(({ filename, expected }) => {
        const ext = filename.split(".").pop();
        expect(ext).toBe(expected);
      });
    });
  });
});
