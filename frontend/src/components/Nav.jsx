import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../lib/auth';
import PipLogo from './PipLogo';

export default function Nav() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div className="nav-brand">
        <PipLogo size={30} />
        <span className="nav-title">PipLog</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📊 <span>Dashboard</span></NavLink>
        <NavLink to="/trades" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 <span>Journal</span></NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📅 <span>Calendar</span></NavLink>
        <NavLink to="/pip" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🐾 <span>Ask Pip</span></NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👤 <span>Profile</span></NavLink>
      </div>
      <div className="nav-user">
        {user?.avatar && <img src={user.avatar} alt={user.name} className="nav-avatar" />}
        <button onClick={handleLogout} className="btn-ghost nav-logout"><span>Logout</span></button>
      </div>
    </nav>
  );
}
