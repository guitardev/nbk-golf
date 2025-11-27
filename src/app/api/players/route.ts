import { NextResponse } from 'next/server';
import { db, Player } from '@/lib/googleSheets';
import { checkAdminAuth, getUnauthorizedResponse } from '@/lib/serverAuth';

export async function GET() {
    try {
        const players = await db.players.getAll();
        return NextResponse.json(players);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // For now, allow POST without admin check (for registration flow)
        // In production, you may want to require admin for direct player creation
        const body = await request.json();
        const newPlayer: Player = {
            id: Date.now().toString(), // Simple ID generation
            ...body,
        };
        await db.players.add(newPlayer);
        return NextResponse.json(newPlayer);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        // Extract user ID from headers or session
        // For now, using a mock check - in production, extract from Line auth token
        const userId = request.headers.get('x-user-id') || '123'; // Mock admin ID

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
        }

        const success = await db.players.update(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Player not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Player updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        // Extract user ID from headers or session
        const userId = request.headers.get('x-user-id') || '123'; // Mock admin ID

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
        }

        const success = await db.players.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Player not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Player deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
    }
}
