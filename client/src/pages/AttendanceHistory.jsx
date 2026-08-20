import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const AttendanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Editing state for inline toggle
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchHistory();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await API.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (subjectFilter) params.subject_id = subjectFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await API.get('/attendance/history', { params });
      setHistory(res.data);
    } catch (err) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleReset = () => {
    setSubjectFilter('');
    setDateFrom('');
    setDateTo('');
    setTimeout(() => {
      API.get('/attendance/history').then((res) => setHistory(res.data));
    }, 0);
  };

  const handleToggleStatus = async (record) => {
    const newStatus = record.status === 'present' ? 'absent' : 'present';
    try {
      setUpdatingId(record.id);
      await API.put(`/attendance/${record.id}`, { status: newStatus });
      setHistory((prev) =>
        prev.map((item) =>
          item.id === record.id ? { ...item, status: newStatus } : item
        )
      );
      toast.success(`Updated status to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRecords = history.length;
  const presentCount = history.filter((r) => r.status === 'present').length;
  const absentCount = totalRecords - presentCount;
  const percentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  return (
    <div className="attendance-history-container">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Attendance History</h2>
          <p className="text-muted mb-0">Audit and filter historical student attendance logs</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card border-0 shadow-sm mb-4 p-3 bg-white">
        <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Subject</label>
            <select
              className="form-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              id="filter-history-subject"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  [{sub.subject_code}] {sub.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted">Date From</label>
            <input
              type="date"
              className="form-control"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              id="filter-date-from"
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted">Date To</label>
            <input
              type="date"
              className="form-control"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              id="filter-date-to"
            />
          </div>

          <div className="col-12 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1" id="filter-history-btn">
              Filter
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleReset}
              id="reset-history-btn"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Summary Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded shadow-sm border text-center">
            <small className="text-muted text-uppercase fw-semibold">Filtered Logs</small>
            <h4 className="fw-bold mb-0 text-dark">{totalRecords}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded shadow-sm border text-center">
            <small className="text-muted text-uppercase fw-semibold">Total Present</small>
            <h4 className="fw-bold mb-0 text-success">{presentCount}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded shadow-sm border text-center">
            <small className="text-muted text-uppercase fw-semibold">Total Absent</small>
            <h4 className="fw-bold mb-0 text-danger">{absentCount}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded shadow-sm border text-center">
            <small className="text-muted text-uppercase fw-semibold">Attendance %</small>
            <h4 className="fw-bold mb-0 text-primary">{percentage}%</h4>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-3">Date</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Subject</th>
                <th>Marked By</th>
                <th>Status</th>
                <th className="text-end px-3">Toggle Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading attendance records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="fs-3 mb-2">📅</div>
                    No attendance logs found matching query.
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const isPresent = record.status === 'present';
                  const formattedDate = new Date(record.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={record.id}>
                      <td className="px-3 fw-semibold text-dark">{formattedDate}</td>
                      <td className="fw-bold text-primary">{record.roll_no}</td>
                      <td className="fw-semibold text-dark">{record.student_name}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {record.subject_code} - {record.subject_name}
                        </span>
                      </td>
                      <td className="text-muted small">
                        👤 {record.marked_by_name || 'Admin'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isPresent ? 'bg-success' : 'bg-danger'
                          } px-3 py-2 text-uppercase fw-bold`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="text-end px-3">
                        <button
                          className={`btn btn-sm ${
                            isPresent ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          onClick={() => handleToggleStatus(record)}
                          disabled={updatingId === record.id}
                        >
                          {updatingId === record.id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : isPresent ? (
                            'Set Absent'
                          ) : (
                            'Set Present'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
