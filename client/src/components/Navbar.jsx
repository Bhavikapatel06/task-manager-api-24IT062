import React from 'react';
import { Layers, Server, Database } from 'lucide-react';

export default function Navbar({ serverStatus = 'connected' }) {
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="brand-logo">
          <div className="logo-badge">
            <Layers size={18} />
          </div>
          <div>
            <div className="brand-title">TaskManager Pro</div>
            <div className="brand-subtitle">Practical 6 • React + Node/Express + MongoDB</div>
          </div>
        </div>

        <div className="nav-badges">
          <span className="badge-tag">
            <Database size={12} />
            <span>MongoDB</span>
          </span>
          <span className="badge-tag">
            <Server size={12} />
            <span>Express :5000</span>
          </span>
          <span className={`badge-tag ${serverStatus === 'connected' ? 'live-status' : ''}`}>
            <span className="status-dot"></span>
            <span>{serverStatus === 'connected' ? 'API Online' : 'Connecting...'}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
