// 報-HOU- content.js v0.3.0 + v0.4.0
// 各AIのストリーミング終了をMutationObserverで検知
let lastText = "";
let timer = null;
const observer = new MutationObserver(()=>{
  const body = document.body.innerText;
  if (body.length > lastText.length + 50) {
    clearTimeout(timer);
    timer = setTimeout(()=>{
      // ストリーミングが止まったら返信完了とみなす
      chrome.storage.local.get(["hou_worker_url","hou_key"], ({hou_worker_url, hou_key})=>{
        if(!hou_worker_url) return;
        fetch(hou_worker_url+"/push", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-hou-key":hou_key},
          body: JSON.stringify({key:"default", title:"青: AI返信完了", body: document.title.slice(0,80), when:null})
        });
      });
      lastText = body;
    }, 3000);
  }
});
observer.observe(document.body, {childList:true, subtree:true, characterData:true});
console.log("[報-HOU-] 返信検知開始");
