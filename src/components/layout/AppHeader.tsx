import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, LogOut, User } from "lucide-react";

const routeLabels: Record<string, string[]> = {
  "/": ["Dashboard", "Planning Overview"],
  "/mrp-run": ["Material Planning", "MRP Run & Results"],
  "/material-requirements": ["Material Planning", "Material Requirements"],
  "/bom-management": ["Material Planning", "BOM Management"],
  "/safety-stock": ["Material Planning", "Safety Stock Management"],
  "/stock-alerts": ["Material Planning", "Stock Exhaustion Alerts"],
  "/production-schedule": ["Production", "Production Schedule"],
  "/work-orders": ["Production", "Work Orders"],
  "/production-constraints": ["Production", "Production Constraints"],
  "/schedule-updates": ["Production", "Schedule Updates"],
  "/stock-overview": ["Inventory", "Stock Overview"],
  "/multi-location": ["Inventory", "Multi-Location Inventory"],
  "/batch-tracking": ["Inventory", "Batch & Serial Tracking"],
  "/inventory-health": ["Inventory", "Inventory Health Scoring"],
  "/purchase-planning": ["Purchase", "Purchase Planning"],
  "/purchase-orders": ["Purchase", "Purchase Orders"],
  "/vendor-management": ["Purchase", "Vendor Management"],
  "/procurement-analytics": ["Purchase", "Procurement Cycle Analytics"],
  "/demand-forecast": ["Forecasting", "Demand Forecast"],
  "/forecast-actuals": ["Forecasting", "Forecast vs. Actuals"],
  "/sales-orders": ["Forecasting", "Sales Order Intake"],
  "/bi-dashboard": ["Analytics", "BI Dashboard"],
  "/material-coverage": ["Analytics", "Material Coverage Monitor"],
  "/procurement-reports": ["Analytics", "Procurement Reports"],
  "/mrp-efficiency": ["Analytics", "MRP Efficiency Metrics"],
  "/custom-reports": ["Analytics", "Custom Reports"],
  "/company-settings": ["Settings", "Company & Warehouses"],
  "/users-roles": ["Settings", "Users & Roles"],
  "/integrations": ["Settings", "Integrations"],
  "/alert-config": ["Settings", "Alert Configuration"],
};

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = routeLabels[location.pathname] || ["Dashboard"];
  const email = localStorage.getItem("matrixops_email") || "guest@matrixops.in";
  const role = localStorage.getItem("matrixops_role") || "admin";

  const handleLogout = () => {
    localStorage.removeItem("matrixops_auth");
    navigate("/login");
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className={i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-1.5 rounded-md hover:bg-secondary transition-colors">
          <Bell className="w-4.5 h-4.5 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium truncate max-w-[160px]">{email}</div>
            <div className="text-[11px] text-muted-foreground capitalize">{role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
