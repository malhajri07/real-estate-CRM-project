/**
 * LoginForm.tsx — Mobile OTP Login
 *
 * Two-step flow:
 *   1. Enter mobile number → Send OTP
 *   2. Enter 4-digit OTP → Verify & login
 *
 * Dev mode: OTP is shown in a hint banner (no SMS integration yet)
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onLogin: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    return digits;
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setSendingOtp(true);
    setOtpError(null);
    setDevOtp(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "فشل إرسال رمز التحقق");
        return;
      }

      // Dev mode: capture OTP from response
      if (data.otp) {
        setDevOtp(data.otp);
      }

      setStep("otp");
      setCountdown(60);
      setOtp(["", "", "", ""]);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      setOtpError("خطأ في الاتصال بالخادم");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError(null);

    // Auto-focus next input
    if (digit && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 4) {
        handleVerifyOtp(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs[3].current?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    setVerifying(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "رمز التحقق غير صحيح");
        setOtp(["", "", "", ""]);
        otpRefs[0].current?.focus();
        return;
      }

      // Store token and trigger login flow
      if (data.token) {
        localStorage.setItem("token", data.token);
        // Call onLogin with a special marker — the token is already set
        await onLogin("__otp_login__", data.token, true);
      }
    } catch {
      setOtpError("خطأ في الاتصال بالخادم");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    handleSendOtp();
  };

  const handleBack = () => {
    setStep("phone");
    setOtp(["", "", "", ""]);
    setOtpError(null);
    setDevOtp(null);
  };

  const busy = isLoading || sendingOtp || verifying;

  return (
    <Card className="w-full border-0 rounded-xl shadow-sm bg-card overflow-hidden">
      <CardHeader className="space-y-2 text-center pb-6 pt-8">
        <CardTitle className="text-xl font-bold text-foreground">
          مرحباً بك مجدداً
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {step === "phone" ? "أدخل رقم جوالك للمتابعة" : `أدخل رمز التحقق المرسل إلى ${phone}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-8 pt-0">
        {(error || otpError) && (
          <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-xl">
            <AlertDescription>{otpError || error}</AlertDescription>
          </Alert>
        )}

        {/* ── Step 1: Phone Number ── */}
        {step === "phone" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">رقم الجوال</label>
              <div className="relative">
                <Phone size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="05XXXXXXXX"
                  maxLength={10}
                  className="h-12 ps-10 text-start text-lg tabular-nums tracking-wider border-border rounded-xl"
                  disabled={busy}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && phone.length >= 10) handleSendOtp(); }}
                />
              </div>
              <p className="text-xs text-muted-foreground">سيتم إرسال رمز تحقق من 4 أرقام</p>
            </div>

            <Button
              className="w-full h-12 text-base"
              disabled={busy || phone.length < 10}
              onClick={handleSendOtp}
            >
              {sendingOtp ? (
                <><Spinner size="sm" className="me-2" />جاري الإرسال...</>
              ) : (
                "إرسال رمز التحقق"
              )}
            </Button>
          </div>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === "otp" && (
          <div className="space-y-5">
            {/* Dev mode OTP hint */}
            {devOtp && (
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">رمز التحقق (وضع التطوير)</p>
                <p className="text-2xl font-black text-primary tracking-[0.5em] tabular-nums">{devOtp}</p>
              </div>
            )}

            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3" dir="ltr" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={cn(
                    "h-14 w-14 text-center text-2xl font-black tabular-nums rounded-xl border-2 transition-colors",
                    digit ? "border-primary bg-primary/5" : "border-border",
                    otpError && "border-destructive"
                  )}
                  disabled={busy}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              className="w-full h-12 text-base gap-2"
              disabled={busy || otp.join("").length < 4}
              onClick={() => handleVerifyOtp(otp.join(""))}
            >
              {verifying ? (
                <><Spinner size="sm" className="me-2" />جاري التحقق...</>
              ) : (
                <><ShieldCheck size={18} />تحقق ودخول</>
              )}
            </Button>

            {/* Resend + Back */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleBack} disabled={busy}>
                <ArrowLeft size={14} />
                تغيير الرقم
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={handleResend}
                disabled={busy || countdown > 0}
              >
                <RefreshCw size={14} />
                {countdown > 0 ? `إعادة إرسال (${countdown})` : "إعادة إرسال"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
