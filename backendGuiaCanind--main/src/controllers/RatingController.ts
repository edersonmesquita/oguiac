import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { CreateRatingDTO } from '../models/Rating';

export class RatingController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateRatingDTO = req.body;
      
      // Validate stars (1-5)
      if (data.stars < 1 || data.stars > 5) {
        return res.status(400).json({ error: 'Stars must be between 1 and 5' });
      }

      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: data.companyId }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Create rating
      const rating = await prisma.rating.create({
        data: {
          stars: data.stars,
          companyId: data.companyId,
          userId: data.userId // This will be undefined for anonymous ratings
        }
      });

      return res.status(201).json(rating);
    } catch (error) {
      console.error('Error creating rating:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCompanyRatings(req: Request, res: Response) {
    try {
      const { companyId } = req.params;

      const ratings = await prisma.rating.findMany({
        where: { companyId }
      });

      // Calculate average rating
      const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
      const averageRating = ratings.length > 0 ? totalStars / ratings.length : 0;

      return res.json({
        ratings,
        averageRating,
        totalRatings: ratings.length
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTopRatedCompanies(req: Request, res: Response) {
    try {
      const companies = await prisma.company.findMany({
        where: {
          approved: true,
          ratings: {
            some: {} // Only companies with at least one rating
          }
        },
        include: {
          category: true,
          ratings: true
        }
      });

      // Calculate average ratings and sort companies
      const companiesWithAvgRating = companies.map(company => {
        const totalStars = company.ratings.reduce((sum, rating) => sum + rating.stars, 0);
        const averageRating = company.ratings.length > 0 ? totalStars / company.ratings.length : 0;
        
        return {
          ...company,
          ratings: undefined, // Remove individual ratings from response
          averageRating,
          totalRatings: company.ratings.length
        };
      }).sort((a, b) => b.averageRating - a.averageRating);

      return res.json(companiesWithAvgRating);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 