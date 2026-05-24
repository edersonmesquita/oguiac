import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { CreateCompanyDTO, UpdateCompanyDTO } from '../models/Company';

// Função para processar a URL da logo
function processLogoUrl(logo: string | undefined): string | undefined {
  if (!logo) return undefined;

  // Se for uma URL do Uploadthing, retorna como está
  if (logo.includes('uploadthing')) {
    return logo;
  }

  // Se for uma URL completa, retorna como está
  if (logo.startsWith('http')) {
    return logo;
  }

  // Se for base64, retorna undefined (não salva base64 no banco)
  if (logo.startsWith('data:image')) {
    return undefined;
  }

  // Se for um caminho relativo no formato /uploads/logo_UUID.jpeg, manter
  if (logo.startsWith('/uploads/logo_') || logo.startsWith('uploads/logo_')) {
    // Normalizamos para garantir que começa com barra
    return logo.startsWith('/') ? logo : `/${logo}`;
  }

  // Outros formatos de caminho relativo serão ignorados
  return undefined;
}

// Função para migrar logos antigas
async function migrateOldLogos() {
  try {
    // Use o select específico para evitar campos que podem não existir no banco
    const companies = await prisma.company.findMany({
      where: {
        logo: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        logo: true
      }
    });

    for (const company of companies) {
      if (company.logo) {
        // Se a logo não for uma URL válida, remove ela
        if (!company.logo.includes('uploadthing') && !company.logo.startsWith('http')) {
          await prisma.company.update({
            where: { id: company.id },
            data: { logo: undefined }
          });
          console.log(`Logo removida da empresa ${company.name} (ID: ${company.id})`);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao migrar logos:', error);
  }
}

export class CompanyController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateCompanyDTO = req.body;
      // Processa a URL da logo antes de salvar
      data.logo = processLogoUrl(data.logo);
      
      // Set approved as false by default
      const company = await prisma.company.create({ 
        data: {
          ...data,
          approved: false
        }
      });
      
      return res.status(201).json(company);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      // Executa a migração antes de buscar as empresas
      await migrateOldLogos();

      const companies = await prisma.company.findMany({
        where: {
          approved: true
        },
        include: {
          category: true,
          ratings: true
        }
      });

      // Calculate average ratings
      const companiesWithRatings = companies.map(company => {
        const totalStars = company.ratings.reduce((acc, rating) => acc + rating.stars, 0);
        const averageRating = company.ratings.length > 0 ? totalStars / company.ratings.length : 0;

        return {
          ...company,
          ratings: undefined, // Remove individual ratings from response
          averageRating,
          totalRatings: company.ratings.length
        };
      });

      return res.json(companiesWithRatings);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company = await prisma.company.findFirst({
        where: { 
          id,
          approved: true
        },
        include: { category: true }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      return res.json(company);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateCompanyDTO = req.body;
      
      // Log the input data for debugging
      console.log('Update request:', { id, data });
      
      // Prepare a clean data object to avoid any potential Prisma issues
      const updateData: any = {};
      
      // Only include defined fields in the update
      if (data.name !== undefined) updateData.name = data.name;
      if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.instagram !== undefined) updateData.instagram = data.instagram;
      if (data.facebook !== undefined) updateData.facebook = data.facebook;
      if (data.youtube !== undefined) updateData.youtube = data.youtube;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      
      // Handle website explicitly, allow empty string
      if (data.website !== undefined) {
        updateData.website = data.website;
      }
      
      // Process logo if present
      if (data.logo) {
        updateData.logo = processLogoUrl(data.logo);
      }
      
      console.log('Cleaned update data:', updateData);
      
      const company = await prisma.company.update({
        where: { id },
        data: updateData
      });
      
      return res.json(company);
    } catch (error) {
      console.error('Error updating company:', error);
      return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.company.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findByCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const companies = await prisma.company.findMany({
        where: { 
          categoryId,
          approved: true
        },
        include: {
          category: true,
          ratings: true
        }
      });

      // Calculate average ratings
      const companiesWithRatings = companies.map(company => {
        const totalStars = company.ratings.reduce((acc, rating) => acc + rating.stars, 0);
        const averageRating = company.ratings.length > 0 ? totalStars / company.ratings.length : 0;

        return {
          ...company,
          ratings: undefined, // Remove individual ratings from response
          averageRating,
          totalRatings: company.ratings.length
        };
      });

      return res.json(companiesWithRatings);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 