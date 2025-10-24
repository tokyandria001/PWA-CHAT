self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("chat-pwa-v1").then((cache) => {
      return cache.addAll(["/", "/profile", "/gallery"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
