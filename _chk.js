
    (function(){
      var DEFAULT_PASSWORD = '200700';
      var PASSWORD_KEY = 'treasurer_password';
      var DATA_KEY = 'treasurer_expenses';
      var SESSION_KEY = 'treasurer_session';
      var SESSION_EXPIRES_KEY = 'treasurer_session_expires_at';
      var SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

      var loginContainer = document.getElementById('loginContainer');
      var dashboardContainer = document.getElementById('dashboardContainer');
      var loginForm = document.getElementById('loginForm');
      var passwordInput = document.getElementById('password');
      var loginError = document.getElementById('loginError');

      var expenseForm = document.getElementById('expenseForm');
      var expenseDate = document.getElementById('expenseDate');
      var expenseLabel = document.getElementById('expenseLabel');
      var expenseAmount = document.getElementById('expenseAmount');
      var amountHint = document.getElementById('amountHint');
      var expenseCategory = document.getElementById('expenseCategory');
      var expenseMethod = document.getElementById('expenseMethod');
      var expenseNote = document.getElementById('expenseNote');
      var formMessage = document.getElementById('formMessage');
      var saveExpenseBtn = document.getElementById('saveExpenseBtn');

      var tableBody = document.getElementById('tableBody');
      var recentList = document.getElementById('recentList');
      var searchInput = document.getElementById('searchInput');
      var visibleCount = document.getElementById('visibleCount');
      var filterAllBtn = document.getElementById('filterAllBtn');
      var filterMonthBtn = document.getElementById('filterMonthBtn');
      var filterTodayBtn = document.getElementById('filterTodayBtn');
      var clearSearchBtn = document.getElementById('clearSearchBtn');

      var totalAmountEl = document.getElementById('totalAmount');
      var monthAmountEl = document.getElementById('monthAmount');
      var todayAmountEl = document.getElementById('todayAmount');
      var totalOpsEl = document.getElementById('totalOps');

      var exportBtn = document.getElementById('exportBtn');
      var clearBtn = document.getElementById('clearBtn');
      var logoutBtn = document.getElementById('logoutBtn');

      var expensesCache = [];
      var isSaving = false;
      var activeDateFilter = 'all';

      expenseDate.value = new Date().toISOString().slice(0, 10);
      updateAmountHint();

      FB.onAuth(function(user){
        if(user){ showDashboard(); loadExpensesFromFirestore(); }
      });

      loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        var email = document.getElementById('email').value.trim();
        if(!email || !passwordInput.value) return;
        FB.signIn(email, passwordInput.value).then(function(){
          loginError.textContent = '';
          loginForm.reset();
        }).catch(function(){
          loginError.textContent = '❌ Email ou mot de passe incorrect';
          passwordInput.value = '';
        });
      });

      var remoteExpenseIds = {};
      function loadExpensesFromFirestore(){
        FB.get('expenses').then(function(items){
          if(!items.length) {
            // Envoi des dépenses locales vers Firebase si la base est vide
            var local = getExpenses();
            if(local.length) syncExpenses(local);
            return;
          }
          var merged = {};
          items.concat(getExpenses()).forEach(function(it){ var n = normalizeExpense(it); if(n) merged[n.id] = n; });
          var arr = Object.keys(merged).map(function(k){ return merged[k]; });
          remoteExpenseIds = {};
          items.forEach(function(i){ remoteExpenseIds[String(i.id)] = true; });
          localStorage.setItem(DATA_KEY, JSON.stringify(arr));
          refreshView();
        }).catch(function(){});
      }

      logoutBtn.addEventListener('click', function(){
        FB.signOut();
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
        loginForm.reset();
      });

      expenseForm.addEventListener('submit', function(e){
        e.preventDefault();
        if(isSaving) return;

        var label = expenseLabel.value.trim();
        var date = expenseDate.value;
        var amount = parseAmount(expenseAmount.value);
        if(!label){
          showMessage(formMessage, '❌ Le libellé est requis', 'error');
          return;
        }
        if(!date){
          showMessage(formMessage, '❌ La date est requise', 'error');
          return;
        }
        if(!amount || amount <= 0){
          showMessage(formMessage, '❌ Le montant doit être supérieur à 0', 'error');
          return;
        }

        isSaving = true;
        setButtonLoading(saveExpenseBtn, true, 'Enregistrement...', null);

        var expenses = getExpenses();
        expenses.unshift({
          id: String(Date.now()),
          date: date,
          label: label,
          amount: amount,
          category: expenseCategory.value || 'Autre',
          method: expenseMethod.value || 'Espèces',
          note: expenseNote.value.trim(),
          createdAt: new Date().toISOString()
        });
        saveExpenses(expenses);

        expenseForm.reset();
        expenseDate.value = new Date().toISOString().slice(0, 10);
        updateAmountHint();
        showMessage(formMessage, '✓ Dépense enregistrée', 'success');
        refreshView();

        isSaving = false;
        setButtonLoading(saveExpenseBtn, false, null, 'Enregistrer');
      });

      tableBody.addEventListener('click', function(e){
        var btn = e.target.closest('.delete-btn');
        if(!btn) return;
        var id = btn.getAttribute('data-id');
        if(!id) return;
        if(!confirm('Supprimer cette dépense ?')) return;
        var next = getExpenses().filter(function(item){ return String(item.id) !== String(id); });
        saveExpenses(next);
        refreshView();
      });

      exportBtn.addEventListener('click', function(){
        var data = getExpenses();
        if(!data.length){
          showMessage(formMessage, '❌ Aucune dépense à exporter', 'error');
          return;
        }
        var csv = 'Date,Libellé,Catégorie,Paiement,Montant_FCFA,Note\n';
        data.forEach(function(item){
          csv += toCsvRow([
            item.date,
            item.label,
            item.category,
            item.method,
            String(item.amount),
            item.note || ''
          ]) + '\n';
        });
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'depenses-tresorier-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
      });

      clearBtn.addEventListener('click', function(){
        if(!confirm('Supprimer toutes les dépenses (local + Firebase) ?')) return;
        var ops = getExpenses().map(function(it){ return { col: 'expenses', id: String(it.id), del: true }; });
        if(ops.length) FB.batch(ops).catch(function(){});
        remoteExpenseIds = {};
        localStorage.removeItem(DATA_KEY);
        refreshView();
        showMessage(formMessage, '✓ Toutes les dépenses ont été supprimées', 'success');
      });

      if(searchInput){
        var debounced = debounce(function(v){
          var filtered = filterExpenses(v);
          renderTable(filtered);
          renderVisibleCount(filtered.length);
        }, 120);
        searchInput.addEventListener('input', function(){
          debounced(searchInput.value);
        });
      }

      if(expenseAmount){
        expenseAmount.addEventListener('input', updateAmountHint);
      }

      if(filterAllBtn){
        filterAllBtn.addEventListener('click', function(){ setActiveDateFilter('all'); refreshView(); });
      }
      if(filterMonthBtn){
        filterMonthBtn.addEventListener('click', function(){ setActiveDateFilter('month'); refreshView(); });
      }
      if(filterTodayBtn){
        filterTodayBtn.addEventListener('click', function(){ setActiveDateFilter('today'); refreshView(); });
      }
      if(clearSearchBtn){
        clearSearchBtn.addEventListener('click', function(){
          if(searchInput) searchInput.value = '';
          refreshView();
        });
      }
      setActiveDateFilter('all');

      function showDashboard(){
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        refreshView();
      }

      function refreshView(){
        expensesCache = getExpenses();
        var filtered = filterExpenses(searchInput ? searchInput.value : '');
        renderStats(expensesCache);
        renderTable(filtered);
        renderRecent(expensesCache.slice(0, 6));
        renderVisibleCount(filtered.length);
      }

      function renderStats(items){
        var today = new Date().toISOString().slice(0, 10);
        var thisMonth = today.slice(0, 7);

        var total = sumAmounts(items);
        var month = sumAmounts(items.filter(function(i){ return String(i.date || '').slice(0, 7) === thisMonth; }));
        var day = sumAmounts(items.filter(function(i){ return i.date === today; }));

        totalAmountEl.textContent = formatCompactFCFA(total);
        totalAmountEl.title = formatFCFA(total);
        monthAmountEl.textContent = formatCompactFCFA(month);
        monthAmountEl.title = formatFCFA(month);
        todayAmountEl.textContent = formatCompactFCFA(day);
        todayAmountEl.title = formatFCFA(day);
        totalOpsEl.textContent = String(items.length);
      }

      function renderTable(items){
        tableBody.innerHTML = '';
        if(!items.length){
          var emptyMsg = expensesCache.length ? 'Aucun résultat pour le filtre actuel' : 'Aucune dépense';
          tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:40px 20px;">' + emptyMsg + '</td></tr>';
          return;
        }

        var fragment = document.createDocumentFragment();
        items.forEach(function(item, index){
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td data-label="#">' + (index + 1) + '</td>' +
            '<td data-label="Date">' + escapeHtml(formatDate(item.date)) + '</td>' +
            '<td data-label="Libellé">' + escapeHtml(item.label) + '</td>' +
            '<td data-label="Catégorie">' + escapeHtml(item.category) + '</td>' +
            '<td data-label="Paiement">' + escapeHtml(item.method) + '</td>' +
            '<td data-label="Montant"><strong>' + escapeHtml(formatFCFA(item.amount)) + '</strong></td>' +
            '<td data-label="Action"><button class="delete-btn" type="button" data-id="' + escapeHtml(item.id) + '">Supprimer</button></td>';
          fragment.appendChild(tr);
        });
        tableBody.appendChild(fragment);
      }

      function renderRecent(items){
        recentList.innerHTML = '';
        if(!items.length){
          recentList.innerHTML = '<div class="news-empty">Aucune dépense enregistrée</div>';
          return;
        }
        var fragment = document.createDocumentFragment();
        items.forEach(function(item){
          var div = document.createElement('div');
          div.className = 'expense-item';
          div.innerHTML =
            '<div class="expense-item-top">' +
              '<div>' +
                '<p class="expense-item-title">' + escapeHtml(item.label) + '</p>' +
                '<p class="expense-item-meta">' + escapeHtml(formatDate(item.date) + ' • ' + item.category + ' • ' + item.method) + '</p>' +
              '</div>' +
              '<div class="expense-item-amount">' + escapeHtml(formatFCFA(item.amount)) + '</div>' +
            '</div>';
          fragment.appendChild(div);
        });
        recentList.appendChild(fragment);
      }

      function filterExpenses(query){
        var clean = String(query || '').trim().toLowerCase();
        var scoped = applyDateFilter(expensesCache);
        if(!clean) return scoped;
        return scoped.filter(function(item){
          var text = [item.label, item.category, item.method, item.note].join(' ').toLowerCase();
          return text.indexOf(clean) !== -1;
        });
      }

      function applyDateFilter(items){
        var today = new Date().toISOString().slice(0, 10);
        var thisMonth = today.slice(0, 7);
        if(activeDateFilter === 'today'){
          return items.filter(function(item){ return item.date === today; });
        }
        if(activeDateFilter === 'month'){
          return items.filter(function(item){ return String(item.date || '').slice(0, 7) === thisMonth; });
        }
        return items.slice();
      }

      function setActiveDateFilter(value){
        activeDateFilter = value;
        if(filterAllBtn) filterAllBtn.classList.toggle('is-active', value === 'all');
        if(filterMonthBtn) filterMonthBtn.classList.toggle('is-active', value === 'month');
        if(filterTodayBtn) filterTodayBtn.classList.toggle('is-active', value === 'today');
      }

      function renderVisibleCount(count){
        if(visibleCount) visibleCount.textContent = String(count);
      }

      function getExpenses(){
        var raw = localStorage.getItem(DATA_KEY);
        if(!raw) return [];
        try{
          var parsed = JSON.parse(raw);
          if(!Array.isArray(parsed)) return [];
          return parsed
            .map(normalizeExpense)
            .filter(function(item){ return item !== null; })
            .sort(function(a, b){
              var da = new Date(a.date || a.createdAt || 0).getTime();
              var db = new Date(b.date || b.createdAt || 0).getTime();
              return db - da;
            });
        }catch(_e){
          return [];
        }
      }

      function normalizeExpense(entry){
        if(!entry || typeof entry !== 'object') return null;
        var amount = Number(entry.amount || 0);
        if(!Number.isFinite(amount) || amount <= 0) return null;
        return {
          id: String(entry.id || Date.now()),
          date: String(entry.date || new Date().toISOString().slice(0, 10)),
          label: String(entry.label || ''),
          amount: Math.round(amount),
          category: String(entry.category || 'Autre'),
          method: String(entry.method || 'Espèces'),
          note: String(entry.note || ''),
          createdAt: String(entry.createdAt || new Date().toISOString())
        };
      }

      function saveExpenses(items){
        localStorage.setItem(DATA_KEY, JSON.stringify(items));
        syncExpenses(items);
      }

      function syncExpenses(items){
        var current = {};
        var ops = items.map(function(it){
          if(it && it.id){ current[String(it.id)] = true; return { col: 'expenses', id: String(it.id), data: it }; }
          return null;
        }).filter(Boolean);
        Object.keys(remoteExpenseIds).forEach(function(id){
          if(!current[id]) ops.push({ col: 'expenses', id: id, del: true });
        });
        remoteExpenseIds = current;
        if(ops.length) FB.batch(ops).catch(function(){});
      }

      function hasActiveSession(){
        var active = sessionStorage.getItem(SESSION_KEY) === 'true';
        if(!active) return false;
        var expiresAt = Number(sessionStorage.getItem(SESSION_EXPIRES_KEY) || 0);
        if(expiresAt > Date.now()) return true;
        clearSession();
        return false;
      }

      function startSession(){
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(SESSION_EXPIRES_KEY, String(Date.now() + SESSION_DURATION_MS));
      }

      function clearSession(){
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_EXPIRES_KEY);
      }

      function getStoredPassword(){
        var stored = localStorage.getItem(PASSWORD_KEY);
        if(stored && stored.trim()) return stored;
        return DEFAULT_PASSWORD;
      }

      function parseAmount(value){
        var cleaned = String(value || '').replace(/\s+/g, '').replace(',', '.');
        var num = Number(cleaned);
        if(!Number.isFinite(num)) return 0;
        return Math.round(num);
      }

      function updateAmountHint(){
        if(!amountHint) return;
        var amount = parseAmount(expenseAmount ? expenseAmount.value : 0);
        amountHint.textContent = formatFCFA(amount);
      }

      function formatFCFA(amount){
        var fmt = new Intl.NumberFormat('fr-FR').format(Number(amount || 0));
        return fmt + ' FCFA';
      }

      function formatCompactFCFA(amount){
        var value = Number(amount || 0);
        if(value >= 1000000){
          return (value / 1000000).toFixed(1).replace('.', ',') + 'M';
        }
        if(value >= 1000){
          return (value / 1000).toFixed(1).replace('.', ',') + 'k';
        }
        return String(value);
      }

      function formatDate(yyyyMmDd){
        var d = new Date(yyyyMmDd);
        if(Number.isNaN(d.getTime())) return yyyyMmDd || '';
        return d.toLocaleDateString('fr-FR');
      }

      function sumAmounts(items){
        return items.reduce(function(total, item){ return total + Number(item.amount || 0); }, 0);
      }

      function toCsvRow(values){
        return values.map(function(value){
          var escaped = String(value == null ? '' : value).replace(/"/g, '""');
          return '"' + escaped + '"';
        }).join(',');
      }

      function showMessage(element, text, type){
        if(!element) return;
        element.textContent = text;
        element.className = 'message ' + type + ' show';
        if(type === 'success'){
          setTimeout(function(){
            element.textContent = '';
            element.className = 'message';
          }, 3000);
        }
      }

      function debounce(fn, delay){
        var timer = null;
        return function(value){
          clearTimeout(timer);
          timer = setTimeout(function(){ fn(value); }, delay);
        };
      }

      function setButtonLoading(button, isLoading, loadingText, defaultText){
        if(!button) return;
        if(isLoading){
          button.setAttribute('disabled', 'disabled');
          if(loadingText) button.textContent = loadingText;
          return;
        }
        button.removeAttribute('disabled');
        if(defaultText) button.textContent = defaultText;
      }

      function escapeHtml(text){
        var safe = String(text == null ? '' : text);
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return safe.replace(/[&<>"']/g, function(m){ return map[m]; });
      }
    })();
  