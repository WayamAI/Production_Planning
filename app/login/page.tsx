import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="brand-gradient flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="justify-items-center space-y-4 text-center">
          <Logo height={40} />
          <CardTitle>Sign in to Production Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
