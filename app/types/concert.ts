export type Concert = {
  id: number;
  title: string;
  description: string;
  image: string;          // URL dari Supabase storage
  location: string;
  start_at: string;       // ISO timestamp
  end_at: string;
  qty: number;            // Total available tickets
  price: number;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};
