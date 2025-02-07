import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-logo">FPL Pulse</div>
      <div className="navbar-links">
        <a onClick={() => navigate('/')}>Home</a>
        <a onClick={() => navigate('/connect')}>Connect</a>
      </div>
    </nav>
  );
};

export default Navbar;
