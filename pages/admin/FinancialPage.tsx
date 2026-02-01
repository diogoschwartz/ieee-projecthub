
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext'; // to get chapters list for filter
import { supabase } from '../../lib/supabase';
import { Finance } from '../../types';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Filter,
    Plus,
    Loader2,
    Calendar,
    FileText,
    Search,
    ExternalLink,
    Trash2,
    RefreshCw,
    FolderKanban,
    Briefcase,
    Pencil,
    FileJson
} from 'lucide-react';
import { FinancialTransactionModal } from '../../components/FinancialTransactionModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { FinancialReportModal } from '../../components/FinancialReportModal';

export const FinancialPage = () => {
    const { profile } = useAuth();
    const { chapters } = useData();

    const [transactions, setTransactions] = useState<Finance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChapterId, setSelectedChapterId] = useState<number | 'all'>('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [exchangeRate, setExchangeRate] = useState(5.0); // Default placeholder

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Finance | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Determine user permissions for UI filters
    const chaptersList = (profile as any).profile_chapters || (profile as any).profileChapters || [];
    const isAdmin = chaptersList.some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');
    const myChapterIds = useMemo(() => {
        if (isAdmin) return chapters.map((c: any) => c.id);
        return ((profile as any).profile_chapters || profile?.profileChapters || [])
            .filter((pc: any) => ['chair'].includes(pc.permission_slug))
            .map((pc: any) => pc.chapter_id);
    }, [profile, chapters, isAdmin]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // RLS policies will filter rows automatically for non-admins
            const { data, error } = await supabase
                .from('finances')
                .select(`
          *,
          chapter:chapters(id, acronym, name),
          project:projects(id, name)
        `)
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Error fetching finances:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Pre-select chapter for non-admins
        if (!isAdmin && myChapterIds.length > 0 && selectedChapterId === 'all') {
            setSelectedChapterId(myChapterIds[0]);
        }
    }, [myChapterIds, isAdmin, selectedChapterId]);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const confirmDelete = (id: number) => {
        setTransactionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!transactionToDelete) return;

        try {
            const { error } = await supabase.from('finances').delete().eq('id', transactionToDelete);
            if (error) throw error;
            fetchTransactions();
        } catch (err) {
            console.error("Error deleting:", err);
            alert("Erro ao excluir.");
        } finally {
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
        }
    };

    const handleEdit = (transaction: Finance) => {
        setTransactionToEdit(transaction);
        setIsModalOpen(true);
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.chapter?.acronym?.toLowerCase().includes(searchTerm.toLowerCase());

        // If selectedChapterId is 'all', show all visible (RLS restricted).
        // If specific, filter.
        const matchesChapter = selectedChapterId === 'all' || t.chapter_id === Number(selectedChapterId);

        const matchesDate = (!dateRange.start || t.date >= dateRange.start) &&
            (!dateRange.end || t.date <= dateRange.end);

        return matchesSearch && matchesChapter && matchesDate;
    });

    // Calculate Balances
    const balances = useMemo(() => {
        let brl = 0;
        let usd = 0;

        filteredTransactions.forEach(t => {
            if (t.type === 'entry') {
                if (t.currency === 'BRL') brl += t.amount;
                else usd += t.amount;
            } else {
                if (t.currency === 'BRL') brl -= t.amount;
                else usd -= t.amount;
            }
        });

        return { brl, usd };
    }, [filteredTransactions]);

    const totalConvertedBrl = balances.brl + (balances.usd * exchangeRate);

    const formatMoney = (amount: number, currency: 'BRL' | 'USD') => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="space-y-6 pb-20">

            {/* Header & Stats */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-8 h-8 text-green-600" />
                            Livro Caixa Financeiro
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Gestão de entradas e saídas de recursos</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                        >
                            <FileJson className="w-5 h-5 text-gray-500" />
                            Relatório
                        </button>
                        <button
                            onClick={() => {
                                setTransactionToEdit(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Nova Transação
                        </button>
                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <span className="text-6xl font-bold text-gray-900">R$</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Saldo em Reais (Caixa)</p>
                        <h3 className={`text-3xl font-bold ${balances.brl >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatMoney(balances.brl, 'BRL')}
                        </h3>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <span className="text-6xl font-bold text-blue-900">$</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Saldo em Dólar (Seção)</p>
                        <h3 className={`text-3xl font-bold ${balances.usd >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatMoney(balances.usd, 'USD')}
                        </h3>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Total Estimado (R$)</p>
                            <div className="flex items-center gap-2 text-xs bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                                <span>USD =</span>
                                <input
                                    type="number"
                                    value={exchangeRate}
                                    onChange={e => setExchangeRate(Number(e.target.value))}
                                    className="w-12 bg-transparent text-white font-bold text-center outline-none border-b border-white/20 focus:border-white"
                                />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold">
                            {formatMoney(totalConvertedBrl, 'BRL')}
                        </h3>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Cotação ajustável manual
                        </p>
                    </div>

                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">

                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por descrição ou capítulo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={Array.isArray(selectedChapterId) ? 'all' : selectedChapterId} // Fix typing logic for select, selectedChapterId is number|'all'
                        onChange={(e) => setSelectedChapterId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 min-w-[150px]"
                    >
                        <option value="all">Todos os Capítulos</option>
                        {chapters
                            .filter((c: any) => isAdmin ? true : myChapterIds.includes(c.id))
                            .map((c: any) => (
                                <option key={c.id} value={c.id}>{c.sigla}</option>
                            ))
                        }
                    </select>

                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500 font-medium">De</span>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                            className="bg-transparent text-sm outline-none w-28"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500 font-medium">Até</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                            className="bg-transparent text-sm outline-none w-28"
                        />
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center text-blue-600">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400 text-center">
                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p>Nenhuma transação encontrada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição / Notas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contexto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reembolso</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                        {/* Date */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(t.date).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${t.type === 'entry'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-red-100 text-red-700 border border-red-200'
                                                }`}>
                                                {t.type === 'entry' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {t.type === 'entry' ? 'Entrada' : 'Saída'}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td className="px-6 py-4">
                                            <div title={t.description}>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {t.description.length > 40 ? t.description.substring(0, 40) + '...' : t.description}
                                                </p>
                                                {t.notes && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px] italic">
                                                        "{t.notes.length > 50 ? t.notes.substring(0, 50) + '...' : t.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Context (Chapter/Project) */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {t.chapter ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit">
                                                        <FolderKanban className="w-3 h-3" /> {t.chapter.acronym}
                                                    </span>
                                                ) : <span className="text-xs text-gray-400">-</span>}

                                                {t.project ? (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[150px]">
                                                        <Briefcase className="w-3 h-3" /> {t.project.name}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>

                                        {/* Reimbursement Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${t.reimbursement_status === 'paid'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : t.reimbursement_status === 'requested_section'
                                                    ? 'bg-orange-100 text-orange-700 border-orange-200'
                                                    : t.reimbursement_status === 'requested_external'
                                                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {t.reimbursement_status === 'paid' ? 'Realizado'
                                                    : t.reimbursement_status === 'requested_section' ? 'Solicitado Seção'
                                                        : t.reimbursement_status === 'requested_external' ? 'Solicitado Externo'
                                                            : 'N/A'}
                                            </span>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`text-sm font-bold ${t.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'entry' ? '+' : '-'} {formatMoney(t.amount, t.currency)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {t.invoice_url && (
                                                    <a
                                                        href={t.invoice_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver Comprovante"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}

                                                {/* Delete Button (Only creator or admin should probably see this, checking admin/manager perm) */}
                                                <button
                                                    onClick={() => confirmDelete(t.id)}
                                                    className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Excluir Transação"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(t)}
                                                    className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Editar Transação"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                {/* Delete Button (Only creator or admin should probably see this, checking admin/manager perm) */}
                                                <button
                                                    onClick={() => confirmDelete(t.id)}
                                                    className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Excluir Transação"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <FinancialTransactionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTransactionToEdit(null);
                }}
                onSuccess={() => {
                    fetchTransactions();
                    // Optionally show success toast/alert
                }}
                transactionToEdit={transactionToEdit}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                title="EXCLUSÃO IRREVERSÍVEL"
                message="Esta ação é PERMANENTE. A sonegação ou ocultação de registros financeiros pode ter implicações legais graves e ser considerada crime. Tem absoluta certeza que deseja excluir este registro?"
                type="danger"
                confirmLabel="Sim, Excluir Permanentemente"
            />

            <FinancialReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                chapterId={selectedChapterId === 'all' ? null : Number(selectedChapterId)}
                chapterName={
                    selectedChapterId === 'all'
                        ? 'Todos os Capítulos'
                        : chapters.find((c: any) => c.id === Number(selectedChapterId))?.name
                }
            />
        </div>
    );
};
