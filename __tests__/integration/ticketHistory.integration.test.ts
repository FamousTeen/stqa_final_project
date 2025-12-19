/**
 * Ticket History (Purchase History) Integration Tests
 * 
 * Tests for ticket/order history page including:
 * - User's order listing
 * - Authentication requirement
 * - Order details display
 * - Order status display
 * 
 * Following patterns from:
 * - 05_mocking_objects: Mocking Supabase client
 * - 06_TDD_case_study: TDD for list operations
 * - 07_BDD_behave: Behavior-driven scenarios
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import {
  buildConcert,
  buildOrder,
  resetIdCounters,
} from "./fixtures/testData";
import type { Concert } from "@/app/types/concert";
import type { Order } from "@/app/types/order";

// ============================================================
// Ticket History Service Simulation
// ============================================================

class TicketHistoryService {
  private orders: Order[] = [];
  private concerts: Map<string, Concert> = new Map();
  private session: { user: { id: string; email: string } } | null = null;
  private shouldError = false;
  private errorMessage = "Database error";

  reset() {
    this.orders = [];
    this.concerts.clear();
    this.session = null;
    this.shouldError = false;
  }

  addConcert(concert: Concert) {
    this.concerts.set(concert.id, concert);
  }

  addOrder(order: Order) {
    this.orders.push(order);
  }

  setSession(session: { user: { id: string; email: string } } | null) {
    this.session = session;
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  /**
   * Check authentication
   */
  async checkAuthentication(): Promise<{ authenticated: boolean; redirectUrl?: string }> {
    if (!this.session) {
      return { authenticated: false, redirectUrl: "/auth/login?redirect=/tickets" };
    }
    return { authenticated: true };
  }

  /**
   * Get user's orders with concert details
   */
  async getUserOrders(): Promise<{ data: Order[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    // Check authentication
    const authCheck = await this.checkAuthentication();
    if (!authCheck.authenticated) {
      return { data: null, error: { message: "Please login to view your tickets" } };
    }

    // Filter orders by current user
    const userOrders = this.orders
      .filter(o => o.user_id === this.session!.user.id)
      .map(order => ({
        ...order,
        concerts: this.concerts.get(order.concert_id) || order.concerts,
      }));

    return { data: userOrders, error: null };
  }

  /**
   * Get single order by ID
   */
  async getOrderById(orderId: string): Promise<{ data: Order | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    // Check authentication
    const authCheck = await this.checkAuthentication();
    if (!authCheck.authenticated) {
      return { data: null, error: { message: "Please login to view order details" } };
    }

    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      return { data: null, error: { message: "Order not found" } };
    }

    // Verify order belongs to user
    if (order.user_id !== this.session!.user.id) {
      return { data: null, error: { message: "Unauthorized to view this order" } };
    }

    return {
      data: {
        ...order,
        concerts: this.concerts.get(order.concert_id) || order.concerts,
      },
      error: null,
    };
  }
}

// ============================================================
// Test Suite: Authentication for Ticket History
// ============================================================

describe("Ticket History Authentication Integration Tests", () => {
  let ticketService: TicketHistoryService;

  beforeAll(() => {
    console.log("=== Starting Ticket History Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed Ticket History Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
  });

  describe("Scenario: Unauthenticated user tries to view tickets", () => {
    it("Given user is not logged in, When accessing tickets page, Then redirect to login", async () => {
      // Given: No session
      ticketService.setSession(null);

      // When
      const authCheck = await ticketService.checkAuthentication();

      // Then
      expect(authCheck.authenticated).toBe(false);
      expect(authCheck.redirectUrl).toContain("/auth/login");
      expect(authCheck.redirectUrl).toContain("redirect=/tickets");
    });

    it("should prevent order listing without authentication", async () => {
      ticketService.setSession(null);

      const result = await ticketService.getUserOrders();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("login");
    });
  });

  describe("Scenario: Authenticated user can view tickets", () => {
    it("Given user is logged in, When accessing tickets page, Then allow access", async () => {
      ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

      const authCheck = await ticketService.checkAuthentication();

      expect(authCheck.authenticated).toBe(true);
    });
  });
});

// ============================================================
// Test Suite: User Order Listing
// ============================================================

describe("User Order Listing Integration Tests", () => {
  let ticketService: TicketHistoryService;
  let testConcert: Concert;

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
    ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

    // Setup test data
    testConcert = buildConcert({ 
      title: "Rock Concert 2025",
      location: "Stadium",
      start_at: "2025-06-15T19:00:00Z",
    });
    ticketService.addConcert(testConcert);
  });

  describe("Scenario: User views their order history", () => {
    it("Given user has orders, When viewing tickets page, Then all orders should display", async () => {
      // Given
      const order1 = buildOrder({ user_id: "user-1", concert_id: testConcert.id, quantity: 2 });
      const order2 = buildOrder({ user_id: "user-1", concert_id: testConcert.id, quantity: 3 });
      ticketService.addOrder(order1);
      ticketService.addOrder(order2);

      // When
      const result = await ticketService.getUserOrders();

      // Then
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should only show orders for logged-in user", async () => {
      // Given: Orders from different users
      const userOrder = buildOrder({ user_id: "user-1", concert_id: testConcert.id });
      const otherUserOrder = buildOrder({ user_id: "user-2", concert_id: testConcert.id });
      ticketService.addOrder(userOrder);
      ticketService.addOrder(otherUserOrder);

      // When
      const result = await ticketService.getUserOrders();

      // Then
      expect(result.data).toHaveLength(1);
      expect(result.data![0].user_id).toBe("user-1");
    });

    it("should return empty array when user has no orders", async () => {
      const result = await ticketService.getUserOrders();

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Scenario: Order data includes concert details", () => {
    it("should include concert title, location, and date", async () => {
      const order = buildOrder({ user_id: "user-1", concert_id: testConcert.id });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();
      const orderWithConcert = result.data![0];

      expect(orderWithConcert.concerts).toBeDefined();
      expect((orderWithConcert.concerts as Concert).title).toBe("Rock Concert 2025");
      expect((orderWithConcert.concerts as Concert).location).toBe("Stadium");
      expect((orderWithConcert.concerts as Concert).start_at).toBeDefined();
    });
  });
});

// ============================================================
// Test Suite: Order Details Display
// ============================================================

describe("Order Details Display Integration Tests", () => {
  let ticketService: TicketHistoryService;
  let testConcert: Concert;
  let testOrder: Order;

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
    ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

    testConcert = buildConcert({ 
      title: "Jazz Night",
      price: 150000,
    });
    ticketService.addConcert(testConcert);

    testOrder = buildOrder({ 
      user_id: "user-1", 
      concert_id: testConcert.id,
      quantity: 2,
      total_price: 300000,
      status: "success",
    });
    ticketService.addOrder(testOrder);
  });

  describe("Scenario: User views order details", () => {
    it("Given an order exists, When viewing details, Then all order info should display", async () => {
      const result = await ticketService.getOrderById(testOrder.id);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe(testOrder.id);
      expect(result.data?.quantity).toBe(2);
      expect(result.data?.total_price).toBe(300000);
      expect(result.data?.status).toBe("success");
    });

    it("should display ticket quantity", async () => {
      const result = await ticketService.getOrderById(testOrder.id);

      expect(result.data?.quantity).toBe(2);
    });

    it("should display total price", async () => {
      const result = await ticketService.getOrderById(testOrder.id);

      expect(result.data?.total_price).toBe(300000);
    });

    it("should display order status", async () => {
      const result = await ticketService.getOrderById(testOrder.id);

      expect(result.data?.status).toBe("success");
    });

    it("should display created date", async () => {
      const result = await ticketService.getOrderById(testOrder.id);

      expect(result.data?.created_at).toBeDefined();
    });
  });

  describe("Scenario: Unauthorized access to order", () => {
    it("should reject viewing other user's order", async () => {
      // Add order from different user
      const otherOrder = buildOrder({ user_id: "user-2", concert_id: testConcert.id });
      ticketService.addOrder(otherOrder);

      const result = await ticketService.getOrderById(otherOrder.id);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Unauthorized");
    });

    it("should return error for non-existent order", async () => {
      const result = await ticketService.getOrderById("non-existent-order");

      expect(result.error?.message).toBe("Order not found");
    });
  });
});

// ============================================================
// Test Suite: Order Status Display
// ============================================================

describe("Order Status Display Integration Tests", () => {
  let ticketService: TicketHistoryService;
  let testConcert: Concert;

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
    ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

    testConcert = buildConcert();
    ticketService.addConcert(testConcert);
  });

  describe("Scenario: Display different order statuses", () => {
    it("should display success status", async () => {
      const order = buildOrder({ user_id: "user-1", concert_id: testConcert.id, status: "success" });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();

      expect(result.data![0].status).toBe("success");
    });

    it("should display pending status", async () => {
      const order = buildOrder({ user_id: "user-1", concert_id: testConcert.id, status: "pending" });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();

      expect(result.data![0].status).toBe("pending");
    });

    it("should display cancelled status", async () => {
      const order = buildOrder({ user_id: "user-1", concert_id: testConcert.id, status: "cancelled" });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();

      expect(result.data![0].status).toBe("cancelled");
    });
  });
});

// ============================================================
// Test Suite: Order Data Formatting
// ============================================================

describe("Order Data Formatting Integration Tests", () => {
  let ticketService: TicketHistoryService;
  let testConcert: Concert;

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
    ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

    testConcert = buildConcert({ 
      title: "Festival",
      start_at: "2025-08-15T18:00:00Z",
      location: "Beach Arena",
    });
    ticketService.addConcert(testConcert);
  });

  describe("Scenario: Price formatting for display", () => {
    it("should format total price in Indonesian Rupiah", async () => {
      const order = buildOrder({ 
        user_id: "user-1", 
        concert_id: testConcert.id, 
        total_price: 450000 
      });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();
      const formattedPrice = `Rp${result.data![0].total_price.toLocaleString("id-ID")}`;

      expect(formattedPrice).toBe("Rp450.000");
    });
  });

  describe("Scenario: Date formatting for display", () => {
    it("should format concert date", async () => {
      const order = buildOrder({ user_id: "user-1", concert_id: testConcert.id });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();
      const concert = result.data![0].concerts as Concert;
      const date = new Date(concert.start_at);
      const formatted = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      expect(formatted).toMatch(/\d{2} \w{3} \d{4}/);
    });

    it("should format order created date", async () => {
      const order = buildOrder({ user_id: "user-1", concert_id: testConcert.id });
      ticketService.addOrder(order);

      const result = await ticketService.getUserOrders();
      const createdDate = new Date(result.data![0].created_at);

      expect(createdDate instanceof Date).toBe(true);
      expect(!isNaN(createdDate.getTime())).toBe(true);
    });
  });
});

// ============================================================
// Test Suite: Error Handling
// ============================================================

describe("Ticket History Error Handling Integration Tests", () => {
  let ticketService: TicketHistoryService;

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
    ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });
  });

  describe("Scenario: Database errors", () => {
    it("should handle database connection errors", async () => {
      ticketService.setError(true, "Connection failed");

      const result = await ticketService.getUserOrders();

      expect(result.error?.message).toBe("Connection failed");
      expect(result.data).toBeNull();
    });

    it("should handle timeout errors", async () => {
      ticketService.setError(true, "Query timeout");

      const result = await ticketService.getUserOrders();

      expect(result.error?.message).toBe("Query timeout");
    });
  });
});

// ============================================================
// Test Suite: Complete Workflow
// ============================================================

describe("Ticket History Complete Workflow Integration Tests", () => {
  let ticketService: TicketHistoryService;

  beforeEach(() => {
    resetIdCounters();
    ticketService = new TicketHistoryService();
  });

  describe("Feature: User views purchase history", () => {
    it("Scenario: User logs in and views all their tickets", async () => {
      // Given: User has multiple orders
      const concert1 = buildConcert({ title: "Concert 1" });
      const concert2 = buildConcert({ title: "Concert 2" });
      ticketService.addConcert(concert1);
      ticketService.addConcert(concert2);

      const order1 = buildOrder({ user_id: "user-1", concert_id: concert1.id, status: "success" });
      const order2 = buildOrder({ user_id: "user-1", concert_id: concert2.id, status: "pending" });
      ticketService.addOrder(order1);
      ticketService.addOrder(order2);

      // When: User logs in
      ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

      // And: Views tickets page
      const result = await ticketService.getUserOrders();

      // Then: All their orders are displayed
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data!.some(o => o.status === "success")).toBe(true);
      expect(result.data!.some(o => o.status === "pending")).toBe(true);
    });

    it("Scenario: User views specific order detail", async () => {
      // Given: User has an order
      const concert = buildConcert({ title: "My Concert" });
      ticketService.addConcert(concert);
      
      const order = buildOrder({ 
        user_id: "user-1", 
        concert_id: concert.id,
        quantity: 4,
        total_price: 400000,
      });
      ticketService.addOrder(order);

      // When: User is authenticated
      ticketService.setSession({ user: { id: "user-1", email: "user@test.com" } });

      // And: Views order detail
      const result = await ticketService.getOrderById(order.id);

      // Then: Order details are shown
      expect(result.data?.quantity).toBe(4);
      expect(result.data?.total_price).toBe(400000);
      expect((result.data?.concerts as Concert).title).toBe("My Concert");
    });
  });
});
