import React from 'react';
import { Layers, LogIn, LogOut } from 'lucide-react';

export default function Navbar({ user = null, onOpenAuth, onLogout }) {
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="brand-logo">
          <div className="logo-badge">
            <Layers size={18} />
          </div>
          <div>
            <div className="brand-title">TaskManager Pro</div>
          </div>
        </div>

        <div className="navbar-auth-section">
          {user ? (
            <div className="user-profile-chip">
              <div className="user-avatar-badge" title={user.email}>
                {getInitials(user.name, user.email)}
              </div>
              <div className="user-info-text">
                <span className="user-display-name">{user.name || user.email.split('@')[0]}</span>
                <span className="user-display-email">{user.email}</span>
              </div>
              <button
                type="button"
                className="btn-logout"
                onClick={onLogout}
                title="Log out of TaskManager"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-auth-signin"
              onClick={onOpenAuth}
            >
              <LogIn size={15} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
