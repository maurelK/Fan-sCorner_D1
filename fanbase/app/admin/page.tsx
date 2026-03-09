'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

interface GlobalStats {
    totalUsers: number;
    totalCreators: number;
    totalRevenue: number;
}

interface Creator {
    id: string;
    name: string;
    email: string;
    status: string;
    joined_at: string;
}

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: 'fan' | 'creator' | 'admin';
    status: string;
    created_at: string;
}

interface WeeklyAnalyticsRow {
    week: string;
    followedFans: number;
    contentFans: number;
    contentRate: number;
    pmfTarget: number;
    goalReached: boolean;
}

interface PMFOverview {
    targetRate: number;
    audienceSize: number;
    latestRate: number;
    goalReached: boolean;
}

interface CohortRow {
    cohort: string;
    cohortSize: number;
    values: Array<number | null>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats>({ totalUsers: 0, totalCreators: 0, totalRevenue: 0 });
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userStatusFilter, setUserStatusFilter] = useState('all');
    const [weeklyAnalytics, setWeeklyAnalytics] = useState<WeeklyAnalyticsRow[]>([]);
    const [analyticsTotals, setAnalyticsTotals] = useState({ followedFans: 0, contentFans: 0 });
    const [analyticsCreatorFilter, setAnalyticsCreatorFilter] = useState('all');
    const [analyticsWeeks, setAnalyticsWeeks] = useState('52');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [pmfOverview, setPmfOverview] = useState<PMFOverview>({ targetRate: 70, audienceSize: 0, latestRate: 0, goalReached: false });
    const [cohortColumns, setCohortColumns] = useState<string[]>([]);
    const [cohortRows, setCohortRows] = useState<CohortRow[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [userSearch, userRoleFilter, userStatusFilter]);

    useEffect(() => {
        loadWeeklyAnalytics();
    }, [analyticsCreatorFilter, analyticsWeeks]);

    const loadData = async () => {
        try {
            const [statsRes, creatorsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/creators')
            ]);

            if (statsRes.ok) setStats((await statsRes.json()).stats);
            if (creatorsRes.ok) setCreators((await creatorsRes.json()).creators);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const params = new URLSearchParams({
                role: userRoleFilter,
                status: userStatusFilter,
                search: userSearch,
            });

            const response = await fetch(`/api/admin/users?${params.toString()}`);
            if (!response.ok) throw new Error('Erreur chargement utilisateurs');
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setUsersLoading(false);
        }
    };

    const loadWeeklyAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const params = new URLSearchParams({
                creatorId: analyticsCreatorFilter,
                weeks: analyticsWeeks,
            });

            const response = await fetch(`/api/admin/analytics/weekly?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                console.error('Weekly analytics API error:', data?.error || 'Erreur chargement analytics');
                setWeeklyAnalytics([]);
                setAnalyticsTotals({ followedFans: 0, contentFans: 0 });
                setPmfOverview({ targetRate: 70, audienceSize: 0, latestRate: 0, goalReached: false });
                setCohortColumns([]);
                setCohortRows([]);
                return;
            }

            setWeeklyAnalytics(data.weekly || []);
            setAnalyticsTotals(data.totals || { followedFans: 0, contentFans: 0 });
            setPmfOverview(data.pmf || { targetRate: 70, audienceSize: 0, latestRate: 0, goalReached: false });
            setCohortColumns(data?.cohorts?.columns || []);
            setCohortRows(data?.cohorts?.rows || []);

            if (data.warning === 'post_views_table_missing') {
                console.warn('La table post_views est absente: métrique de vues à 0 tant que la migration SQL n\'est pas appliquée.');
            }
        } catch (error) {
            console.error('Error loading weekly analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/admin/creators', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status: newStatus }),
            });

            if (response.ok) {
                setCreators(creators.map(c => c.id === userId ? { ...c, status: newStatus } : c));
            } else {
                alert('Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleUpdateUser = async (userId: string, payload: { role?: string; status?: string }) => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...payload }),
            });

            if (!response.ok) {
                alert('Erreur lors de la mise à jour utilisateur');
                return;
            }

            setUsers((previous) =>
                previous.map((user) =>
                    user.id === userId
                        ? {
                            ...user,
                            ...(payload.role ? { role: payload.role as UserRow['role'] } : {}),
                            ...(payload.status ? { status: payload.status } : {}),
                        }
                        : user
                )
            );
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const getCohortCellClass = (value: number | null) => {
        if (value === null) return 'bg-gray-50 text-gray-300';
        if (value < 30) return 'bg-red-100 text-red-700';
        if (value < 50) return 'bg-orange-100 text-orange-700';
        if (value < 70) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    if (loading) {
        return (
            <div className="bg-[#faf8f5] min-h-screen py-12 flex items-center justify-center">
                <div className="text-[#2d1b4e]">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#faf8f5] min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-[#2d1b4e] mb-8">Admin Dashboard</h1>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Utilisateurs Totaux</h3>
                        </div>
                        <p className="text-3xl font-bold text-[#2d1b4e]">{stats.totalUsers}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Créateurs</h3>
                        </div>
                        <p className="text-3xl font-bold text-[#2d1b4e]">{stats.totalCreators}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Volume Total</h3>
                        </div>
                        <p className="text-3xl font-bold text-[#2d1b4e]">{stats.totalRevenue.toLocaleString()} FCFA</p>
                    </div>
                </div>

                {/* Users Management */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-orange-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-2xl font-bold text-[#2d1b4e]">Gestion des Utilisateurs</h2>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <input
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Rechercher nom ou email"
                                className="px-4 py-2 border border-orange-200 rounded-lg text-sm"
                            />
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-orange-200 rounded-lg text-sm"
                            >
                                <option value="all">Tous rôles</option>
                                <option value="fan">Fans</option>
                                <option value="creator">Créateurs</option>
                                <option value="admin">Admins</option>
                            </select>
                            <select
                                value={userStatusFilter}
                                onChange={(e) => setUserStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-orange-200 rounded-lg text-sm"
                            >
                                <option value="all">Tous statuts</option>
                                <option value="active">Actifs</option>
                                <option value="suspended">Suspendus</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#faf8f5] text-[#2d1b4e]/60">
                                <tr>
                                    <th className="p-4 font-medium">Nom</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Rôle</th>
                                    <th className="p-4 font-medium">Statut</th>
                                    <th className="p-4 font-medium">Créé le</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {usersLoading ? (
                                    <tr>
                                        <td className="p-6 text-[#2d1b4e]/70" colSpan={6}>Chargement des utilisateurs...</td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td className="p-6 text-[#2d1b4e]/70" colSpan={6}>Aucun utilisateur trouvé</td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-[#faf8f5]/50">
                                            <td className="p-4 font-medium text-[#2d1b4e]">{user.name}</td>
                                            <td className="p-4 text-[#2d1b4e]/80">{user.email}</td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === 'suspended'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {user.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[#2d1b4e]/60">{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                                                        className="px-2 py-1 border border-orange-200 rounded-lg text-xs"
                                                    >
                                                        <option value="fan">fan</option>
                                                        <option value="creator">creator</option>
                                                        <option value="admin">admin</option>
                                                    </select>

                                                    {user.status === 'suspended' ? (
                                                        <button
                                                            onClick={() => handleUpdateUser(user.id, { status: 'active' })}
                                                            className="bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors text-xs"
                                                        >
                                                            Activer
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateUser(user.id, { status: 'suspended' })}
                                                            className="bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors text-xs"
                                                        >
                                                            Suspendre
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Weekly Analytics */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-orange-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="text-[#2d1b4e]" size={22} />
                            <h2 className="text-2xl font-bold text-[#2d1b4e]">Analytics Fans Hebdo</h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <select
                                value={analyticsCreatorFilter}
                                onChange={(e) => setAnalyticsCreatorFilter(e.target.value)}
                                className="px-3 py-2 border border-orange-200 rounded-lg text-sm"
                            >
                                <option value="all">Tous les créateurs</option>
                                {creators.map((creator) => (
                                    <option key={creator.id} value={creator.id}>{creator.name}</option>
                                ))}
                            </select>

                            <select
                                value={analyticsWeeks}
                                onChange={(e) => setAnalyticsWeeks(e.target.value)}
                                className="px-3 py-2 border border-orange-200 rounded-lg text-sm"
                            >
                                <option value="4">4 semaines</option>
                                <option value="8">8 semaines</option>
                                <option value="12">12 semaines</option>
                                <option value="52">52 semaines (1 an)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-orange-100 bg-[#faf8f5]/40">
                        <div className="bg-white rounded-xl p-4 border border-orange-100">
                            <p className="text-sm text-[#2d1b4e]/70">Total fans ayant suivi (période)</p>
                            <p className="text-2xl font-bold text-[#2d1b4e]">{analyticsTotals.followedFans}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-orange-100">
                            <p className="text-sm text-[#2d1b4e]/70">Total fans ayant regardé du contenu (vues)</p>
                            <p className="text-2xl font-bold text-[#2d1b4e]">{analyticsTotals.contentFans}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-orange-100">
                            <p className="text-sm text-[#2d1b4e]/70">PMF hebdo (objectif {pmfOverview.targetRate}%)</p>
                            <p className="text-2xl font-bold text-[#2d1b4e]">{pmfOverview.latestRate}%</p>
                            <p className={`text-xs mt-1 font-medium ${pmfOverview.goalReached ? 'text-green-700' : 'text-red-700'}`}>
                                {pmfOverview.goalReached ? 'Objectif atteint ✅' : 'Objectif non atteint ❌'} · Audience: {pmfOverview.audienceSize}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#faf8f5] text-[#2d1b4e]/60">
                                <tr>
                                    <th className="p-4 font-medium">Semaine (lundi)</th>
                                    <th className="p-4 font-medium">Fans qui ont suivi</th>
                                    <th className="p-4 font-medium">Fans qui ont regardé du contenu</th>
                                    <th className="p-4 font-medium">Taux PMF</th>
                                    <th className="p-4 font-medium">Objectif 70%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {analyticsLoading ? (
                                    <tr>
                                        <td className="p-6 text-[#2d1b4e]/70" colSpan={5}>Chargement analytics...</td>
                                    </tr>
                                ) : weeklyAnalytics.length === 0 ? (
                                    <tr>
                                        <td className="p-6 text-[#2d1b4e]/70" colSpan={5}>Aucune donnée disponible</td>
                                    </tr>
                                ) : (
                                    weeklyAnalytics.map((row) => (
                                        <tr key={row.week} className="hover:bg-[#faf8f5]/50">
                                            <td className="p-4 text-[#2d1b4e] font-medium">{new Date(row.week).toLocaleDateString()}</td>
                                            <td className="p-4 text-[#2d1b4e]/90">{row.followedFans}</td>
                                            <td className="p-4 text-[#2d1b4e]/90">{row.contentFans}</td>
                                            <td className="p-4 text-[#2d1b4e]/90 font-semibold">{row.contentRate}%</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.goalReached ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {row.goalReached ? 'Atteint' : 'À améliorer'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-orange-100 bg-[#faf8f5]/30">
                        <h3 className="text-lg font-semibold text-[#2d1b4e] mb-4">Chart PMF hebdo</h3>

                        {analyticsLoading ? (
                            <p className="text-sm text-[#2d1b4e]/60">Chargement du chart...</p>
                        ) : weeklyAnalytics.length === 0 ? (
                            <p className="text-sm text-[#2d1b4e]/60">Aucune donnée à afficher.</p>
                        ) : (
                            (() => {
                                const chartWidth = 820;
                                const chartHeight = 260;
                                const paddingLeft = 48;
                                const paddingRight = 20;
                                const paddingTop = 20;
                                const paddingBottom = 40;
                                const innerWidth = chartWidth - paddingLeft - paddingRight;
                                const innerHeight = chartHeight - paddingTop - paddingBottom;
                                const itemCount = weeklyAnalytics.length;
                                const stepX = itemCount > 1 ? innerWidth / (itemCount - 1) : 0;
                                const rateY = (value: number) => paddingTop + innerHeight - (Math.max(0, Math.min(100, value)) / 100) * innerHeight;
                                const getX = (index: number) => paddingLeft + index * stepX;

                                const linePath = (values: number[], yGetter: (value: number) => number) =>
                                    values
                                        .map((value, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${yGetter(value)}`)
                                        .join(' ');

                                const pmfPath = linePath(weeklyAnalytics.map((row) => row.contentRate), rateY);
                                const targetY = rateY(pmfOverview.targetRate);

                                return (
                                    <div className="overflow-x-auto">
                                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[760px] h-[280px] bg-white border border-orange-100 rounded-xl">
                                            <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + innerHeight} stroke="#d1d5db" strokeWidth="1" />
                                            <line x1={paddingLeft} y1={paddingTop + innerHeight} x2={paddingLeft + innerWidth} y2={paddingTop + innerHeight} stroke="#d1d5db" strokeWidth="1" />

                                            <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" fontSize="11" fill="#2d1b4e">100%</text>
                                            <text x={paddingLeft - 8} y={paddingTop + innerHeight / 2 + 4} textAnchor="end" fontSize="11" fill="#2d1b4e">50%</text>
                                            <text x={paddingLeft - 8} y={paddingTop + innerHeight + 4} textAnchor="end" fontSize="11" fill="#2d1b4e">0%</text>

                                            <line x1={paddingLeft} y1={targetY} x2={paddingLeft + innerWidth} y2={targetY} stroke="#2d1b4e" strokeWidth="1.5" strokeDasharray="6 6" />

                                            <path d={pmfPath} fill="none" stroke="#16a34a" strokeWidth="3" />

                                            {weeklyAnalytics.map((row, index) => {
                                                const x = getX(index);
                                                const pmfY = rateY(row.contentRate);

                                                return (
                                                    <g key={`point-${row.week}`}>
                                                        <circle cx={x} cy={pmfY} r="4" fill="#16a34a" />
                                                        <text x={x} y={pmfY - 8} textAnchor="middle" fontSize="10" fill="#166534">{row.contentRate}%</text>
                                                        <text x={x} y={chartHeight - 14} textAnchor="middle" fontSize="11" fill="#2d1b4e">
                                                            {new Date(row.week).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            <text x={paddingLeft + innerWidth - 6} y={targetY - 6} textAnchor="end" fontSize="11" fill="#2d1b4e">
                                                Objectif {pmfOverview.targetRate}%
                                            </text>
                                        </svg>

                                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#2d1b4e]/80">
                                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-600" /> Taux PMF hebdo (%)</div>
                                            <div className="flex items-center gap-2"><span className="w-4 h-[2px] bg-[#2d1b4e]" /> Objectif {pmfOverview.targetRate}%</div>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    <div className="p-6 border-t border-orange-100 bg-white">
                        <h3 className="text-lg font-semibold text-[#2d1b4e] mb-4">Tableau Cohortes PMF (Weekly)</h3>

                        {analyticsLoading ? (
                            <p className="text-sm text-[#2d1b4e]/60">Chargement des cohortes...</p>
                        ) : cohortRows.length === 0 ? (
                            <p className="text-sm text-[#2d1b4e]/60">Aucune donnée de cohorte disponible.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] border-separate border-spacing-1">
                                    <thead>
                                        <tr>
                                            <th className="text-left text-xs text-[#2d1b4e]/70 p-2">Cohorte (semaine)</th>
                                            <th className="text-left text-xs text-[#2d1b4e]/70 p-2">Users acquis</th>
                                            {cohortColumns.map((column) => (
                                                <th key={column} className="text-center text-xs text-[#2d1b4e]/70 p-2">{column}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cohortRows.map((row) => (
                                            <tr key={row.cohort}>
                                                <td className="p-2 text-sm font-medium text-[#2d1b4e] whitespace-nowrap">{row.cohort}</td>
                                                <td className="p-2 text-sm text-[#2d1b4e]/80 text-center">{row.cohortSize}</td>
                                                {row.values.map((value, index) => (
                                                    <td
                                                        key={`${row.cohort}-${index}`}
                                                        className={`p-2 text-center text-xs font-semibold rounded-md ${getCohortCellClass(value)}`}
                                                    >
                                                        {value === null ? '—' : `${value}%`}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Creators Management */}
                <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
                    <div className="p-6 border-b border-orange-100">
                        <h2 className="text-2xl font-bold text-[#2d1b4e]">Gestion des Créateurs</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#faf8f5] text-[#2d1b4e]/60">
                                <tr>
                                    <th className="p-6 font-medium">Nom</th>
                                    <th className="p-6 font-medium">Email</th>
                                    <th className="p-6 font-medium">Rejoint le</th>
                                    <th className="p-6 font-medium">Statut</th>
                                    <th className="p-6 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {creators.map((creator) => (
                                    <tr key={creator.id} className="hover:bg-[#faf8f5]/50">
                                        <td className="p-6 font-medium text-[#2d1b4e]">{creator.name}</td>
                                        <td className="p-6 text-[#2d1b4e]/80">{creator.email}</td>
                                        <td className="p-6 text-[#2d1b4e]/60">
                                            {new Date(creator.joined_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${creator.status === 'suspended'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                {creator.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex gap-2">
                                                {creator.status === 'suspended' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(creator.id, 'active')}
                                                        className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Activer"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateStatus(creator.id, 'suspended')}
                                                        className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Suspendre"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
