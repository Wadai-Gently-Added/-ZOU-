// 報-HOU- PWA app.js v0.3.0 base
async function registerSW(){
  if('serviceWorker' in navigator){
    await navigator.serviceWorker.register('sw.js');
  }
}
async function connectPush(){
  const workerUrl = document.getElementById('workerUrl').value;
  const key = document.getElementById('connKey').value;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly:true,
    applicationServerKey: urlBase64ToUint8Array('CHANGE_ME_VAPID_PUBLIC')
  });
  await fetch(workerUrl+'/subscribe',{method:'POST',headers:{'Content-Type':'application/json','x-hou-key':key},body:JSON.stringify({key, subscription:sub})});
  alert('接続したみゅ！ホーム画面追加してれば閉じても届くよ');
}
function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const rawData=atob(base64);return Uint8Array.from([...rawData].map(c=>c.charCodeAt(0)));}

document.getElementById('btnConnect').onclick=()=>{registerSW().then(connectPush)};
document.getElementById('btnTest').onclick=async()=>{
  const workerUrl=document.getElementById('workerUrl').value;
  const key=document.getElementById('connKey').value;
  const when=new Date(Date.now()+60*1000).toISOString();
  await fetch(workerUrl+'/push',{method:'POST',headers:{'Content-Type':'application/json','x-hou-key':key},body:JSON.stringify({key,title:'テスト報-HOU-',body:'1分後の赤通知テスト',when, subscription:null})});
  alert('1分後に通知くるかテストするみゅ');
};
registerSW();
