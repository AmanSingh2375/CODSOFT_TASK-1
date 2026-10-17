import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Student } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Users,
  Search,
  Eye,
  Loader2,
  Mail,
  Phone,
  BookOpen
} from 'lucide-react';

export const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const res = await api.get<Student[]>(`/students?${params.toString()}`);
        setStudents(res);
      } catch (err) {
        console.error('Failed to load students', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [search]);

  const handleOpenView = async (st: Student) => {
    try {
      const detailed = await api.get<Student>(`/students/${st.id}`);
      setSelectedStudent(detailed);
      setIsModalOpen(true);
    } catch {
      setSelectedStudent(st);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-7 h-7 text-blue-600" />
          <span>Assigned Students Roster</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Enrolled students in courses and batches under your instruction
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search student by name, roll number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Course</th>
                <th className="px-6 py-3.5">Semester</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading enrolled students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">
                      {st.student_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.name}`}
                          alt={st.name}
                          className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{st.name}</p>
                          <p className="text-[11px] text-gray-500">{st.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {st.department_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {st.course_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      Semester {st.semester}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={st.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenView(st)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors cursor-pointer text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Student Details"
        subtitle={`ID: ${selectedStudent?.student_id}`}
        maxWidth="lg"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <img
                src={selectedStudent.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.name}`}
                alt={selectedStudent.name}
                className="w-14 h-14 rounded-full bg-white border border-gray-200"
              />
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedStudent.name}</h3>
                <p className="text-xs text-blue-600 font-semibold">{selectedStudent.student_id}</p>
                <p className="text-xs text-gray-500">{selectedStudent.course_name} • Sem {selectedStudent.semester}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Email</span>
                <span className="font-semibold text-gray-800">{selectedStudent.email}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Phone</span>
                <span className="font-semibold text-gray-800">{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Department</span>
                <span className="font-semibold text-gray-800">{selectedStudent.department_name}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Guardian Contact</span>
                <span className="font-semibold text-gray-800">{selectedStudent.guardian_name || 'N/A'} ({selectedStudent.guardian_phone || 'N/A'})</span>
              </div>
            </div>

            {selectedStudent.attendanceSummary && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs flex justify-between items-center">
                <span className="font-medium text-blue-900">Overall Attendance Record</span>
                <span className="font-bold text-blue-700 text-sm">
                  {selectedStudent.attendanceSummary.percentage}% ({selectedStudent.attendanceSummary.presentClasses}/{selectedStudent.attendanceSummary.totalClasses} classes)
                </span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
