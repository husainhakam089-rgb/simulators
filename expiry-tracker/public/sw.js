// عامل الخدمة: يستقبل الإشعار المجمّع، ويبقي الواجهة تعمل دون اتصال.
const CACHE = "expiry-shell-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/manifest.webmanifest"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// شبكة أولاً مع رجوع للمخزن — حتى تعمل الشاشة داخل المخزن بلا إنترنت
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "تنبيه صلاحية", body: "", url: "/admin/alerts", tag: "digest" };
  try { data = { ...data, ...event.data.json() }; } catch { /* نص عادي */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      dir: "rtl",
      lang: "ar",
      tag: data.tag,
      renotify: true,
      badge: "/icons/icon-192.png",
      icon: "/icons/icon-192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin/alerts";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});
