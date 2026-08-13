import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; direction: "up" | "down"; positive?: boolean };
  status?: "green" | "amber" | "red";
  icon?: React.ElementType;
}

const statusColors = {
  green: "border-l-success",
  amber: "border-l-warning",
  red: "border-l-danger",
};

export default function KPICard({ title, value, subtitle, trend, status, icon: Icon }: KPICardProps) {
  return (
    <div className={`bg-card rounded-lg border border-border p-4 shadow-sm border-l-4 ${status ? statusColors[status] : "border-l-border"}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
              trend.positive ? "text-success" : "text-danger"
            }`}>
              {trend.direction === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ml-3">
            <Icon className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
