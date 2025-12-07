import { Concert } from './concert';

export type Order = {
  id: string;
  user_id: string;
  concert_id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  concerts?: Concert; // For joined queries
  profiles?: { email: string }; // For joined queries
};
