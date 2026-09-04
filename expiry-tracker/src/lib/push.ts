import { supabase, callFunction } from "./supabase";

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && !!VAPID;
}

export async function currentPushState(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function enablePush(storeId: string, userId: string) {
  if (!pushSupported()) throw new Error("متصفحك لا يدعم الإشعارات");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("لم يُسمح بالإشعارات");

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID!),
  });

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
  if (!json.endpoint || !json.keys) throw new Error("تعذّر تسجيل الاشتراك");

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    store_id: storeId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth_key: json.keys.auth,
  }, { onConflict: "endpoint" });
  if (error) throw new Error(error.message);
}

export async function sendTestPush() {
  return callFunction<{ ok: boolean; sent: number }>("send-digest-push", { mode: "test" });
}
