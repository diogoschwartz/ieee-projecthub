
import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Loader2, Download, Briefcase, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { pdf } from '@react-pdf/renderer';
import { FinancialReportPDF } from './FinancialReportPDF';

interface FinancialReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapterId?: number | null;
    chapterName?: string;
}

export const FinancialReportModal = ({ isOpen, onClose, chapterId, chapterName }: FinancialReportModalProps) => {
    const { profile } = useAuth();
    // Helper for default dates
    const getToday = () => new Date().toISOString().split('T')[0];
    const getLastMonth = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportType, setReportType] = useState<'full' | 'project' | 'reimbursement_section' | 'reimbursement_external'>('full');
    const [projectId, setProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            let query = supabase.from('projects').select('id, name').order('name');
            if (chapterId) {
                // Fetch projects associated with this chapter
                const { data: projectChapters } = await supabase
                    .from('project_chapters')
                    .select('project_id')
                    .eq('chapter_id', chapterId);

                if (projectChapters && projectChapters.length > 0) {
                    const projectIds = projectChapters.map(pc => pc.project_id);
                    query = query.in('id', projectIds);
                } else {
                    setProjects([]);
                    return;
                }
            }
            const { data } = await query;
            setProjects(data || []);
        };

        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen, chapterId]);

    const fetchProfiles = async (userIds: string[]) => {
        if (userIds.length === 0) return {};
        const { data } = await supabase
            .from('profiles')
            .select('auth_id, full_name, email')
            .in('auth_id', userIds);

        const map: Record<string, any> = {};
        data?.forEach((p: any) => {
            map[p.auth_id] = p;
        });
        return map;
    };

    const handleGenerate = async (format: 'pdf' | 'json') => {
        if (reportType === 'project' && !projectId) {
            alert("Por favor, selecione um projeto.");
            return;
        }

        setIsGenerating(true);
        try {
            // Build query
            let query = supabase
                .from('finances')
                .select(`
                    *,
                    chapter:chapters(id, acronym, name),
                    project:projects(id, name)
                `)
                .order('date', { ascending: true });

            if (chapterId) {
                query = query.eq('chapter_id', chapterId);
            }

            if (startDate) {
                query = query.gte('date', startDate);
            }

            if (endDate) {
                query = query.lte('date', endDate);
            }

            if (reportType === 'project' && projectId) {
                query = query.eq('project_id', projectId);
            } else if (reportType === 'reimbursement_section') {
                query = query.eq('reimbursement_status', 'requested_section');
            } else if (reportType === 'reimbursement_external') {
                query = query.eq('reimbursement_status', 'requested_external');
            }

            const { data, error } = await query;

            if (error) throw error;

            if (!data || data.length === 0) {
                alert("Nenhum registro encontrado para os filtros selecionados.");
                setIsGenerating(false);
                return;
            }

            // Fetch Overall Balance (Total lifetime)
            let overallQuery = supabase
                .from('finances')
                .select('amount, type, currency');

            if (chapterId) {
                overallQuery = overallQuery.eq('chapter_id', chapterId);
            }

            const { data: allData } = await overallQuery;

            const overallTotals = (allData || []).reduce((acc: any, t: any) => {
                const curr = t.currency || 'BRL';
                if (!acc[curr]) acc[curr] = 0;
                if (t.type === 'entry') acc[curr] += t.amount;
                else if (t.type === 'exit') acc[curr] -= t.amount;
                return acc;
            }, {});

            const reportTypeLabels = {
                full: 'Fluxo de Caixa Completo',
                project: `Projeto: ${projects.find(p => p.id === projectId)?.name || 'N/A'}`,
                reimbursement_section: 'Reembolso (Solicitado à Seção)',
                reimbursement_external: 'Reembolso (Solicitado Externo)'
            };

            const baseFileName = `relatorio_financeiro_${chapterName ? chapterName.replace(/\s+/g, '_').toLowerCase() : 'geral'}_${new Date().toISOString().split('T')[0]}`;

            if (format === 'pdf') {
                const blob = await pdf(
                    <FinancialReportPDF
                        transactions={data}
                        chapterName={chapterName || 'Todos os Capítulos'}
                        startDate={startDate}
                        endDate={endDate}
                        reportTypeLabel={reportTypeLabels[reportType]}
                        generatorName={profile?.full_name || 'Sistema'}
                        overallBalances={overallTotals}
                        isReimbursementReport={reportType.startsWith('reimbursement')}
                    />
                ).toBlob();

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseFileName}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Export as JSON
                const jsonContent = JSON.stringify({
                    metadata: {
                        chapterName: chapterName || 'Todos os Capítulos',
                        reportType: reportTypeLabels[reportType],
                        startDate: startDate || 'Período Total',
                        endDate: endDate || 'Atual',
                        generatedAt: new Date().toISOString(),
                        generator: profile?.full_name || 'Sistema',
                        overallBalances: overallTotals
                    },
                    transactions: data
                }, null, 2);

                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseFileName}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            onClose();

        } catch (err) {
            console.error("Error generating report:", err);
            alert("Erro ao gerar relatório.");
        } finally {
            setIsGenerating(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Exportar Relatório Financeiro
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                        <p>
                            Gerando relatório para: <strong>{chapterName || 'Todos os Capítulos'}</strong>
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Tipo de Relatório
                        </label>
                        <select
                            value={reportType}
                            onChange={e => setReportType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                        >
                            <option value="full">Relatório do Fluxo de Caixa completo</option>
                            <option value="project">Filtrar por projeto específico</option>
                            <option value="reimbursement_section">Despesas de Reembolso (Solicitado à Seção)</option>
                            <option value="reimbursement_external">Despesas de Reembolso (Solicitado Externo)</option>
                        </select>
                    </div>

                    {reportType === 'project' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Selecionar Projeto
                            </label>
                            <select
                                value={projectId || ''}
                                onChange={e => setProjectId(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                            >
                                <option value="" disabled>Selecione um projeto...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data Início</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data Fim</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-3 pt-2">
                    <button
                        onClick={() => handleGenerate('json')}
                        disabled={isGenerating}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Download className="w-5 h-5 text-gray-500" />
                        Baixar JSON
                    </button>
                    <button
                        onClick={() => handleGenerate('pdf')}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};
