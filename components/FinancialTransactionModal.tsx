
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, DollarSign, Calendar, FileText, FolderKanban, Briefcase, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

interface FinancialTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transactionToEdit?: any; // For future editing support
}

export const FinancialTransactionModal = ({ isOpen, onClose, onSuccess, transactionToEdit }: FinancialTransactionModalProps) => {
    const { chapters, projects } = useData();
    const { profile } = useAuth();

    // States
    const [type, setType] = useState<'entry' | 'exit'>('entry');
    const [amount, setAmount] = useState('0'); // Raw digits string
    const [displayAmount, setDisplayAmount] = useState('0,00');
    const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceUrl, setInvoiceUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [chapterId, setChapterId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [reimbursementStatus, setReimbursementStatus] = useState<'not_required' | 'requested_section' | 'requested_external' | 'paid'>('not_required');



    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Initial Data / Reset
    useEffect(() => {
        if (isOpen) {
            if (transactionToEdit) {
                // Populate if editing
                setType(transactionToEdit.type);
                setAmount(String(Math.round(transactionToEdit.amount * 100)));
                setDisplayAmount(formatCurrency(String(Math.round(transactionToEdit.amount * 100))));
                setCurrency(transactionToEdit.currency);
                setDescription(transactionToEdit.description);
                setDate(transactionToEdit.date);
                setInvoiceUrl(transactionToEdit.invoice_url || '');
                setNotes(transactionToEdit.notes || '');
                setChapterId(transactionToEdit.chapter_id);
                setProjectId(transactionToEdit.project_id);
                setReimbursementStatus(transactionToEdit.reimbursement_status || 'not_required');
            } else {
                setType('entry');
                setAmount('0');
                setDisplayAmount('0,00');
                setCurrency('BRL');
                setDescription('');
                setDate(new Date().toISOString().split('T')[0]);
                setInvoiceUrl('');
                setNotes('');
                setChapterId(null);
                setProjectId(null);
                setReimbursementStatus('not_required');
            }
        }
    }, [isOpen, transactionToEdit]);



    // Filter Chapters based on permissions
    // Admin sees all. Chair/Manager sees only theirs.
    const myChapters = React.useMemo(() => {
        if (!profile) return [];

        const chaptersList = (profile as any)?.profile_chapters || (profile as any)?.profileChapters || [];
        const isAdmin = chaptersList.some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');

        if (isAdmin) return chapters;

        // Filter from profile_chapters
        const myChapterIds = ((profile as any)?.profile_chapters || profile?.profileChapters || [])
            .filter((pc: any) => ['chair'].includes(pc.permission_slug))
            .map((pc: any) => pc.chapter_id);

        return chapters.filter((c: any) => myChapterIds.includes(c.id));
    }, [profile, chapters]);

    // Pre-select chapter if user has only tailored access (not admin) and hasn't selected one
    useEffect(() => {
        if (isOpen && !transactionToEdit && !chapterId && myChapters.length > 0) {
            // Check if admin is NOT the one doing this... essentially if filtered list is small?
            // Actually, simply: if not admin (who sees all), default to first.
            // But we don't have 'isAdmin' var here easily without recalculating or passing logic.
            // Let's check permissions again or just rely on myChapters being populated.
            // If I am chair, myChapters has 1 items usually.
            const chaptersList = (profile as any)?.profile_chapters || (profile as any)?.profileChapters || [];
            const isAdmin = chaptersList.some((pc: any) => pc.chapter_id === 1 && pc.permission_slug === 'admin');

            if (!isAdmin) {
                setChapterId(myChapters[0].id);
            }
        }
    }, [isOpen, myChapters, chapterId, transactionToEdit, profile]);

    // Filter Projects based on selected Chapter (or all if no chapter selected?)
    // Let's show projects related to the selected chapter, or all if none selected (but filtering by user permissions maybe?)
    // For simplicity, let's list projects the user has access to management.
    const myProjects = React.useMemo(() => {
        // Ideally we check project_chapters or project_members permissions.
        // For now, listing all projects and filtering by selected chapter if any.
        let filtered = projects;

        if (chapterId) {
            // Projects that belong to chapterId
            filtered = filtered.filter((p: any) =>
                p.project_chapters?.some((pc: any) => pc.chapter_id === chapterId) ||
                p.capituloId?.includes(chapterId) // Legacy check
            );
        }

        return filtered;
    }, [projects, chapterId]);


    const formatCurrency = (value: string) => {
        const number = Number(value) / 100;
        return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digit characters
        let value = e.target.value.replace(/\D/g, '');

        // Remove leading zeros
        value = Number(value).toString();

        setAmount(value);
        setDisplayAmount(formatCurrency(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const floatAmount = Number(amount) / 100;

        if (!floatAmount || isNaN(floatAmount) || floatAmount <= 0) {
            alert("Por favor, insira um valor válido.");
            setIsSubmitting(false);
            return;
        }

        if (!description.trim()) {
            alert("A descrição é obrigatória.");
            setIsSubmitting(false);
            return;
        }

        // Invoice Mandatory for 'exit'
        if (type === 'exit' && !invoiceUrl.trim()) {
            alert("Para saídas, o link do comprovante é obrigatório.");
            setIsSubmitting(false);
            return;
        }

        setShowConfirmation(true);
    };

    const confirmSave = async () => {
        setIsSubmitting(true);
        try {
            const floatAmount = Number(amount) / 100;
            const payload = {
                type,
                amount: floatAmount,
                currency,
                description,
                date,
                invoice_url: invoiceUrl || null,
                notes: notes || null,
                chapter_id: chapterId || null,
                project_id: projectId || null,
                created_by: (profile as any)?.auth_id,
                reimbursement_status: reimbursementStatus
            };

            let error;

            if (transactionToEdit) {
                // Update
                const { error: err } = await supabase
                    .from('finances')
                    .update(payload)
                    .eq('id', transactionToEdit.id);
                error = err;
            } else {
                // Insert
                const { error: err } = await supabase.from('finances').insert([payload]);
                error = err;
            }

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving transaction:", err);
            alert("Erro ao salvar transação.");
        } finally {
            setIsSubmitting(false);
            setShowConfirmation(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

                    {/* Type Toggle */}
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setType('entry')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${type === 'entry' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Entrada
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('exit')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${type === 'exit' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Saída
                        </button>
                    </div>

                    {/* Reimbursement Status - Only for Exit? Or both? User said "cadastrar o gasto", implies Exit. But maybe relevant for entry? Let's show for all but usually relevant for expenses. */}
                    {type === 'exit' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status de Reembolso</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setReimbursementStatus('not_required')}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${reimbursementStatus === 'not_required' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Não Necessário
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReimbursementStatus('requested_section')}
                                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${reimbursementStatus === 'requested_section' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Solicitado Seção
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReimbursementStatus('requested_external')}
                                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${reimbursementStatus === 'requested_external' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Solicitado Externo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReimbursementStatus('paid')}
                                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${reimbursementStatus === 'paid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Realizado
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Amount & Currency */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                                    {currency === 'BRL' ? 'R$' : '$'}
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={displayAmount}
                                    onChange={handleAmountChange}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 transition-all ${type === 'entry' ? 'focus:ring-green-100 border-green-200 focus:border-green-500' : 'focus:ring-red-100 border-red-200 focus:border-red-500'}`}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="flex bg-gray-50 rounded-xl border border-gray-200 p-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setCurrency('BRL')}
                                    className={`px-3 text-xs font-bold rounded-lg transition-all ${currency === 'BRL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                >
                                    BRL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrency('USD')}
                                    className={`px-3 text-xs font-bold rounded-lg transition-all ${currency === 'USD' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                >
                                    USD
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                            placeholder="Ex: Patrocínio Evento X"
                        />
                    </div>

                    {/* Date & Invoice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                Comprovante Link
                                {type === 'exit' && <span className="text-red-500 text-xs">*</span>}
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={invoiceUrl}
                                    onChange={e => setInvoiceUrl(e.target.value)}
                                    required={type === 'exit'}
                                    placeholder="Link do Google Drive..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Chapters & Projects */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <FolderKanban className="w-4 h-4 text-blue-500" /> Capítulo (Opcional)
                            </label>
                            <select
                                value={chapterId || ''}
                                onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    setChapterId(val);
                                    setProjectId(null); // Reset project if chapter changes
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm appearance-none"
                            >
                                <option value="">Selecione...</option>
                                {myChapters.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.sigla} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-purple-500" /> Projeto (Opcional)
                            </label>
                            <select
                                value={projectId || ''}
                                onChange={e => setProjectId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm appearance-none"
                                disabled={projects.length === 0}
                            >
                                <option value="">Selecione...</option>
                                {myProjects.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Anotações</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none text-sm"
                            placeholder="Detalhes adicionais..."
                        />
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 text-white font-medium rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50 ${type === 'entry'
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Transação
                        </button>
                    </div>

                </form>

                <ConfirmationModal
                    isOpen={showConfirmation}
                    onClose={() => setShowConfirmation(false)}
                    onConfirm={confirmSave}
                    title={transactionToEdit ? "Confirmar Edição" : "Confirmar Transação"}
                    message={`Deseja realmente ${transactionToEdit ? 'atualizar' : 'registrar'} esta ${type === 'entry' ? 'ENTRADA' : 'SAÍDA'} no valor de ${currency} ${displayAmount}?`}
                    type="info"
                    confirmLabel="Sim, Confirmar"
                />
            </div>
        </div>
    );
}
