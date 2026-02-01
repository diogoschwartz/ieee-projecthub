import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#1e40af',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 10,
        color: '#4B5563',
        marginBottom: 4,
    },
    section: {
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 4,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    table: {
        display: 'flex',
        width: 'auto',
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 6,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        padding: 6,
        alignItems: 'center',
    },
    colDate: { width: '12%' },
    colDesc: { width: '31%' },
    colProject: { width: '18%' },
    colType: { width: '13%' },
    colDoc: { width: '8%', textAlign: 'center' },
    colAmount: { width: '18%', textAlign: 'right' },
    headerText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
    },
    rowText: {
        fontSize: 8,
        color: '#4B5563',
    },
    amountText: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        textAlign: 'center',
        color: '#9CA3AF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    },
    badge: {
        fontSize: 7,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
        textAlign: 'center',
    },
    noteItem: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    noteLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    noteText: {
        fontSize: 8,
        color: '#4B5563',
        fontStyle: 'italic',
    }
});

interface FinancialReportPDFProps {
    transactions: any[];
    chapterName: string;
    startDate: string;
    endDate: string;
    reportTypeLabel: string;
    generatorName: string;
    overallBalances: Record<string, number>;
    isReimbursementReport?: boolean;
}

export const FinancialReportPDF: React.FC<FinancialReportPDFProps> = ({
    transactions,
    chapterName,
    startDate,
    endDate,
    reportTypeLabel,
    generatorName,
    overallBalances,
    isReimbursementReport = false
}) => {
    const formatDate = (dateStr: string, isEnd?: boolean) => {
        if (!dateStr) return isEnd ? 'Atual' : 'Início';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency === 'USD' ? 'USD' : 'BRL',
        }).format(amount);
    };

    // Group totals by currency
    const totals = transactions.reduce((acc, t) => {
        const curr = t.currency || 'BRL';
        if (!acc[curr]) acc[curr] = { in: 0, out: 0 };

        if (t.type === 'entry') {
            acc[curr].in += t.amount || 0;
        } else if (t.type === 'exit') {
            acc[curr].out += t.amount || 0;
        }
        return acc;
    }, {} as Record<string, { in: number; out: number }>);

    const currencies = Object.keys(totals).filter(c => !isReimbursementReport || c === 'USD');

    const getReimbursementLabel = (status: string) => {
        const labels: Record<string, string> = {
            not_required: 'Não nec.',
            requested_section: 'Seção',
            requested_external: 'Externo',
            paid: 'Realizado'
        };
        return labels[status] || status || '-';
    };

    return (
        <Document title={`Relatório Financeiro - ${chapterName}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Relatório Financeiro</Text>
                    <Text style={styles.subtitle}>Capítulo: {chapterName}</Text>
                    <Text style={styles.subtitle}>Tipo de Relatório: {reportTypeLabel}</Text>
                    <Text style={styles.subtitle}>
                        Período: {!startDate && !endDate ? 'Total' : `${formatDate(startDate)} a ${formatDate(endDate, true)}`}
                    </Text>
                </View>

                {/* Summary Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
                    <View style={{ flexDirection: 'column', gap: 10 }}>
                        {currencies.map(curr => {
                            const periodBalance = totals[curr].in - totals[curr].out;
                            const overallBalance = overallBalances[curr] || 0;
                            return (
                                <View key={curr} style={[styles.summaryContainer, { flexDirection: 'column', gap: 10 }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Total Entradas ({curr})</Text>
                                            <Text style={[styles.summaryValue, { color: '#059669' }]}>
                                                {formatCurrency(totals[curr].in, curr)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Total Saídas ({curr})</Text>
                                            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                                                {formatCurrency(totals[curr].out, curr)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={styles.summaryLabel}>Saldo Período ({curr})</Text>
                                            <Text style={[styles.summaryValue, { color: periodBalance >= 0 ? '#059669' : '#DC2626' }]}>
                                                {formatCurrency(periodBalance, curr)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginTop: 4 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                                            <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#111827' }]}>Saldo Atual do Capítulo ({curr}): </Text>
                                            <Text style={[styles.summaryValue, { fontSize: 12, color: overallBalance >= 0 ? '#059669' : '#DC2626' }]}>
                                                {formatCurrency(overallBalance, curr)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Transactions Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Listagem de Transações ({transactions.length})</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <View style={styles.colDate}><Text style={styles.headerText}>Data</Text></View>
                            <View style={styles.colDesc}><Text style={styles.headerText}>Descrição</Text></View>
                            <View style={styles.colProject}><Text style={styles.headerText}>Projeto</Text></View>
                            <View style={styles.colType}><Text style={styles.headerText}>Reembolso</Text></View>
                            <View style={styles.colDoc}><Text style={styles.headerText}>Doc</Text></View>
                            <View style={styles.colAmount}><Text style={styles.headerText}>Valor</Text></View>
                        </View>

                        {transactions.map((t, idx) => (
                            <View key={t.id || idx} style={styles.tableRow} wrap={false}>
                                <View style={styles.colDate}>
                                    <Text style={styles.rowText}>{formatDate(t.date)}</Text>
                                </View>
                                <View style={styles.colDesc}>
                                    <Text style={styles.rowText}>{t.description}</Text>
                                </View>
                                <View style={styles.colProject}>
                                    <Text style={styles.rowText}>{t.project?.name || '-'}</Text>
                                </View>
                                <View style={styles.colType}>
                                    <Text style={[
                                        styles.badge,
                                        {
                                            backgroundColor: t.reimbursement_status === 'paid' ? '#D1FAE5' : (t.reimbursement_status?.startsWith('requested') ? '#FEF3C7' : '#F3F4F6'),
                                            color: t.reimbursement_status === 'paid' ? '#065F46' : (t.reimbursement_status?.startsWith('requested') ? '#92400E' : '#374151')
                                        }
                                    ]}>
                                        {getReimbursementLabel(t.reimbursement_status)}
                                    </Text>
                                </View>
                                <View style={styles.colDoc}>
                                    {t.invoice_url ? (
                                        <Link src={t.invoice_url} style={[styles.rowText, { color: '#2563EB', textDecoration: 'underline' }]}>
                                            Link
                                        </Link>
                                    ) : (
                                        <Text style={styles.rowText}>-</Text>
                                    )}
                                </View>
                                <View style={styles.colAmount}>
                                    <Text style={[
                                        styles.amountText,
                                        { color: t.type === 'entry' ? '#059669' : '#DC2626' }
                                    ]}>
                                        {t.type === 'entry' ? '+' : '-'} {formatCurrency(t.amount, t.currency)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Notes Section - Only show if there are any notes */}
                {transactions.some(t => t.notes) && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>Anotações Adicionais</Text>
                        {transactions
                            .filter(t => t.notes)
                            .map((t, idx) => (
                                <View key={`note-${t.id || idx}`} style={styles.noteItem} wrap={false}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <Text style={styles.noteLabel}>
                                            {formatDate(t.date)} - {t.description}
                                        </Text>
                                        <Text style={[styles.noteLabel, { fontSize: 8, color: '#6B7280' }]}>
                                            {formatCurrency(t.amount, t.currency)}
                                        </Text>
                                    </View>
                                    <Text style={styles.noteText}>{t.notes}</Text>
                                </View>
                            ))}
                    </View>
                )}

                <View style={styles.footer} fixed>
                    <Text render={({ pageNumber, totalPages }) => (
                        `Relatório Gerado por ${generatorName} em ${new Date().toLocaleDateString('pt-BR')} — Página ${pageNumber} de ${totalPages}`
                    )} />
                </View>
            </Page>
        </Document>
    );
};
