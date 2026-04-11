"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPostAuth } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type LoginFormProps = {
  /** หลังล็อกอินสำเร็จ — ต้องเป็นพาธภายในเว็บ (เริ่มด้วย / ไม่ใช่ //) */
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPostAuth("/app/auth/login", { email, password });
      setAuth(data.accessToken, data.user);
      const target =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/dashboard";
      router.push(target);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md box-shadow-card" data-testid="login-form">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
        <CardDescription>ใช้อีเมลและรหัสผ่านที่ลงทะเบียนกับ</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <FormErrorBanner data-testid="login-error">{error}</FormErrorBanner>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-bold">
              อีเมล
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="login-input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-bold">
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="login-input-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="login-submit"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline hover:text-primary-dim font-bold"
          >
            ลงทะเบียน
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
