import { useState } from "react";
import wayamLogo from "@/assets/wayam-logo-dark.svg";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Layers, Factory, Package, ShoppingCart,
  TrendingUp, BarChart3, Settings, ChevronDown, ChevronRight,
  Zap, ClipboardList, Shield, Box, Truck, FileText,
  AlertTriangle, Calendar, Wrench, MapPin, Hash,
  Heart, LineChart, Target, PieChart, FileBarChart,
  Building, Users, Link2, Bell, PanelLeftClose, PanelLeft, Search
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { label: "Planning Overview", path: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Material Planning",
    icon: Layers,
    items: [
      { label: "MRP Run & Results", path: "/mrp-run", icon: Zap },
      { label: "Material Requirements", path: "/material-requirements", icon: ClipboardList },
      { label: "BOM Management", path: "/bom-management", icon: FileText },
      { label: "Safety Stock", path: "/safety-stock", icon: Shield },
      { label: "Stock Exhaustion Alerts", path: "/stock-alerts", icon: AlertTriangle, badge: 7 },
    ],
  },
  {
    label: "Production",
    icon: Factory,
    items: [
      { label: "Production Schedule", path: "/production-schedule", icon: Calendar },
      { label: "Work Orders", path: "/work-orders", icon: Wrench },
      { label: "Constraints", path: "/production-constraints", icon: AlertTriangle, badge: 3 },
      { label: "Schedule Updates", path: "/schedule-updates", icon: Target },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    items: [
      { label: "Stock Overview", path: "/stock-overview", icon: Box },
      { label: "Multi-Location", path: "/multi-location", icon: MapPin },
      { label: "Batch & Serial Tracking", path: "/batch-tracking", icon: Hash },
      { label: "Inventory Health", path: "/inventory-health", icon: Heart },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    items: [
      { label: "Purchase Planning", path: "/purchase-planning", icon: ClipboardList },
      { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart },
      { label: "Vendor Management", path: "/vendor-management", icon: Truck },
      { label: "Procurement Analytics", path: "/procurement-analytics", icon: PieChart },
    ],
  },
  {
    label: "Demand & Forecasting",
    icon: TrendingUp,
    items: [
      { label: "Demand Forecast", path: "/demand-forecast", icon: TrendingUp },
      { label: "Forecast vs. Actuals", path: "/forecast-actuals", icon: LineChart },
      { label: "Sales Order Intake", path: "/sales-orders", icon: FileBarChart },
    ],
  },
  {
    label: "Traceability",
    icon: Search,
    items: [
      { label: "BOM Traceability", path: "/traceability", icon: Search },
    ],
  },
  {
    label: "Analytics & Reports",
    icon: BarChart3,
    items: [
      { label: "BI Dashboard", path: "/bi-dashboard", icon: BarChart3 },
      { label: "Material Coverage", path: "/material-coverage", icon: Shield },
      { label: "Procurement Reports", path: "/procurement-reports", icon: FileText },
      { label: "MRP Efficiency", path: "/mrp-efficiency", icon: Target },
      { label: "Custom Reports", path: "/custom-reports", icon: FileBarChart },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { label: "Company & Warehouses", path: "/company-settings", icon: Building },
      { label: "Users & Roles", path: "/users-roles", icon: Users },
      { label: "Integrations", path: "/integrations", icon: Link2 },
      { label: "Alert Configuration", path: "/alert-config", icon: Bell },
    ],
  },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navSections.forEach((s) => {
      const isActive = s.items.some((i) => i.path === location.pathname);
      initial[s.label] = isActive || s.label === "Dashboard" || s.label === "Material Planning";
    });
    return initial;
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-[width] duration-300 ${
        collapsed ? "w-20" : "w-60"
      } flex-shrink-0 sticky top-0`}
    >
      {/* Logo */}
      <div className="flex flex-col px-4 py-3 border-b border-sidebar-border gap-1">
        <img src={wayamLogo} alt="Wayam AI" className="h-16 object-contain self-center" />
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="text-sm font-bold text-primary-foreground tracking-tight">MatrixOps</div>
            <div className="text-[10px] text-sidebar-foreground leading-none">Material Planning & ERP</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navSections.map((section) => {
          const isOpen = openSections[section.label];
          const SectionIcon = section.icon;
          const hasActivePath = section.items.some((i) => i.path === location.pathname);
          const totalBadge = section.items.reduce((sum, i) => sum + (i.badge || 0), 0);

          return (
            <div key={section.label}>
              <button
                onClick={() => collapsed ? null : toggleSection(section.label)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors duration-150 ${
                  hasActivePath ? "text-accent" : "text-sidebar-section hover:text-sidebar-foreground"
                }`}
              >
                <SectionIcon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    {totalBadge > 0 && (
                      <span className="bg-danger text-danger-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {totalBadge}
                      </span>
                    )}
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </>
                )}
              </button>

              {!collapsed && isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 animate-fade-in">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-all duration-150 group ${
                          isActive
                            ? "bg-sidebar-hover text-accent font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground"
                        }`}
                      >
                        <ItemIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-accent" : ""}`} />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="bg-danger text-danger-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-hover hover:text-primary-foreground transition-colors duration-150 text-xs"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
