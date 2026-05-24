import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';

export class CategoryController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateCategoryDTO = req.body;
      const category = await prisma.category.create({ data });
      return res.status(201).json(category);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { companies: true }
          }
        }
      });
      return res.json(categories);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { companies: true }
          }
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      return res.json(category);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateCategoryDTO = req.body;

      const category = await prisma.category.update({
        where: { id },
        data
      });

      return res.json(category);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if category has associated companies
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { companies: true }
          }
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (category._count.companies > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with associated companies. Please reassign or delete the companies first.' 
        });
      }

      await prisma.category.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 