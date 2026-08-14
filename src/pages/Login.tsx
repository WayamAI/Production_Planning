import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import wayamLogo from "@/assets/wayam-logo-light.svg";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Demo auth: any email + any password is accepted — no credential check.
  const handleLogin = () => {
    localStorage.setItem("matrixops_auth", "true");
    localStorage.setItem("matrixops_email", email || "guest@matrixops.in");
    localStorage.setItem("matrixops_role", "admin");
    navigate("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <img src={wayamLogo} alt="Wayam AI" className="h-20 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">MatrixOps</h1>
          <p className="text-sm text-muted-foreground mt-1">Material Planning & ERP Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 shadow-lg shadow-primary/5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="any.email@example.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="any password"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-accent text-accent-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Demo environment — any email and password will sign you in
        </p>
      </div>
    </div>
  );
}
