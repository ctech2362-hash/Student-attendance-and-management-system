import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import StatsCard from '../components/StatsCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    todayTotal: 0,
    todayPresent: 0,
    todayAbsent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dashboard/stats');
      setStats(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const attendanceRatio = stats.todayTotal > 0
    ? Math.round((stats.todayPresent / stats.todayTotal) * 100)
    : 0;

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [stats.todayPresent, stats.todayAbsent],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'system-ui', size: 13, weight: '600' }
        },
      },
    },
    cutout: '70%',
  };

  const barData = {
    labels: ['Total Students', 'Total Subjects', "Today's Marked", 'Present', 'Absent'],
    datasets: [
      {
        label: 'Count',
        data: [
          stats.totalStudents,
          stats.totalSubjects,
          stats.todayTotal,
          stats.todayPresent,
          stats.todayAbsent,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)',
          'rgba(147, 51, 234, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(239, 68, 68, 0.85)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { stepSize: 1 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Dashboard Overview</h2>
          <p className="text-muted mb-0">Real-time attendance metrics & institutional statistics</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/mark-attendance" className="btn btn-primary shadow-sm fw-semibold">
            <span className="me-1">✍️</span> Mark Attendance
          </Link>
          <Link to="/students" className="btn btn-outline-secondary shadow-sm fw-semibold">
            <span className="me-1">🎓</span> Manage Students
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

      {/* Stats Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon="🎓"
            subtitle="Registered enrolled"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Subjects"
            value={stats.totalSubjects}
            icon="📚"
            subtitle="Active courses"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Present Today"
            value={stats.todayPresent}
            icon="✅"
            subtitle={`Out of ${stats.todayTotal} marked`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Absent Today"
            value={stats.todayAbsent}
            icon="❌"
            subtitle={`${stats.todayTotal ? Math.round((stats.todayAbsent / stats.todayTotal) * 100) : 0}% absent rate`}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100 p-3">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">System Metrics</h5>
              <span className="badge bg-light text-dark border">Overview</span>
            </div>
            <div className="card-body" style={{ height: '320px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100 p-3">
            <div className="card-header bg-transparent border-0">
              <h5 className="fw-bold mb-0 text-dark">Today's Attendance Rate</h5>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center" style={{ height: '320px' }}>
              {stats.todayTotal > 0 ? (
                <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ marginTop: '-15px' }}>
                    <div className="fs-3 fw-bold text-success">{attendanceRatio}%</div>
                    <small className="text-muted fw-semibold">Turnout</small>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted p-4">
                  <div className="display-6 mb-2">📋</div>
                  <p className="mb-2 fw-semibold">No attendance marked yet today</p>
                  <Link to="/mark-attendance" className="btn btn-sm btn-outline-primary">
                    Mark Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="card border-0 shadow-sm p-4">
        <h5 className="fw-bold mb-3 text-dark">Quick Operations</h5>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <Link to="/mark-attendance" className="text-decoration-none">
              <div className="p-3 border rounded-3 bg-light hover-shadow transition">
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-2 text-primary">📝</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Take Daily Attendance</h6>
                    <small className="text-muted">Record present/absent for any subject</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link to="/attendance-history" className="text-decoration-none">
              <div className="p-3 border rounded-3 bg-light hover-shadow transition">
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-2 text-info">🔍</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Filter Attendance History</h6>
                    <small className="text-muted">Search records by date range or subject</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link to="/student-report" className="text-decoration-none">
              <div className="p-3 border rounded-3 bg-light hover-shadow transition">
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-2 text-success">📊</div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Student Performance Report</h6>
                    <small className="text-muted">Subject-wise & cumulative percentages</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
