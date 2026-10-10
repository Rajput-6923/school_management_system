import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Modal } from '../common/Modal';
import { FeeInvoice } from '../../types';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { settings, students } = useSchool();

  if (!invoice) return null;

  const student = students.find((s) => s.id === invoice.studentId);
  const latestPayment = invoice.payments[invoice.payments.length - 1];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Fee Payment Receipt"
      subtitle={`Receipt #${invoice.invoiceNo} · Student: ${invoice.studentName}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Receipt Slip */}
        <div className="p-6 bg-white border border-slate-300 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center font-mono text-sm">
                EC
              </div>
              <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                {settings.schoolName}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Accounts & Bursar Division · {settings.phone}
            </p>
            <div className="mt-2 text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 py-1 rounded">
              OFFICIAL TREASURY RECEIPT
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block">Receipt / Invoice No</span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoiceNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Issue Date</span>
              <span className="font-mono text-slate-900">{invoice.createdAt}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Student Name</span>
              <span className="font-bold text-slate-900">{invoice.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Class & Section</span>
              <span className="font-medium text-slate-900">{invoice.className}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Admission Number</span>
              <span className="font-mono text-slate-900">
                {student?.admissionNo || 'ADM-RECORD'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Term</span>
              <span className="text-slate-900">{invoice.academicTerm}</span>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden mb-4">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3 text-right">Paid</th>
                <th className="py-2 px-3 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {invoice.feeType}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  {settings.currencySymbol}
                  {invoice.amount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                  {settings.currencySymbol}
                  {invoice.paidAmount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                  {settings.currencySymbol}
                  {Math.max(0, invoice.amount - invoice.paidAmount).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment History / Transaction Ref */}
          {latestPayment ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs space-y-1 mb-6">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Last Payment Record Verified</span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                Paid: {settings.currencySymbol}
                {latestPayment.amount} via {latestPayment.paymentMethod} (Ref:{' '}
                {latestPayment.transactionRef}) on {latestPayment.paymentDate}
              </div>
              {latestPayment.notes && (
                <div className="text-slate-500 italic text-[11px]">{latestPayment.notes}</div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-6">
              Payment pending. Due date: {invoice.dueDate}
            </div>
          )}

          {/* Seal / Signature Stamp */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-300 pb-5 mb-1 font-serif text-slate-400 italic">
                Authorized Bursar Signature
              </div>
              <span className="font-medium text-slate-700">Bursar / Cashier</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-5 mb-1 font-mono text-slate-400">
                [ OFFICIAL STAMP ]
              </div>
              <span className="font-medium text-slate-700">Accounts Department</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
