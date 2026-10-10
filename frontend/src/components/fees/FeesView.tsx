import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { FeeInvoice, FeeStatus } from '../../types';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Trash2,
  Printer,
} from 'lucide-react';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FeesViewProps {
  initialInvoiceReceiptId?: string | null;
}

export const FeesView: React.FC<FeesViewProps> = ({ initialInvoiceReceiptId }) => {
  const { invoices, students, classes, settings, addInvoice, deleteInvoice, isSaving } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoice | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoice | null>(() => {
    if (initialInvoiceReceiptId) {
      return invoices.find((i) => i.id === initialInvoiceReceiptId) || null;
    }
    return null;
  });
  const [invoiceToDelete, setInvoiceToDelete] = useState<FeeInvoice | null>(null);

  // New Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: students[0]?.id || '',
    feeType: 'Tuition Fee' as FeeInvoice['feeType'],
    amount: 1200,
    dueDate: '2026-05-15',
    academicTerm: 'Spring 2026',
  });

  // Calculate Metrics
  const totalBilled = useMemo(
    () => invoices.reduce((acc, i) => acc + i.amount, 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => invoices.reduce((acc, i) => acc + i.paidAmount, 0),
    [invoices]
  );
  const totalPending = Math.max(0, totalBilled - totalCollected);
  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        `${inv.invoiceNo} ${inv.studentName} ${inv.feeType}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchClass = classFilter === 'all' || inv.classId === classFilter;

      return matchSearch && matchStatus && matchClass;
    });
  }, [invoices, searchTerm, statusFilter, classFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === invoiceForm.studentId);
    if (!student) return;

    const saved = await addInvoice({
      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classId: student.classId,
      className: `${student.className} - ${student.section}`,
      feeType: invoiceForm.feeType,
      amount: Number(invoiceForm.amount),
      paidAmount: 0,
      dueDate: invoiceForm.dueDate,
      status: 'Pending',
      academicTerm: invoiceForm.academicTerm,
    });
    if (saved) setIsInvoiceModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-medium text-slate-500">Total Billed Fees</span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {settings.currencySymbol}
            {totalBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {invoices.length} total fee invoices
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-medium text-emerald-700">Total Collected</span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {settings.currencySymbol}
            {totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}% realization rate
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-medium text-amber-700">Pending Dues</span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600">
            {settings.currencySymbol}
            {totalPending.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-600/80 mt-1 block">
            Scheduled for current term
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-xs font-medium text-rose-700">Overdue Invoices</span>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-600">
            {overdueCount}
          </div>
          <span className="text-[11px] text-rose-600/80 mt-1 block">
            Requires follow-up notice
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number, student name, or fee type..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New Invoice</span>
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          {(['all', 'Paid', 'Partial', 'Pending', 'Overdue'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}

          <div className="ml-auto text-xs text-slate-400 font-mono">
            Showing {filteredInvoices.length} invoices
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due Balance</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const due = Math.max(0, inv.amount - inv.paidAmount);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNo}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {inv.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.className}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {inv.feeType}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {settings.currencySymbol}
                        {inv.amount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold tabular-nums">
                        {settings.currencySymbol}
                        {inv.paidAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {due > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {settings.currencySymbol}
                            {due.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {inv.dueDate}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inv.status === 'Partial'
                              ? 'bg-amber-50 text-amber-700'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {due > 0 && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              className="px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => setReceiptInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Print official receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No fee invoices match the filter criteria.
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
        invoice={receiptInvoice}
      />

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Issue New Fee Invoice"
        subtitle="Generate student billing invoice and payment schedule"
        maxWidth="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Student *
            </label>
            <select
              value={invoiceForm.studentId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.className} - Sec {s.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Fee Category *
            </label>
            <select
              value={invoiceForm.feeType}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, feeType: e.target.value as any })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Lab Fee">Lab Fee</option>
              <option value="Transport Fee">Transport Fee</option>
              <option value="Library Fee">Library Fee</option>
              <option value="Annual Examination">Annual Examination</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fee Amount ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                min="10"
                required
                value={invoiceForm.amount}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Due Date *
              </label>
              <input
                type="date"
                required
                value={invoiceForm.dueDate}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Academic Term
            </label>
            <input
              type="text"
              value={invoiceForm.academicTerm}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, academicTerm: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Invoice Dialog */}
      <ConfirmDialog
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }
        }}
        title="Delete Fee Invoice"
        message={`Are you sure you want to remove Invoice #${invoiceToDelete?.invoiceNo} for ${invoiceToDelete?.studentName}?`}
        confirmLabel="Delete Invoice"
        isDestructive={true}
      />
    </div>
  );
};
