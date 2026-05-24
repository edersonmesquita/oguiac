import { Router } from 'express';
import companyRoutes from './company.routes';
import categoryRoutes from './category.routes';
import adminRoutes from './admin.routes';
import ratingRoutes from './rating.routes';
import companyDashboardRoutes from './company-dashboard.routes';

const router = Router();

router.use('/companies', companyRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/ratings', ratingRoutes);
router.use('/company-dashboard', companyDashboardRoutes);

export default router; 