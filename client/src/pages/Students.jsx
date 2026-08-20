import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    course: '',
    semester: 1,
  });

  // Delete modal states
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    studentId: null,
    studentName: '',
  });

  useEffect(() => {
    fetchStudents();
  }, [courseFilter, semesterFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (courseFilter) params.course = courseFilter;
      if (semesterFilter) params.semester = semesterFilter;

      const res = await API.get('/students', { params });
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      student_id: '',
      name: '',
      email: '',
      course: '',
      semester: 1,
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email || '',
      course: student.course,
      semester: student.semester,
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await API.put(`/students/${editingStudent.id}`, formData);
        toast.success('Student updated successfully!');
      } else {
        await API.post('/students', formData);
        toast.success('Student added successfully!');
      }
      setShowFormModal(false);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving student';
      toast.error(msg);
    }
  };

  const handleDeletePrompt = (student) => {
    setDeleteModal({
      show: true,
      studentId: student.id,
      studentName: student.name,
    });
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/students/${deleteModal.studentId}`);
      toast.success('Student deleted successfully');
      setDeleteModal({ show: false, studentId: null, studentName: '' });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const uniqueCourses = Array.from(new Set(students.map((s) => s.course).filter(Boolean)));

  return (
    <div className="students-container">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Student Management</h2>
          <p className="text-muted mb-0">Add, edit, filter, and manage enrolled students</p>
        </div>
        <button
          className="btn btn-primary shadow-sm fw-semibold mt-3 mt-md-0"
          onClick={handleOpenAddModal}
          id="add-student-btn"
        >
          <span className="me-1">➕</span> Add New Student
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card border-0 shadow-sm mb-4 p-3 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Search by Name / Roll No / Email</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-student-input"
              />
              <button className="btn btn-primary" type="submit" id="search-student-btn">
                Search
              </button>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted">Filter Course</label>
            <select
              className="form-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              id="filter-course-select"
            >
              <option value="">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {!uniqueCourses.includes('Computer Science') && <option value="Computer Science">Computer Science</option>}
              {!uniqueCourses.includes('Electronics') && <option value="Electronics">Electronics</option>}
              {!uniqueCourses.includes('Mechanical') && <option value="Mechanical">Mechanical</option>}
              {!uniqueCourses.includes('Civil') && <option value="Civil">Civil</option>}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted">Filter Semester</label>
            <select
              className="form-select"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              id="filter-semester-select"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2 d-flex">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSearch('');
                setCourseFilter('');
                setSemesterFilter('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Students Table */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-3">Roll No</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Semester</th>
                <th className="text-end px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="fs-3 mb-2">🧑‍🎓</div>
                    No students found matching the criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-3 fw-bold text-primary">{student.student_id}</td>
                    <td className="fw-semibold text-dark">{student.name}</td>
                    <td className="text-muted">{student.email || '—'}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1">
                        {student.course}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                        Sem {student.semester}
                      </span>
                    </td>
                    <td className="text-end px-3">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenEditModal(student)}
                        id={`edit-student-${student.id}`}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeletePrompt(student)}
                        id={`delete-student-${student.id}`}
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

      {/* Add / Edit Student Modal */}
      {showFormModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowFormModal(false)}
                ></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Student ID / Roll No *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. STU001"
                      required
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      id="input-student-id"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Aman Sharma"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      id="input-student-name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. aman@school.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      id="input-student-email"
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-7">
                      <label className="form-label fw-semibold small text-muted">Course *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Computer Science"
                        required
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        id="input-student-course"
                      />
                    </div>
                    <div className="col-12 col-md-5">
                      <label className="form-label fw-semibold small text-muted">Semester *</label>
                      <select
                        className="form-select"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        id="input-student-semester"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowFormModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold" id="save-student-btn">
                    {editingStudent ? 'Update Student' : 'Save Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Student"
        message={`Are you sure you want to permanently delete student "${deleteModal.studentName}"? All related attendance logs will also be removed.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ show: false, studentId: null, studentName: '' })}
      />
    </div>
  );
};

export default Students;
