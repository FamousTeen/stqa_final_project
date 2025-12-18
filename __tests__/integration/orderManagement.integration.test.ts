/**
 * Order Management Integration Tests
 * 
 * Tests for order creation and management workflows including:
 * - Order creation with ticket validation
 * - Order status updates
 * - Ticket availability management
 * 
 * Following patterns from:
 * - 06_TDD_case_study: TDD for CRUD operations
 * - 07_BDD_behave: Behavior-driven scenarios
 * - 05_mocking_objects: Mocking external services
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import {
  buildConcert,
  buildOrder,
  MOCK_USER_SESSION,
  resetIdCounters,
} from "./fixtures/testData";
import type { Concert } from "@/app/types/concert";
import type { Order } from "@/app/types/order";

// ============================================================
// Order Service Simulation
// ============================================================

interface OrderInput {
  concertId: string;
  quantity: number;
  userId: string;
  name: string;
  email: string;
  phone: string;
}

class OrderService {
  private orders: Order[] = [];
  private concerts: Map<string, Concert> = new Map();
  private shouldError = false;
  private errorMessage = "Database error";

  reset() {
    this.orders = [];
    this.concerts = new Map();
    this.shouldError = false;
  }

  addConcert(concert: Concert) {
    this.concerts.set(concert.id, concert);
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  async createOrder(input: OrderInput): Promise<{ data: Order | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    // Validate concert exists
    const concert = this.concerts.get(input.concertId);
    if (!concert) {
      return { data: null, error: { message: "Concert not found" } };
    }

    // Validate ticket availability
    if (concert.available_tickets < input.quantity) {
      return { data: null, error: { message: "Not enough tickets available" } };
    }

    // Validate quantity
    if (input.quantity <= 0) {
      return { data: null, error: { message: "Invalid quantity" } };
    }

    if (input.quantity > 10) {
      return { data: null, error: { message: "Maximum 10 tickets per order" } };
    }

    // Calculate total
    const total = concert.price * input.quantity;

    // Create order
    const order = buildOrder({
      concert_id: input.concertId,
      user_id: input.userId,
      quantity: input.quantity,
      total_price: total,
      status: "pending",
    });

    this.orders.push(order);

    // Update ticket count
    concert.available_tickets -= input.quantity;
    this.concerts.set(concert.id, concert);

    return { data: order, error: null };
  }

  async updateStatus(orderId: string, status: string): Promise<{ data: Order | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) {
      return { data: null, error: { message: "Order not found" } };
    }

    const order = this.orders[index];

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return { data: null, error: { message: `Cannot transition from ${order.status} to ${status}` } };
    }

    // If cancelling, restore tickets
    if (status === "cancelled") {
      const concert = this.concerts.get(order.concert_id);
      if (concert) {
        concert.available_tickets += order.quantity;
        this.concerts.set(concert.id, concert);
      }
    }

    this.orders[index] = { ...order, status };
    return { data: this.orders[index], error: null };
  }

  async getOrders(): Promise<{ data: Order[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    return { data: [...this.orders], error: null };
  }

  async getOrderById(id: string): Promise<{ data: Order | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      return { data: null, error: { message: "Order not found" } };
    }
    return { data: order, error: null };
  }

  getTicketsRemaining(concertId: string): number {
    return this.concerts.get(concertId)?.available_tickets ?? 0;
  }
}

// ============================================================
// Test Suite: Order Creation
// ============================================================

describe("Order Creation Integration Tests", () => {
  let orderService: OrderService;
  let testConcert: Concert;

  beforeAll(() => {
    console.log("=== Starting Order Creation Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed Order Creation Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    orderService = new OrderService();
    testConcert = buildConcert({
      title: "Test Concert",
      location: "Test Venue",
      start_at: "2024-12-01T19:00:00Z",
      price: 50,
      available_tickets: 100,
    });
    orderService.addConcert(testConcert);
  });

  describe("Scenario: User creates an order", () => {
    it("Given valid order data, When creating order, Then order should be created", async () => {
      // Given
      const orderInput: OrderInput = {
        concertId: testConcert.id,
        quantity: 2,
        userId: MOCK_USER_SESSION.user.id,
        name: "John Doe",
        email: "john@test.com",
        phone: "1234567890",
      };

      // When
      const result = await orderService.createOrder(orderInput);

      // Then
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.quantity).toBe(2);
      expect(result.data?.total_price).toBe(100); // 2 * 50
      expect(result.data?.status).toBe("pending");
    });

    it("should reduce ticket count after order creation", async () => {
      // Given
      const initialTickets = orderService.getTicketsRemaining(testConcert.id);
      
      // When
      await orderService.createOrder({
        concertId: testConcert.id,
        quantity: 5,
        userId: "user-1",
        name: "Test User",
        email: "test@test.com",
        phone: "1234567890",
      });

      // Then
      const remainingTickets = orderService.getTicketsRemaining(testConcert.id);
      expect(remainingTickets).toBe(initialTickets - 5);
    });
  });

  describe("Scenario: Order validation", () => {
    it("should reject order when not enough tickets available", async () => {
      // Given: Concert with only 10 tickets
      const limitedConcert = buildConcert({ available_tickets: 10 });
      orderService.addConcert(limitedConcert);

      // When: Ordering more than available
      const result = await orderService.createOrder({
        concertId: limitedConcert.id,
        quantity: 15,
        userId: "user-1",
        name: "Test",
        email: "test@test.com",
        phone: "123",
      });

      // Then
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Not enough tickets");
    });

    it("should reject order with zero quantity", async () => {
      const result = await orderService.createOrder({
        concertId: testConcert.id,
        quantity: 0,
        userId: "user-1",
        name: "Test",
        email: "test@test.com",
        phone: "123",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Invalid quantity");
    });

    it("should reject order exceeding maximum quantity", async () => {
      const result = await orderService.createOrder({
        concertId: testConcert.id,
        quantity: 15,
        userId: "user-1",
        name: "Test",
        email: "test@test.com",
        phone: "123",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Maximum 10 tickets");
    });

    it("should reject order for non-existent concert", async () => {
      const result = await orderService.createOrder({
        concertId: "non-existent",
        quantity: 2,
        userId: "user-1",
        name: "Test",
        email: "test@test.com",
        phone: "123",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Concert not found");
    });
  });

  describe("Scenario: Price calculation", () => {
    it("should calculate total correctly", async () => {
      const testCases = [
        { price: 50, quantity: 2, expected: 100 },
        { price: 75, quantity: 4, expected: 300 },
        { price: 100, quantity: 1, expected: 100 },
        { price: 25, quantity: 10, expected: 250 },
      ];

      for (const { price, quantity, expected } of testCases) {
        orderService.reset();
        const concert = buildConcert({ price, available_tickets: 100 });
        orderService.addConcert(concert);

        const result = await orderService.createOrder({
          concertId: concert.id,
          quantity,
          userId: "user-1",
          name: "Test",
          email: "test@test.com",
          phone: "123",
        });

        expect(result.data?.total_price).toBe(expected);
      }
    });
  });
});

// ============================================================
// Test Suite: Order Status Management
// ============================================================

describe("Order Status Management Integration Tests", () => {
  let orderService: OrderService;
  let testConcert: Concert;
  let testOrder: Order;

  beforeEach(async () => {
    resetIdCounters();
    orderService = new OrderService();
    testConcert = buildConcert({ available_tickets: 100, price: 50 });
    orderService.addConcert(testConcert);
    
    const result = await orderService.createOrder({
      concertId: testConcert.id,
      quantity: 2,
      userId: "user-1",
      name: "Test User",
      email: "test@test.com",
      phone: "1234567890",
    });
    testOrder = result.data!;
  });

  describe("Scenario: Admin updates order status", () => {
    it("should update status from pending to completed", async () => {
      const result = await orderService.updateStatus(testOrder.id, "completed");

      expect(result.error).toBeNull();
      expect(result.data?.status).toBe("completed");
    });

    it("should update status from pending to cancelled", async () => {
      const result = await orderService.updateStatus(testOrder.id, "cancelled");

      expect(result.error).toBeNull();
      expect(result.data?.status).toBe("cancelled");
    });

    it("should restore tickets when order is cancelled", async () => {
      const ticketsBefore = orderService.getTicketsRemaining(testConcert.id);
      
      await orderService.updateStatus(testOrder.id, "cancelled");
      
      const ticketsAfter = orderService.getTicketsRemaining(testConcert.id);
      expect(ticketsAfter).toBe(ticketsBefore + testOrder.quantity);
    });
  });

  describe("Scenario: Invalid status transitions", () => {
    it("should reject transition from completed to pending", async () => {
      await orderService.updateStatus(testOrder.id, "completed");
      
      const result = await orderService.updateStatus(testOrder.id, "pending");
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Cannot transition");
    });

    it("should reject transition from cancelled to completed", async () => {
      await orderService.updateStatus(testOrder.id, "cancelled");
      
      const result = await orderService.updateStatus(testOrder.id, "completed");
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Cannot transition");
    });
  });

  describe("Scenario: Error handling", () => {
    it("should handle non-existent order gracefully", async () => {
      const result = await orderService.updateStatus("non-existent", "completed");

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Order not found");
    });

    it("should handle database errors", async () => {
      orderService.setError(true, "Database connection failed");
      
      const result = await orderService.updateStatus(testOrder.id, "completed");
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Database connection failed");
    });
  });
});

// ============================================================
// Test Suite: Admin Order Management
// ============================================================

describe("Admin Order Management Integration Tests", () => {
  let orderService: OrderService;
  let testConcert: Concert;

  beforeEach(() => {
    resetIdCounters();
    orderService = new OrderService();
    testConcert = buildConcert({ available_tickets: 100, price: 50 });
    orderService.addConcert(testConcert);
  });

  describe("Order Listing", () => {
    it("should list all orders", async () => {
      // Create multiple orders
      await orderService.createOrder({
        concertId: testConcert.id,
        quantity: 2,
        userId: "user-1",
        name: "User One",
        email: "user1@test.com",
        phone: "111",
      });
      await orderService.createOrder({
        concertId: testConcert.id,
        quantity: 3,
        userId: "user-2",
        name: "User Two",
        email: "user2@test.com",
        phone: "222",
      });

      const result = await orderService.getOrders();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should handle empty order list", async () => {
      const result = await orderService.getOrders();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Order Details", () => {
    it("should get order by ID", async () => {
      const createResult = await orderService.createOrder({
        concertId: testConcert.id,
        quantity: 2,
        userId: "user-1",
        name: "Test User",
        email: "test@test.com",
        phone: "123",
      });

      const result = await orderService.getOrderById(createResult.data!.id);

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe(createResult.data!.id);
    });

    it("should return error for non-existent order", async () => {
      const result = await orderService.getOrderById("non-existent");

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Order not found");
    });
  });
});
