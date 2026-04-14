import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span className="nav-icon">🏠</span>
        Home
      </NavLink>
      <NavLink to="/recipes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span className="nav-icon">📖</span>
        Recipes
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span className="nav-icon">👤</span>
        Profile
      </NavLink>
    </nav>
  )
}
