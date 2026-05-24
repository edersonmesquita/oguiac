import { Router } from 'express';
import { PrismaClient, Company, Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { CompanyAuthController } from '../controllers/CompanyAuthController';

const router = Router();
const prisma = new PrismaClient();
const companyAuthController = new CompanyAuthController();

// Admin credentials (em produção, isso deveria estar em variáveis de ambiente)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Senha simples para acesso

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Tentativa de login:', { username, password });

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    console.log('Login falhou:', { 
      expectedUsername: ADMIN_USERNAME,
      expectedPassword: ADMIN_PASSWORD,
      receivedUsername: username,
      receivedPassword: password
    });
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  console.log('Login bem-sucedido para:', username);
  const token = jwt.sign(
    { id: '1', role: 'admin' },
    process.env.JWT_SECRET || 'your-super-secret-key-change-this',
    { expiresIn: '24h' }
  );

  res.json({ token });
});

// Get dashboard statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalEmpresas,
      totalCategorias,
      empresasLiberadas,
      empresasBloqueadas
    ] = await Promise.all([
      prisma.company.count(),
      prisma.category.count(),
      prisma.company.count({ where: { approved: true } }),
      prisma.company.count({ where: { approved: false } })
    ]);

    res.json({
      totalEmpresas,
      totalCategorias,
      empresasLiberadas,
      empresasBloqueadas
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// Get recent businesses
router.get('/empresas/recent', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const recentEmpresas = await prisma.company.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    });

    res.json(recentEmpresas.map((empresa: Company & { category: { name: string } }) => ({
      id: empresa.id,
      nome: empresa.name,
      categoria: empresa.category.name,
      website: empresa.website,
      aprovado: empresa.approved,
      createdAt: empresa.createdAt
    })));
  } catch (error) {
    console.error('Error fetching recent businesses:', error);
    res.status(500).json({ message: 'Erro ao buscar empresas recentes' });
  }
});

// Get all businesses with pagination and search
router.get('/empresas', authMiddleware, adminMiddleware, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.CompanyWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { category: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } }
      ]
    } : {};

    const [total, empresas] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true
        }
      })
    ]);

    res.json({
      empresas: empresas.map((empresa) => ({
        id: empresa.id,
        name: empresa.name,
        whatsapp: empresa.whatsapp,
        address: empresa.address,
        description: empresa.description,
        logo: empresa.logo,
        instagram: empresa.instagram,
        facebook: empresa.facebook,
        youtube: empresa.youtube,
        website: empresa.website,
        approved: empresa.approved,
        category: {
          id: empresa.category.id,
          name: empresa.category.name
        },
        createdAt: empresa.createdAt
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ message: 'Erro ao buscar empresas' });
  }
});

// Update business approval status
router.patch('/empresas/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  try {
    const business = await prisma.company.update({
      where: { id },
      data: { approved }
    });

    res.json(business);
  } catch (error) {
    console.error('Error updating business approval:', error);
    res.status(500).json({ message: 'Erro ao atualizar status da empresa' });
  }
});

// Rota para verificar se o token é válido
router.get('/verify', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ valid: true });
});

// Add route for generating company credentials
router.post('/empresas/:id/credentials', authMiddleware, adminMiddleware, companyAuthController.generateCredentials);

// Add route for getting company credentials
router.get('/empresas/:id/credentials', authMiddleware, adminMiddleware, companyAuthController.getCompanyCredentials);

export default router; 