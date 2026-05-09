/**
 * Logique de la page de connexion.
 * Appelle POST /api/auth/login, stocke le JWT en sessionStorage, redirige vers test-ws.html.
 */
(function () {
  // Redirige si déjà connecté
  if (sessionStorage.getItem('taskflow_token')) {
    window.location.replace('test-ws.html');
    return;
  }

  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errorEl  = document.getElementById('error-msg');
    errorEl.textContent = '';

    var email    = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    try {
      var res = await fetch(window.location.origin + '/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password }),
      });

      var json = await res.json();
      if (!res.ok) {
        var msg = json.message;
        errorEl.textContent = Array.isArray(msg) ? msg.join(' ') : (msg || 'Identifiants invalides.');
        return;
      }

      // Le TransformInterceptor enveloppe la réponse dans { data: { access_token, user } }
      var payload = json.data || json;
      sessionStorage.setItem('taskflow_token', payload.access_token);
      sessionStorage.setItem('taskflow_user', JSON.stringify(payload.user));
      window.location.replace('test-ws.html');
    } catch (_) {
      errorEl.textContent = 'Impossible de joindre le serveur.';
    }
  });
})();
