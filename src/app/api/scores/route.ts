import { NextResponse } from 'next/server';
import { db, Score } from '@/lib/googleSheets';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
        return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
    }

    try {
        const scores = await db.scores.getByTournament(tournamentId);
        return NextResponse.json(scores);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newScore: Score = {
            ...body,
        };
        await db.scores.add(newScore);
        return NextResponse.json(newScore);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add score' }, { status: 500 });
    }
}
