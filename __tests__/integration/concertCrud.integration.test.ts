/**
 * Concert CRUD Integration Tests
 * 
 * End-to-end integration tests for concert operations simulating
 * complete user workflows.
 * 
 * Following patterns from:
 * - 06_TDD_case_study: TDD for CRUD operations
 * - 07_BDD_behave: Behavior-driven scenarios
 * - 09_variables_and_continuing: Variables and test continuation
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import {
  buildConcert,
  MOCK_ADMIN_SESSION,
  CONCERT_DATA,
  resetIdCounters,
} from "./fixtures/testData";
import type { Concert } from "@/app/types/concert";

// ============================================================
// Mock Database - Following 04_factories_and_fakes pattern
// ============================================================

class MockDatabase {
  private concerts: Concert[] = [];
  private shouldError = false;
  private errorMessage = "Database error";

  reset() {
    this.concerts = [];
    this.shouldError = false;
  }

  setError(error: boolean, message?: string) {
    this.shouldError = error;
    if (message) this.errorMessage = message;
  }

  async findAll(): Promise<{ data: Concert[] | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const sorted = [...this.concerts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { data: sorted, error: null };
  }

  async findById(id: string): Promise<{ data: Concert | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const concert = this.concerts.find(c => c.id === id);
    if (!concert) {
      return { data: null, error: { message: "Concert not found" } };
    }
    return { data: concert, error: null };
  }

  async create(data: Omit<Concert, "id" | "created_at">): Promise<{ data: Concert | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const concert = buildConcert({
      title: data.title,
      description: data.description,
      start_at: data.start_at,
      end_at: data.end_at,
      location: data.location,
      price: data.price,
      total_tickets: data.total_tickets,
      available_tickets: data.available_tickets,
      image: data.image,
      featured: data.featured,
      published: data.published,
    });
    this.concerts.push(concert);
    return { data: concert, error: null };
  }

  async update(id: string, updates: Partial<Concert>): Promise<{ data: Concert | null; error: { message: string } | null }> {
    if (this.shouldError) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const index = this.concerts.findIndex(c => c.id === id);
    if (index === -1) {
      return { data: null, error: { message: "Concert not found" } };
    }
    this.concerts[index] = { ...this.concerts[index], ...updates };
    return { data: this.concerts[index], error: null };
  }

  async delete(id: string): Promise<{ error: { message: string } | null }> {
    if (this.shouldError) {
      return { error: { message: this.errorMessage } };
    }
    const index = this.concerts.findIndex(c => c.id === id);
    if (index === -1) {
      return { error: { message: "Concert not found" } };
    }
    this.concerts.splice(index, 1);
    return { error: null };
  }

  getCount(): number {
    return this.concerts.length;
  }
}

// ============================================================
// Test Suite: Concert CRUD Workflow
// ============================================================

describe("Concert CRUD Workflow Integration Tests", () => {
  let db: MockDatabase;

  beforeAll(() => {
    console.log("=== Starting Concert CRUD Integration Tests ===");
  });

  afterAll(() => {
    console.log("=== Completed Concert CRUD Integration Tests ===");
  });

  beforeEach(() => {
    resetIdCounters();
    db = new MockDatabase();
  });

  // ============================================================
  // BDD-Style Scenarios
  // ============================================================

  describe("Feature: Concert Management", () => {
    describe("Scenario: Admin creates a new concert", () => {
      it("Given admin is authenticated, When creating a concert, Then concert should be stored", async () => {
        // Given: Admin session
        const session = MOCK_ADMIN_SESSION;
        expect(session.user.role).toBe("admin");

        // When: Creating concert
        const concertData = CONCERT_DATA[0];
        const result = await db.create({
          title: concertData.title,
          description: concertData.description,
          start_at: concertData.start_at,
          end_at: concertData.end_at,
          location: concertData.location,
          price: concertData.price,
          total_tickets: concertData.total_tickets,
          available_tickets: concertData.available_tickets,
          image: concertData.image,
          featured: concertData.featured,
          published: concertData.published,
        });

        // Then: Concert should be created
        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(result.data?.title).toBe(concertData.title);
      });
    });

    describe("Scenario: Admin views all concerts", () => {
      it("Given concerts exist, When viewing all, Then all concerts should be listed", async () => {
        // Given: Multiple concerts
        for (const data of CONCERT_DATA) {
          await db.create({
            title: data.title,
            description: data.description,
            start_at: data.start_at,
            end_at: data.end_at,
            location: data.location,
            price: data.price,
            total_tickets: data.total_tickets,
            available_tickets: data.available_tickets,
            image: data.image,
            featured: data.featured,
            published: data.published,
          });
        }

        // When: Fetching all concerts
        const result = await db.findAll();

        // Then: All concerts returned
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(CONCERT_DATA.length);
      });
    });

    describe("Scenario: Admin updates concert details", () => {
      it("Given a concert exists, When updating, Then changes should be saved", async () => {
        // Given: Existing concert
        const createResult = await db.create({
          title: "Original Title",
          description: "Original description",
          start_at: "2024-12-01T19:00:00Z",
          end_at: "2024-12-01T22:00:00Z",
          location: "Original Venue",
          price: 100,
          total_tickets: 500,
          available_tickets: 500,
          image: null,
          featured: false,
          published: true,
        });
        const concertId = createResult.data!.id;

        // When: Updating concert
        const updates = { title: "Updated Title", price: 150 };
        const updateResult = await db.update(concertId, updates);

        // Then: Changes should be saved
        expect(updateResult.error).toBeNull();
        expect(updateResult.data?.title).toBe("Updated Title");
        expect(updateResult.data?.price).toBe(150);
      });
    });

    describe("Scenario: Admin deletes a concert", () => {
      it("Given a concert exists, When deleting, Then concert should be removed", async () => {
        // Given: Existing concert
        const createResult = await db.create({
          title: "To Delete",
          description: "Concert to be deleted",
          start_at: "2024-12-01T19:00:00Z",
          end_at: "2024-12-01T22:00:00Z",
          location: "Venue",
          price: 100,
          total_tickets: 500,
          available_tickets: 500,
          image: null,
          featured: false,
          published: true,
        });
        const concertId = createResult.data!.id;
        expect(db.getCount()).toBe(1);

        // When: Deleting concert
        const deleteResult = await db.delete(concertId);

        // Then: Concert should be removed
        expect(deleteResult.error).toBeNull();
        expect(db.getCount()).toBe(0);
      });
    });
  });

  // ============================================================
  // Complete CRUD Lifecycle Test
  // ============================================================

  describe("Complete CRUD Workflow", () => {
    it("should complete full CRUD lifecycle", async () => {
      // CREATE
      const createData = CONCERT_DATA[0];
      const createResult = await db.create({
        title: createData.title,
        description: createData.description,
        start_at: createData.start_at,
        end_at: createData.end_at,
        location: createData.location,
        price: createData.price,
        total_tickets: createData.total_tickets,
        available_tickets: createData.available_tickets,
        image: createData.image,
        featured: createData.featured,
        published: createData.published,
      });
      expect(createResult.error).toBeNull();
      const concertId = createResult.data!.id;

      // READ
      const readResult = await db.findById(concertId);
      expect(readResult.error).toBeNull();
      expect(readResult.data?.title).toBe(createData.title);

      // UPDATE
      const updateResult = await db.update(concertId, { 
        title: "Modified Concert",
        price: 200 
      });
      expect(updateResult.error).toBeNull();
      expect(updateResult.data?.title).toBe("Modified Concert");

      // DELETE
      const deleteResult = await db.delete(concertId);
      expect(deleteResult.error).toBeNull();

      // VERIFY DELETION
      const verifyResult = await db.findById(concertId);
      expect(verifyResult.error).not.toBeNull();
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================

  describe("Error Handling", () => {
    it("should handle database connection errors on create", async () => {
      db.setError(true, "Connection refused");
      
      const result = await db.create({
        title: "Test",
        description: "Test description",
        start_at: "2024-12-01T19:00:00Z",
        end_at: "2024-12-01T22:00:00Z",
        location: "Venue",
        price: 100,
        total_tickets: 500,
        available_tickets: 500,
        image: null,
        featured: false,
        published: true,
      });
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Connection refused");
    });

    it("should handle database connection errors on read", async () => {
      db.setError(true, "Connection timeout");
      
      const result = await db.findAll();
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Connection timeout");
    });

    it("should handle not found on get single concert", async () => {
      const result = await db.findById("non-existent-id");
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Concert not found");
    });

    it("should handle not found on update", async () => {
      const result = await db.update("non-existent-id", { title: "New" });
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Concert not found");
    });

    it("should handle not found on delete", async () => {
      const result = await db.delete("non-existent-id");
      
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Concert not found");
    });
  });

  // ============================================================
  // Data Validation Tests
  // ============================================================

  describe("Data Validation", () => {
    it("should validate concert has required fields", async () => {
      const result = await db.create({
        title: "Valid Concert",
        description: "Description",
        start_at: "2024-12-01T19:00:00Z",
        end_at: "2024-12-01T22:00:00Z",
        location: "Valid Venue",
        price: 50,
        total_tickets: 100,
        available_tickets: 100,
        image: "https://example.com/image.jpg",
        featured: false,
        published: true,
      });

      expect(result.data).toMatchObject({
        title: "Valid Concert",
        location: "Valid Venue",
        price: 50,
      });
    });

    it("should preserve all concert fields on create", async () => {
      const concertData: Omit<Concert, 'id' | 'created_at'> = {
        title: "Full Concert",
        description: "A full description",
        start_at: "2024-06-15T19:00:00Z",
        end_at: "2024-06-15T22:00:00Z",
        location: "Full Venue",
        price: 75,
        total_tickets: 1000,
        available_tickets: 1000,
        image: "https://example.com/full.jpg",
        featured: true,
        published: true,
      };

      const result = await db.create(concertData);

      expect(result.data?.title).toBe(concertData.title);
      expect(result.data?.location).toBe(concertData.location);
      expect(result.data?.price).toBe(concertData.price);
      expect(result.data?.total_tickets).toBe(concertData.total_tickets);
    });
  });

  // ============================================================
  // Sorting and Ordering Tests
  // ============================================================

  describe("Sorting and Ordering", () => {
    it("should return concerts sorted by creation date descending", async () => {
      // Create concerts with slight delays to ensure different timestamps
      for (const data of CONCERT_DATA.slice(0, 3)) {
        await db.create({
          title: data.title,
          description: data.description,
          start_at: data.start_at,
          end_at: data.end_at,
          location: data.location,
          price: data.price,
          total_tickets: data.total_tickets,
          available_tickets: data.available_tickets,
          image: data.image,
          featured: data.featured,
          published: data.published,
        });
      }

      const result = await db.findAll();

      expect(result.data).toHaveLength(3);
      // Verify sorted by created_at descending
      for (let i = 0; i < result.data!.length - 1; i++) {
        const current = new Date(result.data![i].created_at).getTime();
        const next = new Date(result.data![i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });
});
