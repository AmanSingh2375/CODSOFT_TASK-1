import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { FeeRecord, Student } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  CreditCard,
  Plus,
  Search,
  IndianRupee,
  Receipt,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AdminFees: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Campus Cashier / Counter');

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialAddForm = {
    studentId: '',
    academicYear: '2025-2026',
    semester: '4',
    totalFee: '45000',
    paidAmount: '0',
    dueDate: '2026-05-30'
  };
  const [addForm, setAddForm] = useState(initialAddForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stRes, fRes] = await Promise.all([
        api.get<Student[]>('/students'),
        api.get<FeeRecord[]>('/fees')
      ]);
      setStudents(stRes);

      let filtered = fRes;
      if (selectedStatus) {
        filtered = filtered.filter(f => f.payment_status === selectedStatus);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(f =>
          f.student_name?.toLowerCase().includes(q) ||
          f.student_code?.toLowerCase().includes(q)
        );
      }
      setFees(filtered);
    } catch (err) {
      console.error('Failed to load fees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, search]);

  const handleOpenAdd = () => {
    setAddForm({
      ...initialAddForm,
      studentId: students[0]?.id ? String(students[0].id) : ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenPay = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPayAmount(String(fee.remaining_amount));
    setIsPayModalOpen(true);
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFormError(null);
      await api.post('/fees', addForm);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add fee record');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;
    try {
      setActionLoading(true);
      await api.post(`/fees/${selectedFee.id}/pay`, {
        amount: Number(payAmount),
        paymentMethod: payMethod
      });
      setIsPayModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to record payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalDues = fees.reduce((sum, f) => sum + Number(f.remaining_amount || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-amber-600" />
            <span>Institutional Fee Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tuition fee records, dues tracking, and payment ledger
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fee Record</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500">Total Dues Outstanding</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">₹{totalDues.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500">Total Fees Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500">Total Fee Accounts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fees.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Semester</th>
                <th className="px-6 py-3.5">Total Fee</th>
                <th className="px-6 py-3.5">Paid</th>
                <th className="px-6 py-3.5">Remaining</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
                    Loading fee records...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No fee records found.
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {fee.student_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-600 font-medium">
                      {fee.student_code}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      Sem {fee.semester} ({fee.academic_year})
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{Number(fee.total_fee).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
                      ₹{Number(fee.paid_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600">
                      ₹{Number(fee.remaining_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">
                      {fee.due_date}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={fee.payment_status} type="fee" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fee.payment_status !== 'Paid' ? (
                        <button
                          onClick={() => handleOpenPay(fee)}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg transition-colors cursor-pointer text-[11px]"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">
                          {fee.receipt_no || 'Cleared'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Fee Ledger Entry"
        maxWidth="md"
      >
        <form onSubmit={handleCreateFee} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700">Student *</label>
            <select
              value={addForm.studentId}
              onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>{st.name} ({st.student_id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Academic Year</label>
              <input
                type="text"
                value={addForm.academicYear}
                onChange={(e) => setAddForm({ ...addForm, academicYear: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Semester</label>
              <select
                value={addForm.semester}
                onChange={(e) => setAddForm({ ...addForm, semester: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Total Fee Amount (₹) *</label>
              <input
                type="number"
                required
                value={addForm.totalFee}
                onChange={(e) => setAddForm({ ...addForm, totalFee: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Paid Amount (₹)</label>
              <input
                type="number"
                value={addForm.paidAmount}
                onChange={(e) => setAddForm({ ...addForm, paidAmount: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Payment Due Date *</label>
            <input
              type="date"
              required
              value={addForm.dueDate}
              onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Fee Record</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Fee Payment (Mock Flow)"
        subtitle={`${selectedFee?.student_name} • Due: ₹${Number(selectedFee?.remaining_amount || 0).toLocaleString('en-IN')}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
            <p className="text-amber-900 font-semibold">Simulated Payment Gateway</p>
            <p className="text-amber-700 mt-0.5">
              Processes test fee payment, updates remaining balance to PostgreSQL, and generates an official receipt number.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Payment Amount (₹) *</label>
            <input
              type="number"
              step="100"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Payment Channel</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Campus Cashier / Counter">Campus Cashier / Counter</option>
              <option value="Online NetBanking (Mock)">Online NetBanking (Mock)</option>
              <option value="UPI / Debit Card (Mock)">UPI / Debit Card (Mock)</option>
              <option value="Bank Demand Draft">Bank Demand Draft</option>
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
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Confirm & Generate Receipt</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
