import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { FeeRecord } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  CreditCard,
  CheckCircle,
  Receipt,
  Clock,
  IndianRupee,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

export const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Online Card Gateway (Mock)');
  const [actionLoading, setActionLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const loadFees = async () => {
    try {
      setLoading(true);
      const studentId = user?.studentId;
      if (studentId) {
        const res = await api.get<FeeRecord[]>(`/fees?studentId=${studentId}`);
        setFees(res);
      }
    } catch (err) {
      console.error('Failed to load fees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [user]);

  const handleOpenPay = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPayAmount(String(fee.remaining_amount));
    setIsPayModalOpen(true);
    setReceiptData(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      setActionLoading(true);
      const res = await api.post(`/fees/${selectedFee.id}/pay`, {
        amount: Number(payAmount),
        paymentMethod
      });
      setReceiptData(res.receipt);
      await loadFees();
    } catch (err: any) {
      alert('Payment failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-amber-600" />
            <span>Semester Tuition & Academic Fees</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review fee invoices, payment dues, and download official payment receipts
          </p>
        </div>
      </div>

      {/* Fee Cards */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          Loading fee records...
        </div>
      ) : fees.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs">
          No fee records found for your account.
        </div>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => {
            const isPaid = fee.payment_status === 'Paid';
            return (
              <div
                key={fee.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={fee.payment_status} type="fee" />
                    <span className="text-xs font-mono font-bold text-gray-400">
                      Academic Year: {fee.academic_year}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    Semester {fee.semester} Tuition Fee
                  </h3>
                  <p className="text-xs text-gray-500">
                    Due Date: <strong className="text-gray-800">{fee.due_date}</strong>
                  </p>

                  {fee.receipt_no && (
                    <p className="text-xs text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border border-emerald-100">
                      Receipt #: {fee.receipt_no} • Paid on {fee.payment_date} ({fee.payment_method})
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="grid grid-cols-3 gap-4 text-left sm:text-right border-l md:border-l-0 pl-4 md:pl-0 border-gray-200">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Total Invoiced</span>
                      <span className="text-sm font-bold text-gray-900">
                        ₹{Number(fee.total_fee).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Amount Paid</span>
                      <span className="text-sm font-bold text-emerald-600">
                        ₹{Number(fee.paid_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Balance Due</span>
                      <span className="text-sm font-bold text-rose-600">
                        ₹{Number(fee.remaining_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div>
                    {!isPaid ? (
                      <button
                        onClick={() => handleOpenPay(fee)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <IndianRupee className="w-4 h-4" />
                        <span>Pay Dues Online</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Fee Cleared</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Dialog Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={receiptData ? "Payment Receipt" : "Simulated Student Fee Checkout"}
        subtitle={`Semester ${selectedFee?.semester} Tuition`}
        maxWidth="md"
      >
        {receiptData ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-emerald-950">Payment Successful!</h3>
              <p className="text-xs text-emerald-700">Official university receipt generated and archived.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-mono font-bold text-gray-900">{receiptData.receiptNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">₹{Number(receiptData.amountPaid).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Payment Date:</span>
                <span className="font-medium text-gray-800">{receiptData.transactionDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Method:</span>
                <span className="font-medium text-gray-800">{receiptData.paymentMethod}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                College Project Mock Flow: No real charges apply. This will record your payment into PostgreSQL and clear your dues.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                max={selectedFee?.remaining_amount}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Online Card Gateway (Mock)">Online Credit / Debit Card (Mock)</option>
                <option value="Student UPI / NetBanking (Mock)">Student UPI / NetBanking (Mock)</option>
                <option value="Campus Educational Voucher">Campus Educational Voucher</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !payAmount || Number(payAmount) <= 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Process Payment (₹{Number(payAmount || 0).toLocaleString('en-IN')})</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
