import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const StudentReport = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await API.get('/students');
      setStudents(res.data);
      if (res.data.length > 0) {
        setSelectedStudentId(res.data[0].id.toString());
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchReport(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchReport = async (studentId) => {
    try {
      setLoadingReport(true);
      const [reportRes, historyRes] = await Promise.all([
        API.get(`/reports/student/${studentId}`),
        API.get(`/attendance/student/${studentId}`),
      ]);
      setReportData(reportRes.data);
      setStudentHistory(historyRes.data.records || []);
    } catch (err) {
      toast.error('Failed to load student report');
    } finally {
      setLoadingReport(false);
    }
  };

  const overallPercentage = reportData?.overall?.percentage || 0;
  const isShortage = overallPercentage < 75;

  const radarLabels = reportData?.subjectWise?.map((s) => s.subject_code) || [];
  const radarValues = reportData?.subjectWise?.map((s) => s.percentage) || [];

  const radarData = {
    labels: radarLabels.length > 0 ? radarLabels : ['No subjects'],
    datasets: [
      {
        label: 'Attendance %',
        data: radarValues.length > 0 ? radarValues : [0],
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { stepSize: 20 },
      },
    },
  };

  return (
    <div className="student-report-container">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Student Attendance Report</h2>
          <p className="text-muted mb-0">Detailed analytics, subject breakdown, and full history</p>
        </div>
      </div>

      {/* Select Student Toolbar */}
      <div className="card border-0 shadow-sm mb-4 p-3 bg-white">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-muted">Select Student</label>
            <select
              className="form-select form-select-lg"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={loadingStudents}
              id="select-report-student"
            >
              {loadingStudents ? (
                <option>Loading students...</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.student_id}] {s.name} - {s.course} (Sem {s.semester})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {loadingReport ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading report...</span>
          </div>
        </div>
      ) : reportData ? (
        <>
          {/* Profile & Overall KPI Summary */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold fs-3"
                    style={{ width: '60px', height: '60px' }}
                  >
                    {reportData.student.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{reportData.student.name}</h5>
                    <span className="badge bg-primary px-2 py-1">{reportData.student.student_id}</span>
                  </div>
                </div>
                <hr className="my-2" />
                <div className="py-2">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Course:</span>
                    <strong className="text-dark">{reportData.student.course}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Semester:</span>
                    <strong className="text-dark">Semester {reportData.student.semester}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Email:</span>
                    <span className="text-dark small">{reportData.student.email || '—'}</span>
                  </div>
                </div>
                <div
                  className={`alert ${
                    isShortage ? 'alert-danger' : 'alert-success'
                  } mb-0 mt-auto d-flex align-items-center gap-2`}
                >
                  <span>{isShortage ? '⚠️' : '✅'}</span>
                  <small className="fw-semibold">
                    {isShortage
                      ? 'Attendance below minimum required 75%'
                      : 'Attendance criteria (≥75%) satisfied'}
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm p-4 h-100 bg-white text-center d-flex flex-column justify-content-center">
                <h6 className="text-muted text-uppercase fw-bold mb-3">Overall Attendance Score</h6>
                <div className="display-4 fw-bold mb-2 text-primary">
                  {overallPercentage}%
                </div>
                <div className="progress mb-3" style={{ height: '12px' }}>
                  <div
                    className={`progress-bar ${
                      isShortage ? 'bg-danger' : 'bg-success'
                    }`}
                    role="progressbar"
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-around text-muted small">
                  <div>
                    Classes: <strong className="text-dark">{reportData.overall.total_classes}</strong>
                  </div>
                  <div>
                    Attended: <strong className="text-success">{reportData.overall.present_count}</strong>
                  </div>
                  <div>
                    Missed: <strong className="text-danger">{reportData.overall.absent_count}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm p-3 h-100 bg-white">
                <h6 className="text-muted text-uppercase fw-bold mb-2 text-center">Subject Balance</h6>
                <div style={{ height: '200px' }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise breakdown */}
          <div className="card border-0 shadow-sm mb-4 p-4 bg-white">
            <h5 className="fw-bold mb-3 text-dark">Subject-wise Attendance Breakdown</h5>
            {reportData.subjectWise.length === 0 ? (
              <p className="text-muted">No attendance marked for any subject yet.</p>
            ) : (
              <div className="row g-3">
                {reportData.subjectWise.map((sub) => {
                  const subPct = sub.percentage || 0;
                  const isSubLow = subPct < 75;
                  return (
                    <div key={sub.subject_id} className="col-12 col-md-6 col-xl-4">
                      <div className="p-3 border rounded-3 bg-light h-100">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="badge bg-secondary mb-1">{sub.subject_code}</span>
                            <h6 className="fw-bold text-dark mb-0">{sub.subject_name}</h6>
                          </div>
                          <span
                            className={`badge ${
                              isSubLow ? 'bg-danger' : 'bg-success'
                            } px-2 py-1 fs-6`}
                          >
                            {subPct}%
                          </span>
                        </div>
                        <div className="progress mb-2" style={{ height: '8px' }}>
                          <div
                            className={`progress-bar ${isSubLow ? 'bg-danger' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${Math.min(subPct, 100)}%` }}
                          ></div>
                        </div>
                        <div className="d-flex justify-content-between text-muted small">
                          <span>
                            Total: <strong>{sub.total_classes}</strong>
                          </span>
                          <span>
                            Present: <strong className="text-success">{sub.present_count}</strong>
                          </span>
                          <span>
                            Absent: <strong className="text-danger">{sub.absent_count}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full Student Log History */}
          <div className="card border-0 shadow-sm overflow-hidden bg-white">
            <div className="card-header bg-white border-bottom p-3">
              <h5 className="fw-bold mb-0 text-dark">Individual Class Attendance Log</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Date</th>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No individual logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    studentHistory.map((rec) => {
                      const isPresent = rec.status === 'present';
                      const formattedDate = new Date(rec.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      return (
                        <tr key={rec.id}>
                          <td className="px-3 fw-semibold text-dark">{formattedDate}</td>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary border">
                              {rec.subject_code}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">{rec.subject_name}</td>
                          <td>
                            <span
                              className={`badge ${
                                isPresent ? 'bg-success' : 'bg-danger'
                              } px-3 py-1 text-uppercase fw-bold`}
                            >
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info">Please select a student to display report.</div>
      )}
    </div>
  );
};

export default StudentReport;
