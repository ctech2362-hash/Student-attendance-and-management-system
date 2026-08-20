import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top px-3 shadow-sm" style={{ zIndex: 1040 }}>
      <button
        className="btn btn-outline-light me-3 d-md-none"
        onClick={onToggleSidebar}
        id="sidebar-toggle"
      >
        <i className="bi bi-list"></i> ☰
      </button>
      <a className="navbar-brand fw-bold" href="/">
        <span className="text-info">📋</span> AttendanceMS
      </a>
      <div className="ms-auto d-flex align-items-center">
        <span className="text-light me-3 d-none d-sm-inline">
          <small className="text-secondary">Welcome,</small> {admin?.username}
        </span>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={handleLogout}
          id="logout-btn"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
