"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "./client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível sair. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/auth/logout"
      onSubmit={(event) => {
        event.preventDefault();
        void signOut();
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
      >
        {pending ? "Saindo…" : "Sair"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
