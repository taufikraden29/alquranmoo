// sw.js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
    const title = data.title || "Pengingat Shalat";
    const options = {
        body: data.body || "",
        icon: "/favicon.ico",
        tag: data.tag || "prayer",
        renotify: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
