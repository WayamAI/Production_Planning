import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import RequireAuth from "@/components/auth/RequireAuth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import MRPRun from "@/pages/MRPRun";
import MaterialRequirements from "@/pages/MaterialRequirements";
import BOMManagement from "@/pages/BOMManagement";
import SafetyStock from "@/pages/SafetyStock";
import StockExhaustionAlerts from "@/pages/StockExhaustionAlerts";
import ProductionSchedule from "@/pages/ProductionSchedule";
import WorkOrders from "@/pages/WorkOrders";
import ProductionConstraints from "@/pages/ProductionConstraints";
import ScheduleUpdates from "@/pages/ScheduleUpdates";
import StockOverview from "@/pages/StockOverview";
import MultiLocationInventory from "@/pages/MultiLocationInventory";
import BatchTracking from "@/pages/BatchTracking";
import InventoryHealth from "@/pages/InventoryHealth";
import PurchasePlanning from "@/pages/PurchasePlanning";
import PurchaseOrders from "@/pages/PurchaseOrders";
import VendorManagement from "@/pages/VendorManagement";
import ProcurementAnalytics from "@/pages/ProcurementAnalytics";
import DemandForecast from "@/pages/DemandForecast";
import ForecastActuals from "@/pages/ForecastActuals";
import SalesOrderIntake from "@/pages/SalesOrderIntake";
import BIDashboard from "@/pages/BIDashboard";
import MaterialCoverage from "@/pages/MaterialCoverage";
import ProcurementReports from "@/pages/ProcurementReports";
import MRPEfficiency from "@/pages/MRPEfficiency";
import CustomReports from "@/pages/CustomReports";
import CompanySettings from "@/pages/CompanySettings";
import UsersRoles from "@/pages/UsersRoles";
import Integrations from "@/pages/Integrations";
import AlertConfig from "@/pages/AlertConfig";
import Traceability from "@/pages/Traceability";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/mrp-run" element={<MRPRun />} />
            <Route path="/material-requirements" element={<MaterialRequirements />} />
            <Route path="/bom-management" element={<BOMManagement />} />
            <Route path="/safety-stock" element={<SafetyStock />} />
            <Route path="/stock-alerts" element={<StockExhaustionAlerts />} />
            <Route path="/production-schedule" element={<ProductionSchedule />} />
            <Route path="/work-orders" element={<WorkOrders />} />
            <Route path="/production-constraints" element={<ProductionConstraints />} />
            <Route path="/schedule-updates" element={<ScheduleUpdates />} />
            <Route path="/stock-overview" element={<StockOverview />} />
            <Route path="/multi-location" element={<MultiLocationInventory />} />
            <Route path="/batch-tracking" element={<BatchTracking />} />
            <Route path="/inventory-health" element={<InventoryHealth />} />
            <Route path="/purchase-planning" element={<PurchasePlanning />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/vendor-management" element={<VendorManagement />} />
            <Route path="/procurement-analytics" element={<ProcurementAnalytics />} />
            <Route path="/demand-forecast" element={<DemandForecast />} />
            <Route path="/forecast-actuals" element={<ForecastActuals />} />
            <Route path="/sales-orders" element={<SalesOrderIntake />} />
            <Route path="/bi-dashboard" element={<BIDashboard />} />
            <Route path="/material-coverage" element={<MaterialCoverage />} />
            <Route path="/procurement-reports" element={<ProcurementReports />} />
            <Route path="/mrp-efficiency" element={<MRPEfficiency />} />
            <Route path="/custom-reports" element={<CustomReports />} />
            <Route path="/company-settings" element={<CompanySettings />} />
            <Route path="/users-roles" element={<UsersRoles />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/alert-config" element={<AlertConfig />} />
            <Route path="/traceability" element={<Traceability />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
