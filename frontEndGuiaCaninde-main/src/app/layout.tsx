import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MobileNav from "../components/MobileNav";
import DesktopNav from "../components/DesktopNav";
import ThemeToggle from "../components/ThemeToggle";
import ClientLayout from "@/components/ClientLayout";
import InstallPWA from "@/components/InstallPWA";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Guia Canindé - Encontre os melhores negócios da cidade",
    description:
        "O melhor guia de empresas e serviços de Canindé. Encontre os melhores negócios da cidade.",
    manifest: "/manifest.json",
    themeColor: "#4f46e5",
    openGraph: {
        title: "Guia Canindé - Encontre os melhores negócios da cidade",
        description:
            "O melhor guia de empresas e serviços de Canindé. Encontre os melhores negócios da cidade.",
        url: "https://guiacaninde.com.br",
        siteName: "Guia Canindé",
        images: [
            {
                url: "https://oguiacaninde.com.br/ICONETESTE.png",
                width: 800,
                height: 600,
                alt: "Guia Canindé",
            },
        ],
        locale: "pt_BR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Guia Canindé - Encontre os melhores negócios da cidade",
        description:
            "O melhor guia de empresas e serviços de Canindé. Encontre os melhores negócios da cidade.",
        images: ["https://oguiacaninde.com.br/ICONETESTE.png"],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "O Guia Canindé",
    },
    icons: {
        icon: [
            {
                url: "/ICONELIGHT.png",
                sizes: "any",
            },
            {
                url: "/ICONELIGHT.png",
                type: "image/png",
                sizes: "32x32",
            },
        ],
        apple: {
            url: "/ICONELIGHT.png",
            type: "image/png",
            sizes: "180x180",
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className="light">
            <head>
                <meta name="application-name" content="Guia Canindé" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta
                    name="apple-mobile-web-app-title"
                    content="Guia Canindé"
                />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="theme-color" content="#4f46e5" />

                {/* Meta tags para compartilhamento no WhatsApp */}
                <meta property="og:title" content="O Guia Canindé" />
                <meta
                    property="og:description"
                    content="Diretório de empresas e serviços de Canindé"
                />
                <meta
                    property="og:image"
                    content="https://oguiacaninde.com.br/ICONETESTE.png"
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:url" content="https://oguiacaninde.com.br" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="O Guia Canindé" />
                <meta property="og:locale" content="pt_BR" />
            </head>
            <body
                className={`${inter.className} pb-16 md:pb-0 md:pt-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}
            >
                <Providers>
                    <ClientLayout>
                        <DesktopNav />
                        <div className="min-h-screen">{children}</div>
                        <ThemeToggle />
                        <MobileNav />
                        <InstallPWA />
                        <WhatsAppButton />
                    </ClientLayout>
                </Providers>
            </body>
        </html>
    );
}
