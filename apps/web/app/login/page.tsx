"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [churches, setChurches] = useState<Tenant[]>([]);
  const [isLoadingChurches, setIsLoadingChurches] = useState(true);

  // Fetch available churches on mount
  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/auth/tenants`);
        if (response.ok) {
          const data = await response.json();
          setChurches(data.data || []);
        }
      } catch {
        console.error("Failed to fetch churches");
      } finally {
        setIsLoadingChurches(false);
      }
    };

    fetchChurches();
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, tenantSlug);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-600">CE FirstTouch</CardTitle>
          <CardDescription>Sign in to your admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="church" className="text-sm font-medium text-gray-700">
                Church
              </label>
              <Select
                value={tenantSlug}
                onValueChange={setTenantSlug}
                disabled={isLoadingChurches}
              >
                <SelectTrigger id="church">
                  <SelectValue placeholder={isLoadingChurches ? "Loading churches..." : "Select your church"} />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.slug}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !tenantSlug}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
