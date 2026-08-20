import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/students', icon: '🎓', label: 'Students' },
  { to: '/subjects', icon: '📚', label: 'Subjects' },
  { to: '/mark-attendance', icon: '✅', label: 'Mark Attendance' },
  { to: '/attendance-history', icon: '📅', label: 'History' },
  { to: '/student-report', icon: '📈', label: 'Reports' },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay d-md-none"
          onClick={onClose}
        ></div>
      )}

      <aside className={`sidebar bg-dark text-white ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-header p-3 border-bottom border-secondary">
          <h6 className="text-uppercase text-secondary mb-0 small fw-bold ls-wide">Navigation</h6>
        </div>
        <nav className="sidebar-nav p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link d-flex align-items-center px-3 py-2 rounded mb-1 text-decoration-none ${
                  isActive ? 'active bg-primary text-white' : 'text-light'
                }`
              }
              onClick={onClose}
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
