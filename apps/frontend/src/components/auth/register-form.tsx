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

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPostAuth("/app/auth/register", {
        displayName,
        email,
        password,
      });
      setAuth(data.accessToken, data.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "ลงทะเบียนไม่สำเร็จ ลองใหม่อีกครั้ง";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className="w-full max-w-md box-shadow-card"
      data-testid="register-form"
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">สร้างบัญชี</CardTitle>
        <CardDescription>กรอกข้อมูลเพื่อลงทะเบียนผู้ใช้ใหม่</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <FormErrorBanner data-testid="register-error">
              {error}
            </FormErrorBanner>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              ชื่อที่แสดง
            </Label>
            <Input
              id="name"
              name="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              data-testid="register-input-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
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
              data-testid="register-input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              data-testid="register-input-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="register-submit"
          >
            {loading ? "กำลังสร้างบัญชี…" : "ลงทะเบียน"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-center text-sm text-muted-foreground">
          มีบัญชีแล้ว?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline hover:text-primary-dim font-medium"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
