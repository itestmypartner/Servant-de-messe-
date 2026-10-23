/*
 * Firebase — couche d'accès partagée (SMSB)
 * Utilise le SDK compat (fonctionne avec de simples balises <script>).
 * Prérequis : charger firebase-app-compat, firebase-auth-compat,
 * firebase-firestore-compat AVANT ce fichier.
 */
(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: 'AIzaSyCEfBqaPOhx-lQ7YFxM2NSYpPv8G-C2erg',
    authDomain: 'smsb-9a9ec.firebaseapp.com',
    projectId: 'smsb-9a9ec',
    storageBucket: 'smsb-9a9ec.firebasestorage.app',
    messagingSenderId: '472704423187',
    appId: '1:472704423187:web:ee905531c0d0321d73f6e6'
  };

  firebase.initializeApp(firebaseConfig);

  var db = firebase.firestore();
  var auth = firebase.auth();
  var ready = true;

  // Cache hors-ligne : l'app marche sans connexion, sync au retour du réseau
  try {
    db.enablePersistence({ synchronizeTabs: true }).catch(function () {});
  } catch (e) { /* multi-onglets ou navigateur ancien */ }

  function col(name) { return db.collection(name); }
  function docs(snap) { return snap.docs.map(function (d) { return d.data(); }); }

  window.FB = {
    isReady: function () { return ready; },
    /* ---- Auth ---- */
    onAuth: function (cb) { return auth.onAuthStateChanged(cb); },
    signIn: function (email, pw) { return auth.signInWithEmailAndPassword(email, pw); },
    signOut: function () { return auth.signOut(); },
    resetPassword: function (email) { return auth.sendPasswordResetEmail(email); },
    // Changement de mot de passe en interne : re-vérifie l'ancien puis applique le nouveau
    changePassword: function (oldPw, newPw) {
      var u = auth.currentUser;
      if (!u || !u.email) return Promise.reject(new Error('non connecté'));
      var cred = firebase.auth.EmailAuthProvider.credential(u.email, oldPw);
      return u.reauthenticateWithCredential(cred).then(function () { return u.updatePassword(newPw); });
    },
    currentUser: function () { return auth.currentUser; },

    /* ---- Données ---- */
    get: function (name) { return col(name).get().then(docs); },
    getDoc: function (name, id) { return col(name).doc(id).get().then(function (d) { return d.exists ? d.data() : null; }); },
    put: function (name, id, data) { return col(name).doc(id).set(data); },
    merge: function (name, id, data) { return col(name).doc(id).set(data, { merge: true }); },
    del: function (name, id) { return col(name).doc(id).delete(); },
    batch: function (ops) {
      var b = db.batch();
      ops.forEach(function (op) {
        var ref = col(op.col).doc(op.id);
        if (op.del) b.delete(ref); else b.set(ref, op.data);
      });
      return b.commit();
    }
  };
})();
