/**
 * Emploi du Temps Officiel des Formations du Samedi
 * Paroisse Saint-Bernard d'Adiopodoumé - Servants de Messe
 * Design 100% personnalisé (sans framework CSS)
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

  // Listes officielles (PDF) — utilisées en secours si le serveur est injoignable
  var SEED_RESPONSABLES = [
    'ODI ANSELME', 'IREMINKE KOPLE', 'DAN DAVID AXEL', 'SIEZA ALAIN',
    'GUEYE CHANCEL', 'OWEL FRANCK', 'DIÉBLÉ HENOC', 'CHATIGRE EMMANUEL',
    'DAFFOU DAVID', 'DION DONESSE', 'KONIN ARISTIDE'
  ];
  var SEED_SERVANTS = [
    'SEPOU YOAN', 'OHOUEU ALLE', 'BOA ADONI YOAN', 'YVO JACQUES',
    'KOUAMÉ ANGE DÉSIRÉ', 'DEH OULOTE', 'KONAN MARC', 'MENEAS ANGE',
    'KOUGNON EDEN', 'DJAHA ETHAN', 'BROU KASSI', 'BROU YAO',
    'OULAÏ PIERRE', 'DJA DAVID', 'RAYÉS HYPOLITE', 'SEPOU KARL',
    'N\'GEUSSAN CHRIST', 'KOUAKOU MOAYÉ', 'NANGUY RYAN', 'GONDO SAMUEL',
    'KOUASSI KOFFI CHRIST', 'AFFI BEDA', 'KOUASSI ARIEL', 'HANSI KOKOU',
    'GONDO DAVID', 'KASSI CHRIST', 'KONAN HENRI', 'KOUAME MOAYÉ',
    'SANOGO NOAH', 'KRA KOUAKOU', 'OUANKO KOUADIO', 'AMOUZOUKAN HAROLD',
    'IBO CLAUDE RAYAN', 'KOFFI ASSENA', 'KOUASSI ABONOUA', 'SOUANGA N\'GEUSSAN',
    'KAMBOU KYLIAN', 'NIBA ISRAËL', 'DIE ASSOUMOU JEAN', 'SANOGO DERECK',
    'ALLIALI AMANY', 'SORO KADER'
  ];

  function seedResponsables() {
    return INITIAL_TRAINERS.concat(SEED_RESPONSABLES.map(function (n, i) {
      return { id: 'tr_r' + String(i + 1).padStart(2, '0'), name: n, role: 'Responsable', tel: '' };
    }));
  }

  function seedServants() {
    return SEED_SERVANTS.map(function (n, i) {
      return { id: 'sv_' + String(i + 1).padStart(3, '0'), nom: n, niveau: '', tel: '', note: '', actif: true };
    });
  }

  // PROGRAMMES PÉDAGOGIQUES DÉTAILLÉS DES 4 NIVEAUX
  var LEVEL_GUIDE = {
    postulant: {
      name: 'Postulant', badge: 'lvl-postulant', emoji: '🌱', color: 'var(--postulant)',
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
      name: 'Samuel', badge: 'lvl-samuel', emoji: '🔔', color: 'var(--samuel)',
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
      name: 'Tarcisius', badge: 'lvl-tarcisius', emoji: '🛡️', color: 'var(--tarcisius)',
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
      name: 'Augustin', badge: 'lvl-augustin', emoji: '🏆', color: 'var(--augustin)',
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
  var editingTrainerId = null;

  // Servants & présences (réservé au responsable, jamais mis en cache local)
  var servants = [];
  var presences = {};
  var membresLoaded = false;
  var editingServantId = null;
  var svSelection = {};
  var appelDraft = {};
  var activeTab = 'servants';

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

  function init() {
    viewMode = localStorage.getItem(STORAGE_KEY_VIEW) || 'list';
    loadData();
    checkAuth();
    buildMonthOptions();
    populateTrainerSelect();
    setupEvents();
    setupViewToggle();
    setupBurger();
    setupGestion();
    render();
    fetchRemoteData();
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

  function fetchRemoteData() {
    fetch(API_BASE + '/api/formations')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.sessions)) return;
        // Migration douce : si le serveur est vide mais que le navigateur
        // contient des séances (ancienne version), on les garde.
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
        // Hors-ligne ou serveur indisponible : cache local + responsables de secours
        if (trainers.length <= 1) {
          trainers = seedResponsables();
          populateTrainerSelect();
          render();
        }
      });
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEY_TRAINERS, JSON.stringify(trainers));
  }

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
        'Quitter Admin' :
        'Espace Responsable';
      adminBtn.className = isAdmin ? 'btn btn-outline-gold btn-sm' : 'btn btn-outline-light btn-sm';
    }
    if (addBtn) addBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (securityBtn) securityBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (addTrainerBtn) addTrainerBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (dupBtn) dupBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    var gestion = document.getElementById('gestion-section');
    if (gestion) gestion.style.display = isAdmin ? '' : 'none';
    if (isAdmin && !membresLoaded) fetchMembres();
    if (!isAdmin) { servants = []; presences = {}; membresLoaded = false; }
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

      var emptyHtml =
        '<div class="empty-state">' +
          '<div class="empty-icon"></div>' +
          '<div class="empty-title">' + emptyMsg + '</div>' +
          '<p class="empty-text">Le planning de ce mois est actuellement vierge. Vous pouvez ajouter les samedis de formation au fur et à mesure.</p>' +
          (isAdmin ?
            '<button type="button" class="btn btn-gold btn-sm" id="emptyAddBtn">Programmer une séance pour ' + MONTH_NAMES[currentMonth] + '</button>' :
            '<span class="empty-hint">Connectez-vous à l\'Espace Responsable pour saisir les dates.</span>') +
        '</div>';

      scheduleBodyEl.innerHTML = '<tr><td colspan="7" class="empty-cell">' + emptyHtml + '</td></tr>';

      var emptyAdd = document.getElementById('emptyAddBtn');
      if (emptyAdd) {
        emptyAdd.onclick = function () { openSessionForm(null); };
      }

      if (scheduleMobileContainer) {
        scheduleMobileContainer.innerHTML = emptyHtml.replace('id="emptyAddBtn"', 'id="emptyAddMobileBtn"');
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

    filtered.forEach(function (s, i) {
      var d = parseDateLocal(s.date);
      var dateFormatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
      var dateFull = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      var badgeClass = getBadgeClassForLevel(s.level);
      var lvlBorderClass = 'border-level-' + (s.level || 'tous').toLowerCase();

      // Vue Tableau (Desktop & Impression)
      html +=
        '<tr style="--i:' + i + '">' +
          '<td class="col-date cell-date">' + capitalizeFirst(dateFormatted) + '</td>' +
          '<td class="col-time"><span class="time-pill">' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</span></td>' +
          '<td class="col-level"><span class="' + badgeClass + '">' + escapeHtml(s.level) + '</span></td>' +
          '<td class="col-topic">' +
            '<div class="topic-title">' + escapeHtml(s.topic) + '</div>' +
            (s.objectives ? '<div class="topic-obj">ℹ️ ' + escapeHtml(s.objectives) + '</div>' : '') +
          '</td>' +
          '<td class="col-trainer cell-muted">' + escapeHtml(s.trainer) + '</td>' +
          '<td class="col-location"><span class="cell-muted">' + escapeHtml(s.location) + '</span></td>' +
          '<td class="action-col">' +
            '<div class="acts">' +
              '<button class="btn btn-icon ai-wa share-single-btn" data-id="' + s.id + '" title="Partager sur WhatsApp">WhatsApp</button>' +
              '<button class="btn btn-icon ai-cal cal-session-btn" data-id="' + s.id + '" title="Ajouter au calendrier">Agenda</button>' +
              '<button class="btn btn-icon ai-pres presence-session-btn" data-id="' + s.id + '" title="Imprimer la fiche de présence">Présence</button>' +
              (isAdmin ?
                '<button class="btn btn-icon ai-edit edit-session-btn" data-id="' + s.id + '" title="Modifier">Modifier</button>' +
                '<button class="btn btn-icon ai-del delete-session-btn" data-id="' + s.id + '" title="Supprimer">Supprimer</button>' : '') +
            '</div>' +
          '</td>' +
        '</tr>';

      // Vue Cartes (Mobile)
      mobileHtml +=
        '<div class="mobile-session-card ' + lvlBorderClass + '" style="--i:' + i + '">' +
          '<div class="ms-head">' +
            '<div class="ms-date">' + capitalizeFirst(dateFull) + '</div>' +
            '<span class="' + badgeClass + '">' + escapeHtml(s.level) + '</span>' +
          '</div>' +
          '<h6 class="ms-topic">' + escapeHtml(s.topic) + '</h6>' +
          (s.objectives ? '<div class="ms-obj">ℹ️ ' + escapeHtml(s.objectives) + '</div>' : '') +
          '<div class="ms-meta">' +
            '<span>' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</span>' +
            '<span>' + escapeHtml(s.trainer) + '</span>' +
            '<span>' + escapeHtml(s.location) + '</span>' +
          '</div>' +
          '<div class="ms-actions">' +
            '<button class="btn btn-success btn-sm share-single-btn" data-id="' + s.id + '">WhatsApp</button>' +
            '<button class="btn btn-icon ai-cal cal-session-btn" data-id="' + s.id + '" title="Ajouter au calendrier">Agenda</button>' +
            '<button class="btn btn-icon ai-pres presence-session-btn" data-id="' + s.id + '" title="Fiche de présence">Présence</button>' +
          '</div>' +
          (isAdmin ?
            '<div class="ms-admin">' +
              '<button class="btn btn-outline btn-sm edit-session-btn" data-id="' + s.id + '">Modifier</button>' +
              '<button class="btn btn-danger btn-sm delete-session-btn" data-id="' + s.id + '">Supprimer</button>' +
            '</div>' : '') +
        '</div>';
    });

    scheduleBodyEl.innerHTML = html;
    if (scheduleMobileContainer) scheduleMobileContainer.innerHTML = mobileHtml;

    renderTrainersList();
  }

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
      '<div class="next-session-card">' +
        '<div class="next-left">' +
          '<div class="next-session-icon"></div>' +
          '<div>' +
            '<div class="next-count">Prochaine formation — ' + countdown + '</div>' +
            '<div class="next-title">' + capitalizeFirst(dateFull) + ' • ' + escapeHtml(next.startTime) + ' - ' + escapeHtml(next.endTime) + '</div>' +
            '<div class="next-sub"><span class="' + getBadgeClassForLevel(next.level) + '">' + escapeHtml(next.level) + '</span>' + escapeHtml(next.topic) + ' — ' + escapeHtml(next.location) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="next-actions">' +
          '<button class="btn btn-outline btn-sm cal-session-btn" data-id="' + next.id + '">Calendrier</button>' +
          '<button class="btn btn-success btn-sm share-single-btn" data-id="' + next.id + '">Partager</button>' +
        '</div>' +
      '</div>';
  }

  function renderCalendarView() {
    var container = document.getElementById('calendarViewContainer');
    if (!container) return;
    if (viewMode !== 'calendar') return;

    var filtered = getFilteredSessions();
    var byDay = {};
    filtered.forEach(function (s) {
      var d = parseDateLocal(s.date);
      if (d) { (byDay[d.getDate()] = byDay[d.getDate()] || []).push(s); }
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

      (byDay[day] || []).forEach(function (s, evIdx) {
        var lvl = (s.level || 'tous').toLowerCase();
        html += '<span class="cal-event cal-event-' + lvl + '" style="--i:' + evIdx + '" title="' + escapeHtml(s.startTime + ' - ' + s.topic + ' (' + s.level + ')') + '">' +
          escapeHtml(s.startTime) + ' ' + escapeHtml(truncate(s.topic, 18)) +
        '</span>';
      });

      html += '</div>';
    }

    html += '</div>';
    if (!filtered.length) {
      html += '<p class="cal-empty-note">ℹ️ Aucune séance ce mois-ci. Les samedis sont surlignés.</p>';
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
      if (listBtn) listBtn.classList.toggle('active', !isCal);
      if (calBtn) calBtn.classList.toggle('active', isCal);
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

  function setupBurger() {
    var burger = document.getElementById('burgerBtn');
    var nav = document.getElementById('topnav');
    if (!burger || !nav) return;
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Fermer le menu au clic sur un lien
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function getBadgeClassForLevel(level) {
    var lvl = (level || '').toLowerCase();
    if (lvl === 'postulant') return 'badge lvl-postulant';
    if (lvl === 'samuel') return 'badge lvl-samuel';
    if (lvl === 'tarcisius') return 'badge lvl-tarcisius';
    if (lvl === 'augustin') return 'badge lvl-augustin';
    return 'badge lvl-tous';
  }

  function renderTrainersList() {
    if (!trainersListContainer) return;
    var html = '';
    trainers.forEach(function (tr) {
      html +=
        '<div class="trainer-item">' +
          '<div class="trainer-item-left">' +
            '<div class="trainer-item-avatar"></div>' +
            '<div>' +
              '<div class="trainer-item-name">' + escapeHtml(tr.name) + '</div>' +
              '<div class="trainer-item-role">' + escapeHtml(tr.role || 'Formateur') + '</div>' +
            '</div>' +
          '</div>' +
          (tr.tel ? '<a href="tel:' + tr.tel.replace(/\s/g, '') + '" class="btn btn-outline btn-sm">Appeler</a>' : '') +
        '</div>';
    });
    trainersListContainer.innerHTML = html;
    if (isAdmin) renderGestion();
  }

  // ==================== ÉVÉNEMENTS ====================

  function setupEvents() {
    setupMonthSelectors();

    // Filtres niveaux (chips)
    levelChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        levelChips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
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

    // Fermeture des modales : boutons data-close, clic sur le fond, Échap
    document.addEventListener('click', function (e) {
      var closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        var m = closeBtn.closest('.modal');
        if (m) closeModal(m);
        return;
      }
      if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var open = document.querySelector('.modal.open');
        if (open) closeModal(open);
      }
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
        openTrainerForm(null);
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
        var existing = editingTrainerId && trainers.find(function (t) { return t.id === editingTrainerId; });
        if (existing) {
          // Renommage : on met aussi à jour les séances qui citaient l'ancien nom
          sessions.forEach(function (s) { if (s.trainer === existing.name) s.trainer = name; });
          existing.name = name;
          existing.role = role || 'Formateur';
          existing.tel = tel || '';
        } else {
          trainers.push({ id: 'tr_' + Date.now(), name: name, role: role || 'Formateur', tel: tel || '' });
        }
        saveAll();
        populateTrainerSelect();
        closeModal(trainerModal);
        trainerForm.reset();
        render();
        showToast(existing ? 'Responsable modifié.' : 'Responsable ajouté.');
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
      var nth = Math.floor((d.getDate() - 1) / 7) + 1;
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
        '<div class="ci-t">' + escapeHtml(s.topic) + '</div>' +
        '<div class="ci-l">' + capitalizeFirst(dateFull) + ' • ' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime) + '</div>' +
        '<div class="ci-l">' + escapeHtml(s.location) + ' • ' + escapeHtml(s.trainer) + '</div>';
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
    var d = parseDateLocal(s.date);
    var dateFull = capitalizeFirst(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    var meta =
      '<tr><td><strong>Niveau :</strong></td><td>' + escapeHtml(s.level) + '</td>' +
          '<td><strong>Formateur :</strong></td><td>' + escapeHtml(s.trainer) + '</td></tr>' +
      '<tr><td><strong>Thème :</strong></td><td colspan="3">' + escapeHtml(s.topic) + '</td></tr>' +
      '<tr><td><strong>Lieu :</strong></td><td colspan="3">' + escapeHtml(s.location) + '</td></tr>';

    function go() {
      var allBox = document.getElementById('appelAllLevels');
      var list = isAdmin ? getAppelServants(s, allBox && allBox.checked).list : [];
      var record = presences[s.id] || {};
      var rows = list.length ? list.map(function (sv, i) {
        var st = record[sv.id];
        return [i + 1, escapeHtml(sv.nom), escapeHtml(sv.niveau || '—'), st ? STATUT_LABELS[st] : '', ''];
      }) : new Array(20).fill(0).map(function (_, i) { return [i + 1, '', '', '', '']; });
      printDocument({
        subtitle: 'Liste d\'appel — Fiche de présence',
        date: dateFull + ' • ' + escapeHtml(s.startTime) + ' - ' + escapeHtml(s.endTime),
        meta: meta,
        cols: [['N°', 6], ['Nom & Prénoms', 44], ['Niveau', 14], ['Présence', 14], ['Observations', 22]],
        rows: rows,
        foot: '<div>Présents : ' + (list.length ? countStatus(record, list, 'P') + ' / ' + list.length : '________') + '</div>' +
              '<div><strong>Visa du Formateur :</strong> ______________________</div>'
      });
    }
    if (isAdmin && !membresLoaded) fetchMembres(go); else go();
  }

  function printDocument(opt) {
    var sheet = document.getElementById('printPresenceSheet');
    if (!sheet) return;
    var head = opt.cols.map(function (c) { return '<th style="width:' + c[1] + '%;">' + escapeHtml(c[0]) + '</th>'; }).join('');
    var body = opt.rows.map(function (r) {
      return '<tr>' + r.map(function (cell, i) { return '<td' + (i === 0 ? ' class="pp-num"' : '') + '>' + cell + '</td>'; }).join('') + '</tr>';
    }).join('');
    sheet.innerHTML =
      '<div class="presence-doc">' +
        '<div class="pp-head">' +
          '<img src="logoservantdemesse.jpg" alt="Logo" class="print-header-logo">' +
          '<div class="pp-head-text">' +
            '<h2 class="pp-title font-cinzel">Paroisse Saint-Bernard d\'Adiopodoumé</h2>' +
            '<p class="pp-sub">Groupe des Servants de Messe • ' + opt.subtitle + '</p>' +
            '<p class="pp-date">' + opt.date + '</p>' +
          '</div>' +
          '<img src="logoeglise.jpeg" alt="Logo" class="print-header-logo">' +
        '</div>' +
        (opt.meta ? '<table class="presence-meta">' + opt.meta + '</table>' : '') +
        '<table class="presence-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>' +
        '<div class="pp-foot">' + (opt.foot || '') + '</div>' +
      '</div>';
    document.body.classList.add('printing-presence');
    window.print();
    setTimeout(function () { document.body.classList.remove('printing-presence'); }, 2000);
  }

  // ==================== ESPACE GESTION : SERVANTS, RESPONSABLES, APPEL ====================

  var NIVEAUX = ['Postulant', 'Samuel', 'Tarcisius', 'Augustin'];
  var STATUT_LABELS = { P: 'Présent', A: 'Absent', R: 'Retard', E: 'Excusé' };
  var saveMembresTimer = null;

  function $(id) { return document.getElementById(id); }

  function fetchMembres(cb) {
    setMembresStatus('Chargement…');
    fetch(API_BASE + '/api/formations/membres', { headers: apiHeaders() })
      .then(function (res) {
        if (res.status === 401) throw new Error('auth');
        if (!res.ok) throw new Error('http');
        return res.json();
      })
      .then(function (data) {
        servants = Array.isArray(data.servants) ? data.servants : [];
        presences = data.presences && typeof data.presences === 'object' ? data.presences : {};
        membresLoaded = true;
        setMembresStatus('Synchronisé');
        renderGestion();
        if (cb) cb();
      })
      .catch(function (err) {
        if (err.message !== 'auth' && !servants.length) {
          // Secours local : liste officielle embarquée, en attente du serveur
          servants = seedServants();
          presences = {};
          membresLoaded = true;
          setMembresStatus('Mode hors-ligne — enregistrement impossible tant que le serveur est injoignable', true);
          renderGestion();
        } else {
          setMembresStatus(err.message === 'auth' ? 'Session expirée' : 'Serveur injoignable', true);
        }
        if (cb) cb();
      });
  }

  function saveMembres() {
    if (!adminPassword || !membresLoaded) return;
    setMembresStatus('Enregistrement…');
    clearTimeout(saveMembresTimer);
    // Regroupe les modifications rapprochées en une seule écriture
    saveMembresTimer = setTimeout(function () {
      fetch(API_BASE + '/api/formations/membres', {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ servants: servants, presences: presences })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          setMembresStatus('Synchronisé');
        })
        .catch(function () {
          setMembresStatus('Échec de l\'enregistrement — réessayez', true);
          showToast('Impossible d\'enregistrer sur le serveur.');
        });
    }, 700);
  }

  function setMembresStatus(txt, isError) {
    var el = $('membresStatus');
    if (!el) return;
    el.textContent = txt;
    el.classList.toggle('is-error', !!isError);
  }

  function attendanceRate(servantId) {
    var total = 0, ok = 0;
    Object.keys(presences).forEach(function (sid) {
      var st = presences[sid][servantId];
      if (!st) return;
      total++;
      if (st === 'P' || st === 'R') ok++;
    });
    return total ? { pct: Math.round(ok * 100 / total), total: total } : null;
  }

  function countStatus(record, list, st) {
    return list.filter(function (sv) { return record[sv.id] === st; }).length;
  }

  function sortByName(a, b) { return a.nom.localeCompare(b.nom, 'fr'); }

  function setupGestion() {
    var section = $('gestion-section');
    if (!section) return;

    section.querySelectorAll('.gtab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        activeTab = tab.getAttribute('data-tab');
        section.querySelectorAll('.gtab').forEach(function (t) { t.classList.toggle('active', t === tab); });
        $('tabServants').hidden = activeTab !== 'servants';
        $('tabResponsables').hidden = activeTab !== 'responsables';
        $('tabAppel').hidden = activeTab !== 'appel';
        renderGestion();
      });
    });

    // --- Servants ---
    $('svSearch').addEventListener('input', renderServants);
    $('svLevelFilter').addEventListener('change', function () { svSelection = {}; renderServants(); renderSummary(); });
    $('svAddBtn').addEventListener('click', function () { openServantForm(null); });
    $('svPrintBtn').addEventListener('click', printServantList);

    $('svCheckAll').addEventListener('change', function () {
      var on = this.checked;
      svSelection = {};
      if (on) getVisibleServants().forEach(function (sv) { svSelection[sv.id] = true; });
      renderServants();
    });

    $('svBulkApply').addEventListener('click', function () {
      var ids = Object.keys(svSelection);
      if (!ids.length) return;
      var lvl = $('svBulkLevel').value;
      servants.forEach(function (sv) { if (svSelection[sv.id]) sv.niveau = lvl; });
      svSelection = {};
      saveMembres();
      renderGestion();
      showToast(ids.length + ' servant(s) : niveau « ' + (lvl || 'Non attribué') + ' ».');
    });

    $('svBulkDelete').addEventListener('click', function () {
      var ids = Object.keys(svSelection);
      if (!ids.length || !confirm('Supprimer définitivement ' + ids.length + ' servant(s) de la liste ?')) return;
      servants = servants.filter(function (sv) { return !svSelection[sv.id]; });
      svSelection = {};
      saveMembres();
      renderGestion();
      showToast(ids.length + ' servant(s) supprimé(s).');
    });

    $('svTableBody').addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-id');
      if (e.target.classList.contains('sv-check')) {
        if (e.target.checked) svSelection[id] = true; else delete svSelection[id];
        updateBulkBar();
      } else if (e.target.classList.contains('sv-level')) {
        var sv = servants.find(function (x) { return x.id === id; });
        if (sv) { sv.niveau = e.target.value; saveMembres(); renderSummary(); }
      }
    });

    $('svTableBody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (btn.getAttribute('data-act') === 'edit') openServantForm(id);
      if (btn.getAttribute('data-act') === 'del') {
        var sv = servants.find(function (x) { return x.id === id; });
        if (sv && confirm('Supprimer ' + sv.nom + ' de la liste ?')) {
          servants = servants.filter(function (x) { return x.id !== id; });
          delete svSelection[id];
          saveMembres();
          renderGestion();
          showToast('Servant supprimé.');
        }
      }
    });

    $('svSummary').addEventListener('click', function (e) {
      var pill = e.target.closest('[data-lvl]');
      if (!pill) return;
      $('svLevelFilter').value = pill.getAttribute('data-lvl');
      svSelection = {};
      renderServants();
      renderSummary();
    });

    $('servantForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = $('svNom').value.trim().replace(/\s+/g, ' ').toUpperCase();
      if (!nom) return;
      var data = {
        nom: nom,
        niveau: $('svNiveau').value,
        tel: $('svTel').value.trim(),
        note: $('svNote').value.trim(),
        actif: $('svActif').checked
      };
      var sv = editingServantId && servants.find(function (x) { return x.id === editingServantId; });
      if (sv) {
        Object.assign(sv, data);
      } else {
        if (servants.some(function (x) { return x.nom === nom; }) && !confirm(nom + ' existe déjà. L\'ajouter quand même ?')) return;
        servants.push(Object.assign({ id: 'sv_' + Date.now() }, data));
      }
      saveMembres();
      closeModal($('servantModal'));
      renderGestion();
      showToast(sv ? 'Servant modifié.' : 'Servant ajouté.');
    });

    // --- Responsables ---
    $('trAddBtn2').addEventListener('click', function () { openTrainerForm(null); });
    $('trTableBody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (btn.getAttribute('data-act') === 'edit') openTrainerForm(id);
      if (btn.getAttribute('data-act') === 'del') {
        var tr = trainers.find(function (t) { return t.id === id; });
        if (!tr) return;
        if (trainers.length <= 1) { alert('Il doit rester au moins un responsable.'); return; }
        var used = sessions.filter(function (s) { return s.trainer === tr.name; }).length;
        var msg = 'Supprimer ' + tr.name + ' des responsables ?' + (used ? '\n(' + used + ' séance(s) le citent comme formateur : elles seront conservées.)' : '');
        if (!confirm(msg)) return;
        trainers = trainers.filter(function (t) { return t.id !== id; });
        saveAll();
        populateTrainerSelect();
        render();
        showToast('Responsable supprimé.');
      }
    });

    // --- Appel ---
    $('appelSession').addEventListener('change', function () { appelDraft = {}; renderAppel(); });
    $('appelAllLevels').addEventListener('change', renderAppel);
    $('appelList').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-st]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var st = btn.getAttribute('data-st');
      var s = currentAppelSession();
      var current = Object.prototype.hasOwnProperty.call(appelDraft, id) ? appelDraft[id] : ((s && presences[s.id] || {})[id] || '');
      appelDraft[id] = current === st ? '' : st;
      renderAppel();
    });
    $('appelAllP').addEventListener('click', function () {
      var s = currentAppelSession();
      if (!s) return;
      getAppelServants(s, $('appelAllLevels').checked).list.forEach(function (sv) { appelDraft[sv.id] = 'P'; });
      renderAppel();
    });
    $('appelReset').addEventListener('click', function () {
      var s = currentAppelSession();
      if (!s || !confirm('Effacer l\'appel de cette séance ?')) return;
      appelDraft = {};
      delete presences[s.id];
      saveMembres();
      renderGestion();
    });
    $('appelSave').addEventListener('click', function () {
      var s = currentAppelSession();
      if (!s) return;
      var record = Object.assign({}, presences[s.id] || {});
      Object.keys(appelDraft).forEach(function (id) {
        if (appelDraft[id]) record[id] = appelDraft[id]; else delete record[id];
      });
      presences[s.id] = record;
      appelDraft = {};
      saveMembres();
      renderGestion();
      showToast('Appel enregistré.');
    });
    $('appelPrint').addEventListener('click', function () {
      var s = currentAppelSession();
      if (s) printPresenceSheet(s.id);
    });
  }

  function openServantForm(id) {
    editingServantId = id;
    var sv = id && servants.find(function (x) { return x.id === id; });
    var filter = $('svLevelFilter').value;
    $('servantModalLabel').textContent = sv ? 'Modifier le servant' : 'Ajouter un servant';
    $('svNom').value = sv ? sv.nom : '';
    $('svNiveau').value = sv ? (sv.niveau || '') : (filter === 'all' ? '' : filter);
    $('svTel').value = sv ? (sv.tel || '') : '';
    $('svNote').value = sv ? (sv.note || '') : '';
    $('svActif').checked = sv ? sv.actif !== false : true;
    openModal($('servantModal'));
    $('svNom').focus();
  }

  function openTrainerForm(id) {
    editingTrainerId = id;
    var tr = id && trainers.find(function (t) { return t.id === id; });
    $('trainerModalLabel').textContent = tr ? 'Modifier le responsable' : 'Ajouter un responsable';
    $('trainerName').value = tr ? tr.name : '';
    $('trainerRole').value = tr ? (tr.role || '') : 'Responsable';
    $('trainerTel').value = tr ? (tr.tel || '') : '';
    openModal(trainerModal);
  }

  function renderGestion() {
    if (!$('gestion-section') || !isAdmin) return;
    $('svCountBadge').textContent = servants.length;
    $('trCountBadge').textContent = trainers.length;
    renderSummary();
    if (activeTab === 'servants') renderServants();
    if (activeTab === 'responsables') renderResponsables();
    if (activeTab === 'appel') { buildAppelSessionOptions(); renderAppel(); }
  }

  function renderSummary() {
    var current = $('svLevelFilter').value;
    var counts = { all: servants.length, '': 0 };
    NIVEAUX.forEach(function (n) { counts[n] = 0; });
    servants.forEach(function (sv) { counts[sv.niveau || ''] = (counts[sv.niveau || ''] || 0) + 1; });
    var items = [['all', 'Tous']].concat(NIVEAUX.map(function (n) { return [n, n]; }), [['', 'Non attribué']]);
    $('svSummary').innerHTML = items.map(function (it) {
      return '<button type="button" class="lvl-pill' + (current === it[0] ? ' active' : '') + '" data-lvl="' + it[0] + '">' +
        escapeHtml(it[1]) + ' <strong>' + counts[it[0]] + '</strong></button>';
    }).join('');
  }

  function getVisibleServants() {
    var q = $('svSearch').value.trim().toLowerCase();
    var lvl = $('svLevelFilter').value;
    return servants.filter(function (sv) {
      if (lvl !== 'all' && (sv.niveau || '') !== lvl) return false;
      return !q || sv.nom.toLowerCase().indexOf(q) !== -1;
    }).sort(sortByName);
  }

  function renderServants() {
    var body = $('svTableBody');
    if (!membresLoaded) {
      body.innerHTML = '<tr><td colspan="6" class="gempty">Chargement de la liste…</td></tr>';
      return;
    }
    var list = getVisibleServants();
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="6" class="gempty">Aucun servant dans cette liste.</td></tr>';
      updateBulkBar();
      return;
    }
    body.innerHTML = list.map(function (sv, i) {
      var rate = attendanceRate(sv.id);
      var opts = '<option value="">Non attribué</option>' + NIVEAUX.map(function (n) {
        return '<option value="' + n + '"' + (sv.niveau === n ? ' selected' : '') + '>' + n + '</option>';
      }).join('');
      return '<tr class="' + (sv.actif === false ? 'is-inactive' : '') + '">' +
        '<td class="w-check"><input type="checkbox" class="sv-check" data-id="' + sv.id + '"' + (svSelection[sv.id] ? ' checked' : '') + ' aria-label="Sélectionner"></td>' +
        '<td class="w-num">' + (i + 1) + '</td>' +
        '<td><div class="g-name">' + escapeHtml(sv.nom) + (sv.actif === false ? ' <span class="g-tag">inactif</span>' : '') + '</div>' +
          (sv.tel || sv.note ? '<div class="g-sub">' + escapeHtml([sv.tel, sv.note].filter(Boolean).join(' · ')) + '</div>' : '') + '</td>' +
        '<td><select class="select select-sm sv-level" data-id="' + sv.id + '" aria-label="Niveau">' + opts + '</select></td>' +
        '<td class="hide-sm">' + (rate ? '<span class="g-rate' + (rate.pct < 60 ? ' low' : '') + '">' + rate.pct + ' %</span> <span class="g-sub">(' + rate.total + ' appels)</span>' : '<span class="g-sub">—</span>') + '</td>' +
        '<td class="t-right"><div class="g-acts">' +
          '<button type="button" class="btn btn-outline btn-icon" data-act="edit" data-id="' + sv.id + '">Modifier</button>' +
          '<button type="button" class="btn btn-outline btn-icon txt-danger" data-act="del" data-id="' + sv.id + '">Supprimer</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
    updateBulkBar();
  }

  function updateBulkBar() {
    var n = Object.keys(svSelection).length;
    $('svBulkBar').classList.toggle('show', n > 0);
    $('svSelCount').textContent = n + (n > 1 ? ' sélectionnés' : ' sélectionné');
    var visible = getVisibleServants();
    $('svCheckAll').checked = visible.length > 0 && visible.every(function (sv) { return svSelection[sv.id]; });
  }

  function printServantList() {
    var lvl = $('svLevelFilter').value;
    var list = getVisibleServants();
    var title = lvl === 'all' ? 'Liste globale des servants (tous niveaux)' : 'Liste des servants — ' + (lvl || 'Niveau non attribué');
    printDocument({
      subtitle: title,
      date: list.length + ' servant(s) • ' + capitalizeFirst(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })),
      cols: [['N°', 6], ['Nom & Prénoms', 46], ['Niveau', 18], ['Téléphone', 16], ['Présence', 14]],
      rows: list.map(function (sv, i) {
        var r = attendanceRate(sv.id);
        return [i + 1, escapeHtml(sv.nom), escapeHtml(sv.niveau || '—'), escapeHtml(sv.tel || ''), r ? r.pct + ' %' : ''];
      }),
      foot: '<div>Responsable Formation : DJEBLE Haniel</div><div><strong>Visa :</strong> ______________________</div>'
    });
  }

  function renderResponsables() {
    $('trTableBody').innerHTML = trainers.map(function (tr, i) {
      var count = sessions.filter(function (s) { return s.trainer === tr.name; }).length;
      return '<tr>' +
        '<td class="w-num">' + (i + 1) + '</td>' +
        '<td><div class="g-name">' + escapeHtml(tr.name) + '</div></td>' +
        '<td class="hide-sm">' + escapeHtml(tr.role || '') + '</td>' +
        '<td class="hide-sm">' + escapeHtml(tr.tel || '—') + '</td>' +
        '<td>' + count + '</td>' +
        '<td class="t-right"><div class="g-acts">' +
          '<button type="button" class="btn btn-outline btn-icon" data-act="edit" data-id="' + tr.id + '">Modifier</button>' +
          '<button type="button" class="btn btn-outline btn-icon txt-danger" data-act="del" data-id="' + tr.id + '">Supprimer</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function buildAppelSessionOptions() {
    var sel = $('appelSession');
    var prev = sel.value;
    var sorted = sessions.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (!sorted.length) {
      sel.innerHTML = '<option value="">Aucune séance planifiée — ajoutez d\'abord une séance</option>';
      return;
    }
    var today = toISODate(new Date());
    sel.innerHTML = sorted.map(function (s) {
      var d = parseDateLocal(s.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      var done = presences[s.id] && Object.keys(presences[s.id]).length ? ' (appel fait)' : '';
      return '<option value="' + s.id + '">' + escapeHtml(capitalizeFirst(d) + ' — ' + s.level + ' — ' + s.topic + done) + '</option>';
    }).join('');
    if (prev && sorted.some(function (s) { return s.id === prev; })) {
      sel.value = prev;
    } else {
      // Par défaut : la séance passée la plus récente (sinon la prochaine)
      var past = sorted.find(function (s) { return s.date <= today; });
      sel.value = (past || sorted[sorted.length - 1]).id;
    }
  }

  function currentAppelSession() {
    var id = $('appelSession').value;
    return sessions.find(function (s) { return s.id === id; }) || null;
  }

  function getAppelServants(s, allLevels) {
    var actifs = servants.filter(function (sv) { return sv.actif !== false; }).sort(sortByName);
    if (allLevels || !s || NIVEAUX.indexOf(s.level) === -1) return { list: actifs, fallback: false };
    var lvlList = actifs.filter(function (sv) { return sv.niveau === s.level; });
    // Niveaux pas encore attribués : on affiche tout le monde
    return lvlList.length ? { list: lvlList, fallback: false } : { list: actifs, fallback: true };
  }

  function renderAppel() {
    var listEl = $('appelList');
    var statsEl = $('appelStats');
    var notice = $('appelNotice');
    var s = currentAppelSession();
    if (!s) {
      listEl.innerHTML = '<p class="gempty">Planifiez une séance pour pouvoir faire l\'appel.</p>';
      statsEl.innerHTML = '';
      notice.hidden = true;
      return;
    }
    if (!membresLoaded) { listEl.innerHTML = '<p class="gempty">Chargement…</p>'; return; }

    var res = getAppelServants(s, $('appelAllLevels').checked);
    notice.hidden = !res.fallback;
    notice.textContent = 'Aucun servant n\'est encore attribué au niveau ' + s.level + ' : tous les servants actifs sont affichés. Attribuez les niveaux dans l\'onglet Servants.';

    var saved = presences[s.id] || {};
    var merged = {};
    res.list.forEach(function (sv) {
      merged[sv.id] = Object.prototype.hasOwnProperty.call(appelDraft, sv.id) ? appelDraft[sv.id] : (saved[sv.id] || '');
    });
    var c = { P: 0, A: 0, R: 0, E: 0, none: 0 };
    res.list.forEach(function (sv) { c[merged[sv.id] || 'none']++; });
    var dirty = Object.keys(appelDraft).length > 0;
    statsEl.innerHTML =
      '<span><strong>' + res.list.length + '</strong> appelés</span>' +
      '<span><strong>' + c.P + '</strong> présents</span>' +
      '<span><strong>' + c.A + '</strong> absents</span>' +
      '<span><strong>' + c.R + '</strong> retards</span>' +
      '<span><strong>' + c.E + '</strong> excusés</span>' +
      '<span><strong>' + c.none + '</strong> non renseignés</span>' +
      (dirty ? '<span class="st-dirty">Modifications non enregistrées</span>' : '');

    listEl.innerHTML = res.list.length ? res.list.map(function (sv, i) {
      var cur = merged[sv.id];
      return '<div class="appel-row">' +
        '<span class="appel-num">' + (i + 1) + '</span>' +
        '<span class="appel-name">' + escapeHtml(sv.nom) + (sv.niveau ? ' <span class="g-sub">' + escapeHtml(sv.niveau) + '</span>' : '') + '</span>' +
        '<span class="appel-btns">' + ['P', 'A', 'R', 'E'].map(function (st) {
          return '<button type="button" class="st-btn st-' + st + (cur === st ? ' on' : '') + '" data-st="' + st + '" data-id="' + sv.id + '">' + STATUT_LABELS[st] + '</button>';
        }).join('') + '</span>' +
      '</div>';
    }).join('') : '<p class="gempty">Aucun servant actif. Ajoutez des servants dans l\'onglet Servants.</p>';
  }

  // ==================== PROGRAMME DES NIVEAUX ====================

  function openLevelModal(levelKey) {
    var guide = LEVEL_GUIDE[levelKey];
    if (!guide) return;

    var title = document.getElementById('levelModalTitle');
    var body = document.getElementById('levelModalBody');
    if (title) {
      title.innerHTML = '<span class="badge ' + guide.badge + '">Niveau</span> ' + guide.name;
    }
    if (body) {
      var modulesHtml = guide.modules.map(function (m) {
        return '<li><span style="color:' + guide.color + ';"></span><span>' + m + '</span></li>';
      }).join('');
      var evalHtml = guide.evaluation.map(function (m) {
        return '<li><span style="color:' + guide.color + ';"></span><span>' + m + '</span></li>';
      }).join('');

      body.innerHTML =
        '<div class="guide-hero">' +
          '<div class="guide-icon" style="background:' + guide.color + '22;">' + guide.emoji + '</div>' +
          '<div>' +
            '<div class="guide-motto">« ' + guide.motto + ' »</div>' +
            '<div class="guide-dur">⏳ ' + guide.duration + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="guide-cols">' +
          '<div>' +
            '<h6 class="guide-col-title">Modules enseignés</h6>' +
            '<ul class="guide-list">' + modulesHtml + '</ul>' +
          '</div>' +
          '<div>' +
            '<h6 class="guide-col-title">Critères de passage</h6>' +
            '<ul class="guide-list">' + evalHtml + '</ul>' +
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

  // ==================== MODALES & TOASTS (CUSTOM) ====================

  function openModal(el) {
    if (!el) return;
    el.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeModal(el) {
    if (!el) return;
    el.classList.remove('open');
    if (!document.querySelector('.modal.open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function showToast(msg) {
    var zone = document.getElementById('toastZone');
    if (!zone) {
      zone = document.createElement('div');
      zone.id = 'toastZone';
      zone.className = 'toast-zone';
      document.body.appendChild(zone);
    }
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    zone.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 400);
    }, 3400);
  }

  // ==================== UTILITAIRES ====================

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
