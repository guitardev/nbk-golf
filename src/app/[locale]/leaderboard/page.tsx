"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

// Helper to calculate Net score (handicap prorated by holes played)
function calculateNet(gross: number, handicap: number, thru: number): number {
    const factor = thru / 18;
    const adjHandicap = Math.round(handicap * factor);
    return gross - adjHandicap;
}
import { Tournament, Player, Score, Course } from '@/lib/googleSheets';
import Header from '@/components/Header';

interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    handicap: number;
    totalStrokes: number;
    thru: number; // Holes played
    netScore: number;
    scores: { [hole: number]: number };
}

export default function LeaderboardPage() {
    const t = useTranslations('leaderboard'); // You might need to add this namespace
    const tCommon = useTranslations('common');

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'gross' | 'net'>('gross');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch('/api/tournaments');
                const data: Tournament[] = await res.json();
                setTournaments(data);
                if (data.length > 0) {
                    // Default to the most recent active or upcoming tournament
                    const active = data.find(t => t.status === 'active') || data[0];
                    setSelectedTournamentId(active.id);
                }
            } catch (err) {
                console.error("Failed to fetch tournaments", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (!selectedTournamentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [playersRes, scoresRes, coursesRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch(`/api/scores?tournamentId=${selectedTournamentId}`),
                    fetch('/api/courses')
                ]);

                const playersData: Player[] = await playersRes.json();
                const scoresData: Score[] = await scoresRes.json();
                const coursesData: Course[] = await coursesRes.json();

                const tournament = tournaments.find(t => t.id === selectedTournamentId);
                if (tournament) {
                    const currentCourse = coursesData.find(c => c.id === tournament.courseId);
                    setCourse(currentCourse || null);
                }

                // Calculate Leaderboard
                const entries: { [id: string]: LeaderboardEntry } = {};

                // Initialize with players who have scores
                const playerIdsWithScores = new Set(scoresData.map(s => s.playerId));

                playersData.forEach(p => {
                    if (playerIdsWithScores.has(p.id)) {
                        entries[p.id] = {
                            playerId: p.id,
                            playerName: p.name,
                            handicap: p.handicap,
                            totalStrokes: 0,
                            thru: 0,
                            netScore: 0,
                            scores: {}
                        };
                    }
                });

                scoresData.forEach(s => {
                    // Skip hole 0 (dummy hole used for player initialization)
                    if (s.hole === 0) return;

                    if (entries[s.playerId]) {
                        entries[s.playerId].scores[s.hole] = s.strokes;
                        entries[s.playerId].totalStrokes += s.strokes;
                        entries[s.playerId].thru += 1;
                    }
                });

                // Calculate Net
                Object.values(entries).forEach(entry => {
                    // Simple Net = Gross - Handicap (if 18 holes played, otherwise pro-rated? Keep simple for now)
                    // If not 18 holes, Net might be misleading. Let's just do Gross - Handicap for now.
                    entry.netScore = calculateNet(entry.totalStrokes, entry.handicap, entry.thru);
                    console.log(`Player: ${entry.playerName}, Handicap: ${entry.handicap}, Gross: ${entry.totalStrokes}, Net: ${entry.netScore}`);
                });

                setLeaderboard(Object.values(entries));

            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedTournamentId, tournaments]);

    const sortedLeaderboard = [...leaderboard].sort((a, b) => {
        if (sortBy === 'gross') {
            return order === 'asc'
                ? a.totalStrokes - b.totalStrokes
                : b.totalStrokes - a.totalStrokes;
        } else {
            return order === 'asc'
                ? a.netScore - b.netScore
                : b.netScore - a.netScore;
        }
    });

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-900 text-white py-8 pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                            {t('title')}
                        </h1>
                        {/* Summary Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <div className="bg-white bg-opacity-10 p-4 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-300">{t('totalPlayers')}</div>
                                <div className="text-2xl font-bold text-emerald-400">{leaderboard.length}</div>
                            </div>
                            <div className="bg-white bg-opacity-10 p-4 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-300">{t('averageGross')}</div>
                                <div className="text-2xl font-bold text-emerald-400">{leaderboard.length ? Math.round(leaderboard.reduce((sum, e) => sum + e.totalStrokes, 0) / leaderboard.length) : 0}</div>
                            </div>
                            <div className="bg-white bg-opacity-10 p-4 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-300">{t('averageNet')}</div>
                                <div className="text-2xl font-bold text-emerald-400">{leaderboard.length ? Math.round(leaderboard.reduce((sum, e) => sum + e.netScore, 0) / leaderboard.length) : 0}</div>
                            </div>
                        </div>

                        <select
                            value={selectedTournamentId}
                            onChange={(e) => setSelectedTournamentId(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white rounded-md focus:ring-emerald-500 focus:border-emerald-500 px-4 py-2"
                        >
                            {tournaments.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6 flex gap-4 justify-center md:justify-start">
                        <button
                            onClick={() => {
                                setSortBy('gross');
                                setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                            }}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${sortBy === 'gross' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {/* Golf icon */}
                            <svg className="inline w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            {t('gross')} {sortBy === 'gross' && (order === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            onClick={() => {
                                setSortBy('net');
                                setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                            }}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${sortBy === 'net' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {/* Balance icon */}
                            <svg className="inline w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 5v14" />
                            </svg>
                            {t('net')} {sortBy === 'net' && (order === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>

                    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('pos')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('player')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">{t('thru')}</th>
                                        <th className={`px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider ${sortBy === 'gross' ? '' : 'opacity-40'}`}>
                                            {t('total')}
                                        </th>
                                        <th className={`px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider ${sortBy === 'net' ? '' : 'opacity-40'}`} title="Net = Gross – (Handicap × holes‑played/18)">
                                            {t('net')}
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">{t('hcp')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('loading')}</td>
                                        </tr>
                                    ) : sortedLeaderboard.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('noScores')}</td>
                                        </tr>
                                    ) : (
                                        sortedLeaderboard.map((entry, index) => (
                                            <tr key={entry.playerId} className="hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                    {entry.playerName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">
                                                    {entry.thru}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-center">
                                                    {entry.totalStrokes}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400 text-center">
                                                    {entry.netScore}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center hidden md:table-cell">
                                                    {entry.handicap}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
