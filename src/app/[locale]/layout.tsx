import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import '../globals.css';
import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "NBK Golf Tournament",
    description: "Premium Golf Tournament Recording System",
};

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Await params in Next.js 16
    const { locale } = await params;

    // Validate locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body>
                <AuthProvider>
                    <NextIntlClientProvider messages={messages} locale={locale}>
                        <div className="min-h-screen bg-gray-50">
                            {/* Navigation Header */}
                            <nav className="bg-white shadow-sm border-b border-gray-200">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <div className="flex justify-between items-center h-16">
                                        <div className="flex items-center">
                                            <h1 className="text-xl font-bold text-emerald-600">
                                                NBK Golf
                                            </h1>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <LanguageSwitcher />
                                        </div>
                                    </div>
                                </div>
                            </nav>

                            {/* Main Content */}
                            <main>
                                {children}
                            </main>
                        </div>
                    </NextIntlClientProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
