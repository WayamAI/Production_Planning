interface StatusBadgeProps {
  status: "green" | "amber" | "red" | "blue" | "gray";
  label: string;
}

const styles = {
  green: "bg-success/10 text-success",
  amber: "bg-warning/10 text-warning",
  red: "bg-danger/10 text-danger",
  blue: "bg-accent/10 text-accent",
  gray: "bg-muted text-muted-foreground",
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status]}`}>
      {label}
    </span>
  );
}
