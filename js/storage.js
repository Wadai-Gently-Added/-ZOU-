// js/storage.js — データ保存層 (localStorageの読み書き, グループ/並び順の管理)
// 依存: なし。他の全js(viewer.js/list.js/print.js)より先に読み込むこと。

const STORE_KEY = 'svgViewerSavedItems';
const GROUPS_KEY = 'svgViewerGroups';
const TOPORDER_KEY = 'svgViewerTopOrder';
const GROUP_COLORS = ['#e0625c','#e0b85c','#7ea6e0','#b57ee0','#e07eb8','#8bd17e'];

function getGroups(){
  try{ return JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]'); }
  catch(e){ return []; }
}
function setGroups(arr){
  try{ localStorage.setItem(GROUPS_KEY, JSON.stringify(arr)); }
  catch(e){}
}
function getTopOrder(){
  try{ return JSON.parse(localStorage.getItem(TOPORDER_KEY) || '[]'); }
  catch(e){ return []; }
}
function setTopOrder(arr){
  try{ localStorage.setItem(TOPORDER_KEY, JSON.stringify(arr)); }
  catch(e){}
}
// topOrder = グループ化タブ(グループ本体)とグループ化してない個別アイテムが
// 混ざって並ぶ「Edgeのタブバー」的な並び順。存在しなくなったもの/未登録のものを
// 自動で整合させる(手動で毎回同期しなくて済むように)
function reconcileTopOrder(items, groups){
  let order = getTopOrder();
  const groupIds = new Set(groups.map(g=>g.id));
  const looseItemIds = new Set(items.filter(it=>!it.group).map(it=>it.id));
  order = order.filter(e=>{
    if(e.type === 'group') return groupIds.has(e.id);
    if(e.type === 'item') return looseItemIds.has(e.id);
    return false;
  });
  groups.forEach(g=>{
    if(!order.some(e=>e.type==='group' && e.id===g.id)) order.push({type:'group', id:g.id});
  });
  items.forEach(it=>{
    if(!it.group && !order.some(e=>e.type==='item' && e.id===it.id)) order.push({type:'item', id: it.id});
  });
  setTopOrder(order);
  return order;
}

function getSaved(){
  let arr;
  try{ arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch(e){ arr = []; }
  let changed = false;
  arr.forEach(it=>{
    if(!it.id){ it.id = 's' + Date.now() + Math.random().toString(36).slice(2,7); changed = true; }
    if(!it.modifiedAt){ it.modifiedAt = it.savedAt; changed = true; }
  });
  if(changed){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }catch(e){} }
  return arr;
}
function setSaved(arr){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
  catch(e){ alert('保存に失敗したみゅ（容量オーバーかも）'); }
}

function pruneEmptyGroups(){
  const items = getSaved();
  const groups = getGroups();
  const usedIds = new Set(items.map(it => it.group).filter(Boolean));
  const kept = groups.filter(g => usedIds.has(g.id));
  if(kept.length !== groups.length) setGroups(kept);
}
