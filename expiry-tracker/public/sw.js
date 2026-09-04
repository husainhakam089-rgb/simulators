// عامل الخدمة: يستقبل الإشعار المجمّع، ويبقي الواجهة تعمل دون اتصال.
const CACHE = "expiry-shell-v2";
const OCR_CACHE = "expiry-ocr-v1";   // ملفات محرك القراءة: كبيرة وثابتة

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/manifest.webmanifest"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE && k !== OCR_CACHE).map((k) => caches.delete(k)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;

  // ملفات محرك القراءة وملفات البناء المبصومة لا تتغيّر أبداً:
  // مخزن أولاً، فلا تُنزَّل الميغابايتات إلا مرة واحدة على الجهاز.
  if (path.startsWith("/ocr/") || path.startsWith("/assets/")) {
    const store = path.startsWith("/ocr/") ? OCR_CACHE : CACHE;
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(store).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })),
    );
    return;
  }

  // ما عدا ذلك: شبكة أولاً مع رجوع للمخزن، حتى تعمل الشاشة داخل المخزن بلا إنترنت
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
