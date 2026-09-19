// Egi Vegan Kitchen — shared site behaviour

(function(){
  // mobile nav toggle
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function(){
      nav.classList.toggle('open');
    });
  }
})();

(function(){
  // home masthead search box -> redirects to ricette.html?q=...
  var homeSearch = document.getElementById('homeSearchForm');
  if (homeSearch) {
    homeSearch.addEventListener('submit', function(e){
      e.preventDefault();
      var val = document.getElementById('homeSearchInput').value.trim();
      var url = 'ricette.html';
      if (val) url += '?q=' + encodeURIComponent(val);
      window.location.href = url;
    });
  }
})();

(function(){
  // recipe archive: category filter pills + live search + multi-ingredient filter,
  // with optional ?q= / ?cat= / ?ing= (comma-separated) from URL
  var pills = Array.prototype.slice.call(document.querySelectorAll('.filter-pill'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.feed-item'));
  var searchInput = document.getElementById('searchInput');
  var ingredientInput = document.getElementById('ingredientInput');
  var ingredientChips = Array.prototype.slice.call(document.querySelectorAll('.ingredient-chip'));
  var ingredientSelected = document.getElementById('ingredientSelected');
  var feedEmpty = document.getElementById('feedEmpty');
  var feedList = document.getElementById('feedList');
  var sortSelect = document.getElementById('sortSelect');
  if (!items.length || !searchInput) return;

  // Progressive numbering (left-hand column): renumbers only the cards
  // currently visible after a filter/search/sort change, in their current
  // on-page order — always starting at 1.
  function renumberVisible(){
    if (!feedList) return;
    var current = Array.prototype.slice.call(feedList.querySelectorAll('.feed-item'));
    var n = 1;
    current.forEach(function(it){
      if (it.style.display === 'none') return;
      var badge = it.querySelector('.feed-item-number');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'feed-item-number';
        it.insertBefore(badge, it.firstChild);
      }
      badge.textContent = n++;
    });
  }

  // Compact date sort ("Più recenti" / "Più vecchie"): reorders the actual
  // .feed-item DOM nodes inside #feedList using each card's data-date
  // (YYYY-MM-DD, baked in at build time), then re-applies filters so the
  // numbering picks up the new order too.
  function applySort(){
    if (!feedList || !sortSelect) return;
    var dir = sortSelect.value === 'vecchie' ? 1 : -1;
    var sorted = items.slice().sort(function(a, b){
      var da = a.getAttribute('data-date') || '';
      var db = b.getAttribute('data-date') || '';
      if (da < db) return -1 * dir;
      if (da > db) return 1 * dir;
      return 0;
    });
    sorted.forEach(function(it){ feedList.appendChild(it); });
    applyFilters();
  }

  var activeCat = 'Tutte';
  // ordered list of selected ingredient tags (lowercase, normalised)
  var selectedIngredients = [];

  function hasIngredient(tag){
    return selectedIngredients.indexOf(tag) !== -1;
  }

  function renderSelectedIngredients(){
    // sync quick-pick chip highlighting
    ingredientChips.forEach(function(c){
      var val = (c.getAttribute('data-ingredient') || '').toLowerCase();
      c.classList.toggle('active', val === '' ? selectedIngredients.length === 0 : hasIngredient(val));
    });
    // render removable pills for every selected ingredient (curated or free-text)
    if (!ingredientSelected) return;
    ingredientSelected.innerHTML = '';
    selectedIngredients.forEach(function(tag){
      var pill = document.createElement('span');
      pill.className = 'ingredient-tag';
      var label = document.createElement('span');
      label.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Rimuovi ' + tag);
      remove.textContent = '×';
      remove.addEventListener('click', function(){ removeIngredient(tag); });
      pill.appendChild(label);
      pill.appendChild(remove);
      ingredientSelected.appendChild(pill);
    });
  }

  function addIngredient(raw){
    var tag = (raw || '').trim().toLowerCase();
    if (!tag || hasIngredient(tag)) return;
    selectedIngredients.push(tag);
    renderSelectedIngredients();
    applyFilters();
  }

  function removeIngredient(tag){
    selectedIngredients = selectedIngredients.filter(function(t){ return t !== tag; });
    renderSelectedIngredients();
    applyFilters();
  }

  function clearIngredients(){
    selectedIngredients = [];
    renderSelectedIngredients();
    applyFilters();
  }

  function applyFilters(){
    var q = (searchInput.value || '').trim().toLowerCase();
    var anyVisible = false;
    items.forEach(function(it){
      var cat = it.getAttribute('data-category');
      var title = (it.getAttribute('data-title') || '').toLowerCase();
      var ingredients = (it.getAttribute('data-ingredients') || '').toLowerCase();
      var matchesCat = activeCat === 'Tutte' || cat === activeCat;
      var matchesQuery = !q || title.indexOf(q) !== -1;
      // recipe must contain EVERY selected ingredient to match ("assieme")
      var matchesIngredients = selectedIngredients.every(function(tag){
        return ingredients.indexOf(tag) !== -1;
      });
      var show = matchesCat && matchesQuery && matchesIngredients;
      it.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    if (feedEmpty) feedEmpty.style.display = anyVisible ? 'none' : 'block';
    renumberVisible();
  }

  pills.forEach(function(p){
    p.addEventListener('click', function(){
      pills.forEach(function(x){ x.classList.remove('active'); });
      p.classList.add('active');
      activeCat = p.getAttribute('data-category');
      applyFilters();
    });
  });

  searchInput.addEventListener('input', applyFilters);

  if (ingredientInput) {
    ingredientInput.addEventListener('keydown', function(e){
      if (e.key === 'Enter') {
        e.preventDefault();
        addIngredient(ingredientInput.value);
        ingredientInput.value = '';
      }
    });
    // native datalist option pick commits via the 'change' event
    ingredientInput.addEventListener('change', function(){
      if (ingredientInput.value.trim()) {
        addIngredient(ingredientInput.value);
        ingredientInput.value = '';
      }
    });
  }

  ingredientChips.forEach(function(chip){
    chip.addEventListener('click', function(){
      var val = (chip.getAttribute('data-ingredient') || '').toLowerCase();
      if (!val) {
        clearIngredients();
        return;
      }
      if (hasIngredient(val)) removeIngredient(val);
      else addIngredient(val);
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', applySort);
  }

  // pre-fill from URL query params (?q=... / ?cat=... / ?ing=a,b,c)
  try {
    var params = new URLSearchParams(window.location.search);
    var qParam = params.get('q');
    var catParam = params.get('cat');
    var ingParam = params.get('ing');
    if (qParam) searchInput.value = qParam;
    if (catParam) {
      var match = pills.filter(function(p){ return p.getAttribute('data-category') === catParam; })[0];
      if (match) {
        pills.forEach(function(x){ x.classList.remove('active'); });
        match.classList.add('active');
        activeCat = catParam;
      }
    }
    if (ingParam) {
      ingParam.split(',').forEach(function(t){
        var v = t.trim().toLowerCase();
        if (v && selectedIngredients.indexOf(v) === -1) selectedIngredients.push(v);
      });
      renderSelectedIngredients();
    }
    applyFilters();
  } catch (err) {
    /* URLSearchParams not available — still number the default (unfiltered) list */
    renumberVisible();
  }
})();

(function(){
  // recipe detail page: print button, share links, copy-link, servings/ingredient scaler
  var printBtn = document.getElementById('printRecipeBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function(){ window.print(); });
  }

  var shareEls = Array.prototype.slice.call(document.querySelectorAll('[data-share]'));
  if (shareEls.length) {
    var pageUrl = window.location.href;
    var pageTitle = document.title;
    var heroImg = document.querySelector('.recipe-hero-media img');
    var imgUrl = heroImg ? heroImg.src : '';

    shareEls.forEach(function(el){
      var kind = el.getAttribute('data-share');
      if (kind === 'pinterest') {
        el.href = 'https://www.pinterest.com/pin/create/button/?url=' + encodeURIComponent(pageUrl) +
          '&media=' + encodeURIComponent(imgUrl) + '&description=' + encodeURIComponent(pageTitle);
        el.target = '_blank';
        el.rel = 'noopener';
      } else if (kind === 'whatsapp') {
        el.href = 'https://wa.me/?text=' + encodeURIComponent(pageTitle + ' — ' + pageUrl);
        el.target = '_blank';
        el.rel = 'noopener';
      } else if (kind === 'facebook') {
        el.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);
        el.target = '_blank';
        el.rel = 'noopener';
      } else if (kind === 'copy') {
        el.addEventListener('click', function(){
          var done = function(){
            el.classList.add('copied');
            setTimeout(function(){ el.classList.remove('copied'); }, 1800);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pageUrl).then(done, done);
          } else {
            done();
          }
        });
      }
    });
  }

  // servings / ingredient quantity scaler
  var scaler = document.getElementById('servingsScaler');
  var servingsLabel = document.getElementById('servingsLabel');
  var dosiStat = document.getElementById('dosiStatValue');
  var qtyEls = Array.prototype.slice.call(document.querySelectorAll('#ingredientsList .qty[data-qty-value]'));
  if (scaler) {
    var baseValue = parseFloat(scaler.getAttribute('data-base'));
    var prefix = scaler.getAttribute('data-prefix') || '';
    var suffix = scaler.getAttribute('data-suffix') || '';

    function formatNumber(n){
      var rounded = Math.round(n * 100) / 100;
      if (Math.abs(rounded - Math.round(rounded)) < 0.01) return String(Math.round(rounded));
      return String(rounded).replace('.', ',');
    }

    function applyScale(target){
      // The recipe's own base (e.g. "2 porzioni") is always the starting
      // point — the scale factor is relative to THAT, not to a fictitious
      // "×1". Buttons show the actual target quantity, stepping only by
      // even amounts (×2 base, ×4, ×6, ×8…), so a base of 2 scaled to the
      // "×4" button means 4 total, i.e. a ×2 factor on every ingredient.
      var factor = target / baseValue;
      if (servingsLabel) servingsLabel.textContent = 'per ' + prefix + formatNumber(target) + ' ' + suffix;
      if (dosiStat) dosiStat.textContent = prefix + formatNumber(target) + ' ' + suffix;
      qtyEls.forEach(function(el){
        var v = parseFloat(el.getAttribute('data-qty-value'));
        var unit = el.getAttribute('data-qty-unit') || '';
        if (isNaN(v)) return;
        el.textContent = formatNumber(v * factor) + (unit ? ' ' + unit : '');
      });
      Array.prototype.slice.call(scaler.querySelectorAll('.scale-btn')).forEach(function(btn){
        btn.classList.toggle('active', parseFloat(btn.getAttribute('data-target')) === target);
      });
    }

    scaler.addEventListener('click', function(e){
      var btn = e.target.closest ? e.target.closest('.scale-btn') : null;
      if (!btn) return;
      var target = parseFloat(btn.getAttribute('data-target'));
      if (isNaN(target)) return;
      applyScale(target);
    });
  }
})();

(function(){
  // Simple browser-side favourites ("preferiti") system: no account, no
  // backend — just localStorage, shared by the heart buttons on feed cards,
  // the featured post and the recipe page, plus the /preferiti.html list.
  var FAV_KEY = 'egiVeganFavorites';

  function getFavorites(){
    try {
      var raw = localStorage.getItem(FAV_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function setFavorites(list){
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (err) { /* storage unavailable — ignore */ }
  }

  function isFavorite(slug){
    return getFavorites().indexOf(slug) !== -1;
  }

  function toggleFavorite(slug){
    var favs = getFavorites();
    var idx = favs.indexOf(slug);
    if (idx === -1) favs.push(slug); else favs.splice(idx, 1);
    setFavorites(favs);
  }

  function refreshButtonsFor(slug){
    var saved = isFavorite(slug);
    Array.prototype.slice.call(document.querySelectorAll('[data-save-slug="' + slug + '"]')).forEach(function(btn){
      btn.classList.toggle('saved', saved);
      btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      var label = btn.querySelector('.save-label');
      if (label) label.textContent = saved ? 'Salvata nei preferiti' : 'Salva nei preferiti';
      btn.title = saved ? 'Rimuovi dai preferiti' : 'Salva nei preferiti';
    });
  }

  function applyFavoritesFilter(){
    var favList = document.getElementById('favList');
    var favEmpty = document.getElementById('favEmpty');
    if (!favList) return;
    var items = Array.prototype.slice.call(favList.querySelectorAll('.feed-item[data-slug]'));
    var anyVisible = false;
    items.forEach(function(it){
      var show = isFavorite(it.getAttribute('data-slug'));
      it.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    if (favEmpty) favEmpty.style.display = anyVisible ? 'none' : 'block';
  }

  var saveButtons = Array.prototype.slice.call(document.querySelectorAll('[data-save-slug]'));
  if (!saveButtons.length) { applyFavoritesFilter(); return; }

  saveButtons.forEach(function(btn){
    var slug = btn.getAttribute('data-save-slug');
    refreshButtonsFor(slug);
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(slug);
      refreshButtonsFor(slug);
      applyFavoritesFilter();
    });
  });

  applyFavoritesFilter();
})();

(function(){
  // "Modalità cucina": keeps the screen awake while cooking, via the Screen
  // Wake Lock API. Requires HTTPS. Where the API isn't supported the button
  // hides itself rather than doing nothing when clicked.
  var btn = document.getElementById('wakeLockBtn');
  if (!btn) return;

  if (!('wakeLock' in navigator)) {
    btn.hidden = true;
    return;
  }

  var wakeLock = null;
  var label = btn.querySelector('.wake-lock-label');

  function setActive(active){
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (label) label.textContent = active ? 'Schermo sempre acceso' : 'Modalità cucina';
    btn.title = active ? 'Disattiva: lo schermo potrà spegnersi di nuovo' : 'Mantieni lo schermo acceso mentre segui la ricetta';
  }

  function enable(){
    navigator.wakeLock.request('screen').then(function(lock){
      wakeLock = lock;
      setActive(true);
      wakeLock.addEventListener('release', function(){
        wakeLock = null;
        setActive(false);
      });
    }, function(){
      // permission denied, battery saver active, tab not visible, etc.
      setActive(false);
    });
  }

  function disable(){
    if (wakeLock) {
      wakeLock.release().catch(function(){ /* already released — ignore */ });
      wakeLock = null;
    }
    setActive(false);
  }

  btn.addEventListener('click', function(){
    if (wakeLock) disable(); else enable();
  });

  // the OS releases the lock whenever the tab is hidden — silently
  // re-acquire it if the user left "modalità cucina" on and comes back.
  document.addEventListener('visibilitychange', function(){
    if (wakeLock === null && btn.classList.contains('active') && document.visibilityState === 'visible') {
      enable();
    }
  });
})();

(function(){
  // Lista della spesa: aggregates ingredients from every recipe currently
  // saved in "preferiti". Quantities come from the same data-qty-value /
  // data-qty-unit pairs each recipe page uses for its servings scaler,
  // baked at build time into each feed-item's data-ingredients-detail
  // attribute — no network requests, everything runs off localStorage.
  var openBtn = document.getElementById('buildShoppingListBtn');
  var modal = document.getElementById('shoppingListModal');
  if (!openBtn || !modal) return;

  var listEl = document.getElementById('shoppingListItems');
  var emptyMsg = document.getElementById('shoppingListEmptyMsg');
  var clearBtn = document.getElementById('shoppingListClearChecks');
  var printBtn = document.getElementById('shoppingListPrintBtn');
  var CHECK_KEY = 'egiVeganShoppingChecks';
  var FAV_KEY = 'egiVeganFavorites';

  function getJSON(key, fallback){
    try {
      var raw = localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : fallback;
      return parsed;
    } catch (err) {
      return fallback;
    }
  }
  function setJSON(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* storage unavailable — ignore */ }
  }

  function formatQty(n){
    var rounded = Math.round(n * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 0.01) return String(Math.round(rounded));
    return String(rounded).replace('.', ',');
  }

  function buildRows(){
    var favSlugs = getJSON(FAV_KEY, []);
    if (!Array.isArray(favSlugs)) favSlugs = [];
    var items = Array.prototype.slice.call(document.querySelectorAll('#favList .feed-item[data-slug]'));
    var byQty = {};   // "name||unit" -> {name, unit, qty}
    var byPlain = {}; // ingredients with no usable quantity (e.g. "q.b.") -> {name, raw}

    items.forEach(function(it){
      var slug = it.getAttribute('data-slug');
      if (favSlugs.indexOf(slug) === -1) return;
      var raw = it.getAttribute('data-ingredients-detail');
      if (!raw) return;
      var ingredients;
      try { ingredients = JSON.parse(raw); } catch (err) { return; }
      if (!Array.isArray(ingredients)) return;
      ingredients.forEach(function(ing){
        var name = (ing.n || '').trim();
        if (!name) return;
        var unit = (ing.u || '').trim().toLowerCase();
        var qty = ing.q;
        if (typeof qty === 'number' && !isNaN(qty)) {
          var key = name.toLowerCase() + '||' + unit;
          if (!byQty[key]) byQty[key] = { name: name, unit: unit, qty: 0 };
          byQty[key].qty += qty;
        } else {
          var pkey = name.toLowerCase() + '||' + (ing.raw || '');
          byPlain[pkey] = { name: name, raw: ing.raw || '' };
        }
      });
    });

    var rows = Object.keys(byQty).map(function(k){
      var v = byQty[k];
      return { key: 'q||' + k, label: formatQty(v.qty) + (v.unit ? ' ' + v.unit : '') + ' — ' + v.name };
    });
    Object.keys(byPlain).forEach(function(k){
      var v = byPlain[k];
      rows.push({ key: 'p||' + k, label: v.name + (v.raw ? ' (' + v.raw + ')' : '') });
    });
    rows.sort(function(a, b){ return a.label.localeCompare(b.label, 'it'); });
    return rows;
  }

  function render(){
    var rows = buildRows();
    var checks = getJSON(CHECK_KEY, {});
    if (!checks || typeof checks !== 'object') checks = {};
    listEl.innerHTML = '';
    if (!rows.length) {
      emptyMsg.hidden = false;
      return;
    }
    emptyMsg.hidden = true;
    rows.forEach(function(row){
      var li = document.createElement('li');
      li.className = 'shopping-list-item';
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('data-shop-key', row.key);
      input.checked = !!checks[row.key];
      var span = document.createElement('span');
      span.textContent = row.label;
      label.appendChild(input);
      label.appendChild(span);
      li.appendChild(label);
      li.classList.toggle('checked', input.checked);
      listEl.appendChild(li);
    });
  }

  listEl.addEventListener('change', function(e){
    var cb = e.target.closest ? e.target.closest('input[data-shop-key]') : null;
    if (!cb) return;
    var checks = getJSON(CHECK_KEY, {});
    if (!checks || typeof checks !== 'object') checks = {};
    checks[cb.getAttribute('data-shop-key')] = cb.checked;
    setJSON(CHECK_KEY, checks);
    var li = cb.closest('li');
    if (li) li.classList.toggle('checked', cb.checked);
  });

  function open(){
    render();
    modal.hidden = false;
    document.body.classList.add('shopping-modal-open');
  }
  function close(){
    modal.hidden = true;
    document.body.classList.remove('shopping-modal-open');
  }

  openBtn.addEventListener('click', open);
  Array.prototype.slice.call(modal.querySelectorAll('[data-close-shopping]')).forEach(function(el){
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function(){
      setJSON(CHECK_KEY, {});
      render();
    });
  }
  if (printBtn) {
    printBtn.addEventListener('click', function(){
      document.body.classList.add('printing-shopping-list');
      window.print();
    });
  }
  window.addEventListener('afterprint', function(){
    document.body.classList.remove('printing-shopping-list');
  });
})();

/* Collab request form (collabora.html) */
(function(){
  var form = document.getElementById('collabForm');
  if (!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var nome = (document.getElementById('collabNome') || {}).value || '';
    var azienda = (document.getElementById('collabAzienda') || {}).value || '';
    var email = (document.getElementById('collabEmail') || {}).value || '';
    var messaggio = (document.getElementById('collabMessaggio') || {}).value || '';

    var subject = 'Richiesta di collaborazione' + (azienda ? ' — ' + azienda : '');
    var bodyLines = [
      'Nome: ' + nome,
      azienda ? 'Brand/azienda: ' + azienda : null,
      'Email: ' + email,
      '',
      messaggio
    ].filter(function(l){ return l !== null; });

    var mailto = 'mailto:ciao@egivegankitchen.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(bodyLines.join('\n'));

    window.location.href = mailto;
  });
})();
