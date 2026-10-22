/**
 * Emploi du Temps Officiel des Formations du Samedi
 * Paroisse Saint-Bernard d'Adiopodoumé - Servants de Messe
 * Interface propulsée par Bootstrap 5
 * Responsable Chargé de la Formation : DJEBLE Haniel (01 50 25 24 67)
 *
 * Données synchronisées via l'API du serveur (/api/formations) :
 * le planning saisi par le responsable est visible par tous les visiteurs.
 * localStorage sert de cache hors-ligne.
 */

(function () {
  'use strict';

  var STORAGE_KEY_SESSIONS = 'formation_bootstrap_sessions_v1';
  var STORAGE_KEY_TRAINERS = 'formation_bootstrap_trainers_v1';
  var STORAGE_KEY_PWD = 'formation_admin_pwd';
  var STORAGE_KEY_VIEW = 'formation_view_mode';

  // API : même origine quand la page est servie par le serveur Render,
  // URL absolue sinon (GitHub Pages, ouverture locale du fichier, etc.)
  var API_BASE = (function () {
    if (window.FORMATIONS_API_BASE) return window.FORMATIONS_API_BASE;
    var h = location.hostname || '';
    if (h.endsWith('onrender.com') || h === 'localhost' || h === '127.0.0.1') return '';
    return 'https://servant-de-messe-4651.onrender.com';
  })();

  var MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  var LEVEL_ORDER = { 'Postulant': 1, 'Samuel': 2, 'Tarcisius': 3, 'Augustin': 4, 'Tous': 5 };

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

  // PROGRAMMES PÉDAGOGIQUES DÉTAILLÉS DES 4 NIVEAUX
  var LEVEL_GUIDE = {
    postulant: {
      name: 'Postulant',
      badge: 'badge-postulant',
      icon: 'bi-seedling',
      color: 'var(--color-postulant)',
      duration: 'Durée indicative : 3 mois',
      motto: 'Les premiers pas au service de l\'autel.',
      modules: [
        'Posture, révérence et marche processionnelle',
        'Découverte du sanctuaire et de la sacristie',
        'Prière du servant de messe et réponses simples',
        'Port correct de l\'aube et attitude pendant la messe',
        'Signification des gestes liturgiques de base'
      ],
      evaluation: [
        'Tenue et comportement irréprochables à l\'autel',
        'Maîtrise de la révérence et de la génuflexion',
        'Ponctualité et assiduité aux formations du samedi',
        'Connaissance de la prière du servant de messe'
      ]
    },
    samuel: {
      name: 'Samuel',
      badge: 'badge-samuel',
      icon: 'bi-bell',
      color: 'var(--color-samuel)',
      duration: 'Durée indicative : 6 mois',
      motto: 'L\'écoute et le service actif.',
      modules: [
        'Service de la clochette aux moments consacrés',
        'Procession des offrandes et accueil des dons',
        'Manipulation des burettes et service du lavabo',
        'Connaissance des vases sacrés (calice, patène, ciboire)',
        'Réponses complètes de la messe en français et en latin'
      ],
      evaluation: [
        'Service actif et autonome des burettes et du lavabo',
        'Sonnerie juste de la clochette pendant la consécration',
        'Identification correcte de tous les objets liturgiques',
        'Récitation complète des réponses de la messe'
      ]
    },
    tarcisius: {
      name: 'Tarcisius',
      badge: 'badge-tarcisius',
      icon: 'bi-shield-fill-check',
      color: 'var(--color-tarcisius)',
      duration: 'Durée indicative : 6 à 9 mois',
      motto: 'Fidélité et garde du Saint-Sacrement.',
      modules: [
        'Service de céroféraire (porte-cierge) et porte-croix',
        'Encensoir et navette : théorie et premières pratiques',
        'Accompagnement de la procession de communion',
        'Conduite des processions d\'entrée et de sortie',
        'Sens du sacré et vénération du Saint-Sacrement'
      ],
      evaluation: [
        'Conduite assurée de la croix et des cierges en procession',
        'Manipulation correcte de l\'encensoir sous supervision',
        'Comportement exemplaire pendant l\'eucharistie',
        'Capacité à guider les servants des niveaux inférieurs'
      ]
    },
    augustin: {
      name: 'Augustin',
      badge: 'badge-augustin',
      icon: 'bi-trophy',
      color: 'var(--color-augustin)',
      duration: 'Niveau de perfectionnement continu',
      motto: 'Maturité, maîtrise et encadrement.',
      modules: [
        'Service des grandes célébrations solennelles',
        'Thuriféraire expérimenté (encensoir en solennité)',
        'Coordination de l\'équipe des servants pendant la messe',
        'Tutorat et accompagnement des plus jeunes',
        'Préparation de la sacristie et vérification du matériel'
      ],
      evaluation: [
        'Maîtrise complète de tous les offices de l\'autel',
        'Capacité à encadrer et corriger avec charité',
        'Fiabilité totale lors des célébrations solennelles',
        'Exemplarité de vie et de foi au sein du groupe'
      ]
    }
  };

  // État de l'application
  var sessions = [];
  var trainers = [];
  var now = new Date();
  var currentYear = now.getFullYear();
  var currentMonth = now.getMonth();
  var activeLevelFilter = 'all';
  var viewMode = 'list';
  var isAdmin = false;
  var adminPassword = '';
  var editingSessionId = null;
  var calendarSessionId = null;

  // Éléments du DOM
  var scheduleBodyEl = document.getElementById('scheduleBody');
  var scheduleMobileContainer = document.getElementById('scheduleMobileContainer');
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
  var pwdModal = document.getElementById('pwdModal');
  var calendarModal = document.getElementById('calendarModal');
  var levelModal = document.getElementById('levelModal');
  var whatsappPreview = document.getElementById('whatsappPreview');
  var liveToastEl = document.getElementById('liveToast');
  var toastMessageEl = document.getElementById('toastMessage');

  function init() {
    viewMode = localStorage.getItem(STORAGE_KEY_VIEW) || 'list';
    loadData();
    checkAuth();
    buildMonthOptions();
    populateTrainerSelect();
    setupEvents();
    setupViewToggle();
    render();
    fetchRemoteData(); // synchronise depuis le serveur en arrière-plan
    registerServiceWorker();
  }

  // ==================== DONNÉES : LOCAL + SERVEUR ====================

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

  // Lecture publique du planning partagé depuis le serveur
  function fetchRemoteData() {
    fetch(API_BASE + '/api/formations')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.sessions)) return;
        // Migration douce : si le serveur est vide mais que le navigateur
        // contient des séances (ancienne version localStorage), on les garde —
        // elles seront envoyées au serveur à la prochaine sauvegarde admin.
        if (data.sessions.length === 0 && sessions.length > 0) {
          if (Array.isArray(data.trainers) && data.trainers.length) {
            trainers = data.trainers;
          }
          populateTrainerSelect();
          render();
          return;
        }
        sessions = data.sessions;
        if (Array.isArray(data.trainers) && data.trainers.length) {
          trainers = data.trainers;
        }
        saveLocal();
        populateTrainerSelect();
        render();
      })
      .catch(function () {
        // Hors-ligne ou serveur indisponible : on garde le cache local
      });
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEY_TRAINERS, JSON.stringify(trainers));
  }

  // Sauvegarde locale + synchronisation serveur si responsable connecté
  function saveAll() {
    saveLocal();
    if (!adminPassword) return;
    fetch(API_BASE + '/api/formations', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ sessions: sessions, trainers: trainers })
    })
      .then(function (res) {
        if (res.status === 401) {
          logoutAdmin();
          showToast('Session responsable expirée. Reconnectez-vous pour synchroniser.');
          return;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
      })
      .catch(function () {
        showToast('Sauvegardé en local uniquement — synchronisation serveur impossible.');
      });
  }

  function apiHeaders() {
    var h = { 'Content-Type': 'application/json' };
    if (adminPassword) h['x-admin-password'] = adminPassword;
    return h;
  }

  // ==================== AUTHENTIFICATION ====================

  function checkAuth() {
    adminPassword = sessionStorage.getItem(STORAGE_KEY_PWD) || '';
    isAdmin = !!adminPassword;
    updateAdminUI();
  }

  function logoutAdmin() {
    sessionStorage.removeItem(STORAGE_KEY_PWD);
    adminPassword = '';
    isAdmin = false;
    updateAdminUI();
    render();
  }

  function updateAdminUI() {
    var adminBtn = document.getElementById('adminLoginBtn');
    var addBtn = document.getElementById('addSessionBtn');
    var addTrainerBtn = document.getElementById('addTrainerBtn');
    var securityBtn = document.getElementById('securityBtn');
    var dupBtn = document.getElementById('dupMonthBtn');
    if (adminBtn) {
      adminBtn.innerHTML = isAdmin ?
        '<i class="bi bi-box-arrow-right me-1"></i> Quitter Admin' :
        '<i class="bi bi-shield-lock me-1"></i> Espace Responsable';
      adminBtn.className = isAdmin ? 'btn btn-outline-warning btn-sm' : 'btn btn-outline-light btn-sm';
    }
    if (addBtn) addBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (securityBtn) securityBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (addTrainerBtn) addTrainerBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (dupBtn) dupBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  // ==================== NAVIGATION MOIS ====================

  function buildMonthOptions() {
    if (!monthSelect) return;
    monthSelect.innerHTML = '';
    MONTH_NAMES.forEach(function (mName, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = mName + ' ' + currentYear;
      if (idx === currentMonth) opt.selected = true;
      monthSelect.appendChild(opt);
    });
  }

  function setupMonthSelectors() {
    if (monthSelect) {
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
        buildMonthOptions();
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
        buildMonthOptions();
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

  // ==================== SÉLECTION DES SÉANCES ====================

  function getMonthSessions() {
    return sessions.filter(function (s) {
      var d = parseDateLocal(s.date);
      if (!d) return false;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }

  function getFilteredSessions() {
    var monthItems = getMonthSessions();
    return monthItems.filter(function (s) {
      if (activeLevelFilter !== 'all' && (s.level || '').toLowerCase() !== activeLevelFilter.toLowerCase()) {
        return false;
      }
      return true;
    }).sort(function (a, b) {
      var diffDate = parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime();
      if (diffDate !== 0) return diffDate;
      return (LEVEL_ORDER[a.level] || 9) - (LEVEL_ORDER[b.level] || 9);
    });
  }

  function getNextSession() {
    var nowDate = new Date();
    var best = null;
    var bestTime = Infinity;
    sessions.forEach(function (s) {
      var d = parseDateLocal(s.date);
      if (!d) return;
      var parts = (s.endTime || '23:59').split(':');
      d.setHours(parseInt(parts[0], 10) || 23, parseInt(parts[1], 10) || 59);
      var t = d.getTime();
      if (t >= nowDate.getTime() && t < bestTime) {
        bestTime = t;
        best = s;
      }
    });
    return best;
  }

  // ==================== RENDU ====================

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

    var printMonthText = document.getElementById('printMonthText');
    if (printMonthText) {
      printMonthText.textContent = MONTH_NAMES[currentMonth] + ' ' + currentYear;
    }

    if (scheduleCountEl) {
      scheduleCountEl.textContent = filtered.length + ' séance(s) programmée(s)';
    }

    renderLevelBreakdown(monthSessions);
    renderNextSessionCard();
    renderCalendarView();

    if (!scheduleBodyEl) return;

    if (filtered.length === 0) {
      var emptyMsg = activeLevelFilter === 'all' ?
        'Aucune formation programmée pour ' + MONTH_NAMES[currentMonth] + ' ' + currentYear :
        'Aucune séance du niveau ' + activeLevelFilter + ' ce mois-ci';

      scheduleBodyEl.innerHTML =
        '<tr><td colspan="7" class="text-center py-5">' +
          '<div class="display-6 text-muted mb-3"><i class="bi bi-calendar-x"></i></div>' +
          '<h5 class="fw-bold text-dark">' + emptyMsg + '</h5>' +
          '<p class="text-muted small mb-3">Le planning de ce mois est actuellement vierge. Vous pouvez ajouter les samedis de formation au fur et à mesure.</p>' +
          (isAdmin ?
            '<button type="button" class="btn btn-gold btn-sm px-3" id="emptyAddBtn"><i class="bi bi-plus-circle me-1"></i> Programmer une séance pour ' + MONTH_NAMES[currentMonth] + '</button>' :
            '<span class="badge bg-light text-secondary border">Connectez-vous à l\'Espace Responsable pour saisir les dates.</span>') +
        '</td></tr>';

      var emptyAdd = document.getElementById('emptyAddBtn');
      if (emptyAdd) {
        emptyAdd.onclick = function () { openSessionForm(null); };
      }

      if (scheduleMobileContainer) {
        scheduleMobileContainer.innerHTML =
          '<div class="text-center py-4 px-2">' +
            '<div class="display-6 text-muted mb-2"><i class="bi bi-calendar-x"></i></div>' +
            '<h6 class="fw-bold text-dark">Aucune formation programmée</h6>' +
            '<p class="text-muted small mb-3">Le planning de ' + MONTH_NAMES[currentMonth] + ' ' + currentYear + ' est actuellement vierge.</p>' +
            (isAdmin ?
              '<button type="button" class="btn btn-gold btn-sm w-100" id="emptyAddMobileBtn"><i class="bi bi-plus-circle me-1"></i> Programmer une séance</button>' :
              '<span class="badge bg-light text-secondary border small">Espace Responsable pour planifier.</span>') +
          '</div>';

        var emptyAddMobile = document.getElementById('emptyAddMobileBtn');
        if (emptyAddMobile) {
          emptyAddMobile.onclick = function () { openSessionForm(null); };
        }
      }

      renderTrainersList();
      return;
    }

    var html = '';
    var mobileHtml = '';

    filtered.forEach(function (s) {
      var d = parseDateLocal(s.date);
      var dateFormatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
      var dateFull = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      var badgeClass = getBadgeClassForLevel(s.level);
      var lvlBorderClass = 'border-level-' + (s.level || 'tous').toLowerCase();

      // Vue Tableau (Desktop & Impression)
      html +=
        '<tr>' +
          '<td class="col-date fw-bold text-dark"><i class="bi bi-calendar-event text-secondary me-1"></i>' + capitalizeFirst(dateFormatted) + '</td>' +
          '<td class="col-time"><span class="badge bg-light text-dark border"><i class="bi bi-clock me-1"></i>' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</span></td>' +
          '<td class="col-level"><span class="' + badgeClass + '">' + escapeHtml(s.level) + '</span></td>' +
          '<td class="col-topic">' +
            '<div class="fw-semibold text-dark">' + escapeHtml(s.topic) + '</div>' +
            (s.objectives ? '<div class="small text-muted mt-1"><i class="bi bi-info-circle me-1"></i>' + escapeHtml(s.objectives) + '</div>' : '') +
          '</td>' +
          '<td class="col-trainer"><i class="bi bi-person-fill text-muted me-1"></i>' + escapeHtml(s.trainer) + '</td>' +
          '<td class="col-location"><span class="small text-muted"><i class="bi bi-geo-alt-fill text-danger me-1"></i>' + escapeHtml(s.location) + '</span></td>' +
          '<td class="action-col text-end">' +
            '<div class="btn-group btn-group-sm">' +
              '<button class="btn btn-outline-success share-single-btn" data-id="' + s.id + '" title="Partager sur WhatsApp"><i class="bi bi-whatsapp"></i></button>' +
              '<button class="btn btn-outline-primary cal-session-btn" data-id="' + s.id + '" title="Ajouter au calendrier"><i class="bi bi-calendar-plus"></i></button>' +
              '<button class="btn btn-outline-dark presence-session-btn" data-id="' + s.id + '" title="Imprimer la fiche de présence"><i class="bi bi-clipboard-check"></i></button>' +
              (isAdmin ?
                '<button class="btn btn-outline-secondary edit-session-btn" data-id="' + s.id + '" title="Modifier"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger delete-session-btn" data-id="' + s.id + '" title="Supprimer"><i class="bi bi-trash"></i></button>' : '') +
            '</div>' +
          '</td>' +
        '</tr>';

      // Vue Cartes (Mobile)
      mobileHtml +=
        '<div class="mobile-session-card ' + lvlBorderClass + ' mb-3 p-3 bg-white rounded-3 shadow-sm border">' +
          '<div class="d-flex align-items-center justify-content-between mb-2">' +
            '<div class="fw-bold text-dark small"><i class="bi bi-calendar-event text-warning me-1"></i>' + capitalizeFirst(dateFull) + '</div>' +
            '<span class="' + badgeClass + '">' + escapeHtml(s.level) + '</span>' +
          '</div>' +
          '<h6 class="fw-bold text-dark mb-1 fs-6">' + escapeHtml(s.topic) + '</h6>' +
          (s.objectives ? '<div class="small text-muted mb-2"><i class="bi bi-info-circle me-1"></i>' + escapeHtml(s.objectives) + '</div>' : '') +
          '<div class="d-flex flex-wrap gap-2 small text-muted pt-2 border-top mb-3">' +
            '<div class="bg-light px-2 py-1 rounded border text-nowrap"><i class="bi bi-clock me-1 text-secondary"></i>' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</div>' +
            '<div class="bg-light px-2 py-1 rounded border text-nowrap"><i class="bi bi-person-fill me-1 text-secondary"></i>' + escapeHtml(s.trainer) + '</div>' +
            '<div class="bg-light px-2 py-1 rounded border text-nowrap"><i class="bi bi-geo-alt-fill text-danger me-1"></i>' + escapeHtml(s.location) + '</div>' +
          '</div>' +
          '<div class="d-flex align-items-center gap-2">' +
            '<button class="btn btn-sm btn-success flex-fill share-single-btn" data-id="' + s.id + '"><i class="bi bi-whatsapp me-1"></i>WhatsApp</button>' +
            '<button class="btn btn-sm btn-outline-primary cal-session-btn" data-id="' + s.id + '" title="Ajouter au calendrier"><i class="bi bi-calendar-plus"></i></button>' +
            '<button class="btn btn-sm btn-outline-dark presence-session-btn" data-id="' + s.id + '" title="Fiche de présence"><i class="bi bi-clipboard-check"></i></button>' +
          '</div>' +
          (isAdmin ?
            '<div class="d-flex align-items-center gap-2 mt-2">' +
              '<button class="btn btn-sm btn-outline-secondary flex-fill edit-session-btn" data-id="' + s.id + '"><i class="bi bi-pencil me-1"></i>Modifier</button>' +
              '<button class="btn btn-sm btn-outline-danger flex-fill delete-session-btn" data-id="' + s.id + '"><i class="bi bi-trash me-1"></i>Supprimer</button>' +
            '</div>' : '') +
        '</div>';
    });

    scheduleBodyEl.innerHTML = html;
    if (scheduleMobileContainer) scheduleMobileContainer.innerHTML = mobileHtml;

    renderTrainersList();
  }

  // Statistiques par niveau pour le mois affiché
  function renderLevelBreakdown(monthSessions) {
    var el = document.getElementById('levelBreakdown');
    if (!el) return;
    if (!monthSessions.length) { el.textContent = ''; return; }
    var counts = {};
    monthSessions.forEach(function (s) {
      counts[s.level] = (counts[s.level] || 0) + 1;
    });
    var parts = Object.keys(LEVEL_ORDER)
      .filter(function (lvl) { return counts[lvl]; })
      .map(function (lvl) { return lvl + ' ×' + counts[lvl]; });
    el.textContent = parts.join(' · ');
  }

  // Carte "Prochaine séance" avec compte à rebours
  function renderNextSessionCard() {
    var card = document.getElementById('nextSessionCard');
    if (!card) return;
    var next = getNextSession();
    if (!next) {
      card.style.display = 'none';
      card.innerHTML = '';
      return;
    }
    var d = parseDateLocal(next.date);
    var dateFull = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var dayDiff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - today.getTime()) / 86400000);
    var countdown;
    if (dayDiff === 0) countdown = 'AUJOURD\'HUI';
    else if (dayDiff === 1) countdown = 'DEMAIN';
    else countdown = 'DANS ' + dayDiff + ' JOURS';

    card.style.display = 'block';
    card.innerHTML =
      '<div class="next-session-card p-3 p-md-4 rounded-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">' +
        '<div class="d-flex align-items-center gap-3">' +
          '<div class="next-session-icon"><i class="bi bi-megaphone-fill"></i></div>' +
          '<div>' +
            '<div class="text-uppercase fw-bold text-warning-emphasis" style="font-size:0.7rem;letter-spacing:0.8px;">Prochaine formation — ' + countdown + '</div>' +
            '<div class="fw-bold text-dark fs-5">' + capitalizeFirst(dateFull) + ' • ' + escapeHtml(next.startTime) + ' - ' + escapeHtml(next.endTime) + '</div>' +
            '<div class="small text-muted"><span class="' + getBadgeClassForLevel(next.level) + ' me-1">' + escapeHtml(next.level) + '</span>' + escapeHtml(next.topic) + ' — ' + escapeHtml(next.location) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="d-flex gap-2 flex-shrink-0">' +
          '<button class="btn btn-outline-primary btn-sm cal-session-btn" data-id="' + next.id + '"><i class="bi bi-calendar-plus me-1"></i>Calendrier</button>' +
          '<button class="btn btn-success btn-sm share-single-btn" data-id="' + next.id + '"><i class="bi bi-whatsapp me-1"></i>Partager</button>' +
        '</div>' +
      '</div>';
  }

  // Vue calendrier mensuel
  function renderCalendarView() {
    var container = document.getElementById('calendarViewContainer');
    if (!container) return;
    if (viewMode !== 'calendar') return;

    var filtered = getFilteredSessions();
    var byDay = {};
    filtered.forEach(function (s) {
      var d = parseDateLocal(s.date);
      if (d) byDay[d.getDate()] = byDay[d.getDate()] || [], byDay[d.getDate()].push(s);
    });

    var first = new Date(currentYear, currentMonth, 1);
    var startDay = (first.getDay() + 6) % 7; // lundi = 0
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var today = new Date();
    var isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    var html = '<div class="calendar-grid">';
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(function (wd, i) {
      html += '<div class="cal-head' + (i === 5 ? ' cal-head-sat' : '') + '">' + wd + '</div>';
    });

    for (var i = 0; i < startDay; i++) {
      html += '<div class="cal-cell cal-cell-empty"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var cellDate = new Date(currentYear, currentMonth, day);
      var isSat = cellDate.getDay() === 6;
      var isToday = isCurrentMonth && day === today.getDate();
      var classes = 'cal-cell' + (isSat ? ' cal-cell-sat' : '') + (isToday ? ' cal-cell-today' : '');

      html += '<div class="' + classes + '" data-day="' + day + '">';
      html += '<div class="cal-day">' + day + '</div>';

      (byDay[day] || []).forEach(function (s) {
        var lvl = (s.level || 'tous').toLowerCase();
        html += '<span class="cal-event cal-event-' + lvl + '" title="' + escapeHtml(s.startTime + ' - ' + s.topic + ' (' + s.level + ')') + '">' +
          '<i class="bi bi-clock me-1"></i>' + escapeHtml(s.startTime) + ' ' + escapeHtml(truncate(s.topic, 18)) +
        '</span>';
      });

      html += '</div>';
    }

    html += '</div>';
    if (!filtered.length) {
      html += '<p class="text-center text-muted small mt-3 mb-0"><i class="bi bi-info-circle me-1"></i>Aucune séance ce mois-ci. Les samedis sont surlignés.</p>';
    }
    container.innerHTML = html;
  }

  function setupViewToggle() {
    var listBtn = document.getElementById('viewListBtn');
    var calBtn = document.getElementById('viewCalendarBtn');
    var tableWrapper = document.getElementById('scheduleTableWrapper');
    var mobile = document.getElementById('scheduleMobileContainer');
    var calContainer = document.getElementById('calendarViewContainer');

    function applyView() {
      var isCal = viewMode === 'calendar';
      if (listBtn) { listBtn.className = isCal ? 'btn btn-outline-dark' : 'btn btn-dark'; }
      if (calBtn) { calBtn.className = isCal ? 'btn btn-dark' : 'btn btn-outline-dark'; }
      if (tableWrapper) tableWrapper.style.display = isCal ? 'none' : '';
      if (mobile) mobile.style.display = isCal ? 'none' : '';
      if (calContainer) calContainer.style.display = isCal ? 'block' : 'none';
      if (isCal) renderCalendarView();
    }

    if (listBtn) listBtn.addEventListener('click', function () {
      viewMode = 'list';
      localStorage.setItem(STORAGE_KEY_VIEW, viewMode);
      applyView();
    });
    if (calBtn) calBtn.addEventListener('click', function () {
      viewMode = 'calendar';
      localStorage.setItem(STORAGE_KEY_VIEW, viewMode);
      applyView();
    });

    applyView();
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

  // ==================== ÉVÉNEMENTS ====================

  function setupEvents() {
    setupMonthSelectors();

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

    // Cartes des niveaux : programme détaillé
    document.querySelectorAll('.level-card-clickable').forEach(function (card) {
      function open() { openLevelModal(card.getAttribute('data-level-guide')); }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
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

      var calBtn = e.target.closest('.cal-session-btn');
      if (calBtn) {
        openCalendarModal(calBtn.getAttribute('data-id'));
        return;
      }

      var presenceBtn = e.target.closest('.presence-session-btn');
      if (presenceBtn) {
        printPresenceSheet(presenceBtn.getAttribute('data-id'));
        return;
      }

      // Clic sur un samedi du calendrier (admin) : pré-remplit le formulaire
      var cell = e.target.closest('.cal-cell');
      if (cell && !cell.classList.contains('cal-cell-empty') && isAdmin) {
        var day = parseInt(cell.getAttribute('data-day'), 10);
        var cellDate = new Date(currentYear, currentMonth, day);
        if (cellDate.getDay() === 6) {
          openSessionForm(null, toISODate(cellDate));
        }
      }
    });

    // Connexion Admin
    var adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', function () {
        if (isAdmin) {
          if (confirm('Voulez-vous quitter le mode Responsable ?')) {
            logoutAdmin();
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
        var submitBtn = adminLoginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        fetch(API_BASE + '/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        })
          .then(function (res) {
            if (!res.ok) throw new Error('bad_password');
            return res.json();
          })
          .then(function () {
            sessionStorage.setItem(STORAGE_KEY_PWD, pwd);
            adminPassword = pwd;
            isAdmin = true;
            closeModal(adminModal);
            updateAdminUI();
            fetchRemoteData();
            showToast('Bienvenue DJEBLE Haniel. Mode Responsable actif.');
          })
          .catch(function (err) {
            if (err.message === 'bad_password') {
              alert('Mot de passe incorrect.');
            } else {
              alert('Impossible de vérifier le mot de passe (serveur injoignable). Réessayez.');
            }
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }

    // Changement de mot de passe
    var securityBtn = document.getElementById('securityBtn');
    if (securityBtn) {
      securityBtn.addEventListener('click', function () {
        var form = document.getElementById('pwdForm');
        if (form) form.reset();
        openModal(pwdModal);
      });
    }

    var pwdForm = document.getElementById('pwdForm');
    if (pwdForm) {
      pwdForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var current = document.getElementById('pwdCurrent').value;
        var next = document.getElementById('pwdNew').value;
        var confirmPwd = document.getElementById('pwdConfirm').value;
        if (next !== confirmPwd) {
          alert('La confirmation ne correspond pas au nouveau mot de passe.');
          return;
        }
        fetch(API_BASE + '/api/admin/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: current, newPassword: next })
        })
          .then(function (res) {
            return res.json().then(function (data) { return { ok: res.ok, data: data }; });
          })
          .then(function (r) {
            if (!r.ok) {
              alert(r.data && r.data.error ? r.data.error : 'Échec du changement de mot de passe.');
              return;
            }
            sessionStorage.setItem(STORAGE_KEY_PWD, next);
            adminPassword = next;
            closeModal(pwdModal);
            pwdForm.reset();
            showToast('Mot de passe modifié avec succès.');
          })
          .catch(function () {
            alert('Serveur injoignable. Réessayez plus tard.');
          });
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

    // Dupliquer le mois précédent
    var dupMonthBtn = document.getElementById('dupMonthBtn');
    if (dupMonthBtn) {
      dupMonthBtn.addEventListener('click', duplicatePreviousMonth);
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
        saveAll();
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

    // Après impression : retirer le mode "fiche de présence"
    window.addEventListener('afterprint', function () {
      document.body.classList.remove('printing-presence');
    });
  }

  // ==================== FORMULAIRE SÉANCE ====================

  function openSessionForm(id, prefillDate) {
    editingSessionId = id;
    var modalTitle = document.getElementById('sessionModalTitle');
    var form = document.getElementById('sessionForm');
    form.reset();

    populateTrainerSelect();

    var repeatRow = document.getElementById('formRepeatRow');
    var repeatBox = document.getElementById('formRepeat');

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
      if (repeatRow) repeatRow.style.display = 'none';
    } else {
      modalTitle.textContent = 'Planifier un samedi de formation';
      var dateToUse = prefillDate;
      if (!dateToUse) {
        var d = new Date(currentYear, currentMonth, 1);
        while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
        dateToUse = toISODate(d);
      }
      document.getElementById('formDate').value = dateToUse;
      document.getElementById('formStartTime').value = '15:00';
      document.getElementById('formEndTime').value = '16:30';
      document.getElementById('formTrainer').value = 'DJEBLE Haniel';
      document.getElementById('formLocation').value = 'Église paroissiale';
      if (repeatRow) repeatRow.style.display = '';
      if (repeatBox) repeatBox.checked = false;
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
    var repeat = document.getElementById('formRepeat');

    if (!date || !startTime || !endTime || !topic) {
      alert('Veuillez renseigner la date, les horaires et le thème.');
      return;
    }

    if (endTime <= startTime) {
      alert('L\'heure de fin doit être après l\'heure de début.');
      return;
    }

    var chosenDate = parseDateLocal(date);
    if (chosenDate && chosenDate.getDay() !== 6) {
      if (!confirm('Attention : la date choisie n\'est pas un samedi. Voulez-vous quand même enregistrer ?')) {
        return;
      }
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
      // Séance initiale + récurrence éventuelle sur les samedis suivants du mois
      var dates = [date];
      if (repeat && repeat.checked && chosenDate) {
        var cursor = new Date(chosenDate.getTime());
        cursor.setDate(cursor.getDate() + 7);
        while (cursor.getMonth() === chosenDate.getMonth()) {
          dates.push(toISODate(cursor));
          cursor.setDate(cursor.getDate() + 7);
        }
      }
      var baseId = Date.now();
      dates.forEach(function (d, i) {
        var exists = sessions.some(function (x) {
          return x.date === d && x.level === level && x.topic === topic;
        });
        if (exists) return;
        sessions.push({
          id: 'sess_' + baseId + '_' + i,
          date: d,
          startTime: startTime,
          endTime: endTime,
          level: level,
          topic: topic,
          trainer: trainer || 'DJEBLE Haniel',
          location: location || 'Église paroissiale',
          objectives: objectives
        });
      });
      showToast(dates.length > 1 ?
        dates.length + ' séances de formation enregistrées.' :
        'Séance de formation enregistrée.');
    }

    var sDate = parseDateLocal(date);
    if (sDate) {
      currentYear = sDate.getFullYear();
      currentMonth = sDate.getMonth();
      buildMonthOptions();
    }

    saveAll();
    closeModal(sessionModal);
    render();
  }

  function deleteSession(id) {
    if (!confirm('Supprimer cette formation de l\'emploi du temps ?')) return;
    sessions = sessions.filter(function (s) { return s.id !== id; });
    saveAll();
    render();
    showToast('Séance supprimée.');
  }

  // Reprend les séances du mois précédent sur les mêmes samedis du mois courant
  function duplicatePreviousMonth() {
    var prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    var prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    var prevSessions = sessions.filter(function (s) {
      var d = parseDateLocal(s.date);
      return d && d.getFullYear() === prevY && d.getMonth() === prevM;
    });

    if (!prevSessions.length) {
      showToast('Aucune séance en ' + MONTH_NAMES[prevM] + ' ' + prevY + ' à dupliquer.');
      return;
    }

    if (!confirm('Dupliquer les ' + prevSessions.length + ' séance(s) de ' + MONTH_NAMES[prevM] + ' vers ' + MONTH_NAMES[currentMonth] + ' ' + currentYear + ' ?')) {
      return;
    }

    var added = 0;
    prevSessions.forEach(function (s) {
      var d = parseDateLocal(s.date);
      var nth = Math.floor((d.getDate() - 1) / 7) + 1; // n-ième samedi du mois
      var target = nthSaturdayOfMonth(currentYear, currentMonth, nth);
      if (!target) return;
      var iso = toISODate(target);
      var exists = sessions.some(function (x) {
        return x.date === iso && x.level === s.level && x.topic === s.topic;
      });
      if (exists) return;
      sessions.push({
        id: 'sess_' + Date.now() + '_' + added,
        date: iso,
        startTime: s.startTime,
        endTime: s.endTime,
        level: s.level,
        topic: s.topic,
        trainer: s.trainer,
        location: s.location,
        objectives: s.objectives
      });
      added++;
    });

    saveAll();
    render();
    showToast(added > 0 ? added + ' séance(s) dupliquée(s).' : 'Aucune nouvelle séance ajoutée (doublons ignorés).');
  }

  function nthSaturdayOfMonth(y, m, n) {
    var d = new Date(y, m, 1);
    var count = 0;
    while (d.getMonth() === m) {
      if (d.getDay() === 6) {
        count++;
        if (count === n) return new Date(d.getTime());
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  // ==================== CALENDRIER PERSONNEL (.ICS / GOOGLE) ====================

  function openCalendarModal(sessionId) {
    var s = sessions.find(function (item) { return item.id === sessionId; });
    if (!s) return;
    calendarSessionId = sessionId;

    var d = parseDateLocal(s.date);
    var dateFull = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    var info = document.getElementById('calendarModalInfo');
    if (info) {
      info.innerHTML =
        '<div class="fw-bold text-dark mb-1">' + escapeHtml(s.topic) + '</div>' +
        '<div><i class="bi bi-calendar-event me-1"></i>' + capitalizeFirst(dateFull) + ' • ' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</div>' +
        '<div><i class="bi bi-geo-alt me-1"></i>' + escapeHtml(s.location) + ' • <i class="bi bi-person me-1"></i>' + escapeHtml(s.trainer) + '</div>';
    }

    var gLink = document.getElementById('googleCalLink');
    if (gLink) {
      var dates = toGoogleDate(s.date, s.startTime) + '/' + toGoogleDate(s.date, s.endTime);
      gLink.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent('Formation Servants de Messe — ' + s.topic + ' [' + s.level + ']') +
        '&dates=' + dates +
        '&details=' + encodeURIComponent('Niveau : ' + s.level + '\nFormateur : ' + s.trainer + (s.objectives ? '\nObjectifs : ' + s.objectives : '') + '\nParoisse Saint-Bernard d\'Adiopodoumé') +
        '&location=' + encodeURIComponent(s.location || 'Église paroissiale') +
        '&ctz=Africa/Abidjan';
    }

    var icsBtn = document.getElementById('icsDownloadBtn');
    if (icsBtn) {
      icsBtn.onclick = function () { downloadICS(s); };
    }

    openModal(calendarModal);
  }

  function toGoogleDate(dateStr, timeStr) {
    var p = dateStr.split('-');
    var t = (timeStr || '00:00').replace(':', '') + '00';
    return p[0] + p[1] + p[2] + 'T' + t;
  }

  function icsEscape(str) {
    return String(str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  function downloadICS(s) {
    var ics =
      'BEGIN:VCALENDAR\r\n' +
      'VERSION:2.0\r\n' +
      'PRODID:-//Servants de Messe//Formations//FR\r\n' +
      'BEGIN:VEVENT\r\n' +
      'UID:' + s.id + '@servants-de-messe-stbernard\r\n' +
      'DTSTAMP:' + toGoogleDate(toISODate(new Date()), new Date().toTimeString().slice(0, 5)) + '\r\n' +
      'DTSTART:' + toGoogleDate(s.date, s.startTime) + '\r\n' +
      'DTEND:' + toGoogleDate(s.date, s.endTime) + '\r\n' +
      'SUMMARY:' + icsEscape('Formation Servants de Messe — ' + s.topic + ' [' + s.level + ']') + '\r\n' +
      'DESCRIPTION:' + icsEscape('Niveau : ' + s.level + '\\nFormateur : ' + s.trainer + (s.objectives ? '\\nObjectifs : ' + s.objectives : '')) + '\r\n' +
      'LOCATION:' + icsEscape(s.location || 'Église paroissiale') + '\r\n' +
      'END:VEVENT\r\n' +
      'END:VCALENDAR\r\n';

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'formation-' + s.date + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Fichier calendrier téléchargé.');
  }

  // ==================== FICHE DE PRÉSENCE ====================

  function printPresenceSheet(sessionId) {
    var s = sessions.find(function (item) { return item.id === sessionId; });
    if (!s) return;

    var sheet = document.getElementById('printPresenceSheet');
    if (!sheet) return;

    var d = parseDateLocal(s.date);
    var dateFull = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    function buildSheet(children) {
      var rows = '';
      var list = children && children.length ? children : new Array(15).fill(null);
      list.forEach(function (child, i) {
        var name = child ? escapeHtml((child.nom || '') + ' ' + (child.prenom || '')) : '';
        var age = child && child.age ? escapeHtml(String(child.age)) : '';
        rows +=
          '<tr>' +
            '<td class="pp-num">' + (i + 1) + '</td>' +
            '<td class="pp-name">' + name + '</td>' +
            '<td class="pp-age">' + age + '</td>' +
            '<td class="pp-check"></td>' +
            '<td class="pp-obs"></td>' +
          '</tr>';
      });

      sheet.innerHTML =
        '<div class="presence-doc">' +
          '<div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-2 border-dark">' +
            '<img src="logoservantdemesse.jpg" alt="Logo" class="print-header-logo">' +
            '<div class="text-center px-3 flex-grow-1">' +
              '<h2 class="font-cinzel fs-5 fw-bold mb-1 text-uppercase text-dark">Paroisse Saint-Bernard d\'Adiopodoumé</h2>' +
              '<p class="small text-dark mb-1 fw-semibold">Groupe des Servants de Messe • Fiche de Présence</p>' +
              '<h3 class="fs-6 fw-bold text-uppercase text-dark mb-0">' + capitalizeFirst(dateFull) + ' • ' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</h3>' +
            '</div>' +
            '<img src="logoeglise.jpeg" alt="Logo" class="print-header-logo">' +
          '</div>' +
          '<table class="presence-meta">' +
            '<tr><td class="fw-bold">Niveau :</td><td>' + escapeHtml(s.level) + '</td>' +
                '<td class="fw-bold">Formateur :</td><td>' + escapeHtml(s.trainer) + '</td></tr>' +
            '<tr><td class="fw-bold">Thème :</td><td colspan="3">' + escapeHtml(s.topic) + '</td></tr>' +
            '<tr><td class="fw-bold">Lieu :</td><td colspan="3">' + escapeHtml(s.location) + '</td></tr>' +
          '</table>' +
          '<table class="presence-table">' +
            '<thead><tr>' +
              '<th style="width:6%;">N°</th>' +
              '<th style="width:44%;">Nom &amp; Prénoms</th>' +
              '<th style="width:10%;">Âge</th>' +
              '<th style="width:14%;">Présent</th>' +
              '<th style="width:26%;">Observations</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<div class="d-flex justify-content-between mt-4 small text-dark">' +
            '<div>Présents : ________ / ' + list.length + '</div>' +
            '<div class="text-end"><span class="fw-bold">Visa du Formateur :</span> ______________________</div>' +
          '</div>' +
        '</div>';

      document.body.classList.add('printing-presence');
      window.print();
      setTimeout(function () { document.body.classList.remove('printing-presence'); }, 2000);
    }

    // Récupère la liste des inscrits si le responsable est connecté
    if (adminPassword) {
      fetch(API_BASE + '/api/inscriptions', { headers: apiHeaders() })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          var children = (data && Array.isArray(data.inscriptions)) ? data.inscriptions.slice() : [];
          children.sort(function (a, b) {
            return String(a.nom || '').localeCompare(String(b.nom || ''), 'fr');
          });
          buildSheet(children);
        })
        .catch(function () { buildSheet([]); });
    } else {
      buildSheet([]);
    }
  }

  // ==================== PROGRAMME DES NIVEAUX ====================

  function openLevelModal(levelKey) {
    var guide = LEVEL_GUIDE[levelKey];
    if (!guide) return;

    var title = document.getElementById('levelModalTitle');
    var body = document.getElementById('levelModalBody');
    if (title) {
      title.innerHTML = '<span class="badge ' + guide.badge + ' me-2">Niveau</span>' + guide.name;
    }
    if (body) {
      var modulesHtml = guide.modules.map(function (m) {
        return '<li><i class="bi bi-check2-circle me-2" style="color:' + guide.color + ';"></i>' + m + '</li>';
      }).join('');
      var evalHtml = guide.evaluation.map(function (m) {
        return '<li><i class="bi bi-award me-2" style="color:' + guide.color + ';"></i>' + m + '</li>';
      }).join('');

      body.innerHTML =
        '<div class="d-flex align-items-center gap-3 mb-3">' +
          '<div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:56px;height:56px;background:' + guide.color + '22;color:' + guide.color + ';">' +
            '<i class="bi ' + guide.icon + ' fs-2"></i>' +
          '</div>' +
          '<div>' +
            '<div class="fst-italic text-muted">« ' + guide.motto + ' »</div>' +
            '<div class="small fw-bold text-dark mt-1"><i class="bi bi-hourglass-split me-1"></i>' + guide.duration + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row g-3">' +
          '<div class="col-md-6">' +
            '<h6 class="fw-bold text-uppercase small text-dark border-bottom pb-2"><i class="bi bi-journal-bookmark me-1"></i>Modules enseignés</h6>' +
            '<ul class="list-unstyled small text-secondary mb-0">' + modulesHtml + '</ul>' +
          '</div>' +
          '<div class="col-md-6">' +
            '<h6 class="fw-bold text-uppercase small text-dark border-bottom pb-2"><i class="bi bi-clipboard-check me-1"></i>Critères de passage</h6>' +
            '<ul class="list-unstyled small text-secondary mb-0">' + evalHtml + '</ul>' +
          '</div>' +
        '</div>';
    }
    openModal(levelModal);
  }

  // ==================== WHATSAPP ====================

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
        var d = parseDateLocal(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
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
    var d = parseDateLocal(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
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

  // ==================== PWA ====================

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  // ==================== UTILITAIRES ====================

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

  // Parse 'YYYY-MM-DD' en heure locale (évite le décalage UTC de new Date(str))
  function parseDateLocal(str) {
    if (!str) return null;
    var p = String(str).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function toISODate(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function truncate(str, max) {
    str = String(str || '');
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
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
