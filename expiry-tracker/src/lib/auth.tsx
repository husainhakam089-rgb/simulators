import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, phoneToEmail } from "./supabase";

export interface Profile {
  id: string;
  store_id: string;
  name: string;
  phone: string | null;
  role: "admin" | "worker";
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  storeName: string | null;
  loading: boolean;
  signIn: (phone: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) { setProfile(null); setStoreName(null); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("id, store_id, name, phone, role, stores(name)")
        .eq("id", session.user.id)
        .single();
      if (cancelled) return;
      if (data) {
        const { stores, ...rest } = data as unknown as
          Profile & { stores: { name: string } | { name: string }[] | null };
        setProfile(rest);
        setStoreName(Array.isArray(stores) ? stores[0]?.name ?? null : stores?.name ?? null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const value: AuthState = {
    session, profile, storeName, loading,
    async signIn(phone, pin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: phoneToEmail(phone),
        password: pin,
      });
      if (error) {
        throw new Error(
          error.message.includes("Invalid") ? "رقم الهاتف أو الرمز غير صحيح" : error.message,
        );
      }
      setLoading(true);
    },
    async signOut() {
      await supabase.auth.signOut();
      setProfile(null);
      setStoreName(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth خارج AuthProvider");
  return v;
}
