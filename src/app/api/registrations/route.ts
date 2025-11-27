import { NextResponse } from 'next/server';
import { db, Registration } from '@/lib/googleSheets';
import { checkAdminAuth, getUnauthorizedResponse } from '@/lib/serverAuth';

export async function GET() {
    try {
        const registrations = await db.registrations.getAll();
        return NextResponse.json(registrations);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newRegistration: Registration = {
            id: Date.now().toString(),
            ...body,
            status: 'pending', // Default to pending until payment
        };
        await db.registrations.add(newRegistration);
        return NextResponse.json(newRegistration);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add registration' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || '123';

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }

        const success = await db.registrations.update(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Registration not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Registration updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || '123';

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
        }

        const success = await db.registrations.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Registration not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Registration deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
    }
}
