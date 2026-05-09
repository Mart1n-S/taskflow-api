/**
 * Logique WebSocket extraite de test-ws.html.
 * Lit le token JWT depuis sessionStorage (posé par login.js).
 */
(function () {
  var socket;

  // ---- Pré-remplissage du token ----
  var token = sessionStorage.getItem('taskflow_token') || '';
  var tokenInput = document.getElementById('token');
  if (tokenInput && token) tokenInput.value = token;

  // ---- Journal ----
  function log(type, msg) {
    var list  = document.getElementById('events');
    var empty = document.getElementById('events-empty');
    if (!list) return;

    if (empty) empty.style.display = 'none';

    var li = document.createElement('li');
    li.className = 'event-item';

    var time = new Date().toLocaleTimeString('fr-FR');
    li.innerHTML =
      '<span class="event-time">'  + time           + '</span>' +
      '<span class="event-type">'  + escHtml(type)  + '</span>' +
      '<span class="event-body">'  + escHtml(msg)   + '</span>';

    list.prepend(li);
    updateStatus();
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---- Indicateur de statut ----
  function updateStatus() {
    var dot       = document.getElementById('ws-dot');
    var label     = document.getElementById('ws-label');
    var connected = socket && socket.connected;
    if (dot)   { dot.classList.toggle('on', !!connected); dot.classList.toggle('off', !connected); }
    if (label) label.textContent = connected ? 'Connecté' : 'Déconnecté';
  }

  // ---- Connexion ----
  function connect() {
    var t = document.getElementById('token').value.trim();
    if (!t) { log('erreur', 'Token manquant.'); return; }

    sessionStorage.setItem('taskflow_token', t);

    socket = io(window.location.origin + '/notifications', { auth: { token: t } });

    socket.on('connect',    function ()     { log('connect',      'ID : ' + socket.id); });
    socket.on('disconnect', function ()     { log('disconnect',   ''); updateStatus(); });
    socket.on('task:assigned', function (d) { log('task:assigned', JSON.stringify(d)); });
  }

  // ---- Rejoindre un projet ----
  function joinProject() {
    if (!socket || !socket.connected) { log('erreur', 'Non connecté.'); return; }
    var projectId = document.getElementById('projectId').value.trim();
    if (!projectId) { log('erreur', 'UUID de projet manquant.'); return; }
    socket.emit('join:project', projectId, function (ack) {
      log('join:project', 'Rejoint : ' + JSON.stringify(ack));
    });
  }

  // ---- Liaison des boutons (aucun onclick dans le HTML) ----
  document.getElementById('btn-connect').addEventListener('click', connect);
  document.getElementById('btn-join').addEventListener('click', joinProject);

  document.getElementById('btn-clear').addEventListener('click', function () {
    var list  = document.getElementById('events');
    var empty = document.getElementById('events-empty');
    if (list)  list.innerHTML = '';
    if (empty) empty.style.display = '';
  });

  document.getElementById('btn-logout').addEventListener('click', function (e) {
    e.preventDefault();
    sessionStorage.removeItem('taskflow_token');
    window.location.href = 'login.html';
  });

  updateStatus();
})();
