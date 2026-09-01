"use client";

import Image from "next/image";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});

type SignInValues = z.infer<typeof signInSchema>;

interface LoginScreenProps {
  onSignIn: () => void;
}

const productBenefits = [
  "One place for documents, routing, and approvals",
  "Clear visibility across every record lifecycle",
  "Built for secure institutional document control",
];

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  function submit(): void {
    onSignIn();
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#17092c] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
        <Image alt="" aria-hidden="true" className="scale-110 object-cover opacity-30 blur-md" fill priority sizes="58vw" src="/login-background.jpg" />
        <div aria-hidden="true" className="absolute top-0 right-0 size-[30rem] bg-violet-500/20 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="flex items-center gap-3"><Image alt="Bureau of the Treasury" className="size-11" height={44} src="/btr-logo.png" width={44} /><span className="text-sm font-semibold tracking-[0.16em] text-violet-100 uppercase">Document Management</span></div>
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-white xl:text-5xl">Document control, brought into focus.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-violet-100/80">A unified workspace for records, routing, approvals, and institutional knowledge.</p>
          <ul className="mt-10 grid gap-4">
            {productBenefits.map((benefit) => <li className="flex items-start gap-3 text-sm leading-6 text-violet-50" key={benefit}><span className="mt-1 grid size-5 shrink-0 place-items-center rounded-sm bg-violet-300 text-violet-950"><ShieldCheck aria-hidden="true" size={14} /></span>{benefit}</li>)}
          </ul>
        </div>

        <div className="relative flex items-center justify-between pt-6 text-xs text-violet-100/70"><span>Bureau of the Treasury</span><span>Saile Document Management System</span></div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-4"><Image alt="Saile" className="h-auto w-50" height={45} src="/saile.png" width={112} /><span aria-hidden="true" className="h-8 w-px bg-slate-200" /></div>
          <div className="mt-10"><p className="text-xs font-bold tracking-[0.13em] text-violet-700 uppercase">Welcome back</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">Sign in to Saile</h2><p className="mt-3 text-sm leading-6 text-slate-500">Use your authorized account to access your document workspace.</p></div>

          <form className="mt-9 grid gap-5" onSubmit={handleSubmit(submit)}>
            <div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="email">Email address</label><div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={17} /><input aria-invalid={Boolean(errors.email)} autoComplete="email" className="h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id="email" placeholder="name@treasury.gov.ph" type="email" {...register("email")} /></div>{errors.email ? <p className="text-xs font-medium text-rose-600" role="alert">{errors.email.message}</p> : null}</div>
            <div className="grid gap-2"><div className="flex items-center justify-between gap-4"><label className="text-sm font-semibold text-slate-800" htmlFor="password">Password</label><button className="text-xs font-semibold text-violet-700 transition hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" type="button">Forgot password?</button></div><div className="relative"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={17} /><input aria-invalid={Boolean(errors.password)} autoComplete="current-password" className="h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pr-11 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id="password" placeholder="Enter your password" type={showPassword ? "text" : "password"} {...register("password")} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}</button></div>{errors.password ? <p className="text-xs font-medium text-rose-600" role="alert">{errors.password.message}</p> : null}</div>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600"><input className="size-4 rounded-sm border-slate-300 accent-violet-700" type="checkbox" {...register("remember")} />Remember this device</label>
            <Button className="mt-1 h-11 rounded-lg text-sm shadow-sm" disabled={isSubmitting} type="submit" variant="default">Sign in</Button>
          </form>

          <div className="mt-9 flex items-start gap-3 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-violet-700" size={16} /><p>Access is restricted to authorized Bureau of the Treasury personnel.</p></div>
          <p className="mt-6 text-center text-xs text-slate-400">Need assistance? Contact your system administrator.</p>
        </div>
      </section>
    </main>
  );
}
