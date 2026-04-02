import ProfileDropdown from "./ProfileDropdown";

/**
 * DashboardLayout - Uber-style layout
 * 
 * Structure:
 * - Top: Full-width header with logo (left) and profile menu (right)
 * - Left: Fixed-width booking/control panel (~380px)
 * - Right: Full-size map area
 *
 * This is purely a layout/wrapper component – it does not touch
 * any business logic or API calls.
 */
function DashboardLayout({ leftPanel, children, title = "Quick Ride" }) {
  return (
    <div className="uber-layout">
      {/* Top Header / Navbar */}
      <header className="uber-header">
        <div className="uber-header-left">
          <img 
            src="/logo-quickride.png" 
            alt="Quick Ride" 
            className="uber-logo"
          />
          <span className="uber-title">{title}</span>
        </div>
        <div className="uber-header-right">
          <ProfileDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="uber-body">
        {/* Left Side Panel - Booking/Controls */}
        <aside className="uber-left-panel">
          <div className="uber-left-panel-content">
            {leftPanel}
          </div>
        </aside>

        {/* Right Side - Map Area */}
        <main className="uber-map-area">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

