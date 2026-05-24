export interface Rating {
  id: string;
  stars: number;
  companyId: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRatingDTO {
  stars: number;
  companyId: string;
  userId?: string;
} 