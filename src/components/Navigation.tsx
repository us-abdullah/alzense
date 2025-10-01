import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, History, Compass, Download } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Map', icon: Map },
    { path: '/history', label: 'History', icon: History },
    { path: '/routes', label: 'Routes', icon: Compass },
    { path: '/export', label: 'Export', icon: Download }
  ];

  return (
    <nav className="nav">
      <div className="nav-content">
        <div className="nav-title">
          <span>🧠</span>
          Alzense
        </div>
        <ul className="nav-links">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              >
                <Icon size={20} style={{ marginRight: '0.5rem' }} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
