import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Extend Request type
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: string;
  };
}

export class CompanyDashboardController {
  // Get company profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user?.id;
      
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }
      
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              features: true
            }
          }
        }
      });
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      return res.json(company);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Update company profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const companyId = req.user?.id;
      
      if (!companyId) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }
      
      // Check if we received form data with an image or just JSON data
      let updateData;
      let logoPath: string | null = null;
      
      if (req.file) {
        // Handle image upload
        logoPath = `/uploads/${req.file.filename}`;
        
        // Parse the form data
        updateData = req.body.data ? JSON.parse(req.body.data) : {};
        updateData.logo = logoPath;
      } else {
        // Regular JSON data
        updateData = req.body;
      }
      
      // Update company profile
      const company = await prisma.company.update({
        where: { id: companyId },
        data: {
          name: updateData.name,
          whatsapp: updateData.whatsapp,
          address: updateData.address,
          description: updateData.description,
          instagram: updateData.instagram,
          facebook: updateData.facebook,
          youtube: updateData.youtube,
          website: updateData.website,
          categoryId: updateData.categoryId,
          ...(logoPath && { logo: logoPath })
        },
        include: {
          category: true
        }
      });
      
      return res.json({
        message: 'Profile updated successfully',
        company
      });
    } catch (error) {
      console.error('Error updating company profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Get available plans
  async getPlans(req: Request, res: Response) {
    try {
      const plans = await prisma.plan.findMany({
        orderBy: {
          price: 'asc'
        }
      });
      
      return res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 