import { NextResponse } from 'next/server';
import { db, Tournament } from '@/lib/googleSheets';
import { checkAdminAuth, getUnauthorizedResponse } from '@/lib/serverAuth';

export async function GET() {
    try {
        const tournaments = await db.tournaments.getAll();
        return NextResponse.json(tournaments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || '123';

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const body = await request.json();
        const newTournament: Tournament = {
            id: Date.now().toString(),
            ...body,
            status: 'upcoming',
        };
        await db.tournaments.add(newTournament);
        return NextResponse.json(newTournament);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add tournament' }, { status: 500 });
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
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        const success = await db.tournaments.update(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Tournament not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Tournament updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
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
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        const success = await db.tournaments.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Tournament not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Tournament deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
    }
}
