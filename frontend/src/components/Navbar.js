import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaUserCircle, FaSignOutAlt, FaHome, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeNavbar = () => {
    setExpanded(false);
  };

  return (
    <BootstrapNavbar 
      expand="lg" 
      fixed="top" 
      className="shadow-sm py-2" 
      data-theme={theme} 
      expanded={expanded}
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold">
          <span className="me-2">✓</span>
          Task Manager
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)}
        />
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <Nav.Link 
                as={Link} 
                to="/" 
                active={location.pathname === '/'} 
                onClick={closeNavbar}
                className="d-flex align-items-center"
              >
                <FaHome className="me-2" /> Dashboard
              </Nav.Link>
            )}
          </Nav>
          
          <Nav className="ms-auto d-flex align-items-lg-center">
            <Button 
              variant="outline-secondary" 
              onClick={toggleTheme} 
              className="me-2 my-2 my-lg-0 d-flex align-items-center justify-content-center"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
              <span className="d-lg-none ms-2">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </Button>
            
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="outline-primary" 
                  id="dropdown-user" 
                  className="d-flex align-items-center"
                >
                  <FaUserCircle className="me-2" /> Account
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item 
                    onClick={handleLogout}
                    className="text-danger d-flex align-items-center"
                  >
                    <FaSignOutAlt className="me-2" /> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  active={location.pathname === '/login'}
                  onClick={closeNavbar}
                  className="my-2 my-lg-0 me-lg-2 d-flex align-items-center"
                >
                  <FaSignInAlt className="me-2" /> Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register" 
                  active={location.pathname === '/register'}
                  onClick={closeNavbar}
                  className="my-2 my-lg-0 d-flex align-items-center"
                >
                  <FaUserPlus className="me-2" /> Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;