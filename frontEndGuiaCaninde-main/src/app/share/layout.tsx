import { ReactNode } from 'react';

export default function ShareLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* 
        Este layout é intencionalmente mínimo para permitir que os metadados específicos 
        da página sejam priorizados pelos crawlers de redes sociais.
      */}
      {children}
    </>
  );
} 