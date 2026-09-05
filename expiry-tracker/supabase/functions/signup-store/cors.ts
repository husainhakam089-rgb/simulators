export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** رقم الهاتف هو اسم الدخول؛ نحوّله لبريد داخلي لأن Supabase يطلب بريداً */
export function phoneToEmail(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  return `${digits}@expiry.local`;
}

export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}
