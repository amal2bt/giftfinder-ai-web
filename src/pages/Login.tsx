import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, Mail, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import loginBg from "@/assets/login-bg.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Login failed");
      if (!data.user || data.user.role.toLowerCase() !== "admin") {
        throw new Error("Access denied: admin role required");
      }

      // Store in sessionStorage
      if (data.token) sessionStorage.setItem("auth_token", data.token);
      if (data.refreshToken) sessionStorage.setItem("refresh_token", data.refreshToken);
      sessionStorage.setItem("auth_user", JSON.stringify(data.user));

      toast({
        title: "Login successful!",
        description: "Welcome back to GiftFinder Admin",
      });

      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/90 to-secondary/60 backdrop-blur-sm" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-glow animate-float">
              <Gift className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">🎁 GiftFinder Admin</h1>
          <p className="text-white/90 drop-shadow">Welcome back! Please login to continue</p>
        </div>

        <Card className="glass-card p-8 shadow-soft">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="admin@giftfinder.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-white shadow-soft hover:shadow-glow transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login to Dashboard"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Forgot password? Contact your administrator
        </p>
      </div>
    </div>
  );
};

export default Login;
