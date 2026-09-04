// تنفيذ Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) على WebCrypto مباشرة.

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    len * 8,
  );
  return new Uint8Array(bits);
}

export interface VapidKeys {
  publicKey: string;   // base64url، النقطة غير المضغوطة (٦٥ بايت)
  privateKey: string;  // base64url، d بطول ٣٢ بايت
  subject: string;     // mailto:...
}

async function importVapidPrivate(keys: VapidKeys) {
  const pub = b64urlToBytes(keys.publicKey);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: keys.privateKey,
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    ext: true,
  };
  return await crypto.subtle.importKey(
    "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
}

async function vapidHeader(endpoint: string, keys: VapidKeys): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(enc.encode(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: keys.subject,
  })));
  const unsigned = `${header}.${payload}`;
  const pk = await importVapidPrivate(keys);
  const sig = new Uint8Array(await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, pk, enc.encode(unsigned),
  ));
  return `vapid t=${unsigned}.${bytesToB64url(sig)}, k=${keys.publicKey}`;
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function encryptPayload(sub: PushSubscription, payload: string) {
  const uaPublic = b64urlToBytes(sub.p256dh);   // ٦٥ بايت
  const authSecret = b64urlToBytes(sub.auth);   // ١٦ بايت

  const asKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],
  ) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));

  const uaKey = await crypto.subtle.importKey(
    "raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, [],
  );
  const shared = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "ECDH", public: uaKey }, asKeys.privateKey, 256,
  ));

  const keyInfo = concat(enc.encode("WebPush: info"), new Uint8Array([0]), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, shared, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, concat(enc.encode("Content-Encoding: aes128gcm"), new Uint8Array([0])), 16);
  const nonce = await hkdf(salt, ikm, concat(enc.encode("Content-Encoding: nonce"), new Uint8Array([0])), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const plaintext = concat(enc.encode(payload), new Uint8Array([2])); // فاصل الحشو
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce }, aesKey, plaintext,
  ));

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

export async function sendPush(
  sub: PushSubscription,
  payload: string,
  keys: VapidKeys,
  ttl = 86400,
): Promise<{ ok: boolean; status: number; body?: string }> {
  const body = await encryptPayload(sub, payload);
  const auth = await vapidHeader(sub.endpoint, keys);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttl),
    },
    body,
  });
  return {
    ok: res.ok,
    status: res.status,
    body: res.ok ? undefined : await res.text().catch(() => undefined),
  };
}
