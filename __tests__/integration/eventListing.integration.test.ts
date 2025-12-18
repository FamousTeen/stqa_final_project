/**
 * Event Listing Integration Tests
 * 
 * Tests for event/concert listing functionality including:
 * - Home page event display
 * - Events page listing
 * - Filtering and sorting
 * - Public access (no auth required)
 * 
 * Following patterns from:
 * - 05_mocking_objects: Mocking Supabase client
 * - 06_TDD_case_study: TDD for list operations
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import {
  buildConcert,
  buildConcertsFromData,
  CONCERT_DATA,
  resetIdCounters,
} from "./fixtures/testData";
import type { Concert } from "@/app/types/concert";

// ============================================================
// Event Listing Service Simulation
// ============================================================

class EventListingService {
  private concerts: Concert[] = [];
  private shouldError = false;
  private errorMessage = "Database error";

  reset() {
    this.concerts = [];
    this.shouldError = false;
  }

  addConcert(concert: Concert) {
    this.concerts.push(concert);
  }

  addConcerts(concerts: Concert[]) {
    this.concerts.push(...concerts);
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  /**
   * Get all published events (public access)
   */
  async getPublishedEvents(): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const published = this.concerts.filter(c => c.published === true);
    return { data: published, error: null };
  }

  /**
   * Get events sorted by date (ascending - upcoming first)
   */
  async getEventsSortedByDate(ascending = true): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const published = this.concerts.filter(c => c.published === true);
    const sorted = [...published].sort((a, b) => {
      const dateA = new Date(a.start_at).getTime();
      const dateB = new Date(b.start_at).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });

    return { data: sorted, error: null };
  }

  /**
   * Get featured events for homepage
   */
  async getFeaturedEvents(limit = 3): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const featured = this.concerts
      .filter(c => c.published === true && c.featured === true)
      .slice(0, limit);

    return { data: featured, error: null };
  }

  /**
   * Search events by title or location
   */
  async searchEvents(query: string): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const lowerQuery = query.toLowerCase();
    const results = this.concerts.filter(
      c =>
        c.published === true &&
        (c.title.toLowerCase().includes(lowerQuery) ||
          c.location.toLowerCase().includes(lowerQuery))
    );

    return { data: results, error: null };
  }

  /**
   * Get events with available tickets
   */
  async getAvailableEvents(): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const available = this.concerts.filter(
      c => c.published === true && c.available_tickets > 0
    );

    return { data: available, error: null };
  }

  /**
   * Get upcoming events (start_at > now)
   */
  async getUpcomingEvents(): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }

    const now = new Date();
    const upcoming = this.concerts.filter(
      c => c.published === true && new Date(c.start_at) > now
    );

    return { data: upcoming, error: null };
  }
}

// ============================================================
// Test Suite: Events Page Listing
// ============================================================

describe("Events Page Listing Integration Tests", () => {
  let eventService: EventListingService;

  beforeAll(() => {
    console.log("=== Starting Events Page Listing Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed Events Page Listing Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventListingService();
  });

  describe("Scenario: User views all events", () => {
    it("Given published events exist, When loading events page, Then all published events should display", async () => {
      // Given
      const concerts = buildConcertsFromData();
      eventService.addConcerts(concerts);

      // When
      const result = await eventService.getPublishedEvents();

      // Then
      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data!.every(c => c.published === true)).toBe(true);
    });

    it("should only show published events", async () => {
      // Given: Mix of published and unpublished
      eventService.addConcert(buildConcert({ title: "Published Event", published: true }));
      eventService.addConcert(buildConcert({ title: "Draft Event", published: false }));
      eventService.addConcert(buildConcert({ title: "Another Published", published: true }));

      // When
      const result = await eventService.getPublishedEvents();

      // Then
      expect(result.data).toHaveLength(2);
      expect(result.data!.every(c => c.published === true)).toBe(true);
    });

    it("should return empty array when no published events exist", async () => {
      // Given: Only unpublished events
      eventService.addConcert(buildConcert({ published: false }));

      // When
      const result = await eventService.getPublishedEvents();

      // Then
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe("Scenario: Events sorted by date", () => {
    it("should sort events by start date ascending (upcoming first)", async () => {
      // Given
      eventService.addConcert(buildConcert({ 
        title: "Far Future Event", 
        start_at: "2026-12-01T19:00:00Z",
        published: true 
      }));
      eventService.addConcert(buildConcert({ 
        title: "Near Future Event", 
        start_at: "2025-06-01T19:00:00Z",
        published: true 
      }));
      eventService.addConcert(buildConcert({ 
        title: "Mid Future Event", 
        start_at: "2025-09-01T19:00:00Z",
        published: true 
      }));

      // When
      const result = await eventService.getEventsSortedByDate(true);

      // Then
      expect(result.data).toHaveLength(3);
      expect(result.data![0].title).toBe("Near Future Event");
      expect(result.data![1].title).toBe("Mid Future Event");
      expect(result.data![2].title).toBe("Far Future Event");
    });

    it("should sort events by start date descending", async () => {
      eventService.addConcert(buildConcert({ 
        title: "Event A", 
        start_at: "2025-06-01T19:00:00Z",
        published: true 
      }));
      eventService.addConcert(buildConcert({ 
        title: "Event B", 
        start_at: "2025-12-01T19:00:00Z",
        published: true 
      }));

      const result = await eventService.getEventsSortedByDate(false);

      expect(result.data![0].title).toBe("Event B");
      expect(result.data![1].title).toBe("Event A");
    });
  });

  describe("Scenario: Error handling", () => {
    it("should handle database errors gracefully", async () => {
      eventService.setError(true, "Connection failed");

      const result = await eventService.getPublishedEvents();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Connection failed");
      expect(result.data).toBeNull();
    });
  });
});

// ============================================================
// Test Suite: Homepage Featured Events
// ============================================================

describe("Homepage Featured Events Integration Tests", () => {
  let eventService: EventListingService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventListingService();
  });

  describe("Scenario: Display featured events on homepage", () => {
    it("Given featured events exist, When loading homepage, Then featured events should display", async () => {
      // Given
      eventService.addConcert(buildConcert({ title: "Featured 1", featured: true, published: true }));
      eventService.addConcert(buildConcert({ title: "Featured 2", featured: true, published: true }));
      eventService.addConcert(buildConcert({ title: "Not Featured", featured: false, published: true }));

      // When
      const result = await eventService.getFeaturedEvents();

      // Then
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data!.every(c => c.featured === true)).toBe(true);
    });

    it("should limit featured events to specified count", async () => {
      // Given: More than limit
      for (let i = 0; i < 5; i++) {
        eventService.addConcert(buildConcert({ 
          title: `Featured ${i}`, 
          featured: true, 
          published: true 
        }));
      }

      // When
      const result = await eventService.getFeaturedEvents(3);

      // Then
      expect(result.data).toHaveLength(3);
    });

    it("should not include unpublished featured events", async () => {
      eventService.addConcert(buildConcert({ featured: true, published: false }));
      eventService.addConcert(buildConcert({ featured: true, published: true }));

      const result = await eventService.getFeaturedEvents();

      expect(result.data).toHaveLength(1);
      expect(result.data![0].published).toBe(true);
    });

    it("should return empty array when no featured events exist", async () => {
      eventService.addConcert(buildConcert({ featured: false, published: true }));

      const result = await eventService.getFeaturedEvents();

      expect(result.data).toEqual([]);
    });
  });
});

// ============================================================
// Test Suite: Event Search
// ============================================================

describe("Event Search Integration Tests", () => {
  let eventService: EventListingService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventListingService();

    // Setup test data
    eventService.addConcert(buildConcert({ 
      title: "Rock Night 2025", 
      location: "Stadium Arena",
      published: true 
    }));
    eventService.addConcert(buildConcert({ 
      title: "Jazz Evening", 
      location: "City Concert Hall",
      published: true 
    }));
    eventService.addConcert(buildConcert({ 
      title: "Pop Festival", 
      location: "Beach Stadium",
      published: true 
    }));
  });

  describe("Scenario: Search by title", () => {
    it("should find events matching title", async () => {
      const result = await eventService.searchEvents("Rock");

      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toContain("Rock");
    });

    it("should be case insensitive", async () => {
      const result = await eventService.searchEvents("JAZZ");

      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Jazz Evening");
    });

    it("should return multiple matches", async () => {
      const result = await eventService.searchEvents("stadium");

      expect(result.data).toHaveLength(2); // Stadium Arena and Beach Stadium
    });
  });

  describe("Scenario: Search by location", () => {
    it("should find events by location", async () => {
      const result = await eventService.searchEvents("Concert Hall");

      expect(result.data).toHaveLength(1);
      expect(result.data![0].location).toContain("Concert Hall");
    });
  });

  describe("Scenario: No results", () => {
    it("should return empty array for no matches", async () => {
      const result = await eventService.searchEvents("Classical");

      expect(result.data).toEqual([]);
    });
  });
});

// ============================================================
// Test Suite: Event Availability
// ============================================================

describe("Event Availability Integration Tests", () => {
  let eventService: EventListingService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventListingService();
  });

  describe("Scenario: Filter by ticket availability", () => {
    it("should only return events with available tickets", async () => {
      eventService.addConcert(buildConcert({ 
        title: "Available Event", 
        available_tickets: 50, 
        published: true 
      }));
      eventService.addConcert(buildConcert({ 
        title: "Sold Out Event", 
        available_tickets: 0, 
        published: true 
      }));

      const result = await eventService.getAvailableEvents();

      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Available Event");
    });
  });

  describe("Scenario: Get upcoming events only", () => {
    it("should filter out past events", async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);
      
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      eventService.addConcert(buildConcert({ 
        title: "Upcoming Event", 
        start_at: futureDate.toISOString(), 
        published: true 
      }));
      eventService.addConcert(buildConcert({ 
        title: "Past Event", 
        start_at: pastDate.toISOString(), 
        published: true 
      }));

      const result = await eventService.getUpcomingEvents();

      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Upcoming Event");
    });
  });
});

// ============================================================
// Test Suite: Event Data Display
// ============================================================

describe("Event Data Display Integration Tests", () => {
  let eventService: EventListingService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventListingService();
  });

  describe("Scenario: Event card data formatting", () => {
    it("should include all required display fields", async () => {
      const concert = buildConcert({
        title: "Test Concert",
        description: "A great concert",
        location: "Test Venue",
        price: 150000,
        start_at: "2025-06-15T19:00:00Z",
        image: "/images/test.jpg",
        published: true,
      });
      eventService.addConcert(concert);

      const result = await eventService.getPublishedEvents();
      const event = result.data![0];

      // Required fields for event card display
      expect(event.id).toBeDefined();
      expect(event.title).toBe("Test Concert");
      expect(event.price).toBe(150000);
      expect(event.start_at).toBeDefined();
      expect(event.location).toBe("Test Venue");
      expect(event.image).toBeDefined();
    });

    it("should format price correctly for display", async () => {
      const concert = buildConcert({ price: 250000, published: true });
      eventService.addConcert(concert);

      const result = await eventService.getPublishedEvents();
      const event = result.data![0];

      // Price formatting (Rp250.000)
      const formattedPrice = `Rp${event.price.toLocaleString("id-ID")}`;
      expect(formattedPrice).toBe("Rp250.000");
    });

    it("should format date correctly for display", async () => {
      const concert = buildConcert({ 
        start_at: "2025-06-15T19:00:00Z", 
        published: true 
      });
      eventService.addConcert(concert);

      const result = await eventService.getPublishedEvents();
      const event = result.data![0];

      const date = new Date(event.start_at);
      const formattedDate = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      expect(formattedDate).toMatch(/\d{2} \w{3} \d{4}/);
    });
  });

  describe("Scenario: Image handling", () => {
    it("should handle absolute URL images", async () => {
      const concert = buildConcert({ 
        image: "https://example.com/image.jpg", 
        published: true 
      });
      eventService.addConcert(concert);

      const result = await eventService.getPublishedEvents();
      const event = result.data![0];

      expect(event.image?.startsWith("http")).toBe(true);
    });

    it("should handle relative path images", async () => {
      const concert = buildConcert({ 
        image: "/images/concert.jpg", 
        published: true 
      });
      eventService.addConcert(concert);

      const result = await eventService.getPublishedEvents();
      const event = result.data![0];

      expect(event.image?.startsWith("/")).toBe(true);
    });
  });
});

// ============================================================
// Test Suite: Public Access (No Auth Required)
// ============================================================

describe("Public Event Access Integration Tests", () => {
  let eventService: EventListingService;

  beforeEach(() => {
    resetIdCounters();
    eventService = new EventListingService();
  });

  describe("Scenario: Unauthenticated user views events", () => {
    it("should allow event listing without authentication", async () => {
      eventService.addConcert(buildConcert({ published: true }));

      // No session/auth check required
      const result = await eventService.getPublishedEvents();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });

    it("should allow search without authentication", async () => {
      eventService.addConcert(buildConcert({ title: "Public Event", published: true }));

      const result = await eventService.searchEvents("Public");

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });
  });
});
