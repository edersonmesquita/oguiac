import { Router } from 'express';
import { RatingController } from '../controllers/RatingController';

const router = Router();
const ratingController = new RatingController();

// Create or update a rating (no authentication required)
router.post('/', ratingController.create);

// Get ratings for a specific company
router.get('/company/:companyId', ratingController.getCompanyRatings);

// Get top rated companies
router.get('/top-rated', ratingController.getTopRatedCompanies);

export default router; 