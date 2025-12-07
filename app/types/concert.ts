export type Concert = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string;
  price: number;
  total_tickets: number;
  available_tickets: number;
  image: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
};
