/**
 * Récupération et affichage des projets et tâches.
 * Gestion de l'assignation de tâche (admin uniquement).
 */
(function () {
  var token = sessionStorage.getItem('taskflow_token');
  var user  = JSON.parse(sessionStorage.getItem('taskflow_user') || 'null');
  var isAdmin = user && user.role === 'admin';

  if (!token) return; // pas connecté, login.js redirige

  // ---- Helpers ----

  function apiGet(path) {
    return fetch(window.location.origin + '/api' + path, {
      headers: { Authorization: 'Bearer ' + token },
    }).then(function (r) { return r.json(); })
      .then(function (j) { return j.data !== undefined ? j.data : j; });
  }

  function apiPatch(path, body) {
    return fetch(window.location.origin + '/api' + path, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); })
      .then(function (j) { return j.data !== undefined ? j.data : j; });
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---- Projets ----

  function renderProjects(projects) {
    var container = document.getElementById('projects-body');
    if (!container) return;

    if (!projects || projects.length === 0) {
      container.innerHTML = '<tr><td colspan="3" class="td-empty">Aucun projet.</td></tr>';
      return;
    }

    container.innerHTML = projects.map(function (p) {
      var statusClass = 'badge-' + (p.status || '').toLowerCase();
      return [
        '<tr>',
        '<td>' + escHtml(p.name) + '</td>',
        '<td><span class="badge ' + statusClass + '">' + escHtml(p.status) + '</span></td>',
        '<td class="text-muted">' + escHtml(p.description || '-') + '</td>',
        '<td class="uuid-cell">',
        '<code class="uuid-text">' + escHtml(p.id) + '</code>',
        '<button class="btn-copy" data-copy="' + escHtml(p.id) + '" title="Copier l\'UUID">',
        '<i class="bi bi-clipboard"></i>',
        '</button>',
        '</td>',
        '</tr>',
      ].join('');
    }).join('');
  }

  function loadProjects() {
    apiGet('/projects')
      .then(renderProjects)
      .catch(function () {
        var c = document.getElementById('projects-body');
        if (c) c.innerHTML = '<tr><td colspan="3" class="td-empty text-error">Erreur de chargement.</td></tr>';
      });
  }

  // ---- Tâches ----

  var _users = []; // pour le select d'assignation

  function renderTasks(tasks) {
    var container = document.getElementById('tasks-body');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<tr><td colspan="' + (isAdmin ? 5 : 4) + '" class="td-empty">Aucune tâche.</td></tr>';
      return;
    }

    container.innerHTML = tasks.map(function (t) {
      var statusClass   = 'badge-status-' + (t.status   || '').toLowerCase();
      var priorityClass = 'badge-priority-' + (t.priority || '').toLowerCase();
      var assigneeName  = t.assignee ? escHtml(t.assignee.name) : '<span class="text-muted">-</span>';

      var assignCell = '';
      if (isAdmin) {
        var options = '<option value="">- Choisir -</option>' +
          _users.map(function (u) {
            var sel = t.assignee && t.assignee.id === u.id ? ' selected' : '';
            return '<option value="' + u.id + '"' + sel + '>' + escHtml(u.name) + '</option>';
          }).join('');

        assignCell = [
          '<td>',
          '<div class="assign-row">',
          '<select class="assign-select" data-task-id="' + t.id + '">' + options + '</select>',
          '<button class="btn btn-sm btn-primary assign-btn" data-task-id="' + t.id + '">Assigner</button>',
          '</div>',
          '</td>',
        ].join('');
      }

      return [
        '<tr>',
        '<td>' + escHtml(t.title) + '</td>',
        '<td><span class="badge ' + statusClass + '">'   + escHtml(t.status)   + '</span></td>',
        '<td><span class="badge ' + priorityClass + '">' + escHtml(t.priority) + '</span></td>',
        '<td>' + assigneeName + '</td>',
        assignCell,
        '</tr>',
      ].join('');
    }).join('');
  }

  function loadTasks() {
    var fetches = [apiGet('/tasks')];
    if (isAdmin) fetches.push(apiGet('/users'));

    Promise.all(fetches)
      .then(function (results) {
        var tasks = results[0];
        if (isAdmin) _users = results[1] || [];
        renderTasks(tasks);
      })
      .catch(function () {
        var c = document.getElementById('tasks-body');
        if (c) c.innerHTML = '<tr><td colspan="5" class="td-empty text-error">Erreur de chargement.</td></tr>';
      });
  }

  // ---- Assignation (admin) ----

  function handleAssign(taskId) {
    var select = document.querySelector('.assign-select[data-task-id="' + taskId + '"]');
    if (!select) return;
    var userId = select.value;
    if (!userId) return;

    apiPatch('/tasks/' + taskId, { assigneeId: userId })
      .then(function () { loadTasks(); })
      .catch(function (err) { console.error('Assignation échouée', err); });
  }

  // ---- Bouton copier UUID (table projets) ----
  var projectsBody = document.getElementById('projects-body');
  if (projectsBody) {
    projectsBody.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-copy');
      if (!btn) return;
      var uuid = btn.dataset.copy;
      navigator.clipboard.writeText(uuid).then(function () {
        var original = btn.innerHTML;
        btn.classList.add('btn-copy-done');
        btn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
        setTimeout(function () {
          btn.classList.remove('btn-copy-done');
          btn.innerHTML = original;
        }, 1500);
      });
    });
  }

  // Délégation sur le container des tâches (contenu rechargé dynamiquement)
  var tasksTable = document.getElementById('tasks-table');
  if (tasksTable) {
    tasksTable.addEventListener('click', function (e) {
      var btn = e.target.closest('.assign-btn');
      if (btn) handleAssign(btn.dataset.taskId);
    });
  }

  // ---- Bouton rafraîchir ----
  var btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
      loadProjects();
      loadTasks();
    });
  }

  // ---- Affichage conditionnel colonne assignation ----
  if (isAdmin) {
    var th = document.getElementById('th-assign');
    if (th) th.classList.remove('th-assign-hidden');
  }

  // ---- Chargement initial ----
  loadProjects();
  loadTasks();
})();
