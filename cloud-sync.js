(function createCloudSync() {
  const SESSION_KEY = "nsca-cpt:supabase-session";
  const config = window.NSCA_CLOUD_CONFIG || {};
  let session = null;
  let user = null;
  let saveTimer = null;
  let getProgress = () => ({});
  let setProgress = () => {};
  let onStatus = () => {};

  function isConfigured() {
    return Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  function status(value, message = "") {
    onStatus({ value, message, signedIn: Boolean(user) });
  }

  function endpoint(path) {
    return `${config.supabaseUrl.replace(/\/$/, "")}${path}`;
  }

  async function request(path, options = {}, accessToken = "") {
    const response = await fetch(endpoint(path), {
      ...options,
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken || config.supabaseAnonKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.msg || body.message || body.error_description || `请求失败 (${response.status})`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  function saveSession(nextSession) {
    session = nextSession;
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function consumeAuthCallback() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return false;

    saveSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Date.now() + Number(params.get("expires_in") || 3600) * 1000,
    });
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    return true;
  }

  async function validSession() {
    if (!session) {
      try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      } catch {
        session = null;
      }
    }
    if (!session) return null;
    if (session.expires_at > Date.now() + 60_000) return session;

    try {
      const refreshed = await request(
        "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        },
      );
      saveSession({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
      });
      return session;
    } catch {
      saveSession(null);
      return null;
    }
  }

  async function loadUser() {
    const currentSession = await validSession();
    if (!currentSession) return null;
    try {
      user = await request("/auth/v1/user", {}, currentSession.access_token);
      return user;
    } catch {
      saveSession(null);
      user = null;
      return null;
    }
  }

  async function writeProgress(progress) {
    const currentSession = await validSession();
    if (!currentSession || !user) return;
    await request(
      "/rest/v1/study_progress?on_conflict=user_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: user.id, progress }),
      },
      currentSession.access_token,
    );
  }

  async function syncNow() {
    if (!isConfigured()) {
      status("unconfigured", "尚未连接 Supabase");
      return false;
    }
    if (!(await loadUser())) {
      status("signed-out", "登录后可跨设备同步");
      return false;
    }

    status("syncing", "正在同步");
    try {
      const currentSession = await validSession();
      const rows = await request(
        `/rest/v1/study_progress?select=progress,updated_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
        {},
        currentSession.access_token,
      );
      const local = getProgress() || {};
      const remote = rows[0];
      const localTime = Date.parse(local._updatedAt || 0);
      const remoteTime = Date.parse(remote?.updated_at || 0);

      if (!remote || localTime > remoteTime) {
        await writeProgress(local);
      } else if (remoteTime > localTime && remote.progress) {
        setProgress(remote.progress);
      }

      status("synced", "已同步");
      return true;
    } catch (error) {
      status("error", error.message);
      return false;
    }
  }

  async function getAccessToken() {
    const currentSession = await validSession();
    if (!currentSession) return "";
    if (!user && !(await loadUser())) return "";
    const refreshedSession = await validSession();
    return refreshedSession?.access_token || "";
  }

  async function sendMagicLink(email) {
    if (!isConfigured()) throw new Error("尚未连接 Supabase");
    status("syncing", "正在发送登录邮件");
    await request("/auth/v1/otp", {
      method: "POST",
      body: JSON.stringify({
        email,
        create_user: true,
        options: {
          emailRedirectTo: `${location.origin}${location.pathname}`,
        },
      }),
    });
    status("email-sent", "登录链接已发送");
  }

  function queueSave(progress) {
    if (!user) return;
    clearTimeout(saveTimer);
    const snapshot = JSON.parse(JSON.stringify(progress));
    saveTimer = setTimeout(() => {
      writeProgress(snapshot)
        .then(() => status("synced", "已同步"))
        .catch((error) => status("error", error.message));
    }, 900);
  }

  async function init(handlers) {
    getProgress = handlers.getProgress;
    setProgress = handlers.setProgress;
    onStatus = handlers.onStatus;
    if (!isConfigured()) {
      status("unconfigured", "尚未连接 Supabase");
      return;
    }
    consumeAuthCallback();
    await syncNow();
  }

  window.NSCACloudSync = {
    init,
    isConfigured,
    sendMagicLink,
    syncNow,
    queueSave,
    getAccessToken,
    isSignedIn: () => Boolean(user),
  };
})();
