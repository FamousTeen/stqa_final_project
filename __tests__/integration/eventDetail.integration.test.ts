/**
 * Event Detail & Ticket Purchase Integration Tests
 * 
 * Tests for event detail page and ticket ordering including:
 * - Event detail display
 * - Authentication check before ordering
 * - Ticket quantity selection
 * - Order creation from event page
 * 
 * Following patterns from:
 * - 05_mocking_objects: Mocking Supabase client
 * - 06_TDD_case_study: TDD for CRUD operations
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
// Event Detail Service Simulation
// ============================================================

interface OrderInput {
  concertId: string;
  quantity: number;
  userId: string;
}

class EventDetailService {
  private concerts: Map<string, Concert> = new Map();
  private orders: Order[] = [];
  private session: { user: { id: string; email: string } } | null = null;
  private shouldError = false;
  private errorMessage = "Database error";

  reset() {
    this.concerts.clear();
    this.orders = [];
    this.session = null;
    this.shouldError = false;
  }

  addConcert(concert: Concert) {
    this.concerts.set(concert.id, concert);
  }

  setSession(session: { user: { id: string; email: string } } | null) {
    this.session = session;
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<{ data: Concert | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const concert = this.concerts.get(id);
    if (!concert) {
      return { data: null, error: { message: "Event not found" } };
    }

    return { data: concert, error: null };
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication(): Promise<{ authenticated: boolean; redirectUrl?: string }> {
    if (!this.session) {
      return { authenticated: false, redirectUrl: "/auth/login" };
    }
    return { authenticated: true };
  }

  /**
   * Create order for event
   */
  async createOrder(input: OrderInput): Promise<{ data: Order | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    // Check authentication
    const authCheck = await this.checkAuthentication();
    if (!authCheck.authenticated) {
      return { data: null, error: { message: "Please login to purchase tickets" } };
    }

    // Validate concert exists
    const concert = this.concerts.get(input.concertId);
    if (!concert) {
      return { data: null, error: { message: "Event not found" } };
    }

    // Validate quantity
    if (input.quantity <= 0) {
      return { data: null, error: { message: "Pilih jumlah tiket dulu." } };
    }

    // Validate ticket availability
    if (concert.available_tickets < input.quantity) {
      return { data: null, error: { message: "Not enough tickets available" } };
    }

    // Calculate total price
    const totalPrice = concert.price * input.quantity;

    // Create order
    const order = buildOrder({
      user_id: input.userId,
      concert_id: input.concertId,
      quantity: input.quantity,
      total_price: totalPrice,
      status: "pending",
    });

    this.orders.push(order);

    // Update ticket count
    concert.available_tickets -= input.quantity;
    this.concerts.set(concert.id, concert);

    return { data: order, error: null };
  }

  /**
   * Get remaining tickets for a concert
   */
  getAvailableTickets(concertId: string): number {
    return this.concerts.get(concertId)?.available_tickets ?? 0;
  }
}

// ============================================================
// Test Suite: Event Detail Display
// ============================================================

describe("Event Detail Display Integration Tests", () => {
  let eventService: EventDetailService;

  beforeAll(() => {
    console.log("=== Starting Event Detail Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed Event Detail Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventDetailService();
  });

  describe("Scenario: User views event details", () => {
    it("Given event exists, When user navigates to event page, Then event details should display", async () => {
      // Given
      const concert = buildConcert({
        title: "Rock Night 2025",
        description: "An amazing rock concert",
        location: "Stadium Arena",
        price: 250000,
        start_at: "2025-06-15T19:00:00Z",
        end_at: "2025-06-15T23:00:00Z",
        available_tickets: 100,
        image: "/images/rock.jpg",
        published: true,
      });
      eventService.addConcert(concert);

      // When
      const result = await eventService.getEventById(concert.id);

      // Then
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.title).toBe("Rock Night 2025");
      expect(result.data?.description).toBe("An amazing rock concert");
      expect(result.data?.location).toBe("Stadium Arena");
      expect(result.data?.price).toBe(250000);
    });

    it("should display all required event information", async () => {
      const concert = buildConcert({ published: true });
      eventService.addConcert(concert);

      const result = await eventService.getEventById(concert.id);
      const event = result.data!;

      // Required display fields
      expect(event.title).toBeDefined();
      expect(event.description).toBeDefined();
      expect(event.location).toBeDefined();
      expect(event.price).toBeDefined();
      expect(event.start_at).toBeDefined();
      expect(event.available_tickets).toBeDefined();
      expect(event.image).toBeDefined();
    });

    it("should show available ticket count", async () => {
      const concert = buildConcert({ available_tickets: 50, published: true });
      eventService.addConcert(concert);

      const result = await eventService.getEventById(concert.id);

      expect(result.data?.available_tickets).toBe(50);
    });
  });

  describe("Scenario: Event not found", () => {
    it("Given invalid event ID, When user navigates, Then error should display", async () => {
      const result = await eventService.getEventById("non-existent-id");

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Event not found");
      expect(result.data).toBeNull();
    });
  });

  describe("Scenario: Error handling", () => {
    it("should handle database errors", async () => {
      eventService.setError(true, "Connection failed");

      const result = await eventService.getEventById("any-id");

      expect(result.error?.message).toBe("Connection failed");
    });
  });
});

// ============================================================
// Test Suite: Authentication Check for Purchase
// ============================================================

describe("Event Purchase Authentication Integration Tests", () => {
  let eventService: EventDetailService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventDetailService();
    eventService.addConcert(buildConcert({ available_tickets: 100, published: true }));
  });

  describe("Scenario: Unauthenticated user attempts to purchase", () => {
    it("Given user is not logged in, When attempting purchase, Then redirect to login", async () => {
      // Given: No session
      eventService.setSession(null);

      // When
      const authCheck = await eventService.checkAuthentication();

      // Then
      expect(authCheck.authenticated).toBe(false);
      expect(authCheck.redirectUrl).toBe("/auth/login");
    });

    it("should prevent order creation without authentication", async () => {
      eventService.setSession(null);
      const concert = Array.from((eventService as unknown as { concerts: Map<string, Concert> }).concerts.values())[0];

      const result = await eventService.createOrder({
        concertId: concert.id,
        quantity: 2,
        userId: "any-user",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("login");
    });
  });

  describe("Scenario: Authenticated user can purchase", () => {
    it("Given user is logged in, When attempting purchase, Then allow purchase", async () => {
      // Given
      eventService.setSession({ user: { id: "user-1", email: "user@test.com" } });

      // When
      const authCheck = await eventService.checkAuthentication();

      // Then
      expect(authCheck.authenticated).toBe(true);
      expect(authCheck.redirectUrl).toBeUndefined();
    });
  });
});

// ============================================================
// Test Suite: Ticket Quantity Selection
// ============================================================

describe("Ticket Quantity Selection Integration Tests", () => {
  let eventService: EventDetailService;
  let testConcert: Concert;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventDetailService();
    testConcert = buildConcert({ available_tickets: 100, price: 50000, published: true });
    eventService.addConcert(testConcert);
    eventService.setSession({ user: { id: "user-1", email: "user@test.com" } });
  });

  describe("Scenario: User selects ticket quantity", () => {
    it("should allow selecting valid quantity", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 2,
        userId: "user-1",
      });

      expect(result.error).toBeNull();
      expect(result.data?.quantity).toBe(2);
    });

    it("should reject zero quantity", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 0,
        userId: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Pilih jumlah tiket dulu.");
    });

    it("should reject negative quantity", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: -1,
        userId: "user-1",
      });

      expect(result.error).not.toBeNull();
    });

    it("should reject quantity exceeding available tickets", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 150, // More than 100 available
        userId: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Not enough tickets");
    });
  });

  describe("Scenario: Price calculation", () => {
    it("should calculate total price correctly", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 3,
        userId: "user-1",
      });

      expect(result.data?.total_price).toBe(150000); // 3 * 50000
    });
  });
});

// ============================================================
// Test Suite: Order Creation from Event Page
// ============================================================

describe("Order Creation from Event Page Integration Tests", () => {
  let eventService: EventDetailService;
  let testConcert: Concert;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventDetailService();
    testConcert = buildConcert({ 
      title: "Concert for Order Test",
      available_tickets: 50, 
      price: 100000, 
      published: true 
    });
    eventService.addConcert(testConcert);
    eventService.setSession({ user: { id: "user-1", email: "buyer@test.com" } });
  });

  describe("Scenario: User creates order from event page", () => {
    it("Given authenticated user on event page, When clicking checkout, Then order should be created", async () => {
      // Given: User is authenticated and on event page
      const initialTickets = eventService.getAvailableTickets(testConcert.id);

      // When: Creating order
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 2,
        userId: "user-1",
      });

      // Then: Order is created and tickets reduced
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.concert_id).toBe(testConcert.id);
      expect(result.data?.quantity).toBe(2);
      expect(result.data?.status).toBe("pending");
      
      const remainingTickets = eventService.getAvailableTickets(testConcert.id);
      expect(remainingTickets).toBe(initialTickets - 2);
    });

    it("should create order with correct user association", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 1,
        userId: "user-1",
      });

      expect(result.data?.user_id).toBe("user-1");
    });

    it("should create order with pending status initially", async () => {
      const result = await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 1,
        userId: "user-1",
      });

      expect(result.data?.status).toBe("pending");
    });
  });

  describe("Scenario: Order creation validation", () => {
    it("should reject order for non-existent event", async () => {
      const result = await eventService.createOrder({
        concertId: "non-existent-concert",
        quantity: 1,
        userId: "user-1",
      });

      expect(result.error?.message).toBe("Event not found");
    });

    it("should reduce available tickets after order", async () => {
      const ticketsBefore = eventService.getAvailableTickets(testConcert.id);

      await eventService.createOrder({
        concertId: testConcert.id,
        quantity: 5,
        userId: "user-1",
      });

      const ticketsAfter = eventService.getAvailableTickets(testConcert.id);
      expect(ticketsAfter).toBe(ticketsBefore - 5);
    });

    it("should handle sold out events", async () => {
      // Create concert with 0 tickets
      const soldOutConcert = buildConcert({ available_tickets: 0, published: true });
      eventService.addConcert(soldOutConcert);

      const result = await eventService.createOrder({
        concertId: soldOutConcert.id,
        quantity: 1,
        userId: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Not enough tickets");
    });
  });

  describe("Scenario: Concurrent purchases", () => {
    it("should handle last available ticket correctly", async () => {
      // Concert with only 2 tickets
      const limitedConcert = buildConcert({ available_tickets: 2, published: true });
      eventService.addConcert(limitedConcert);

      // First purchase takes 2 tickets
      const firstOrder = await eventService.createOrder({
        concertId: limitedConcert.id,
        quantity: 2,
        userId: "user-1",
      });
      expect(firstOrder.error).toBeNull();

      // Second purchase should fail - no tickets left
      const secondOrder = await eventService.createOrder({
        concertId: limitedConcert.id,
        quantity: 1,
        userId: "user-2",
      });
      expect(secondOrder.error).not.toBeNull();
    });
  });
});

// ============================================================
// Test Suite: Redirect After Order
// ============================================================

describe("Post-Order Redirect Integration Tests", () => {
  let eventService: EventDetailService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventDetailService();
    eventService.addConcert(buildConcert({ available_tickets: 100, published: true }));
    eventService.setSession({ user: { id: "user-1", email: "user@test.com" } });
  });

  describe("Scenario: Redirect to ticket page after order", () => {
    it("should return order ID for redirect URL construction", async () => {
      const concert = Array.from((eventService as unknown as { concerts: Map<string, Concert> }).concerts.values())[0];
      
      const result = await eventService.createOrder({
        concertId: concert.id,
        quantity: 1,
        userId: "user-1",
      });

      expect(result.data?.id).toBeDefined();
      // In real app: router.push(`/tickets/${order.id}`)
      const redirectUrl = `/tickets/${result.data?.id}`;
      expect(redirectUrl).toMatch(/^\/tickets\/order-\d+$/);
    });
  });
});
