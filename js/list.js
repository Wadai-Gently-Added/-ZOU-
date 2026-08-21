// js/list.js — マイSVG一覧の描画、グループ管理、ドラッグ並べ替え、右クリック(長押し)メニュー
// 依存: js/storage.js, js/viewer.js(loadContent/guardedLoad/isDirty等), js/print.js(印刷系関数)
// 最後に読み込むこと(showContextMenu等がviewer.js/print.jsのcontextmenuハンドラから参照される)

const listSheet = document.getElementById('listSheet');
const listBackdrop = document.getElementById('listBackdrop');

function commitOrder(container){
  const rows = Array.from(container.children);
  const arr = getSaved();
  const groupId = container.dataset.group || null;
  const byId = {};
  arr.forEach(it => byId[it.id] = it);
  const thisGroupNew = rows.map(r => byId[r.dataset.itemId]).filter(Boolean);
  const others = arr.filter(it => (it.group||null) !== groupId);
  setSaved([...others, ...thisGroupNew]);
  renderList();
}

function attachTopLevelDrag(block){
  const handle = block.querySelector('.group-handle') || block.querySelector('.handle');
  if(!handle) return;
  handle.addEventListener('pointerdown', (e)=>{
    if(e.button !== 0) return;
    e.preventDefault();
    const listEl = document.getElementById('savedList');
    let startY = e.clientY;
    block.classList.add('dragging-block');
    block.style.zIndex = 6;
    const isGroupBlock = block.classList.contains('group-block');
    let hoverGroupBlock = null;

    function onMove(ev){
      const dy = ev.clientY - startY;
      block.style.transform = `translateY(${dy}px)`;

      if(!isGroupBlock){
        // 個別アイテムをグループの上まで持っていったらそこにポトンと入れられる
        const groupBlocks = Array.from(listEl.querySelectorAll('.group-block'));
        let matched = null;
        for(const gb of groupBlocks){
          const r = gb.getBoundingClientRect();
          if(ev.clientY >= r.top && ev.clientY <= r.bottom){ matched = gb; break; }
        }
        if(hoverGroupBlock && hoverGroupBlock !== matched) hoverGroupBlock.classList.remove('drop-target');
        if(matched) matched.classList.add('drop-target');
        hoverGroupBlock = matched;
        if(hoverGroupBlock) return;
      }

      const blocks = Array.from(listEl.children).filter(el => el.classList.contains('toplevel-block'));
      const idx = blocks.indexOf(block);
      const rect = block.getBoundingClientRect();
      const centerY = rect.top + rect.height/2;
      for(let k=0;k<blocks.length;k++){
        if(blocks[k] === block) continue;
        const r2 = blocks[k].getBoundingClientRect();
        const otherCenter = r2.top + r2.height/2;
        if(k < idx && centerY < otherCenter){
          listEl.insertBefore(block, blocks[k]);
          startY = ev.clientY; block.style.transform = 'translateY(0px)'; break;
        }
        if(k > idx && centerY > otherCenter){
          listEl.insertBefore(block, blocks[k].nextSibling);
          startY = ev.clientY; block.style.transform = 'translateY(0px)'; break;
        }
      }
    }
    function onUp(){
      block.classList.remove('dragging-block');
      block.style.transform = '';
      block.style.zIndex = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      if(hoverGroupBlock){
        hoverGroupBlock.classList.remove('drop-target');
        const targetGroupId = hoverGroupBlock.dataset.entryId;
        const itemId = block.dataset.entryId;
        const cur = getSaved();
        const it = cur.find(x => x.id === itemId);
        if(it){ it.group = targetGroupId; setSaved(cur); }
        renderList();
        return;
      }

      const blocks = Array.from(listEl.children).filter(el => el.classList.contains('toplevel-block'));
      const newOrder = blocks.map(b => ({ type: b.dataset.entryType, id: b.dataset.entryId }));
      setTopOrder(newOrder);
      renderList();
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

function attachDrag(row){
  const handle = row.querySelector('.handle');
  handle.addEventListener('pointerdown', (e)=>{
    if(e.button !== 0) return;
    e.preventDefault();
    const container = row.parentElement;
    const ownBlock = container.parentElement; // .group-block
    const ownGroupId = container.dataset.group || null;
    const listEl = document.getElementById('savedList');
    let startY = e.clientY;
    let lastY = e.clientY;
    row.classList.add('dragging');
    row.style.zIndex = 6;
    let hoverTarget = null;

    function onMove(ev){
      lastY = ev.clientY;
      const dy = ev.clientY - startY;
      row.style.transform = `translateY(${dy}px)`;

      // 別のグループの上まで来てたらそこにドロップできる状態にする
      const blocks = Array.from(listEl.querySelectorAll('.group-block'));
      let matched = null;
      for(const b of blocks){
        if(b.dataset.entryId === ownGroupId) continue;
        const r = b.getBoundingClientRect();
        if(ev.clientY >= r.top && ev.clientY <= r.bottom){ matched = b; break; }
      }
      if(hoverTarget && hoverTarget !== matched) hoverTarget.classList.remove('drop-target');
      if(matched) matched.classList.add('drop-target');
      hoverTarget = matched;

      if(hoverTarget) return; // 別グループに乗ってる間は並べ替え計算はしない

      const rows = Array.from(container.children);
      const idx = rows.indexOf(row);
      const rowRect = row.getBoundingClientRect();
      const centerY = rowRect.top + rowRect.height/2;
      for(let k=0;k<rows.length;k++){
        if(rows[k] === row) continue;
        if(rows[k].classList.contains('pinned')) continue;
        const r2 = rows[k].getBoundingClientRect();
        const otherCenter = r2.top + r2.height/2;
        if(k < idx && centerY < otherCenter){
          container.insertBefore(row, rows[k]);
          startY = ev.clientY;
          row.style.transform = 'translateY(0px)';
          break;
        }
        if(k > idx && centerY > otherCenter){
          container.insertBefore(row, rows[k].nextSibling);
          startY = ev.clientY;
          row.style.transform = 'translateY(0px)';
          break;
        }
      }
    }
    function onUp(){
      row.classList.remove('dragging');
      row.style.transform = '';
      row.style.zIndex = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      if(hoverTarget){
        hoverTarget.classList.remove('drop-target');
        const groupId = hoverTarget.dataset.entryId || null;
        const cur = getSaved();
        const it = cur.find(x => x.id === row.dataset.itemId);
        if(it) it.group = groupId;
        setSaved(cur);
        renderList();
        return;
      }

      // 自分のグループブロックの外まで持ち出したらグループ解除
      const ownRect = ownBlock.getBoundingClientRect();
      if(lastY < ownRect.top - 4 || lastY > ownRect.bottom + 4){
        const cur = getSaved();
        const it = cur.find(x => x.id === row.dataset.itemId);
        if(it) it.group = null;
        setSaved(cur);
        renderList();
        return;
      }

      commitOrder(container);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

// 直前に登録した「メニュー外クリックで閉じる」リスナーへの参照。closeContextMenu()を
// メニュー項目クリック経由(showContextMenuを介さない)で呼んだ場合に、このリスナーが
// 消費されずdocumentに残り続けることがあり、次回メニューを開いた瞬間その場でこのリスナーが
// 発火して即座に閉じてしまう不具合があった(連打すると2回目以降メニューが開かなくなる原因)。
// closeContextMenu()の中で必ず明示的に除去することで解消する。
let ctxOutsideClickHandler = null;
function closeContextMenu(){
  const el = document.getElementById('ctxMenu');
  if(el) el.remove();
  document.querySelectorAll('.ctx-submenu').forEach(el2 => el2.remove());
  if(ctxOutsideClickHandler){
    document.removeEventListener('click', ctxOutsideClickHandler);
    ctxOutsideClickHandler = null;
  }
}

function positionFlyout(el, anchorRect){
  const fw = el.offsetWidth, fh = el.offsetHeight;
  let left = anchorRect.right + 2;
  if(left + fw > window.innerWidth) left = anchorRect.left - fw - 2;
  let top = anchorRect.top;
  if(top + fh > window.innerHeight) top = window.innerHeight - fh - 8;
  if(top < 8) top = 8;
  el.style.left = left + 'px';
  el.style.top = top + 'px';
}

function showContextMenu(x, y, options){
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.id = 'ctxMenu';

  options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'ctx-menu-item';

    if(opt.submenu){
      btn.innerHTML = `<span>${opt.label}</span><span class="ctx-arrow">▶</span>`;
      let flyout = null;
      let hideTimer = null;

      function buildFlyout(){
        const f = document.createElement('div');
        f.className = 'ctx-menu ctx-submenu';
        opt.submenu.forEach(sub=>{
          const sbtn = document.createElement('button');
          sbtn.className = 'ctx-menu-item';
          sbtn.textContent = sub.label;
          sbtn.onclick = (e)=>{
            e.stopPropagation();
            sub.onClick();
            closeContextMenu();
          };
          f.appendChild(sbtn);
        });
        document.body.appendChild(f);
        positionFlyout(f, btn.getBoundingClientRect());
        f.addEventListener('mouseenter', ()=>{ if(hideTimer) clearTimeout(hideTimer); });
        f.addEventListener('mouseleave', scheduleHide);
        return f;
      }
      function scheduleHide(){
        hideTimer = setTimeout(()=>{
          if(flyout){ flyout.remove(); flyout = null; }
        }, 220);
      }
      btn.addEventListener('mouseenter', ()=>{
        if(hideTimer) clearTimeout(hideTimer);
        if(!flyout) flyout = buildFlyout();
      });
      btn.addEventListener('mouseleave', scheduleHide);
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(flyout){ flyout.remove(); flyout = null; }
        else flyout = buildFlyout();
      });
    } else {
      btn.textContent = opt.label;
      btn.onclick = (e)=>{
        e.stopPropagation();
        opt.onClick();
        closeContextMenu();
      };
    }
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = x, top = y;
  if(left + mw > window.innerWidth) left = window.innerWidth - mw - 8;
  if(top + mh > window.innerHeight) top = window.innerHeight - mh - 8;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  setTimeout(()=>{
    ctxOutsideClickHandler = closeContextMenu;
    document.addEventListener('click', ctxOutsideClickHandler, { once:true });
  }, 0);
}

function pickGroupColor(callback){
  const backdrop = document.createElement('div');
  backdrop.className = 'color-pick-backdrop';
  const panel = document.createElement('div');
  panel.className = 'color-pick-panel';
  const title = document.createElement('div');
  title.className = 'color-pick-title';
  title.textContent = STR.common.groupColorPickTitle;
  panel.appendChild(title);
  const swatchWrap = document.createElement('div');
  swatchWrap.className = 'color-swatch-wrap';
  GROUP_COLORS.forEach(c=>{
    const sw = document.createElement('button');
    sw.className = 'color-swatch';
    sw.style.background = c;
    sw.onclick = (e)=>{
      e.stopPropagation();
      document.body.removeChild(backdrop);
      callback(c);
    };
    swatchWrap.appendChild(sw);
  });
  panel.appendChild(swatchWrap);
  const cancel = document.createElement('button');
  cancel.className = 'color-pick-cancel';
  cancel.textContent = STR.common.cancel;
  cancel.onclick = ()=> document.body.removeChild(backdrop);
  panel.appendChild(cancel);
  backdrop.appendChild(panel);
  backdrop.onclick = (e)=>{ if(e.target === backdrop) document.body.removeChild(backdrop); };
  document.body.appendChild(backdrop);
}

// 注: ピン留め中のアイテムも handle からドラッグしてグループ移動できる
// (並べ替え順はピンが常に先頭に来るよう毎回ソートされるので位置は動かないが、
//  グループ間の移動は反映される)
function buildItemRow(item, i, groups, isTopLevel){
  const row = document.createElement('div');
  row.className = 'saved-item' + (item.pinned ? ' pinned' : '');
  row.dataset.origIdx = i;
  row.dataset.itemId = item.id;
  row.dataset.group = item.group || '';
  const d = new Date(item.savedAt);
  const inSelectMode = printSelectActive;
  const handleHtml = inSelectMode
    ? `<input type="checkbox" class="print-select-box" id="printSelect-${item.id}" name="printSelect-${item.id}" ${printSelectedIds.has(item.id) ? 'checked' : ''}>`
    : `<span class="handle" title="${STR.common.dragHandleTitle}">⠿</span>`;
  const options = [`<option value="">${STR.common.noGroupOption}</option>`]
    .concat(groups.map(g => `<option value="${g.id}" ${item.group===g.id?'selected':''}>${g.name}</option>`));
  const thumbHtml = currentMode === 'html' ? '<span style="font-size:20px;">📄</span>' : item.content;
  row.innerHTML = `
    ${handleHtml}
    <div class="thumb">${thumbHtml}</div>
    <div class="meta">
      <div class="name">${item.name}</div>
      <div class="date">${d.toLocaleDateString('ja-JP')} ${d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>
    <select class="group-select" id="groupSelect-${item.id}" name="groupSelect-${item.id}">${options.join('')}</select>
    <button class="pin" title="${STR.common.pinTitle}">${item.pinned ? '📌' : '📍'}</button>
  `;
  if(inSelectMode){
    const box = row.querySelector('.print-select-box');
    box.addEventListener('click', ev=> ev.stopPropagation());
    box.addEventListener('change', ()=>{
      if(box.checked) printSelectedIds.add(item.id); else printSelectedIds.delete(item.id);
      updatePrintSelectBar();
    });
  } else {
    // ドラッグ用ハンドルのクリックは行全体の読込に伝播させない(ドラッグ操作と誤反応しないように)
    row.querySelector('.handle').addEventListener('click', ev=> ev.stopPropagation());
  }
  // Edgeのタブのように行全体のどこをクリックしても読み込まれるようにする
  // (以前はサムネイル画像を直接クリックしないと反映されず、動線として分かりにくかった)
  row.addEventListener('click', ()=>{
    if(Date.now() < suppressClickUntil) return;
    if(inSelectMode){
      const box = row.querySelector('.print-select-box');
      box.checked = !box.checked;
      box.dispatchEvent(new Event('change'));
      return;
    }
    guardedLoad(()=>{
      loadContent(item.content, item.name);
      isDirty = false;
      setDraftDirty(currentMode, false); // マイSVG/マイHTMLと同じ内容なので「未登録」扱いを外す
      renderList();
    });
  });
  row.querySelector('.group-select').addEventListener('click', ev=> ev.stopPropagation());
  row.querySelector('.group-select').addEventListener('change', (ev)=>{
    const cur = getSaved();
    const it = cur.find(x=>x.id===item.id);
    if(it) it.group = ev.target.value || null;
    setSaved(cur);
    renderList();
  });
  row.addEventListener('contextmenu', (ev)=>{
    ev.preventDefault();
    suppressClickUntil = Date.now() + 500;
    const allGroups = getGroups();
    const opts = [];
    opts.push({ label: STR.common.itemMenuRename, onClick: ()=>{
      const newName = prompt(STR.common.itemRenamePrompt, item.name);
      if(newName === null || !newName.trim()) return;
      const cur = getSaved();
      const it = cur.find(x=>x.id===item.id);
      if(it){ it.name = newName.trim(); it.modifiedAt = new Date().toISOString(); }
      setSaved(cur);
      renderList();
    }});
    opts.push({ label: STR.common.itemMenuDuplicate, onClick: ()=>{
      // Edgeのタブ複製のように、同じグループ内にそのままコピーを1件追加する。
      // カスタマイズの土台としてすぐ使えるよう、名前だけ「(コピー)」を付けて区別する
      const cur = getSaved();
      const copy = {
        id: 's' + Date.now() + Math.random().toString(36).slice(2,7),
        name: item.name + STR.common.itemDuplicateSuffix,
        content: item.content,
        savedAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        pinned: false,
        group: item.group || null
      };
      const idx = cur.findIndex(x=>x.id===item.id);
      cur.splice(idx + 1, 0, copy);
      setSaved(cur);
      const order = getTopOrder();
      if(!copy.group){
        const pos = order.findIndex(e=> e.type==='item' && e.id===item.id);
        order.splice(pos + 1, 0, { type:'item', id: copy.id });
        setTopOrder(order);
      }
      renderList();
    }});
    opts.push({ label: STR.common.itemMenuPrint, submenu: printSubmenuOptions((mode)=>{
      openSinglePrint(item.name, item.content, mode, { savedAt: item.savedAt, modifiedAt: item.modifiedAt });
    })});
    opts.push({ label: STR.common.groupMenuSelectPrint, onClick: ()=>{
      enterPrintSelectMode();
    }});
    opts.push({ label: STR.common.itemMenuNewGroup, onClick: ()=>{
      const name = prompt(STR.common.groupNamePrompt, STR.common.newGroupDefaultName);
      if(!name || !name.trim()) return;
      pickGroupColor((color)=>{
        const groups = getGroups();
        const newGroup = { id: 'g' + Date.now(), name: name.trim(), color, collapsed:false };
        groups.push(newGroup);
        setGroups(groups);
        const cur = getSaved();
        const it = cur.find(x=>x.id===item.id);
        if(it) it.group = newGroup.id;
        setSaved(cur);
        renderList();
      });
    }});
    allGroups.forEach(g=>{
      if((item.group||null) !== g.id){
        opts.push({ label: STR.common.itemMenuMoveToGroup(g.name), onClick: ()=>{
          const cur = getSaved(); const it = cur.find(x=>x.id===item.id); if(it) it.group = g.id; setSaved(cur); renderList();
        }});
      }
    });
    if(item.group){
      opts.push({ label: STR.common.itemMenuUngroup, onClick: ()=>{
        const cur = getSaved(); const it = cur.find(x=>x.id===item.id); if(it) it.group = null; setSaved(cur); renderList();
      }});
    }
    opts.push({ label: STR.common.itemMenuDelete, onClick: ()=>{
      if(!confirm(STR.common.itemDeleteConfirm(item.name))) return;
      const cur = getSaved().filter(x=>x.id!==item.id);
      setSaved(cur);
      renderList();
    }});
    showContextMenu(ev.clientX, ev.clientY, opts);
  });
  row.querySelector('.pin').addEventListener('click', (ev)=>{
    ev.stopPropagation();
    const cur = getSaved();
    const it = cur.find(x=>x.id===item.id);
    if(it) it.pinned = !it.pinned;
    setSaved(cur);
    renderList();
  });
  // 修正: 以前は pinned なアイテムはドラッグ不可(グループ移動もできなかった)だったが、
  // ピン留めは「並び順の固定」のためのものであり、グループ移動まで封じる必要はないため解除。
  if(!isTopLevel && !inSelectMode) attachDrag(row);
  return row;
}

function renderList(){
  pruneEmptyGroups();
  const items = getSaved();
  const groups = getGroups();
  const listEl = document.getElementById('savedList');
  const emptyEl = document.getElementById('savedEmpty');
  listEl.innerHTML = '';
  if(items.length === 0){ emptyEl.style.display='block'; return; }
  emptyEl.style.display='none';
  const order = reconcileTopOrder(items, groups);

  order.forEach(entry=>{
    if(entry.type === 'group'){
      const g = groups.find(x=>x.id===entry.id);
      if(!g) return;

      const block = document.createElement('div');
      block.className = 'toplevel-block group-block';
      block.dataset.entryType = 'group';
      block.dataset.entryId = g.id;
      block.style.borderLeftColor = g.color;
      block.style.background = g.color + '14';

      const header = document.createElement('div');
      header.className = 'group-header';
      header.dataset.groupId = g.id;
      header.innerHTML = `
        <span class="group-handle" title="${STR.common.dragHandleTitleGroup}">⠿</span>
        <button class="group-toggle">${g.collapsed ? '▶' : '▼'}</button>
        <span class="group-name">${g.name}</span>
      `;
      block.appendChild(header);

      header.querySelector('.group-toggle').onclick = ()=>{
        g.collapsed = !g.collapsed;
        setGroups(groups);
        renderList();
      };
      header.addEventListener('contextmenu', (ev)=>{
        ev.preventDefault();
        suppressClickUntil = Date.now() + 500;
        showContextMenu(ev.clientX, ev.clientY, [
          { label: STR.common.itemMenuRename, onClick: ()=>{
            const newName = prompt(STR.common.groupRenamePrompt, g.name);
            if(newName && newName.trim()){ g.name = newName.trim(); setGroups(groups); renderList(); }
          }},
          { label: STR.common.groupMenuColor, onClick: ()=>{
            pickGroupColor((color)=>{
              g.color = color; setGroups(groups); renderList();
            });
          }},
          { label: STR.common.itemMenuPrint, submenu: printSubmenuOptions((mode)=>{
            closeList();
            openGroupPrint(g.id, g.name, mode);
          })},
          { label: STR.common.groupMenuSelectPrint, onClick: ()=>{
            enterPrintSelectMode();
          }},
          { label: STR.common.groupMenuDelete, onClick: ()=>{
            if(!confirm(STR.common.groupDeleteConfirm(g.name, STR.mode().groupItemsNoun))) return;
            const cur = getSaved();
            cur.forEach(it=>{ if(it.group === g.id) it.group = null; });
            setSaved(cur);
            setGroups(groups.filter(x=>x.id!==g.id));
            renderList();
          }}
        ]);
      });

      const body = document.createElement('div');
      body.className = 'group-body';
      body.dataset.group = g.id;
      if(g.collapsed) body.style.display = 'none';
      block.appendChild(body);

      try{
        const itemsWithIdx = items
          .map((item,i)=>({item,i}))
          .filter(o => (o.item.group||null) === g.id)
          .sort((a,b)=> (b.item.pinned?1:0) - (a.item.pinned?1:0));
        itemsWithIdx.forEach(({item,i})=>{
          body.appendChild(buildItemRow(item, i, groups, false));
        });
      }catch(err){
        console.error('group item render failed', err);
      }

      attachTopLevelDrag(block);
      listEl.appendChild(block);

    } else if(entry.type === 'item'){
      const idx = items.findIndex(it => it.id === entry.id);
      if(idx === -1) return;
      const item = items[idx];

      const block = document.createElement('div');
      block.className = 'toplevel-block item-block';
      block.dataset.entryType = 'item';
      block.dataset.entryId = item.id;
      block.appendChild(buildItemRow(item, idx, groups, true));
      attachTopLevelDrag(block);
      listEl.appendChild(block);
    }
  });
  updatePrintSelectBar();
}

document.getElementById('btnPrintSelectCancel').onclick = exitPrintSelectMode;
document.getElementById('btnPrintSelectGo').onclick = (ev)=>{
  try{
    if(printSelectedIds.size === 0){ alert(STR.common.noSelection); return; }
    // printSelectedIds はSetなので挿入順=チェックした順を保っている。
    // 印刷順もチェックした順にしたいので、この順のままitemsを組み立てる
    const byId = {};
    getSaved().forEach(it => byId[it.id] = it);
    const items = Array.from(printSelectedIds).map(id => byId[id]).filter(Boolean);
    showPrintFlyoutFromButton(ev.currentTarget, (mode)=>{
      exitPrintSelectMode();
      closeList();
      openMultiPrint(items, mode, STR.common.selectedItemsTitle);
    });
  }catch(err){
    alert(STR.common.printMenuError(err && err.message ? err.message : err));
    console.error('btnPrintSelectGo error', err);
  }
};
function showPrintFlyoutFromButton(btnEl, onPick){
  // 直前に閉じ損なったメニューが残ってて新規作成を邪魔してないか念のため掃除
  closeContextMenu();
  const r = btnEl.getBoundingClientRect();
  showContextMenu(r.left, r.top - 8, printSubmenuOptions(onPick));
}

document.getElementById('btnNewGroup').onclick = ()=>{
  const name = prompt(STR.common.groupNamePrompt, STR.common.newGroupDefaultName);
  if(!name || !name.trim()) return;
  pickGroupColor((color)=>{
    const groups = getGroups();
    groups.push({ id: 'g' + Date.now(), name: name.trim(), color, collapsed:false });
    setGroups(groups);
    renderList();
  });
};
document.getElementById('btnStartSelectPrint').onclick = ()=>{
  if(printSelectActive){ exitPrintSelectMode(); }
  else{ enterPrintSelectMode(); }
};

function openList(){ closeAllSheets(); renderList(); listSheet.classList.add('open'); listBackdrop.classList.add('open'); }
function closeList(){ listSheet.classList.remove('open'); listBackdrop.classList.remove('open'); }
document.getElementById('listBtn').onclick = openList;
document.getElementById('listCancel').onclick = closeList;
listBackdrop.onclick = closeList;

/* ---- バックアップ書き出し／読み込み ----
   マイSVG・マイHTML両方の登録データ・グループ・並び順を丸ごと1つのJSONにまとめて書き出す。
   読み込み時は上書きしてしまう前に必ず今のデータを退避スナップショットへ保存しておき、
   「復元したら別のデータが消えた」という二次事故を防ぐ(直前のインポート前に戻すメニューで復旧可能) */
const BACKUP_KEYS = ['svgViewerSavedItems','svgViewerGroups','svgViewerTopOrder',
                      'htmlViewerSavedItems','htmlViewerGroups','htmlViewerTopOrder'];
function exportBackup(){
  const data = { appName: '造 -ZOU-', exportedAt: new Date().toISOString() };
  BACKUP_KEYS.forEach(k=>{ data[k] = localStorage.getItem(k); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zou-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function snapshotBeforeImport(){
  const snap = { savedAt: new Date().toISOString() };
  BACKUP_KEYS.forEach(k=>{ snap[k] = localStorage.getItem(k); });
  try{ localStorage.setItem('zouPreImportSnapshot', JSON.stringify(snap)); }catch(e){}
}
function importBackup(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    let data;
    try{ data = JSON.parse(reader.result); }catch(e){ alert(STR.common.backupParseError); return; }
    const hasAny = data && BACKUP_KEYS.some(k => k in data);
    if(!hasAny){ alert(STR.common.backupParseError); return; }
    if(!confirm(STR.common.backupImportConfirm)) return;
    snapshotBeforeImport(); // 上書きする前に今の状態を退避
    BACKUP_KEYS.forEach(k=>{
      if(data[k] != null) localStorage.setItem(k, data[k]); else localStorage.removeItem(k);
    });
    renderList();
    alert(STR.common.backupImportSuccess);
  };
  reader.readAsText(file);
}
function restorePreImportSnapshot(){
  let snap;
  try{ snap = JSON.parse(localStorage.getItem('zouPreImportSnapshot') || 'null'); }catch(e){ snap = null; }
  if(!snap){ alert(STR.common.backupNoSnapshot); return; }
  if(!confirm(STR.common.backupRestoreSnapshotConfirm)) return;
  BACKUP_KEYS.forEach(k=>{
    if(snap[k] != null) localStorage.setItem(k, snap[k]); else localStorage.removeItem(k);
  });
  renderList();
  alert(STR.common.backupImportSuccess);
}
document.getElementById('btnBackup').addEventListener('click', (ev)=>{
  // 開いている状態でもう一度押したら閉じるだけにする(押しっぱなしで開き直る違和感を無くす)
  if(document.getElementById('ctxMenu')){ closeContextMenu(); return; }
  const rect = ev.currentTarget.getBoundingClientRect();
  showContextMenu(rect.left, rect.bottom + 4, [
    { label: STR.common.backupExportMenu, onClick: exportBackup },
    { label: STR.common.backupImportMenu, onClick: ()=> document.getElementById('backupFileInput').click() },
    { label: STR.common.backupRestoreMenu, onClick: restorePreImportSnapshot }
  ]);
});
document.getElementById('backupFileInput').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(file) importBackup(file);
  e.target.value = '';
});
