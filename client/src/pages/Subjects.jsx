import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    semester: 1,
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    subjectId: null,
    subjectName: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, [semesterFilter]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (semesterFilter) params.semester = semesterFilter;
      const res = await API.get('/subjects', { params });
      setSubjects(res.data);
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setFormData({
      subject_code: '',
      subject_name: '',
      semester: 1,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      semester: subject.semester,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await API.put(`/subjects/${editingSubject.id}`, formData);
        toast.success('Subject updated successfully!');
      } else {
        await API.post('/subjects', formData);
        toast.success('Subject added successfully!');
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    }
  };

  const handleDeletePrompt = (subject) => {
    setDeleteModal({
      show: true,
      subjectId: subject.id,
      subjectName: `${subject.subject_code} - ${subject.subject_name}`,
    });
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/subjects/${deleteModal.subjectId}`);
      toast.success('Subject deleted successfully');
      setDeleteModal({ show: false, subjectId: null, subjectName: '' });
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="subjects-container">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Subject Curriculum</h2>
          <p className="text-muted mb-0">Manage course modules and semester curriculum</p>
        </div>
        <button
          className="btn btn-primary shadow-sm fw-semibold mt-3 mt-md-0"
          onClick={handleOpenAddModal}
          id="add-subject-btn"
        >
          <span className="me-1">➕</span> Add New Subject
        </button>
      </div>

      {/* Filter Row */}
      <div className="card border-0 shadow-sm mb-4 p-3 bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Filter by Semester</label>
            <select
              className="form-select"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              id="filter-subject-semester"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <button
              type="button"
              className="btn btn-outline-secondary mt-4 w-100"
              onClick={() => setSemesterFilter('')}
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-3">Code</th>
                <th>Subject Name</th>
                <th>Semester</th>
                <th className="text-end px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    <div className="fs-3 mb-2">📚</div>
                    No subjects found. Add a new subject to get started.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-3 fw-bold text-primary">{sub.subject_code}</td>
                    <td className="fw-semibold text-dark">{sub.subject_name}</td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                        Semester {sub.semester}
                      </span>
                    </td>
                    <td className="text-end px-3">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenEditModal(sub)}
                        id={`edit-subject-${sub.id}`}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeletePrompt(sub)}
                        id={`delete-subject-${sub.id}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Subject Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CS401"
                      required
                      value={formData.subject_code}
                      onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                      id="input-subject-code"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Subject Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Data Structures & Algorithms"
                      required
                      value={formData.subject_name}
                      onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                      id="input-subject-name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Semester *</label>
                    <select
                      className="form-select"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      id="input-subject-semester"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold" id="save-subject-btn">
                    {editingSubject ? 'Update Subject' : 'Save Subject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteModal.subjectName}"? Attendance entries associated with this subject will also be affected.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ show: false, subjectId: null, subjectName: '' })}
      />
    </div>
  );
};

export default Subjects;
