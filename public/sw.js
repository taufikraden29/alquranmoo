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

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || "/")
    );
});

// For direct showNotification calls from the main app
// The service worker is already set up to handle showNotification calls from the main app
