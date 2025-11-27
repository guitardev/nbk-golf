"use client";

import { useState, useEffect } from 'react';
import { Player, Score } from '@/lib/googleSheets';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface LeaderboardProps {
    tournamentId: string;
}

interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    totalStrokes: number;
    totalPar: number;
    score: number; // Relation to par (e.g. -2, +5)
}

export default function Leaderboard({ tournamentId }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [playersRes, scoresRes] = await Promise.all([
                fetch('/api/players'),
                fetch(`/api/scores?tournamentId=${tournamentId}`)
            ]);

            const players: Player[] = await playersRes.json();
            const scores: Score[] = await scoresRes.json();

            const playerMap = new Map(players.map(p => [p.id, p]));
            const leaderboardMap = new Map<string, LeaderboardEntry>();

            scores.forEach(score => {
                const player = playerMap.get(score.playerId);
                if (!player) return;

                if (!leaderboardMap.has(score.playerId)) {
                    leaderboardMap.set(score.playerId, {
                        playerId: score.playerId,
                        playerName: player.name,
                        totalStrokes: 0,
                        totalPar: 0,
                        score: 0
                    });
                }

                const entry = leaderboardMap.get(score.playerId)!;
                entry.totalStrokes += score.strokes;
                entry.totalPar += score.par;
                entry.score = entry.totalStrokes - entry.totalPar;
            });

            setEntries(Array.from(leaderboardMap.values()).sort((a, b) => a.score - b.score));
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [tournamentId]);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(entries.map(e => ({
            Position: entries.indexOf(e) + 1,
            Player: e.playerName,
            Score: e.score === 0 ? 'E' : e.score > 0 ? `+${e.score}` : e.score,
            TotalStrokes: e.totalStrokes,
            TotalPar: e.totalPar
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `tournament_results_${tournamentId}.xlsx`);
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Live Leaderboard</h3>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                    Export Excel
                </button>
            </div>
            <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thru</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry, index) => (
                            <tr key={entry.playerId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.playerName}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${entry.score < 0 ? 'text-red-600' : entry.score > 0 ? 'text-blue-600' : 'text-gray-900'
                                    }`}>
                                    {entry.score === 0 ? 'E' : entry.score > 0 ? `+${entry.score}` : entry.score}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
