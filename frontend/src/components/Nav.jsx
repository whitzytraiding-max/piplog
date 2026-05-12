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
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
        <NavLink to="/trades" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Journal</NavLink>
        <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Calendar</NavLink>
        <NavLink to="/pip" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Ask Pip</NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Profile</NavLink>
      </div>
      <div className="nav-user">
        {user?.avatar && <img src={user.avatar} alt={user.name} className="nav-avatar" />}
        <button onClick={handleLogout} className="btn-ghost">Logout</button>
      </div>
    </nav>
  );
}
