import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Topbar } from './Topbar';

export const AppShell = ({ children, onBookAdded }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Desktop Sidebar */}
      <div className="desktop-only-sidebar">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Top Header */}
        <MobileNav />

        {/* Desktop Topbar */}
        <Topbar onBookAdded={onBookAdded} />

        {/* Main Route View */}
        <main style={{ flex: 1, padding: '24px 32px', paddingBottom: '80px', overflowY: 'auto' }} className="main-content-padding">
          {children}
        </main>
      </div>

      {/* Responsive media query styling */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only-sidebar, .topbar-desktop {
            display: none !important;
          }
          .mobile-only-header, .mobile-only-nav {
            display: flex !important;
          }
          .main-content-padding {
            padding: 16px !important;
            padding-bottom: 90px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only-header, .mobile-only-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
