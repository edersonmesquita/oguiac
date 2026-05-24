import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import path from 'path';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();

// Configuração básica
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração CORS unificada
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Rota de teste para verificar CORS
app.get('/test-cors', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'CORS está funcionando!',
    origin: req.headers.origin,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para verificar se a API está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API do Guia Canindé está funcionando!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api', router);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 