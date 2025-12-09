import { Concert } from "@/app/types/concert";
import { Order } from "@/app/types/order";

export const buildConcert = (overrides: Partial<Concert> = {}): Concert => ({
  id: "concert-1",
  title: "Rock Night",
  description: "A loud concert",
  start_at: new Date("2025-01-01T19:00:00Z").toISOString(),
  end_at: new Date("2025-01-01T22:00:00Z").toISOString(),
  location: "Stadium",
  price: 150000,
  total_tickets: 100,
  available_tickets: 50,
  image: "/banner1.jpg",
  featured: true,
  published: true,
  created_at: new Date("2024-12-01T00:00:00Z").toISOString(),
  ...overrides,
});

export const buildOrder = (
  overrides: Partial<Order> = {},
  concert: Concert = buildConcert()
): Order => ({
  id: "order-1",
  user_id: "user-1",
  concert_id: concert.id,
  quantity: 2,
  total_price: concert.price * 2,
  status: "success",
  created_at: new Date("2025-01-02T10:00:00Z").toISOString(),
  concerts: concert,
  ...overrides,
});
