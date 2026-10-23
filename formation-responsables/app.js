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
  var STORAGE_KEY_VIEW = 'formation_view_mode';

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
    'GUEYE CHANCEL', 'OWEL FRANCK', 'CHATIGRE EMMANUEL',
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
    setupServices();
    setupStats();
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
    FB.get('sessions')
      .then(function (data) {
        sessions = data.filter(function (s) { return s && s.date; });
        return FB.get('trainers');
      })
      .then(function (tr) {
        if (tr.length) trainers = tr;
        saveLocal();
        populateTrainerSelect();
        render();
      })
      .catch(function () {
        // Hors-ligne : cache local + responsables de secours
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

  var pendingSessionDeletes = [];

  function saveAll() {
    saveLocal();
    if (!isAdmin) return;
    var ops = sessions.map(function (s) { return { col: 'sessions', id: s.id, data: s }; });
    pendingSessionDeletes.forEach(function (id) {
      ops.push({ col: 'sessions', id: id, del: true });
    });
    FB.batch(ops)
      .then(function () { pendingSessionDeletes = []; })
      .catch(function () {
        showToast('Enregistré en local — synchronisation Firebase impossible.');
      });
  }

  function persistTrainer(t) {
    if (!isAdmin) return;
    FB.put('trainers', t.id, t).catch(function () {
      showToast('Responsable enregistré en local — synchronisation impossible.');
    });
  }

  // ==================== AUTHENTIFICATION FIREBASE ====================

  function checkAuth() {
    FB.onAuth(function (user) {
      isAdmin = !!user;
      updateAdminUI();
      render();
      if (isAdmin) seedIfEmpty();
    });
  }

  function logoutAdmin() {
    FB.signOut().catch(function () {});
  }

  // Premier démarrage : importe les listes officielles si Firestore est vide
  function seedIfEmpty() {
    FB.getDoc('config', 'seeded').then(function (doc) {
      if (doc && doc.done) return;
      var ops = seedServants().map(function (sv) { return { col: 'servants', id: sv.id, data: sv }; })
        .concat(seedResponsables().map(function (t) { return { col: 'trainers', id: t.id, data: t }; }))
        .concat([{ col: 'config', id: 'postes', data: { id: 'postes', list: DEFAULT_POSTES } },
                 { col: 'config', id: 'seeded', data: { done: true, at: new Date().toISOString() } }]);
      return FB.batch(ops).then(function () {
        showToast('Listes officielles importées dans Firebase.');
        fetchRemoteData();
        fetchMembres();
      });
    }).catch(function () {});
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
    if (isAdmin && !membresLoaded) { fetchMembres(); fetchServices(); }
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
          var emailField = document.getElementById('adminEmail');
          if (emailField) { emailField.focus(); }
        }
      });
    }

    var adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('adminEmail').value.trim();
        var pwd = document.getElementById('adminPassword').value;
        if (!email || !pwd) return;
        var submitBtn = adminLoginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        FB.signIn(email, pwd)
          .then(function () {
            closeModal(adminModal);
            showToast('Connexion réussie. Mode Responsable actif.');
          })
          .catch(function () {
            alert('Identifiants incorrects ou compte inexistant.');
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }

    var forgotPwdLink = document.getElementById('forgotPwdLink');
    if (forgotPwdLink) {
      forgotPwdLink.addEventListener('click', function (e) {
        e.preventDefault();
        var email = document.getElementById('adminEmail').value.trim();
        if (!email) { alert('Saisissez votre email puis cliquez sur « Mot de passe oublié ».'); return; }
        FB.resetPassword(email)
          .then(function () { alert('Email de réinitialisation envoyé à ' + email + '.'); })
          .catch(function () { alert('Envoi impossible. Vérifiez l\'adresse email.'); });
      });
    }

    // Sécurité : lien de réinitialisation par email (Firebase gère les mots de passe)
    var securityBtn = document.getElementById('securityBtn');
    if (securityBtn) {
      securityBtn.addEventListener('click', function () {
        var u = FB.currentUser();
        if (!u || !u.email) return;
        if (!confirm('Envoyer un email de changement de mot de passe à ' + u.email + ' ?')) return;
        FB.resetPassword(u.email)
          .then(function () { showToast('Email de réinitialisation envoyé.'); })
          .catch(function () { showToast('Envoi impossible. Réessayez.'); });
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
          var emailField = document.getElementById('adminEmail');
          if (emailField) { emailField.focus(); }
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
        var savedTrainer = trainers.find(function (t) { return t.id === (existing ? editingTrainerId : trainers[trainers.length - 1].id); });
        if (savedTrainer) persistTrainer(savedTrainer);
        if (sessions.some(function (s) { return s.trainer === name; })) saveAll(); else saveLocal();
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
    pendingSessionDeletes.push(id);
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

  // Postes de messe = vocabulaire des compétences des servants
  var DEFAULT_POSTES = [
    'Porte-croix', 'Céroféraire', 'Encensoir', 'Clochette',
    'Navette', 'Livre', 'Pain & Vin', 'Collecteur', 'Lecture'
  ];
  var POSTES = DEFAULT_POSTES.slice();
  var services = [];
  var editingServiceId = null;

  function safeId(txt) { return String(txt).replace(/[^a-z0-9]/gi, '_'); }

  function $(id) { return document.getElementById(id); }

  function fetchMembres(cb) {
    setMembresStatus('Chargement…');
    Promise.all([FB.get('servants'), FB.get('presences'), FB.getDoc('config', 'postes')])
      .then(function (r) {
        servants = r[0];
        presences = {};
        r[1].forEach(function (d) { if (d && d.id) presences[d.id] = d.records || {}; });
        if (r[2] && Array.isArray(r[2].list) && r[2].list.length) POSTES = r[2].list;
        membresLoaded = true;
        setMembresStatus('Synchronisé');
        renderGestion();
        if (cb) cb();
      })
      .catch(function () {
        if (!servants.length) {
          // Secours local en attendant le retour réseau
          servants = seedServants();
          presences = {};
          membresLoaded = true;
          setMembresStatus('Hors-ligne — modifications en attente de synchronisation', true);
          renderGestion();
        } else {
          setMembresStatus('Connexion impossible', true);
        }
        if (cb) cb();
      });
  }

  function markSaving() { setMembresStatus('Enregistrement…'); }
  function markSaved() { setMembresStatus('Synchronisé'); }
  function markFail() {
    setMembresStatus('Échec de l\'enregistrement — réessayez', true);
    showToast('Enregistrement impossible (connexion).');
  }

  function saveServant(sv) { markSaving(); FB.put('servants', sv.id, sv).then(markSaved).catch(markFail); }
  function delServant(id) { markSaving(); FB.del('servants', id).then(markSaved).catch(markFail); }
  function delTrainer(id) { FB.del('trainers', id).catch(function () {}); }
  function savePresences(sessionId) {
    markSaving();
    FB.put('presences', sessionId, { id: sessionId, records: presences[sessionId] || {} })
      .then(markSaved).catch(markFail);
  }
  function delPresences(sessionId) { FB.del('presences', sessionId).catch(markFail); }
  function batchServants(ops) {
    markSaving();
    FB.batch(ops.map(function (o) { o.col = 'servants'; return o; })).then(markSaved).catch(markFail);
  }
  function savePostes() { FB.merge('config', 'postes', { id: 'postes', list: POSTES }).catch(function () {}); }

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
        $('tabServices').hidden = activeTab !== 'services';
        $('tabStats').hidden = activeTab !== 'stats';
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
      var ops = [];
      servants.forEach(function (sv) {
        if (svSelection[sv.id]) {
          if (sv.niveau !== lvl) sv.niveauDepuis = toISODate(new Date());
          sv.niveau = lvl;
          ops.push({ id: sv.id, data: sv });
        }
      });
      svSelection = {};
      batchServants(ops);
      renderGestion();
      showToast(ids.length + ' servant(s) : niveau « ' + (lvl || 'Non attribué') + ' ».');
    });

    $('svBulkDelete').addEventListener('click', function () {
      var ids = Object.keys(svSelection);
      if (!ids.length || !confirm('Supprimer définitivement ' + ids.length + ' servant(s) de la liste ?')) return;
      batchServants(ids.map(function (id) { return { id: id, del: true }; }));
      servants = servants.filter(function (sv) { return !svSelection[sv.id]; });
      svSelection = {};
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
        if (sv) {
          if (sv.niveau !== e.target.value) sv.niveauDepuis = toISODate(new Date());
          sv.niveau = e.target.value;
          saveServant(sv);
          renderSummary();
        }
      }
    });

    $('svTableBody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (btn.getAttribute('data-act') === 'edit') openServantForm(id);
      if (btn.getAttribute('data-act') === 'profil') openProfil(id);
      if (btn.getAttribute('data-act') === 'del') {
        var sv = servants.find(function (x) { return x.id === id; });
        if (sv && confirm('Supprimer ' + sv.nom + ' de la liste ?')) {
          delServant(id);
          servants = servants.filter(function (x) { return x.id !== id; });
          delete svSelection[id];
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
        actif: $('svActif').checked,
        competences: POSTES.filter(function (p) {
          var c = $('svComp_' + safeId(p));
          return c && c.checked;
        })
      };
      var sv = editingServantId && servants.find(function (x) { return x.id === editingServantId; });
      if (sv) {
        if (sv.niveau !== data.niveau) sv.niveauDepuis = toISODate(new Date());
        Object.assign(sv, data);
      } else {
        if (servants.some(function (x) { return x.nom === nom; }) && !confirm(nom + ' existe déjà. L\'ajouter quand même ?')) return;
        sv = Object.assign({ id: 'sv_' + Date.now() }, data);
        servants.push(sv);
      }
      saveServant(sv);
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
        delTrainer(id);
        trainers = trainers.filter(function (t) { return t.id !== id; });
        saveLocal();
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
      delPresences(s.id);
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
      savePresences(s.id);
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
    var have = sv && Array.isArray(sv.competences) ? sv.competences : [];
    $('svComps').innerHTML = POSTES.map(function (p) {
      return '<label class="comp-check"><input type="checkbox" id="svComp_' + safeId(p) + '"' +
        (have.indexOf(p) >= 0 ? ' checked' : '') + '> ' + escapeHtml(p) + '</label>';
    }).join('');
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
    if (activeTab === 'services') renderServices();
    if (activeTab === 'stats') renderStats();
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
          '<button type="button" class="btn btn-outline btn-icon" data-act="profil" data-id="' + sv.id + '">Profil</button>' +
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

  // ==================== SERVICES DE MESSE ====================

  function fetchServices() {
    if (!isAdmin) return;
    FB.get('services').then(function (list) {
      services = list.filter(function (s) { return s && s.date; });
      renderServices();
    }).catch(function () {});
  }

  function setupServices() {
    var form = $('serviceForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {
          date: $('svDate').value,
          heure: $('svHeure').value,
          type: $('svType').value,
          intitule: $('svIntitule').value.trim()
        };
        if (!data.date || !data.heure) return;
        var svc = editingServiceId && services.find(function (x) { return x.id === editingServiceId; });
        if (svc) {
          Object.assign(svc, data);
        } else {
          svc = Object.assign({ id: 'svc_' + Date.now(), assignments: {} }, data);
          services.push(svc);
        }
        FB.put('services', svc.id, svc).catch(function () { showToast('Enregistrement impossible (connexion).'); });
        closeModal($('serviceModal'));
        renderServices();
        showToast(editingServiceId ? 'Service modifié.' : 'Service planifié.');
      });
    }
    var addBtn = $('serviceAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openServiceForm(null); });

    var listEl = $('serviceList');
    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-act]');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        var act = btn.getAttribute('data-act');
        if (act === 'edit') openServiceForm(id);
        if (act === 'assign') openAssignModal(id);
        if (act === 'print') printService(id);
        if (act === 'wa') shareServiceWhatsApp(id);
        if (act === 'del') {
          var svc = services.find(function (x) { return x.id === id; });
          if (svc && confirm('Supprimer le service du ' + svc.date + ' ?')) {
            FB.del('services', id).catch(function () {});
            services = services.filter(function (x) { return x.id !== id; });
            renderServices();
            showToast('Service supprimé.');
          }
        }
      });
    }

    // Postes : ajout / suppression
    var posteForm = $('posteForm');
    if (posteForm) {
      posteForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('posteName').value.trim();
        if (!name || POSTES.indexOf(name) >= 0) return;
        POSTES.push(name);
        $('posteName').value = '';
        savePostes();
        renderPostes();
      });
    }
    var posteList = $('posteList');
    if (posteList) {
      posteList.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-poste]');
        if (!btn) return;
        var p = btn.getAttribute('data-poste');
        if (confirm('Retirer le poste « ' + p + ' » ?')) {
          POSTES = POSTES.filter(function (x) { return x !== p; });
          savePostes();
          renderPostes();
        }
      });
    }

    // Attribution automatique : équilibre les tours entre les servants formés
    var autoBtn = $('autoAssignBtn');
    if (autoBtn) {
      autoBtn.addEventListener('click', function () {
        var svc = services.find(function (x) { return x.id === $('assignForm').getAttribute('data-svc'); });
        if (!svc) return;
        var actifs = servants.filter(function (s) { return s.actif !== false; });
        var usage = {};
        // Compte combien de fois chaque servant a tenu chaque poste
        services.forEach(function (s2) {
          POSTES.forEach(function (p) {
            var sid = (s2.assignments || {})[p];
            if (sid) (usage[p] = usage[p] || {})[sid] = ((usage[p] || {})[sid] || 0) + 1;
          });
        });
        var usedThisService = {};
        POSTES.forEach(function (p) {
          var sel = $('assign_' + safeId(p));
          if (!sel) return;
          var pool = actifs.filter(function (s) {
            return Array.isArray(s.competences) && s.competences.indexOf(p) >= 0 && !usedThisService[s.id];
          });
          if (!pool.length) pool = actifs.filter(function (s) { return !usedThisService[s.id]; });
          if (!pool.length) return;
          pool.sort(function (a, b) {
            var ua = (usage[p] || {})[a.id] || 0, ub = (usage[p] || {})[b.id] || 0;
            if (ua !== ub) return ua - ub;
            return a.nom.localeCompare(b.nom, 'fr');
          });
          sel.value = pool[0].id;
          usedThisService[pool[0].id] = true;
        });
        showToast('Proposition équilibrée affichée — vérifiez puis enregistrez.');
      });
    }

    // Assignation
    var assignForm = $('assignForm');
    if (assignForm) {
      assignForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var svc = services.find(function (x) { return x.id === assignForm.getAttribute('data-svc'); });
        if (!svc) return;
        POSTES.forEach(function (p) {
          var sel = $('assign_' + safeId(p));
          if (sel && sel.value) svc.assignments[p] = sel.value;
          else delete svc.assignments[p];
        });
        FB.put('services', svc.id, svc).catch(function () { showToast('Enregistrement impossible (connexion).'); });
        closeModal($('assignModal'));
        renderServices();
        showToast('Attributions enregistrées.');
      });
    }
  }

  function openServiceForm(id) {
    editingServiceId = id;
    var svc = id && services.find(function (x) { return x.id === id; });
    $('serviceModalLabel').textContent = svc ? 'Modifier le service' : 'Planifier un service de messe';
    $('svDate').value = svc ? svc.date : '';
    $('svHeure').value = svc ? svc.heure : '09:00';
    $('svType').value = svc ? svc.type : 'Messe dominicale';
    $('svIntitule').value = svc ? (svc.intitule || '') : '';
    openModal($('serviceModal'));
  }

  function servantsById() {
    var map = {};
    servants.forEach(function (s) { map[s.id] = s; });
    return map;
  }

  function openAssignModal(id) {
    var svc = services.find(function (x) { return x.id === id; });
    if (!svc) return;
    var actifs = servants.filter(function (s) { return s.actif !== false; }).sort(sortByName);
    $('assignForm').setAttribute('data-svc', id);
    $('assignTitle').textContent = 'Attributions — ' + svc.type + ' du ' + svc.date;
    $('assignBody').innerHTML = POSTES.map(function (p) {
      var assigned = (svc.assignments || {})[p] || '';
      var qualified = actifs.filter(function (s) {
        return Array.isArray(s.competences) && s.competences.indexOf(p) >= 0;
      });
      var others = actifs.filter(function (s) { return qualified.indexOf(s) < 0; });
      function opt(s, tag) {
        return '<option value="' + s.id + '"' + (s.id === assigned ? ' selected' : '') + '>' +
          escapeHtml(s.nom) + (tag || '') + (s.niveau ? ' · ' + escapeHtml(s.niveau) : '') + '</option>';
      }
      return '<div class="assign-row">' +
        '<label for="assign_' + safeId(p) + '" class="assign-label">' + escapeHtml(p) +
          (qualified.length ? '' : ' <span class="g-sub">(personne formée — choix libre)</span>') + '</label>' +
        '<select id="assign_' + safeId(p) + '" class="select select-sm">' +
          '<option value="">— Non attribué —</option>' +
          (qualified.length ? '<optgroup label="Formé(e)s">' + qualified.map(function (s) { return opt(s, ''); }).join('') + '</optgroup>' : '') +
          '<optgroup label="Autres servants">' + others.map(function (s) { return opt(s, ''); }).join('') + '</optgroup>' +
        '</select></div>';
    }).join('');
    openModal($('assignModal'));
  }

  function renderPostes() {
    var el = $('posteList');
    if (el) {
      el.innerHTML = POSTES.map(function (p) {
        return '<span class="lvl-pill">' + escapeHtml(p) +
          ' <button type="button" class="poste-x" data-poste="' + escapeHtml(p) + '" title="Retirer">✕</button></span>';
      }).join('');
    }
  }

  function renderServices() {
    var listEl = $('serviceList');
    if (!listEl) return;
    renderPostes();
    var today = toISODate(new Date());
    var upcoming = services.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (!upcoming.length) {
      listEl.innerHTML = '<div class="gempty">Aucun service planifié. Cliquez sur « Planifier un service ».</div>';
      return;
    }
    var map = servantsById();
    listEl.innerHTML = upcoming.map(function (svc) {
      var d = parseDateLocal(svc.date);
      var dateTxt = d ? capitalizeFirst(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })) : svc.date;
      var past = svc.date < today ? ' is-inactive' : '';
      var asg = POSTES.map(function (p) {
        var sv = map[(svc.assignments || {})[p]];
        return '<div class="svc-line"><span class="svc-poste">' + escapeHtml(p) + '</span>' +
          '<span class="svc-name' + (sv ? '' : ' svc-empty') + '">' + (sv ? escapeHtml(sv.nom) : '—') + '</span></div>';
      }).join('');
      return '<div class="svc-card' + past + '">' +
        '<div class="svc-head"><div><strong>' + escapeHtml(svc.type) + '</strong>' +
        (svc.intitule ? ' — ' + escapeHtml(svc.intitule) : '') +
        '<div class="g-sub">' + dateTxt + ' · ' + escapeHtml(svc.heure) + '</div></div>' +
        '<div class="g-acts">' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="assign" data-id="' + svc.id + '">Attribuer</button>' +
          '<button type="button" class="btn btn-sm btn-success" data-act="wa" data-id="' + svc.id + '">WhatsApp</button>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="print" data-id="' + svc.id + '">Imprimer</button>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="edit" data-id="' + svc.id + '">Modifier</button>' +
          '<button type="button" class="btn btn-sm btn-danger" data-act="del" data-id="' + svc.id + '">Suppr.</button>' +
        '</div></div>' +
        '<div class="svc-grid">' + asg + '</div></div>';
    }).join('');
  }

  function printService(id) {
    var svc = services.find(function (x) { return x.id === id; });
    if (!svc) return;
    var map = servantsById();
    var d = parseDateLocal(svc.date);
    var dateFull = d ? capitalizeFirst(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) : svc.date;
    var rows = POSTES.map(function (p, i) {
      var sv = map[(svc.assignments || {})[p]];
      return [i + 1, escapeHtml(p), sv ? escapeHtml(sv.nom) : '', sv ? escapeHtml(sv.niveau || '—') : ''];
    });
    printDocument({
      subtitle: 'Programme de service',
      date: escapeHtml(svc.type) + ' — ' + dateFull + ' • ' + escapeHtml(svc.heure) +
        (svc.intitule ? ' • ' + escapeHtml(svc.intitule) : ''),
      meta: '',
      cols: [['N°', 6], ['Poste', 34], ['Servant', 44], ['Niveau', 16]],
      rows: rows,
      foot: '<div><strong>Responsable du jour :</strong> ______________________</div>'
    });
  }

  // ==================== WHATSAPP + STATS + PROFIL ====================

  function shareServiceWhatsApp(id) {
    var svc = services.find(function (x) { return x.id === id; });
    if (!svc) return;
    var map = servantsById();
    var d = parseDateLocal(svc.date);
    var dateFull = d ? capitalizeFirst(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) : svc.date;
    var lines = POSTES.map(function (p) {
      var sv = map[(svc.assignments || {})[p]];
      return '• ' + p + ' : ' + (sv ? sv.nom : '—');
    });
    var msg =
      'SERVANTS DE MESSE — ' + svc.type.toUpperCase() + '\n' +
      dateFull + ' à ' + svc.heure + (svc.intitule ? ' — ' + svc.intitule : '') + '\n\n' +
      'ATTRIBUTIONS :\n' + lines.join('\n') +
      '\n\nMerci d\'être présents 30 min avant le début.\n' +
      '— DJEBLE Haniel, Responsable Formation';
    var prev = document.getElementById('whatsappPreview');
    if (prev) prev.value = msg;
    openModal(whatsappModal);
  }

  function setupStats() {
    var per = $('statsPeriod');
    if (per) per.addEventListener('change', renderStats);
    var pr = $('statsPrintBtn');
    if (pr) pr.addEventListener('click', printStats);
  }

  function statsPeriodSessions() {
    var v = $('statsPeriod') ? $('statsPeriod').value : 'all';
    var cutoff = null;
    if (v === '30') { cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30); }
    if (v === '90') { cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90); }
    return sessions.filter(function (s) {
      var d = parseDateLocal(s.date);
      return d && (!cutoff || d >= cutoff) && presences[s.id];
    });
  }

  function renderStats() {
    var body = $('statsTableBody');
    if (!body) return;
    var scoped = statsPeriodSessions();
    var totals = { P: 0, R: 0, A: 0, E: 0 };

    var rows = servants.slice().sort(function (a, b) {
      var ra = attendanceRate(a.id), rb = attendanceRate(b.id);
      return (rb ? rb.pct : -1) - (ra ? ra.pct : -1);
    }).map(function (sv) {
      var c = { P: 0, R: 0, A: 0, E: 0 };
      scoped.forEach(function (s) {
        var st = (presences[s.id] || {})[sv.id];
        if (st) { c[st]++; totals[st]++; }
      });
      var total = c.P + c.R + c.A + c.E;
      var pct = total ? Math.round((c.P + c.R) * 100 / total) : null;
      return { sv: sv, c: c, total: total, pct: pct };
    });

    var withCalls = rows.filter(function (r) { return r.total > 0; });
    var avg = withCalls.length ? Math.round(withCalls.reduce(function (acc, r) { return acc + r.pct; }, 0) / withCalls.length) : null;
    $('statsCards').innerHTML =
      '<div class="stat-mini"><strong>' + scoped.length + '</strong><span>appel(s) sur la période</span></div>' +
      '<div class="stat-mini"><strong>' + totals.P + '</strong><span>présences</span></div>' +
      '<div class="stat-mini"><strong>' + totals.R + '</strong><span>retards</span></div>' +
      '<div class="stat-mini"><strong>' + totals.A + '</strong><span>absences</span></div>' +
      '<div class="stat-mini"><strong>' + (avg === null ? '—' : avg + ' %') + '</strong><span>taux moyen</span></div>';

    body.innerHTML = rows.length ? rows.map(function (r) {
      return '<tr' + (r.sv.actif === false ? ' class="is-inactive"' : '') + '>' +
        '<td><div class="g-name">' + escapeHtml(r.sv.nom) + '</div></td>' +
        '<td>' + escapeHtml(r.sv.niveau || '—') + '</td>' +
        '<td>' + r.c.P + '</td><td>' + r.c.R + '</td><td>' + r.c.A + '</td><td>' + r.c.E + '</td>' +
        '<td>' + (r.pct === null ? '—' : '<span class="g-rate' + (r.pct < 60 ? ' low' : '') + '">' + r.pct + ' %</span>') + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="gempty">Aucun appel enregistré sur cette période.</td></tr>';
  }

  function printStats() {
    var scoped = statsPeriodSessions();
    var rows = servants.slice().sort(sortByName).map(function (sv, i) {
      var c = { P: 0, R: 0, A: 0, E: 0 };
      scoped.forEach(function (s) { var st = (presences[s.id] || {})[sv.id]; if (st) c[st]++; });
      var t = c.P + c.R + c.A + c.E;
      var pct = t ? Math.round((c.P + c.R) * 100 / t) + ' %' : '';
      return [i + 1, escapeHtml(sv.nom), escapeHtml(sv.niveau || '—'), c.P, c.R, c.A, c.E, pct];
    });
    printDocument({
      subtitle: 'Bilan de présence aux formations',
      date: scoped.length + ' appel(s) • ' + capitalizeFirst(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })),
      cols: [['N°', 5], ['Nom & Prénoms', 41], ['Niveau', 14], ['P', 8], ['R', 8], ['A', 8], ['E', 8], ['Taux', 8]],
      rows: rows,
      foot: '<div>Responsable Formation : DJEBLE Haniel</div><div><strong>Visa :</strong> ______________________</div>'
    });
  }

  function openProfil(id) {
    var sv = servants.find(function (x) { return x.id === id; });
    if (!sv) return;
    $('profilTitle').textContent = sv.nom;

    // Appels : historique par séance
    var appels = sessions.filter(function (s) { return presences[s.id]; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var appelRows = appels.map(function (s) {
      var st = (presences[s.id] || {})[sv.id];
      if (!st) return '';
      var d = parseDateLocal(s.date);
      return '<div class="svc-line"><span class="svc-poste">' + (d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : s.date) + ' — ' + escapeHtml(s.topic || '') + '</span>' +
        '<span class="svc-name">' + STATUT_LABELS[st] + '</span></div>';
    }).filter(Boolean).join('');

    // Services tenus : par poste
    var parPoste = {};
    var derniers = [];
    services.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).forEach(function (s) {
      POSTES.forEach(function (p) {
        if ((s.assignments || {})[p] === sv.id) {
          parPoste[p] = (parPoste[p] || 0) + 1;
          derniers.push({ date: s.date, poste: p, type: s.type });
        }
      });
    });
    var histo = derniers.slice(0, 6).map(function (h) {
      var d = parseDateLocal(h.date);
      return '<div class="svc-line"><span class="svc-poste">' + (d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : h.date) + ' — ' + escapeHtml(h.type) + '</span>' +
        '<span class="svc-name">' + escapeHtml(h.poste) + '</span></div>';
    }).join('');

    // Progression : ancienneté dans le niveau
    var duree = '';
    if (sv.niveauDepuis) {
      var depuis = parseDateLocal(sv.niveauDepuis);
      var mois = depuis ? Math.floor((Date.now() - depuis.getTime()) / (30.44 * 86400000)) : 0;
      var SEUILS = { Postulant: 3, Samuel: 6, Tarcisius: 6 };
      var seuil = SEUILS[sv.niveau];
      duree = 'Niveau ' + (sv.niveau || 'non attribué') + ' depuis ~' + mois + ' mois' +
        (seuil ? (mois >= seuil ? ' — <strong>éligible au niveau suivant</strong>' : ' (durée indicative ' + seuil + ' mois)') : '');
    } else {
      duree = 'Niveau ' + (sv.niveau || 'non attribué') + (sv.niveau ? '' : ' — à attribuer');
    }

    var rate = attendanceRate(sv.id);
    var comps = (sv.competences || []).length ? sv.competences.map(function (c) { return '<span class="g-tag">' + escapeHtml(c) + '</span>'; }).join(' ') : '<span class="g-sub">Aucune compétence enregistrée</span>';

    $('profilBody').innerHTML =
      '<div class="profil-grid">' +
      '<div><div class="g-sub">NIVEAU & PROGRESSION</div><p>' + duree + '</p>' +
      (sv.tel ? '<p class="g-sub">Tél : ' + escapeHtml(sv.tel) + '</p>' : '') +
      (sv.note ? '<p class="g-sub">' + escapeHtml(sv.note) + '</p>' : '') + '</div>' +
      '<div><div class="g-sub">ASSIDUITÉ</div><p>' + (rate ? '<strong class="g-rate' + (rate.pct < 60 ? ' low' : '') + '">' + rate.pct + ' %</strong> sur ' + rate.total + ' appel(s)' : 'Aucun appel enregistré') + '</p></div>' +
      '</div>' +
      '<div class="g-sub">COMPÉTENCES</div><p class="comp-grid">' + comps + '</p>' +
      '<div class="g-sub">SERVICES TENUS (' + derniers.length + ')</div>' + (histo || '<p class="g-sub">Aucun service encore.</p>') +
      '<div class="g-sub" style="margin-top:10px">APPELS DU SAMEDI</div>' + (appelRows || '<p class="g-sub">Aucun statut enregistré.</p>');

    openModal($('profilModal'));
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
