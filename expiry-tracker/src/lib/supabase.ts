import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error("ينقص إعداد VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY في ملف .env");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const FUNCTIONS_URL = `${url}/functions/v1`;
export const SUPABASE_ANON_KEY = key;

/** رقم الهاتف هو اسم الدخول — نحوّله لبريد داخلي كما تفعل الدوال الطرفية */
export function phoneToEmail(phone: string) {
  return `${(phone || "").replace(/\D/g, "")}@expiry.local`;
}

export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "فشل الاتصال بالخادم");
  return json as T;
}
