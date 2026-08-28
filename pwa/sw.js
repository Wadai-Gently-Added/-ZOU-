self.addEventListener('push', event=>{
  const data = event.data ? event.data.json() : {title:'報-HOU-', body:'制限解除だよ'};
  event.waitUntil(self.registration.showNotification(data.title, {body:data.body, icon:'icon-192.png', badge:'icon-192.png'}));
});
self.addEventListener('notificationclick', event=>{event.notification.close(); event.waitUntil(clients.openWindow('/'));});
