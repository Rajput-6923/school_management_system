import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { FeeInvoice, FeePayment } from '../../types';
import { Modal } from '../common/Modal';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { recordPayment, settings, isSaving } = useSchool();

  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<FeePayment['paymentMethod']>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (invoice) {
      const remaining = Math.max(0, invoice.amount - invoice.paidAmount);
      setAmount(remaining);
      setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
      setNotes('Tuition installment acknowledged.');
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const remainingDue = Math.max(0, invoice.amount - invoice.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const saved = await recordPayment(invoice.id, {
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      transactionRef: transactionRef || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      notes,
    });
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee Payment"
      subtitle={`Invoice #${invoice.invoiceNo} · Student: ${invoice.studentName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice Total:</span>
            <span className="font-mono font-bold text-slate-900">
              {settings.currencySymbol}
              {invoice.amount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Previously Paid:</span>
            <span className="font-mono text-emerald-600 font-semibold">
              {settings.currencySymbol}
              {invoice.paidAmount}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-700 font-bold">Outstanding Balance:</span>
            <span className="font-mono font-bold text-rose-600">
              {settings.currencySymbol}
              {remainingDue}
            </span>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Payment Amount ({settings.currencySymbol}) *
          </label>
          <input
            type="number"
            min="1"
            max={remainingDue || 5000}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:border-indigo-600 bg-white"
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Payment Method *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
          >
            <option value="Bank Transfer">Bank Transfer (Wire / ACH)</option>
            <option value="Credit/Debit Card">Credit / Debit Card</option>
            <option value="Cash">Cash (Counter Deposit)</option>
            <option value="Online/UPI">Online / Digital Wallet / UPI</option>
          </select>
        </div>

        {/* Reference */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Transaction Reference / Slip No
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. WIRE-88192-OK"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-indigo-600 bg-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Memo / Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional receipt notes..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Confirm & Issue Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
