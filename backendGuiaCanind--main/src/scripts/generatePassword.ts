import bcrypt from 'bcrypt';

const password = 'admin123'; // Esta será a senha que você usará para fazer login
const saltRounds = 10;
 
bcrypt.hash(password, saltRounds).then(hash => {
  console.log('Senha hasheada:', hash);
}); 