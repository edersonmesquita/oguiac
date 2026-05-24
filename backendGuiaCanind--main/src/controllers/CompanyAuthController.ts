import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class CompanyAuthController {
  // Generate credentials for a company (admin only)
  async generateCredentials(req: Request, res: Response) {
    try {
      const { id } = req.params; // Obter o ID da URL
      const { email, password } = req.body;
      
      if (!id || !email) {
        return res.status(400).json({ error: 'Company ID and email are required' });
      }
      
      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id }
      });
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      // Check if email is already in use
      const existingCompany = await prisma.company.findFirst({
        where: { email }
      });
      
      if (existingCompany && existingCompany.id !== id) {
        return res.status(400).json({ error: 'Email already in use by another company' });
      }
      
      // Prepare update data
      const updateData: { email: string; password?: string } = { email };
      
      // Only hash and update password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      // Update company with credentials
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true
        }
      });
      
      return res.json({
        message: 'Company credentials updated successfully',
        company: updatedCompany
      });
    } catch (error) {
      console.error('Error generating company credentials:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get company credentials (admin only)
  async getCompanyCredentials(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      // Find company by ID
      const company = await prisma.company.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          // Do not include password for security reasons
        }
      });
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      return res.json({
        hasCredentials: !!company.email,
        credentials: {
          email: company.email || ''
        }
      });
    } catch (error) {
      console.error('Error fetching company credentials:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Company login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find company by email
      const company = await prisma.company.findFirst({
        where: { email },
        include: { category: true }
      });
      
      if (!company || !company.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const validPassword = await bcrypt.compare(password, company.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate token
      const token = jwt.sign(
        { 
          id: company.id, 
          email: company.email,
          type: 'company' 
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '1d' }
      );
      
      return res.json({
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          category: company.category.name
        },
        token
      });
    } catch (error) {
      console.error('Error during company login:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 