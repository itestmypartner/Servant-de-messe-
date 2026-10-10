/**
 * Emploi du Temps Officiel des Formations du Samedi
 * Paroisse Saint-Bernard d'Adiopodoumé - Servants de Messe
 * Interface propulsée par Bootstrap 5
 * Responsable Chargé de la Formation : DJEBLE Haniel (01 50 25 24 67)
 */

(function () {
  'use strict';

  var STORAGE_KEY_SESSIONS = 'formation_bootstrap_sessions_v1';
  var STORAGE_KEY_TRAINERS = 'formation_bootstrap_trainers_v1';
  var STORAGE_KEY_AUTH = 'formation_bootstrap_auth';
  var STORAGE_KEY_PASS = 'formation_admin_password';
  var DEFAULT_PASSWORD = '200700';

  var MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // SEUL RESPONSABLE AU DÉPART CONFORMÉMENT À LA DEMANDE DE L'UTILISATEUR
  var INITIAL_TRAINERS = [
    {
      id: 'tr_djeble',
      name: 'DJEBLE Haniel',
      role: 'Responsable Chargé de la Formation',
      tel: '+225 01 50 25 24 67'
    }
  ];

  // AUCUN PROGRAMME FABRIQUÉ PAR DÉFAUT : LISTE VIERGE
  var INITIAL_SESSIONS = [];

  // État de l'application
  var sessions = [];
  var trainers = [];
  var now = new Date();
  var currentYear = now.getFullYear();
  var currentMonth = now.getMonth();
  var activeLevelFilter = 'all';
  var isAdmin = false;
  var editingSessionId = null;

  // Éléments du DOM
  var scheduleBodyEl = document.getElementById('scheduleBody');
  var currentMonthTitleEl = document.getElementById('currentMonthTitle');
  var prevMonthBtn = document.getElementById('prevMonthBtn');
  var nextMonthBtn = document.getElementById('nextMonthBtn');
  var monthSelect = document.getElementById('monthSelect');
  var scheduleCountEl = document.getElementById('scheduleCount');
  var levelChips = document.querySelectorAll('.level-chip');
  var trainersListContainer = document.getElementById('trainersListContainer');

  // Modales
  var adminModal = document.getElementById('adminModal');
  var sessionModal = document.getElementById('sessionModal');
  var trainerModal = document.getElementById('trainerModal');
  var whatsappModal = document.getElementById('whatsappModal');
  var whatsappPreview = document.getElementById('whatsappPreview');
  var liveToastEl = document.getElementById('liveToast');
  var toastMessageEl = document.getElementById('toastMessage');

  function init() {
    loadData();
    checkAuth();
    setupMonthSelectors();
    populateTrainerSelect();
    setupEvents();
    render();
  }

  function loadData() {
    try {
      var savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      sessions = savedSessions ? JSON.parse(savedSessions) : INITIAL_SESSIONS.slice();
    } catch (e) {
      sessions = [];
    }

    try {
      var savedTrainers = localStorage.getItem(STORAGE_KEY_TRAINERS);
      trainers = savedTrainers ? JSON.parse(savedTrainers) : INITIAL_TRAINERS.slice();
    } catch (e) {
      trainers = INITIAL_TRAINERS.slice();
    }
  }

  function saveSessions() {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  }

  function saveTrainers() {
    localStorage.setItem(STORAGE_KEY_TRAINERS, JSON.stringify(trainers));
  }

  function checkAuth() {
    isAdmin = sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
    updateAdminUI();
  }

  function updateAdminUI() {
    var adminBtn = document.getElementById('adminLoginBtn');
    var addBtn = document.getElementById('addSessionBtn');
    var addTrainerBtn = document.getElementById('addTrainerBtn');
    if (adminBtn) {
      adminBtn.innerHTML = isAdmin ? 
        '<i class="bi bi-box-arrow-right me-1"></i> Quitter Admin' : 
        '<i class="bi bi-shield-lock me-1"></i> Espace Responsable';
      adminBtn.className = isAdmin ? 'btn btn-outline-warning btn-sm' : 'btn btn-outline-secondary btn-sm';
    }
    if (addBtn) addBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (addTrainerBtn) addTrainerBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  function setupMonthSelectors() {
    if (monthSelect) {
      monthSelect.innerHTML = '';
      MONTH_NAMES.forEach(function (mName, idx) {
        var opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = mName + ' ' + currentYear;
        if (idx === currentMonth) opt.selected = true;
        monthSelect.appendChild(opt);
      });
      monthSelect.addEventListener('change', function () {
        currentMonth = parseInt(this.value, 10);
        render();
      });
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', function () {
        if (currentMonth === 0) {
          currentMonth = 11;
          currentYear--;
        } else {
          currentMonth--;
        }
        if (monthSelect) monthSelect.value = currentMonth;
        render();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', function () {
        if (currentMonth === 11) {
          currentMonth = 0;
          currentYear++;
        } else {
          currentMonth++;
        }
        if (monthSelect) monthSelect.value = currentMonth;
        render();
      });
    }
  }

  function populateTrainerSelect() {
    var formTrainer = document.getElementById('formTrainer');
    if (!formTrainer) return;
    formTrainer.innerHTML = '';
    trainers.forEach(function (tr) {
      var opt = document.createElement('option');
      opt.value = tr.name;
      opt.textContent = tr.name + (tr.role ? ' (' + tr.role + ')' : '');
      formTrainer.appendChild(opt);
    });
  }

  function getMonthSessions() {
    return sessions.filter(function (s) {
      var d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }

  function getFilteredSessions() {
    var monthItems = getMonthSessions();
    return monthItems.filter(function (s) {
      if (activeLevelFilter !== 'all' && s.level.toLowerCase() !== activeLevelFilter.toLowerCase()) {
        return false;
      }
      return true;
    }).sort(function (a, b) {
      var diffDate = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (diffDate !== 0) return diffDate;
      var levelOrder = { 'Postulant': 1, 'Samuel': 2, 'Tarcisius': 3, 'Augustin': 4, 'Tous': 5 };
      return (levelOrder[a.level] || 9) - (levelOrder[b.level] || 9);
    });
  }

  function render() {
    if (currentMonthTitleEl) {
      currentMonthTitleEl.textContent = MONTH_NAMES[currentMonth] + ' ' + currentYear;
    }

    var monthSessions = getMonthSessions();
    var filtered = getFilteredSessions();

    var statMonthCount = document.getElementById('statMonthCount');
    var statMonthLabel = document.getElementById('statMonthLabel');
    if (statMonthCount) {
      statMonthCount.textContent = monthSessions.length + (monthSessions.length > 1 ? ' séances planifiées' : ' séance planifiée');
    }
    if (statMonthLabel) {
      statMonthLabel.textContent = MONTH_NAMES[currentMonth] + ' ' + currentYear;
    }

    if (scheduleCountEl) {
      scheduleCountEl.textContent = filtered.length + ' séance(s) programmée(s)';
    }

    if (!scheduleBodyEl) return;

    if (filtered.length === 0) {
      scheduleBodyEl.innerHTML = 
        '<tr><td colspan="7" class="text-center py-5">' +
          '<div class="display-6 text-muted mb-3"><i class="bi bi-calendar-x"></i></div>' +
          '<h5 class="fw-bold text-dark">Aucune formation programmée pour ' + MONTH_NAMES[currentMonth] + ' ' + currentYear + '</h5>' +
          '<p class="text-muted small mb-3">Le planning de ce mois est actuellement vierge. Vous pouvez ajouter les samedis de formation au fur et à mesure.</p>' +
          (isAdmin ? 
            '<button type="button" class="btn btn-gold btn-sm px-3" id="emptyAddBtn"><i class="bi bi-plus-circle me-1"></i> Programmer une séance pour ' + MONTH_NAMES[currentMonth] + '</button>' : 
            '<span class="badge bg-light text-secondary border">Connectez-vous à l\'Espace Responsable pour saisir les dates.</span>') +
        '</td></tr>';

      var emptyAdd = document.getElementById('emptyAddBtn');
      if (emptyAdd) {
        emptyAdd.onclick = function () {
          openSessionForm(null);
        };
      }
      renderTrainersList();
      return;
    }

    var html = '';
    filtered.forEach(function (s) {
      var d = new Date(s.date);
      var dateFormatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
      var badgeClass = getBadgeClassForLevel(s.level);

      html += 
        '<tr>' +
          '<td class="fw-bold text-dark text-nowrap"><i class="bi bi-calendar-event text-secondary me-2"></i>' + capitalizeFirst(dateFormatted) + '</td>' +
          '<td class="text-nowrap"><span class="badge bg-light text-dark border"><i class="bi bi-clock me-1"></i>' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</span></td>' +
          '<td><span class="' + badgeClass + '">' + escapeHtml(s.level) + '</span></td>' +
          '<td>' +
            '<div class="fw-semibold text-dark">' + escapeHtml(s.topic) + '</div>' +
            (s.objectives ? '<div class="small text-muted mt-1"><i class="bi bi-info-circle me-1"></i>' + escapeHtml(s.objectives) + '</div>' : '') +
          '</td>' +
          '<td class="text-nowrap"><i class="bi bi-person-fill text-muted me-1"></i>' + escapeHtml(s.trainer) + '</td>' +
          '<td class="text-nowrap"><span class="small text-muted"><i class="bi bi-geo-alt-fill text-danger me-1"></i>' + escapeHtml(s.location) + '</span></td>' +
          '<td class="action-col text-end text-nowrap">' +
            (isAdmin ? 
              '<div class="btn-group btn-group-sm">' +
                '<button class="btn btn-outline-secondary edit-session-btn" data-id="' + s.id + '" title="Modifier"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger delete-session-btn" data-id="' + s.id + '" title="Supprimer"><i class="bi bi-trash"></i></button>' +
              '</div>' : 
              '<button class="btn btn-outline-success btn-sm share-single-btn" data-id="' + s.id + '" title="Partager sur WhatsApp"><i class="bi bi-whatsapp"></i></button>') +
          '</td>' +
        '</tr>';
    });

    scheduleBodyEl.innerHTML = html;
    renderTrainersList();
  }

  function getBadgeClassForLevel(level) {
    var lvl = (level || '').toLowerCase();
    if (lvl === 'postulant') return 'badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill px-2 py-1';
    if (lvl === 'samuel') return 'badge bg-primary-subtle text-primary-emphasis border border-primary-subtle rounded-pill px-2 py-1';
    if (lvl === 'tarcisius') return 'badge badge-tarcisius rounded-pill px-2 py-1';
    if (lvl === 'augustin') return 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-1';
    return 'badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle rounded-pill px-2 py-1';
  }

  function renderTrainersList() {
    if (!trainersListContainer) return;
    var html = '';
    trainers.forEach(function (tr) {
      html += 
        '<div class="col-md-6 col-lg-4">' +
          '<div class="p-3 bg-light border rounded d-flex align-items-center justify-content-between">' +
            '<div class="d-flex align-items-center">' +
              '<div class="rounded-circle bg-white border d-flex align-items-center justify-content-center me-3" style="width:40px;height:40px;">' +
                '<i class="bi bi-person-badge text-primary fs-5"></i>' +
              '</div>' +
              '<div>' +
                '<div class="fw-bold text-dark">' + escapeHtml(tr.name) + '</div>' +
                '<div class="small text-muted">' + escapeHtml(tr.role || 'Formateur') + '</div>' +
              '</div>' +
            '</div>' +
            (tr.tel ? '<a href="tel:' + tr.tel.replace(/\s/g, '') + '" class="btn btn-sm btn-outline-primary"><i class="bi bi-telephone-fill me-1"></i>Appeler</a>' : '') +
          '</div>' +
        '</div>';
    });
    trainersListContainer.innerHTML = html;
  }

  function setupEvents() {
    // Filtres niveaux (chips)
    levelChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        levelChips.forEach(function (c) { 
          c.classList.remove('active'); 
          c.classList.remove('btn-dark');
          c.classList.add('btn-outline-dark');
        });
        chip.classList.add('active');
        chip.classList.remove('btn-outline-dark');
        chip.classList.add('btn-dark');
        activeLevelFilter = chip.getAttribute('data-level');
        render();
      });
    });

    // Clics délégués sur les actions
    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('.edit-session-btn');
      if (editBtn) {
        openSessionForm(editBtn.getAttribute('data-id'));
        return;
      }

      var delBtn = e.target.closest('.delete-session-btn');
      if (delBtn) {
        deleteSession(delBtn.getAttribute('data-id'));
        return;
      }

      var shareSingle = e.target.closest('.share-single-btn');
      if (shareSingle) {
        shareSingleSessionWhatsApp(shareSingle.getAttribute('data-id'));
        return;
      }
    });

    // Connexion Admin
    var adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', function () {
        if (isAdmin) {
          if (confirm('Voulez-vous quitter le mode Responsable ?')) {
            sessionStorage.removeItem(STORAGE_KEY_AUTH);
            isAdmin = false;
            updateAdminUI();
            render();
            showToast('Mode Responsable désactivé.');
          }
        } else {
          openModal(adminModal);
          var pwd = document.getElementById('adminPassword');
          if (pwd) { pwd.value = ''; pwd.focus(); }
        }
      });
    }

    var adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var pwd = document.getElementById('adminPassword').value;
        var storedPwd = localStorage.getItem(STORAGE_KEY_PASS) || DEFAULT_PASSWORD;
        if (pwd === storedPwd) {
          sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
          isAdmin = true;
          closeModal(adminModal);
          updateAdminUI();
          render();
          showToast('Bienvenue DJEBLE Haniel. Mode Responsable actif.');
        } else {
          alert('Mot de passe incorrect.');
        }
      });
    }

    // Ajout Séance
    var addSessionBtn = document.getElementById('addSessionBtn');
    if (addSessionBtn) {
      addSessionBtn.addEventListener('click', function () {
        openSessionForm(null);
      });
    }

    var adminQuickBtn = document.getElementById('adminQuickBtn');
    if (adminQuickBtn) {
      adminQuickBtn.addEventListener('click', function () {
        if (!isAdmin) {
          openModal(adminModal);
          var pwd = document.getElementById('adminPassword');
          if (pwd) { pwd.value = ''; pwd.focus(); }
        } else {
          openSessionForm(null);
        }
      });
    }

    var sessionForm = document.getElementById('sessionForm');
    if (sessionForm) {
      sessionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveSessionFromForm();
      });
    }

    // Ajout Formateur
    var addTrainerBtn = document.getElementById('addTrainerBtn');
    if (addTrainerBtn) {
      addTrainerBtn.addEventListener('click', function () {
        openModal(trainerModal);
      });
    }

    var trainerForm = document.getElementById('trainerForm');
    if (trainerForm) {
      trainerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('trainerName').value.trim();
        var role = document.getElementById('trainerRole').value.trim();
        var tel = document.getElementById('trainerTel').value.trim();
        if (!name) return;
        trainers.push({
          id: 'tr_' + Date.now(),
          name: name,
          role: role || 'Formateur',
          tel: tel || ''
        });
        saveTrainers();
        populateTrainerSelect();
        renderTrainersList();
        closeModal(trainerModal);
        trainerForm.reset();
        showToast('Formateur ajouté avec succès.');
      });
    }

    // WhatsApp
    var whatsappShareBtn = document.getElementById('whatsappShareBtn');
    if (whatsappShareBtn) {
      whatsappShareBtn.addEventListener('click', function () {
        openWhatsAppModal();
      });
    }

    // Impression
    var printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }
  }

  function openSessionForm(id) {
    editingSessionId = id;
    var modalTitle = document.getElementById('sessionModalTitle');
    var form = document.getElementById('sessionForm');
    form.reset();

    populateTrainerSelect();

    if (id) {
      var s = sessions.find(function (item) { return item.id === id; });
      if (!s) return;
      modalTitle.textContent = 'Modifier la séance';
      document.getElementById('formDate').value = s.date || '';
      document.getElementById('formStartTime').value = s.startTime || '';
      document.getElementById('formEndTime').value = s.endTime || '';
      document.getElementById('formLevel').value = s.level || 'Postulant';
      document.getElementById('formTopic').value = s.topic || '';
      document.getElementById('formTrainer').value = s.trainer || 'DJEBLE Haniel';
      document.getElementById('formLocation').value = s.location || '';
      document.getElementById('formObjectives').value = s.objectives || '';
    } else {
      modalTitle.textContent = 'Planifier un samedi de formation';
      var d = new Date(currentYear, currentMonth, 1);
      while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
      document.getElementById('formDate').value = d.toISOString().slice(0, 10);
      document.getElementById('formStartTime').value = '15:00';
      document.getElementById('formEndTime').value = '16:30';
      document.getElementById('formTrainer').value = 'DJEBLE Haniel';
      document.getElementById('formLocation').value = 'Église paroissiale';
    }

    openModal(sessionModal);
  }

  function saveSessionFromForm() {
    var date = document.getElementById('formDate').value;
    var startTime = document.getElementById('formStartTime').value;
    var endTime = document.getElementById('formEndTime').value;
    var level = document.getElementById('formLevel').value;
    var topic = document.getElementById('formTopic').value.trim();
    var trainer = document.getElementById('formTrainer').value;
    var location = document.getElementById('formLocation').value.trim();
    var objectives = document.getElementById('formObjectives').value.trim();

    if (!date || !startTime || !endTime || !topic) {
      alert('Veuillez renseigner la date, les horaires et le thème.');
      return;
    }

    if (editingSessionId) {
      var idx = sessions.findIndex(function (item) { return item.id === editingSessionId; });
      if (idx !== -1) {
        sessions[idx] = {
          id: editingSessionId,
          date: date,
          startTime: startTime,
          endTime: endTime,
          level: level,
          topic: topic,
          trainer: trainer || 'DJEBLE Haniel',
          location: location || 'Église paroissiale',
          objectives: objectives
        };
        showToast('Séance modifiée.');
      }
    } else {
      sessions.push({
        id: 'sess_' + Date.now(),
        date: date,
        startTime: startTime,
        endTime: endTime,
        level: level,
        topic: topic,
        trainer: trainer || 'DJEBLE Haniel',
        location: location || 'Église paroissiale',
        objectives: objectives
      });
      showToast('Séance de formation enregistrée.');
    }

    var sDate = new Date(date);
    if (!isNaN(sDate.getTime())) {
      currentYear = sDate.getFullYear();
      currentMonth = sDate.getMonth();
      if (monthSelect) monthSelect.value = currentMonth;
    }

    saveSessions();
    closeModal(sessionModal);
    render();
  }

  function deleteSession(id) {
    if (!confirm('Supprimer cette formation de l\'emploi du temps ?')) return;
    sessions = sessions.filter(function (s) { return s.id !== id; });
    saveSessions();
    render();
    showToast('Séance supprimée.');
  }

  function openWhatsAppModal() {
    var filtered = getFilteredSessions();
    var mName = MONTH_NAMES[currentMonth].toUpperCase();

    var text = 
      "📋 *EMPLOI DU TEMPS DES FORMATIONS DU SAMEDI*\n" +
      "Mois de : *" + mName + " " + currentYear + "*\n" +
      "Paroisse Saint-Bernard d'Adiopodoumé\n" +
      "✍️ *Responsable Chargé de la Formation :* DJEBLE Haniel (01 50 25 24 67)\n" +
      "════════════════════════════\n\n";

    if (filtered.length === 0) {
      text += "Aucune séance programmée pour l'instant pour le mois de " + mName + ".\n\n";
    } else {
      filtered.forEach(function (s) {
        var d = new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
        text += "🗓️ *" + capitalizeFirst(d) + "* (" + s.startTime + " - " + s.endTime + ")\n" +
                "  ▫️ *[" + s.level.toUpperCase() + "]* " + s.topic + "\n" +
                "  ▫️ Formateur : " + s.trainer + " | Lieu : " + s.location + "\n\n";
      });
    }

    text += "════════════════════════════\n" +
            "✍️ *Visa du Responsable :* DJEBLE Haniel (01 50 25 24 67)\n" +
            "« Servir et non être servi ! »";

    if (whatsappPreview) whatsappPreview.value = text;
    openModal(whatsappModal);

    var copyBtn = document.getElementById('copyWhatsAppTextBtn');
    if (copyBtn) {
      copyBtn.onclick = function () {
        whatsappPreview.select();
        document.execCommand('copy');
        showToast('Texte copié !');
      };
    }

    var sendBtn = document.getElementById('openWhatsAppAppBtn');
    if (sendBtn) {
      sendBtn.onclick = function () {
        var url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
      };
    }
  }

  function shareSingleSessionWhatsApp(id) {
    var s = sessions.find(function (item) { return item.id === id; });
    if (!s) return;
    var d = new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    var msg = 
      "🔔 *FORMATION SERVANTS DE MESSE*\n" +
      "Paroisse Saint-Bernard d'Adiopodoumé\n" +
      "✍️ *Responsable Formation :* DJEBLE Haniel (01 50 25 24 67)\n\n" +
      "📅 *Date :* " + capitalizeFirst(d) + "\n" +
      "⏰ *Horaire :* " + s.startTime + " - " + s.endTime + "\n" +
      "👥 *Niveau :* " + s.level.toUpperCase() + "\n" +
      "📖 *Thème :* " + s.topic + "\n" +
      "👤 *Formateur :* " + s.trainer + "\n" +
      "📍 *Lieu :* " + s.location + "\n\n" +
      "« Servir et non être servi ! »";

    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
  }

  // Modales avec API Bootstrap 5
  function openModal(el) {
    if (!el) return;
    if (window.bootstrap && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(el).show();
    }
  }

  function closeModal(el) {
    if (!el) return;
    if (window.bootstrap && bootstrap.Modal) {
      var modal = bootstrap.Modal.getInstance(el);
      if (modal) modal.hide();
    }
  }

  // Toast avec API Bootstrap 5
  function showToast(msg) {
    if (!liveToastEl) return;
    if (toastMessageEl) toastMessageEl.textContent = msg;
    if (window.bootstrap && bootstrap.Toast) {
      bootstrap.Toast.getOrCreateInstance(liveToastEl).show();
    }
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
