import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { IconX, IconEye, IconEyeOff, IconLock, IconRefresh } from '@tabler/icons-react';

interface Company {
  id: string;
  name: string;
}

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => void;
  company: Company | null;
}

export default function CredentialModal({ isOpen, onClose, onSubmit, company }: CredentialModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);
  
  useEffect(() => {
    // Fetch existing credentials when modal is opened
    if (isOpen && company) {
      const fetchCredentials = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('adminToken');
          if (!token) {
            setError('Token não encontrado');
            return;
          }
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/empresas/${company.id}/credentials`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Erro ao buscar credenciais');
          }
          
          const data = await response.json();
          if (data.hasCredentials) {
            setEmail(data.credentials.email);
            setHasExistingCredentials(true);
          } else {
            setEmail('');
            setPassword('');
            setHasExistingCredentials(false);
          }
        } catch (err) {
          setError('Erro ao carregar credenciais existentes');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCredentials();
    }
  }, [isOpen, company]);
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setError('');
    }
  }, [isOpen]);
  
  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    
    // Length check
    if (pwd.length >= 8) strength += 25;
    else if (pwd.length >= 6) strength += 15;
    
    // Character variety checks
    if (/[A-Z]/.test(pwd)) strength += 25; // Has uppercase
    if (/[0-9]/.test(pwd)) strength += 25; // Has number
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25; // Has special char
    
    return Math.min(100, strength);
  };

  const passwordStrength = getPasswordStrength(password);
  
  const getStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Muito fraca';
    if (passwordStrength < 50) return 'Fraca';
    if (passwordStrength < 75) return 'Média';
    return 'Forte';
  };
  
  const generatePassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const length = 10;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setPassword(result);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return;
    }
    
    onSubmit(email, password);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto pt-4 sm:pt-6">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

      <div className="flex justify-center items-start min-h-full p-4">
        <Dialog.Panel className="relative bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <IconLock className="mr-2 text-indigo-500" size={20} />
                {hasExistingCredentials ? 'Editar Credenciais de Acesso' : 'Gerar Credenciais de Acesso'}
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
              >
                <IconX size={20} aria-hidden="true" />
              </button>
            </div>
          </div>

          {company && (
            <div className="p-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50 mb-5">
                <h4 className="font-medium text-indigo-800 dark:text-indigo-300 text-sm">
                  Empresa: <span className="font-bold">{company.name}</span>
                </h4>
                <p className="text-xs mt-1 text-indigo-600 dark:text-indigo-400">
                  As credenciais permitirão que a empresa gerencie seus próprios dados no sistema.
                </p>
                {hasExistingCredentials && (
                  <p className="text-xs mt-1 font-medium text-indigo-700 dark:text-indigo-300">
                    Esta empresa já possui credenciais. Modifique abaixo para atualizar.
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-md text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email da empresa
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-md py-2 px-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="empresa@example.com"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      O email será usado para acessar o painel da empresa
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {hasExistingCredentials ? 'Nova Senha' : 'Senha'}
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-md py-2 px-2 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 pr-10 sm:text-sm"
                        placeholder={hasExistingCredentials ? "Nova senha (deixe em branco para não alterar)" : "******"}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full ${getStrengthColor()}`} style={{ width: `${passwordStrength}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Força da senha: <span className={`font-medium ${getStrengthColor().replace('bg-', 'text-')}`}>{getStrengthText()}</span>
                        </p>
                      </div>
                    )}
                    
                    {/* Generate password button */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <IconRefresh size={14} className="mr-1" />
                        Gerar senha aleatória segura
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {hasExistingCredentials ? 'Atualizar Credenciais' : 'Gerar Credenciais'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 