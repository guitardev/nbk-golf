import { google } from 'googleapis';

// Interface definitions
export interface Player {
    id: string;
    name: string;
    lineUserId?: string;
    handicap: number;
    team?: string;
    email?: string;
    phone?: string;
}

export interface Tournament {
    id: string;
    name: string;
    date: string;
    courseId: string;
    status: 'upcoming' | 'active' | 'completed';
}

export interface Score {
    tournamentId: string;
    playerId: string;
    hole: number;
    strokes: number;
    par: number;
}

export interface Course {
    id: string;
    name: string;
    pars: number[]; // Array of 18 pars
    distances?: number[]; // Array of 18 distances
}

export interface Registration {
    id: string;
    tournamentId: string;
    playerName: string;
    email: string;
    phone: string;
    status: 'pending' | 'paid';
}

// Google Sheets Setup
const privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
// If the key contains actual newlines, use it as is.
// Otherwise, replace literal \n with actual newlines.
const formattedKey = privateKey.includes('\n') ? privateKey : privateKey.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formattedKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Helper to get sheet data
async function getSheetData(range: string) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range,
        });
        return response.data.values || [];
    } catch (error) {
        console.error(`Error reading sheet ${range}:`, error);
        return [];
    }
}

// Helper to append data
async function appendSheetData(range: string, values: any[]) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });
        return true;
    } catch (error) {
        console.error(`Error appending to sheet ${range}:`, error);
        return false;
    }
}

// Helper to update a row
async function updateSheetRow(range: string, rowIndex: number, values: any[]) {
    try {
        const cellRange = `${range.split('!')[0]}!A${rowIndex}:${String.fromCharCode(64 + values.length)}${rowIndex}`;
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: cellRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });
        return true;
    } catch (error) {
        console.error(`Error updating row ${rowIndex} in ${range}:`, error);
        return false;
    }
}

// Helper to delete a row (by clearing it)
async function deleteSheetRow(range: string, rowIndex: number) {
    try {
        const sheetName = range.split('!')[0];
        const cellRange = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: cellRange,
        });
        return true;
    } catch (error) {
        console.error(`Error deleting row ${rowIndex} in ${range}:`, error);
        return false;
    }
}

// Helper to find row index by ID
async function findRowIndexById(range: string, id: string): Promise<number | null> {
    try {
        const rows = await getSheetData(range);
        const index = rows.findIndex((row) => row[0] === id);
        return index !== -1 ? index + 2 : null; // +2 because: 0-indexed array + header row
    } catch (error) {
        console.error(`Error finding row in ${range}:`, error);
        return null;
    }
}


export const db = {
    players: {
        getAll: async (): Promise<Player[]> => {
            const rows = await getSheetData('Players!A2:G');
            return rows.map((row) => ({
                id: row[0],
                name: row[1],
                lineUserId: row[2],
                handicap: Number(row[3]),
                team: row[4],
                email: row[5],
                phone: row[6],
            }));
        },
        add: async (player: Player) => {
            return await appendSheetData('Players!A:G', [
                player.id,
                player.name,
                player.lineUserId || '',
                player.handicap,
                player.team || '',
                player.email || '',
                player.phone || '',
            ]);
        },
        update: async (id: string, player: Partial<Player>) => {
            const rowIndex = await findRowIndexById('Players!A2:G', id);
            if (!rowIndex) return false;

            const existing = await db.players.getAll();
            const current = existing.find(p => p.id === id);
            if (!current) return false;

            const updated = { ...current, ...player };
            return await updateSheetRow('Players!A:G', rowIndex, [
                updated.id,
                updated.name,
                updated.lineUserId || '',
                updated.handicap,
                updated.team || '',
                updated.email || '',
                updated.phone || '',
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Players!A2:G', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Players!A:G', rowIndex);
        },
    },
    tournaments: {
        getAll: async (): Promise<Tournament[]> => {
            const rows = await getSheetData('Tournaments!A2:E');
            return rows.map((row) => ({
                id: row[0],
                name: row[1],
                date: row[2],
                courseId: row[3],
                status: row[4] as Tournament['status'],
            }));
        },
        add: async (tournament: Tournament) => {
            return await appendSheetData('Tournaments!A:E', [
                tournament.id,
                tournament.name,
                tournament.date,
                tournament.courseId,
                tournament.status,
            ]);
        },
        update: async (id: string, tournament: Partial<Tournament>) => {
            const rowIndex = await findRowIndexById('Tournaments!A2:E', id);
            if (!rowIndex) return false;

            const existing = await db.tournaments.getAll();
            const current = existing.find(t => t.id === id);
            if (!current) return false;

            const updated = { ...current, ...tournament };
            return await updateSheetRow('Tournaments!A:E', rowIndex, [
                updated.id,
                updated.name,
                updated.date,
                updated.courseId,
                updated.status,
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Tournaments!A2:E', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Tournaments!A:E', rowIndex);
        },
    },
    scores: {
        add: async (score: Score) => {
            const rows = await getSheetData('Scores!A2:E');
            const existingIndex = rows.findIndex(row =>
                row[0] === score.tournamentId &&
                row[1] === score.playerId &&
                Number(row[2]) === score.hole
            );

            if (existingIndex !== -1) {
                // Update existing row
                const rowIndex = existingIndex + 2;
                return await updateSheetRow('Scores!A:E', rowIndex, [
                    score.tournamentId,
                    score.playerId,
                    score.hole,
                    score.strokes,
                    score.par,
                ]);
            } else {
                // Append new row
                return await appendSheetData('Scores!A:E', [
                    score.tournamentId,
                    score.playerId,
                    score.hole,
                    score.strokes,
                    score.par,
                ]);
            }
        },
        getByTournament: async (tournamentId: string): Promise<Score[]> => {
            const rows = await getSheetData('Scores!A2:E');
            const scores = rows
                .filter((row) => row[0] === tournamentId)
                .map((row) => ({
                    tournamentId: row[0],
                    playerId: row[1],
                    hole: Number(row[2]),
                    strokes: Number(row[3]),
                    par: Number(row[4]),
                }));

            // Deduplicate: keep the last one found (assuming append order = time order)
            const uniqueScoresMap = new Map<string, Score>();
            scores.forEach(score => {
                const key = `${score.playerId}-${score.hole}`;
                uniqueScoresMap.set(key, score);
            });

            return Array.from(uniqueScoresMap.values());
        },
    },
    courses: {
        getAll: async (): Promise<Course[]> => {
            const rows = await getSheetData('Courses!A2:D');
            return rows.map((row) => ({
                id: row[0],
                name: row[1],
                pars: row[2].split(',').map(Number),
                distances: row[3] ? row[3].split(',').map(Number) : [],
            }));
        },
        add: async (course: Course) => {
            return await appendSheetData('Courses!A:D', [
                course.id,
                course.name,
                course.pars.join(','),
                course.distances?.join(',') || '',
            ]);
        },
        update: async (id: string, course: Partial<Course>) => {
            const rowIndex = await findRowIndexById('Courses!A2:D', id);
            if (!rowIndex) return false;

            const existing = await db.courses.getAll();
            const current = existing.find(c => c.id === id);
            if (!current) return false;

            const updated = { ...current, ...course };
            return await updateSheetRow('Courses!A:D', rowIndex, [
                updated.id,
                updated.name,
                updated.pars.join(','),
                updated.distances?.join(',') || '',
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Courses!A2:D', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Courses!A:D', rowIndex);
        },
    },
    registrations: {
        getAll: async (): Promise<Registration[]> => {
            const rows = await getSheetData('Registrations!A2:F');
            return rows.map((row) => ({
                id: row[0],
                tournamentId: row[1],
                playerName: row[2],
                email: row[3],
                phone: row[4],
                status: row[5] as Registration['status'],
            }));
        },
        add: async (registration: Registration) => {
            return await appendSheetData('Registrations!A:F', [
                registration.id,
                registration.tournamentId,
                registration.playerName,
                registration.email,
                registration.phone,
                registration.status,
            ]);
        },
        update: async (id: string, registration: Partial<Registration>) => {
            const rowIndex = await findRowIndexById('Registrations!A2:F', id);
            if (!rowIndex) return false;

            const existing = await db.registrations.getAll();
            const current = existing.find(r => r.id === id);
            if (!current) return false;

            const updated = { ...current, ...registration };
            return await updateSheetRow('Registrations!A:F', rowIndex, [
                updated.id,
                updated.tournamentId,
                updated.playerName,
                updated.email,
                updated.phone,
                updated.status,
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Registrations!A2:F', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Registrations!A:F', rowIndex);
        },
    },
};
