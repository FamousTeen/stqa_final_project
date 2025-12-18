/**
 * Test Fixtures for Integration Tests
 * 
 * This file contains test data fixtures following the patterns from:
 * - 03_test_fixtures_coverage: Loading and managing test data
 * - 04_factories_and_fakes: Creating fake data with factories
 * 
 * Reference: https://github.com/FrostyVin/stqa_codes
 */

import { Concert } from "@/app/types/concert";
import { Order } from "@/app/types/order";
import { Profile } from "@/app/types/profile";

// ============================================================
// Test Data - Similar to ACCOUNT_DATA in Python examples
// ============================================================

export const CONCERT_DATA: Omit<Concert, 'id' | 'created_at'>[] = [
  {
    title: "Rock Night 2025",
    description: "An amazing rock concert featuring top bands",
    start_at: "2025-03-15T19:00:00Z",
    end_at: "2025-03-15T23:00:00Z",
    location: "Stadium Arena",
    price: 250000,
    total_tickets: 1000,
    available_tickets: 800,
    image: "/images/rock-night.jpg",
    featured: true,
    published: true,
  },
  {
    title: "Jazz Evening",
    description: "Smooth jazz under the stars",
    start_at: "2025-04-20T18:00:00Z",
    end_at: "2025-04-20T22:00:00Z",
    location: "City Hall",
    price: 150000,
    total_tickets: 500,
    available_tickets: 500,
    image: "/images/jazz-evening.jpg",
    featured: false,
    published: true,
  },
  {
    title: "Pop Festival",
    description: "Three-day pop music festival",
    start_at: "2025-05-10T10:00:00Z",
    end_at: "2025-05-12T23:00:00Z",
    location: "Beach Resort",
    price: 500000,
    total_tickets: 2000,
    available_tickets: 1500,
    image: "/images/pop-festival.jpg",
    featured: true,
    published: false, // Unpublished draft
  },
  {
    title: "Classical Symphony",
    description: "Orchestra performing classical masterpieces",
    start_at: "2025-06-01T19:30:00Z",
    end_at: "2025-06-01T21:30:00Z",
    location: "Concert Hall",
    price: 350000,
    total_tickets: 300,
    available_tickets: 0, // Sold out
    image: "/images/symphony.jpg",
    featured: false,
    published: true,
  },
];

export const USER_DATA: Omit<Profile, 'id' | 'created_at'>[] = [
  {
    email: "user1@example.com",
    role: "user",
    is_active: true,
  },
  {
    email: "user2@example.com",
    role: "user",
    is_active: true,
  },
  {
    email: "disabled@example.com",
    role: "user",
    is_active: false,
  },
  {
    email: "admin@example.com",
    role: "admin",
    is_active: true,
  },
];

// ============================================================
// Factory Functions - Following 04_factories_and_fakes pattern
// ============================================================

let concertIdCounter = 1;
let orderIdCounter = 1;
let userIdCounter = 1;

/**
 * Reset ID counters - Call in setUp/beforeEach
 */
export function resetIdCounters(): void {
  concertIdCounter = 1;
  orderIdCounter = 1;
  userIdCounter = 1;
}

/**
 * Build a Concert with default values and optional overrides
 */
export function buildConcert(overrides: Partial<Concert> = {}): Concert {
  const id = `concert-${concertIdCounter++}`;
  return {
    id,
    title: "Default Concert",
    description: "A default concert description",
    start_at: new Date("2025-06-01T19:00:00Z").toISOString(),
    end_at: new Date("2025-06-01T22:00:00Z").toISOString(),
    location: "Default Venue",
    price: 100000,
    total_tickets: 100,
    available_tickets: 50,
    image: "/default.jpg",
    featured: false,
    published: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Build multiple Concerts from test data
 */
export function buildConcertsFromData(): Concert[] {
  return CONCERT_DATA.map((data, index) => ({
    ...data,
    id: `concert-${index + 1}`,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Build a Profile with default values and optional overrides
 */
export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  const id = `user-${userIdCounter++}`;
  return {
    id,
    email: `user${userIdCounter}@example.com`,
    role: "user",
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Build multiple Profiles from test data
 */
export function buildProfilesFromData(): Profile[] {
  return USER_DATA.map((data, index) => ({
    ...data,
    id: `user-${index + 1}`,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Build an Order with default values and optional overrides
 */
export function buildOrder(
  overrides: Partial<Order> = {},
  concert?: Concert
): Order {
  const id = `order-${orderIdCounter++}`;
  const relatedConcert = concert || buildConcert();
  const quantity = overrides.quantity || 2;
  
  return {
    id,
    user_id: "user-1",
    concert_id: relatedConcert.id,
    quantity,
    total_price: overrides.total_price || relatedConcert.price * quantity,
    status: "success",
    created_at: new Date().toISOString(),
    concerts: relatedConcert,
    ...overrides,
  };
}

/**
 * Build an Order with specific concert details
 */
export function buildOrderWithConcert(
  concertOverrides: Partial<Concert> = {},
  orderOverrides: Partial<Order> = {}
): Order {
  const concert = buildConcert(concertOverrides);
  return buildOrder(orderOverrides, concert);
}

// ============================================================
// Mock Session Data - For authentication tests
// ============================================================

export const MOCK_USER_SESSION = {
  user: {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    role: "user",
    is_active: true,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const MOCK_ADMIN_SESSION = {
  user: {
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    is_active: true,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const MOCK_DISABLED_USER_SESSION = {
  user: {
    id: "disabled-1",
    email: "disabled@example.com",
    name: "Disabled User",
    role: "user",
    is_active: false,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// ============================================================
// API Response Mocks - Following 05_mocking_objects pattern
// ============================================================

export const SUPABASE_RESPONSES = {
  // Success responses
  concertCreated: (concert: Concert) => ({ data: concert, error: null }),
  concertUpdated: (concert: Concert) => ({ data: concert, error: null }),
  concertDeleted: () => ({ data: null, error: null }),
  concertsListed: (concerts: Concert[]) => ({ data: concerts, error: null }),
  
  orderCreated: (order: Order) => ({ data: order, error: null }),
  ordersListed: (orders: Order[]) => ({ data: orders, error: null }),
  
  profileListed: (profiles: Profile[]) => ({ data: profiles, error: null }),
  profileUpdated: (profile: Profile) => ({ data: profile, error: null }),
  
  // Error responses
  notFound: () => ({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
  unauthorized: () => ({ data: null, error: { code: '42501', message: 'Unauthorized' } }),
  foreignKeyViolation: () => ({ data: null, error: { code: '23503', message: 'Foreign key violation' } }),
  duplicateKey: () => ({ data: null, error: { code: '23505', message: 'Duplicate key' } }),
  serverError: () => ({ data: null, error: { code: '500', message: 'Internal server error' } }),
};

// ============================================================
// Validation Test Cases - For boundary and edge case testing
// ============================================================

export const VALIDATION_TEST_CASES = {
  signup: {
    validData: {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      password_confirmation: "password123",
    },
    missingName: {
      name: "",
      email: "john@example.com",
      password: "password123",
      password_confirmation: "password123",
    },
    missingEmail: {
      name: "John Doe",
      email: "",
      password: "password123",
      password_confirmation: "password123",
    },
    shortPassword: {
      name: "John Doe",
      email: "john@example.com",
      password: "123",
      password_confirmation: "123",
    },
    passwordMismatch: {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      password_confirmation: "different123",
    },
    invalidEmail: {
      name: "John Doe",
      email: "not-an-email",
      password: "password123",
      password_confirmation: "password123",
    },
  },
  order: {
    validQuantity: 1,
    maxQuantity: 10,
    zeroQuantity: 0,
    negativeQuantity: -1,
    exceedsAvailable: 1000,
  },
  concert: {
    validPrice: 100000,
    zeroPrice: 0,
    negativePrice: -1000,
    maxPrice: 10000000,
  },
};
