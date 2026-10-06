(function createCloudSync() {
  const SESSION_KEY = "nsca-cpt:supabase-session";
  const config = window.NSCA_CLOUD_CONFIG || {};
  let session = null;
  let user = null;
  let saveTimer = null;
  let getProgress = () => ({});
  let setProgress = () => {};
  let onStatus = () => {};
  let onUser = () => {};
  let boundUserId = null;
  let readyToSave = false;
  let refreshPromise = null;
  let writeTail = Promise.resolve();
  let pendingProgress = null;
  let saveVersion = 0;

  function bindUser(nextUser) {
    if (boundUserId === (nextUser?.id || null)) return;
    clearTimeout(saveTimer);
    pendingProgress = null;
    readyToSave = false;
    boundUserId = nextUser?.id || null;
    onUser(nextUser);
  }

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
      signal: AbortSignal.timeout(15000),
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
      const error = new Error(body.msg || body.message || body.error_description || `请求失败 (${response.status})`);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204 || options.headers?.Prefer?.split(",").includes("return=minimal")) return null;
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
    if (params.has("error")) {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      throw new Error("Google 登录未完成，请重试。若持续失败，请检查 Supabase 的 Google 登录及回调地址配置。");
    }
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

    if (refreshPromise) return refreshPromise;
    refreshPromise = refreshSession();
    try { return await refreshPromise; }
    finally { refreshPromise = null; }
  }

  async function refreshSession() {
    const refreshingSession = session;
    try {
      const refreshed = await request(
        "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        },
      );
      if (session !== refreshingSession) return session;
      saveSession({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
      });
      return session;
    } catch (error) {
      if (session !== refreshingSession) return session;
      if ([400, 401, 403].includes(error.status)) {
        saveSession(null);
        user = null;
        return null;
      }
      throw error;
    }
  }

  async function loadUser() {
    const currentSession = await validSession();
    if (!currentSession) return null;
    try {
      const loaded = await request("/auth/v1/user", {}, currentSession.access_token);
      if (session !== currentSession) return null;
      user = loaded;
      bindUser(user);
      return user;
    } catch (error) {
      if (session !== currentSession) return null;
      if ([401, 403].includes(error.status)) {
        saveSession(null);
        user = null;
        return null;
      }
      throw error;
    }
  }

  async function writeProgress(progress) {
    const owner = user?.id;
    if (!owner || progress._ownerId !== owner) throw new Error("账号与本地进度不一致，未上传");
    const currentSession = await validSession();
    if (!currentSession || user?.id !== owner) throw new Error("请重新登录后同步");
    await request(
      "/rest/v1/study_progress?on_conflict=user_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: owner, progress }),
      },
      currentSession.access_token,
    );
  }

  function orderedWrite(progress) {
    const snapshot = JSON.parse(JSON.stringify(progress));
    const write = writeTail.then(() => writeProgress(snapshot));
    writeTail = write.catch(() => {});
    return write;
  }

  async function syncNow() {
    if (!isConfigured()) {
      status("unconfigured", "尚未连接 Supabase");
      return false;
    }
    status("syncing", "正在同步");
    try {
      if (!(await loadUser())) {
        bindUser(null);
        status("signed-out", "登录后可跨设备同步");
        return false;
      }
      const currentSession = await validSession();
      const owner = user.id;
      const rows = await request(
        `/rest/v1/study_progress?select=progress,updated_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
        {},
        currentSession.access_token,
      );
      if (user?.id !== owner || session !== currentSession) return false;
      const local = getProgress() || {};
      const remote = rows[0];
      const localTime = Date.parse(local._updatedAt) || 0;
      const remoteTime = Date.parse(remote?.progress?._updatedAt || remote?.updated_at) || 0;

      if (!remote || localTime > remoteTime) {
        await orderedWrite(local);
      } else if (remoteTime > localTime && remote.progress) {
        setProgress({ ...remote.progress, _ownerId: user.id });
      }

      if (user?.id !== owner) return false;
      readyToSave = true;
      status("synced", "已同步");
      return true;
    } catch (error) {
      status("error", error.message);
      return false;
    }
  }

  async function getAccessToken() {
    const currentSession = await validSession();
    if (!currentSession) { bindUser(null); return ""; }
    if (!user && !(await loadUser())) return "";
    const refreshedSession = await validSession();
    return refreshedSession?.access_token || "";
  }

  function signInWithGoogle() {
    if (!/^https?:\/\//.test(location.origin)) {
      throw new Error("本地 HTML 文件不能用于此登录流程。请在 https://nsca-cpt-review-app.vercel.app/ 登录；本地答题记录仍保留，但不会自动转移到网站。");
    }
    if (!isConfigured()) throw new Error("尚未连接 Supabase");
    const url = new URL(endpoint("/auth/v1/authorize"));
    url.search = new URLSearchParams({
      provider: "google",
      redirect_to: `${location.origin}${location.pathname}`,
    });
    window.location.assign(url.href);
  }

  function queueSave(progress) {
    if (!user || !readyToSave) return;
    clearTimeout(saveTimer);
    pendingProgress = JSON.parse(JSON.stringify(progress));
    saveVersion += 1;
    status("syncing", "正在保存进度");
    saveTimer = setTimeout(() => {
      flushSave()
        .catch((error) => status("error", error.message));
    }, 900);
  }

  async function flushSave() {
    clearTimeout(saveTimer);
    const snapshot = pendingProgress;
    const version = saveVersion;
    pendingProgress = null;
    if (!snapshot) { await writeTail; return; }
    try {
      await orderedWrite(snapshot);
      if (user?.id === snapshot._ownerId && version === saveVersion) status("synced", "已同步");
    } catch (error) {
      if (user?.id === snapshot._ownerId && version === saveVersion) pendingProgress = snapshot;
      throw error;
    }
  }

  async function signOut() {
    try {
      if (readyToSave) {
        // Capture the latest local state even if a previous upload failed.
        pendingProgress = JSON.parse(JSON.stringify(getProgress()));
        saveVersion += 1;
        await flushSave();
        while (pendingProgress) await flushSave();
      }
    } catch (error) {
      status("error", "退出前同步失败，仍保持登录；进度已保留在本机。请联网后重试。");
      return false;
    }
    clearTimeout(saveTimer);
    saveSession(null);
    user = null;
    bindUser(null);
    status("signed-out", "已退出账号，本机进度已保留");
    return true;
  }

  async function init(handlers) {
    onUser = handlers.onUser || (() => {});
    getProgress = handlers.getProgress;
    setProgress = handlers.setProgress;
    onStatus = handlers.onStatus;
    if (!isConfigured()) {
      status("unconfigured", "尚未连接 Supabase");
      return;
    }
    try {
      consumeAuthCallback();
    } catch (error) {
      status("error", error.message);
      window.alert(error.message);
      return;
    }
    await syncNow();
  }

  window.NSCACloudSync = {
    signOut,
    flushSave,
    init,
    isConfigured,
    signInWithGoogle,
    syncNow,
    queueSave,
    getAccessToken,
    isSignedIn: () => Boolean(user),
  };
  window.addEventListener?.("storage", (event) => {
    if (event.key === SESSION_KEY) {
      clearTimeout(saveTimer);
      window.location.reload();
    }
  });
})();
