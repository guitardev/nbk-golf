"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/googleSheets';

export default function RegisterPage() {
    const t = useTranslations('register'); // You might need to add this namespace
    const tCommon = useTranslations('common');

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [formData, setFormData] = useState({
        playerName: '',
        email: '',
        phone: '',
        lineId: '' // Optional
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch('/api/tournaments');
                const data: Tournament[] = await res.json();
                // Filter for upcoming tournaments
                const upcoming = data.filter(t => t.status === 'upcoming');
                setTournaments(upcoming);
                if (upcoming.length > 0) {
                    setSelectedTournamentId(upcoming[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch tournaments", err);
                setError("Failed to load tournaments");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'tournamentId') {
            setSelectedTournamentId(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!selectedTournamentId) {
            setError("Please select a tournament");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch('/api/registrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tournamentId: selectedTournamentId,
                    ...formData
                })
            });

            if (!res.ok) {
                throw new Error('Registration failed');
            }

            setSubmitSuccess(true);
            setFormData({
                playerName: '',
                email: '',
                phone: '',
                lineId: ''
            });
        } catch (err) {
            console.error(err);
            setError("Failed to submit registration. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">{t('loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="px-6 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                            {t('title')}
                        </h1>
                        <p className="mt-2 text-gray-400">{t('subtitle')}</p>
                    </div>

                    {submitSuccess ? (
                        <div className="text-center py-8">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white">{t('success')}</h3>
                            <p className="mt-2 text-gray-400">
                                {t('successMessage')}
                            </p>
                            <button
                                onClick={() => setSubmitSuccess(false)}
                                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                            >
                                {t('registerAnother')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}

                            <div>
                                <label htmlFor="tournamentId" className="block text-sm font-medium text-gray-300">
                                    {t('fields.tournament')}
                                </label>
                                <select
                                    id="tournamentId"
                                    name="tournamentId"
                                    required
                                    value={selectedTournamentId}
                                    onChange={handleChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-gray-700 text-white"
                                >
                                    {tournaments.length === 0 ? (
                                        <option value="">{t('noTournaments')}</option>
                                    ) : (
                                        tournaments.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.date})</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="playerName" className="block text-sm font-medium text-gray-300">
                                    {t('fields.name')}
                                </label>
                                <input
                                    type="text"
                                    name="playerName"
                                    id="playerName"
                                    required
                                    value={formData.playerName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                    {t('fields.email')}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                                    {t('fields.phone')}
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="lineId" className="block text-sm font-medium text-gray-300">
                                    {t('fields.lineId')}
                                </label>
                                <input
                                    type="text"
                                    name="lineId"
                                    id="lineId"
                                    value={formData.lineId}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || tournaments.length === 0}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                                >
                                    {isSubmitting ? t('submitting') : t('submit')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
