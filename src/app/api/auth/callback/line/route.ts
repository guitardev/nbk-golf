import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback/line`,
                client_id: process.env.LINE_CHANNEL_ID || '',
                client_secret: process.env.LINE_CHANNEL_SECRET || '',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokenData.error_description || 'Failed to get token');
        }

        // Get user profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const profileData = await profileResponse.json();

        // In a real app, you would create a session (cookie) here
        // For this demo, we'll redirect to a page that stores the user info in localStorage (or handle it via cookies)

        // Redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        console.error('Line Login Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
