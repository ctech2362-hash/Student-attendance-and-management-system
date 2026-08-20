import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const MarkAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'present' | 'absent' }
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await API.get('/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubject(res.data[0].id.toString());
      }
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      fetchStudentsForSubject(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchStudentsForSubject = async (subjectId) => {
    try {
      setLoadingStudents(true);
      const sub = subjects.find((s) => s.id === parseInt(subjectId));
      const params = {};
      if (sub && sub.semester) {
        params.semester = sub.semester;
      }
      const res = await API.get('/students', { params });
      setStudents(res.data);

      // Default all to 'present'
      const initialMap = {};
      res.data.forEach((s) => {
        initialMap[s.id] = 'present';
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      toast.error('Failed to load student list');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (students.length === 0) {
      toast.error('No students available to mark');
      return;
    }

    const records = students.map((s) => ({
      student_id: s.id,
      status: attendanceMap[s.id] || 'absent',
    }));

    try {
      setSubmitting(true);
      const res = await API.post('/attendance/mark', {
        subject_id: parseInt(selectedSubject),
        date: selectedDate,
        records,
      });
      toast.success(res.data.message || 'Attendance submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const totalStudents = students.length;
  const presentCount = Object.values(attendanceMap).filter((v) => v === 'present').length;
  const absentCount = totalStudents - presentCount;

  return (
    <div className="mark-attendance-container">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Take Attendance</h2>
          <p className="text-muted mb-0">Record daily classroom attendance for subjects</p>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="card border-0 shadow-sm mb-4 p-4 bg-white">
        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end mb-4">
            <div className="col-12 col-md-5">
              <label className="form-label small fw-semibold text-muted">Select Subject *</label>
              <select
                className="form-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={loadingSubjects}
                id="select-attendance-subject"
                required
              >
                {loadingSubjects ? (
                  <option>Loading subjects...</option>
                ) : (
                  subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.subject_code}] {sub.subject_name} (Sem {sub.semester})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted">Attendance Date *</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                id="input-attendance-date"
                required
              />
            </div>

            <div className="col-12 col-md-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-success flex-grow-1 btn-sm py-2"
                onClick={() => handleMarkAll('present')}
                id="btn-all-present"
              >
                ✓ All Present
              </button>
              <button
                type="button"
                className="btn btn-outline-danger flex-grow-1 btn-sm py-2"
                onClick={() => handleMarkAll('absent')}
                id="btn-all-absent"
              >
                ✕ All Absent
              </button>
            </div>
          </div>

          {/* Quick Summary Pill Banner */}
          <div className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded bg-light border mb-4">
            <div className="d-flex gap-3 align-items-center">
              <span className="badge bg-secondary px-3 py-2 fs-6">
                Total: <strong>{totalStudents}</strong>
              </span>
              <span className="badge bg-success px-3 py-2 fs-6">
                Present: <strong>{presentCount}</strong>
              </span>
              <span className="badge bg-danger px-3 py-2 fs-6">
                Absent: <strong>{absentCount}</strong>
              </span>
            </div>
            <button
              type="submit"
              className="btn btn-primary fw-bold px-4 shadow-sm"
              disabled={submitting || students.length === 0}
              id="submit-attendance-btn"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                '💾 Submit Attendance'
              )}
            </button>
          </div>

          {/* Student List */}
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3" style={{ width: '120px' }}>Roll No</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th className="text-center" style={{ width: '220px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Loading eligible students...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        No students found for this subject's semester.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const isPresent = attendanceMap[student.id] === 'present';
                      return (
                        <tr
                          key={student.id}
                          className={isPresent ? 'table-success-subtle' : 'table-danger-subtle'}
                        >
                          <td className="px-3 fw-bold text-dark">{student.student_id}</td>
                          <td className="fw-semibold text-dark">{student.name}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {student.course}
                            </span>
                          </td>
                          <td>Sem {student.semester}</td>
                          <td className="text-center">
                            <div className="btn-group" role="group">
                              <button
                                type="button"
                                className={`btn btn-sm ${
                                  isPresent
                                    ? 'btn-success fw-bold'
                                    : 'btn-outline-secondary'
                                }`}
                                onClick={() => handleStatusChange(student.id, 'present')}
                                id={`status-present-${student.id}`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm ${
                                  !isPresent
                                    ? 'btn-danger fw-bold'
                                    : 'btn-outline-secondary'
                                }`}
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                id={`status-absent-${student.id}`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkAttendance;
