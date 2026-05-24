import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CompanyController } from '../controllers/CompanyController';
import { CompanyAuthController } from '../controllers/CompanyAuthController';
import upload from './upload';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();
const companyController = new CompanyController();
const companyAuthController = new CompanyAuthController();

// Schema de validação para empresa
const companySchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  whatsapp: z.string().min(11, 'WhatsApp inválido'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  categoryId: z.string().uuid('Categoria inválida'),
  description: z.string().max(300, 'Descrição deve ter no máximo 300 caracteres').optional(),
  logo: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  website: z.string().optional(),
});

// Public routes
router.get('/', companyController.findAll);
router.get('/:id', companyController.findById);
router.get('/category/:categoryId', companyController.findByCategory);
router.post('/', companyController.create);

// Company login
router.post('/login', companyAuthController.login);

// Protected routes
router.put('/:id', authMiddleware, companyController.update);
router.delete('/:id', authMiddleware, companyController.delete);

// Listar empresas (apenas liberadas)
router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        approved: true
      },
      include: {
        category: true,
        ratings: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average ratings for each company
    const companiesWithRatings = companies.map(company => {
      const totalStars = company.ratings.reduce((sum, rating) => sum + rating.stars, 0);
      const averageRating = company.ratings.length > 0 ? totalStars / company.ratings.length : 0;

      return {
        ...company,
        ratings: undefined, // Remove individual ratings from response
        averageRating,
        totalRatings: company.ratings.length
      };
    });

    res.json(companiesWithRatings);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Erro ao buscar empresas' });
  }
});

// Buscar empresa por ID (apenas liberadas)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findFirst({
      where: {
        id,
        approved: true
      },
      include: {
        category: true,
        ratings: true
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Calculate average rating
    const totalStars = company.ratings.reduce((sum, rating) => sum + rating.stars, 0);
    const averageRating = company.ratings.length > 0 ? totalStars / company.ratings.length : 0;

    // Format response
    const response = {
      ...company,
      ratings: undefined, // Remove individual ratings from response
      averageRating,
      totalRatings: company.ratings.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Erro ao buscar empresa' });
  }
});

// Buscar empresas por categoria (apenas liberadas)
router.get('/category/:categoryId', async (req, res) => {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average ratings for each company
    const companiesWithRatings = companies.map(company => {
      const totalStars = company.ratings.reduce((sum, rating) => sum + rating.stars, 0);
      const averageRating = company.ratings.length > 0 ? totalStars / company.ratings.length : 0;

      return {
        ...company,
        ratings: undefined, // Remove individual ratings from response
        averageRating,
        totalRatings: company.ratings.length
      };
    });

    res.json(companiesWithRatings);
  } catch (error) {
    console.error('Error fetching companies by category:', error);
    res.status(500).json({ message: 'Erro ao buscar empresas por categoria' });
  }
});

export default router; 