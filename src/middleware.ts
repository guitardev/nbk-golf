import { auth } from "@/auth";
import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'en'
});

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // Check if visiting dashboard
    // Path might be /en/dashboard or /dashboard
    const isDashboard = nextUrl.pathname.includes('/dashboard');

    if (isDashboard && !isLoggedIn) {
        // Redirect to home page (which has login button)
        // We should preserve locale if possible, or default to en
        // For simplicity, redirect to root (intl middleware will handle default locale)
        return NextResponse.redirect(new URL('/', nextUrl));
    }

    return intlMiddleware(req);
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
