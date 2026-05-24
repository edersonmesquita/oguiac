import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';

const categoryRoutes = Router();
const categoryController = new CategoryController();

categoryRoutes.post('/', categoryController.create);
categoryRoutes.get('/', categoryController.findAll);
categoryRoutes.get('/:id', categoryController.findById);
categoryRoutes.put('/:id', categoryController.update);
categoryRoutes.delete('/:id', categoryController.delete);

export default categoryRoutes; 