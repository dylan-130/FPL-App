import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">FPL Pulse</div>
            <div className="hamburger-menu" onClick={toggleMenu}>
                ☰
            </div>
            <div className={`navbar-links ${isMenuOpen ? 'show' : 'hide'}`}>
                <a href="/">Home</a>
                <a href="/connect">Connect</a>
            </div>
        </nav>
    );
};

export default Navbar;
