// src/app/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signInWithEmail } from "./actions";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signInWithEmail(formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-fit px-4 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-orange-500/20 mb-3">
          Milestone
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          Entrar no Milestone
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Acesse sua conta para continuar sua ofensiva de estudos
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium text-center">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              name="email"
              type="email"
              required
              placeholder="seu.email@universidade.edu.br"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Senha
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
        >
          <span>{isLoading ? "Entrando..." : "Entrar"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          Ainda não tem uma conta?{" "}
          <Link
            href="/register"
            className="text-orange-400 hover:text-orange-300 font-bold transition"
          >
            Cadastre-se gratuitamente
          </Link>
        </p>
      </div>
    </div>
  </div>
);
}