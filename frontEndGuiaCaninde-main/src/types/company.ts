export interface Company {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  logo?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  category: {
    id: string;
    name: string;
  };
  averageRating?: number;
  totalRatings?: number;
} 