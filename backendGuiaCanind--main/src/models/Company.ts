export interface Company {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  description?: string;
  logo?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyDTO {
  name: string;
  whatsapp: string;
  address: string;
  description?: string;
  logo?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  categoryId: string;
}

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {} 