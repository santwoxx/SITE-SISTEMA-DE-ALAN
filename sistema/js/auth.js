// ==========================================================================
// MONTAXX ERP — Controle de Acesso
//   • Administrador  -> login com a conta Google (lista fixa de e-mails)
//   • Funcionário    -> login com e-mail e senha criados pelo administrador
// ==========================================================================

import { auth, workerAuth, db, USERS_COLLECTION, SITE_URL, isAdminEmail } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { startCloudSync, stopCloudSync, flushCloudSync } from "./cloud-sync.js";

// Se este ponto foi alcançado, o SDK do Firebase carregou (os imports acima
// resolveram). Serve de aviso para o alerta de rede em index.html.
window.MONTAXX_AUTH_LOADED = true;

const ROLE_ADMIN = "admin";
const ROLE_STAFF = "funcionario";

let currentProfile = null;
let unsubscribeTeam = null;
let signingOut = false;

// --------------------------------------------------------------------------
// Utilitários de tela
// --------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

function setGateState(state) {
  // state: "loading" | "form" | "ready"
  document.body.dataset.auth = state;
}

function showAuthError(message) {
  const box = $("auth-error");
  if (!box) return;
  box.textContent = message || "";
  box.hidden = !message;
}

function setBusy(busy, label) {
  [$("btn-login-google"), $("btn-login-staff")].forEach((b) => {
    if (b) b.disabled = busy;
  });
  const hint = $("auth-busy");
  if (hint) {
    hint.hidden = !busy;
    hint.textContent = label || "Verificando…";
  }
}

function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Traduz os códigos de erro do Firebase para linguagem do usuário
function friendlyError(err) {
  const map = {
    "auth/invalid-email": "E-mail inválido. Confira o endereço digitado.",
    "auth/user-disabled": "Este acesso foi desativado pelo administrador.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-login-credentials": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.",
    "auth/network-request-failed": "Sem conexão com a internet. Verifique o sinal e tente de novo.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir o login.",
    "auth/cancelled-popup-request": "Login do Google cancelado.",
    "auth/unauthorized-domain": "Este endereço não está autorizado no Firebase. Adicione o domínio em Authentication > Settings > Authorized domains.",
    "auth/operation-not-allowed": "O método de login não está habilitado no console do Firebase.",
    "auth/email-already-in-use": "Já existe um acesso cadastrado com este e-mail.",
    "auth/weak-password": "A senha precisa ter no mínimo 6 caracteres.",
    "permission-denied": "Sua conta não tem permissão para esta ação."
  };
  return map[err && err.code] || (err && err.message) || "Não foi possível concluir a operação.";
}

// --------------------------------------------------------------------------
// Resolução do perfil (papel) do usuário autenticado
// --------------------------------------------------------------------------
async function resolveProfile(user) {
  const email = String(user.email || "").toLowerCase();

  // O provedor é lido do token — é o mesmo valor conferido pelas regras do
  // Firestore, portanto não há como forjar isso pelo navegador.
  let provider = "password";
  try {
    provider = (await user.getIdTokenResult()).signInProvider || "password";
  } catch (_) { /* mantém o padrão */ }

  const ref = doc(db, USERS_COLLECTION, user.uid);

  // ---- Caminho do ADMINISTRADOR -----------------------------------------
  if (isAdminEmail(email)) {
    if (provider !== "google.com") {
      return { error: "As contas de administrador entram somente pelo botão Entrar com Google." };
    }
    const profile = {
      uid: user.uid,
      email,
      name: user.displayName || "Administrador",
      photo: user.photoURL || "",
      role: ROLE_ADMIN
    };
    // Mantém o cadastro do admin atualizado (não bloqueia o login se falhar)
    setDoc(ref, {
      name: profile.name,
      email,
      role: ROLE_ADMIN,
      active: true,
      provider: "google.com",
      lastLogin: serverTimestamp()
    }, { merge: true }).catch((e) => console.warn("[MONTAXX] users/admin:", e));

    return profile;
  }

  // ---- Caminho do FUNCIONÁRIO -------------------------------------------
  if (provider === "google.com") {
    return { error: "Esta conta Google não é administradora do sistema MONTAXX." };
  }

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (e) {
    return { error: friendlyError(e) };
  }

  if (!snap.exists()) {
    return { error: "Acesso ainda não liberado. Peça ao administrador para cadastrar o seu usuário." };
  }

  const data = snap.data();
  if (data.active === false) {
    return { error: "Este acesso foi desativado pelo administrador." };
  }

  updateDoc(ref, { lastLogin: serverTimestamp() }).catch(() => { /* opcional */ });

  return {
    uid: user.uid,
    email,
    name: data.name || email,
    photo: "",
    // Papel de admin só existe via Google: um cadastro de senha nunca vira admin
    role: ROLE_STAFF
  };
}

// --------------------------------------------------------------------------
// Aplicação do papel na interface
// --------------------------------------------------------------------------
function applyProfileToUI(profile) {
  document.body.dataset.role = profile.role;

  const avatar = $("sidebar-user-avatar");
  const nameEl = $("sidebar-user-name");
  const roleEl = $("sidebar-user-role");

  if (avatar) {
    if (profile.photo) {
      avatar.innerHTML = '<img src="' + escapeHtml(profile.photo) + '" alt="" referrerpolicy="no-referrer">';
    } else {
      avatar.textContent = initials(profile.name);
    }
  }
  if (nameEl) nameEl.textContent = profile.name;
  if (roleEl) {
    roleEl.textContent = profile.role === ROLE_ADMIN ? "Administrador" : "Funcionário / Montador";
  }

  // Funcionário nunca fica parado em uma aba restrita
  if (profile.role !== ROLE_ADMIN) {
    const active = document.querySelector(".view-panel.active");
    if (active && active.hasAttribute("data-admin-only")) {
      const dash = document.querySelector('.nav-link-item[data-view="view-dashboard"]');
      if (dash) dash.click();
    }
  }
}

// --------------------------------------------------------------------------
// Ciclo de vida da sessão
// --------------------------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (signingOut) return;

  if (!user) {
    currentProfile = null;
    window.MONTAXX_USER = null;
    stopTeamWatch();
    stopCloudSync();
    document.body.removeAttribute("data-role");
    setGateState("form");
    setBusy(false);
    return;
  }

  setGateState("loading");
  const profile = await resolveProfile(user);

  if (profile.error) {
    // Conta autenticada porém sem autorização: encerra a sessão
    signingOut = true;
    try { await signOut(auth); } finally { signingOut = false; }
    setGateState("form");
    setBusy(false);
    showAuthError(profile.error);
    return;
  }

  currentProfile = profile;
  window.MONTAXX_USER = profile;
  showAuthError("");
  applyProfileToUI(profile);
  startCloudSync(profile);

  if (profile.role === ROLE_ADMIN) startTeamWatch();

  setGateState("ready");
  setBusy(false);
  if (window.showToast) {
    window.showToast("Bem-vindo, " + profile.name.split(" ")[0] + "!");
  }
});

// --------------------------------------------------------------------------
// Ações de login
// --------------------------------------------------------------------------
async function loginWithGoogle() {
  showAuthError("");
  setBusy(true, "Abrindo o login do Google…");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const popupBlocked = [
      "auth/popup-blocked",
      "auth/operation-not-supported-in-this-environment"
    ].includes(err.code);

    if (popupBlocked) {
      try {
        await signInWithRedirect(auth, provider);
        return; // a página será recarregada pelo Google
      } catch (e2) {
        showAuthError(friendlyError(e2));
      }
    } else if (err.code !== "auth/cancelled-popup-request") {
      showAuthError(friendlyError(err));
    }
    setBusy(false);
  }
}

async function loginWithPassword(event) {
  if (event) event.preventDefault();
  showAuthError("");

  const emailField = $("staff-email");
  const passwordField = $("staff-password");
  const email = emailField ? emailField.value.trim() : "";
  const password = passwordField ? passwordField.value : "";

  if (!email || !password) {
    showAuthError("Preencha o e-mail e a senha para entrar.");
    return;
  }

  setBusy(true, "Entrando…");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    if (passwordField) passwordField.value = "";
  } catch (err) {
    showAuthError(friendlyError(err));
    setBusy(false);
  }
}

async function recoverPassword() {
  const emailField = $("staff-email");
  const email = emailField ? emailField.value.trim() : "";

  if (!email) {
    showAuthError("Digite o seu e-mail no campo acima para receber o link de redefinição.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showAuthError("");
    alert("Enviamos um link de redefinição de senha para " + email + ". Confira a caixa de entrada e o spam.");
  } catch (err) {
    showAuthError(friendlyError(err));
  }
}

window.montaxxLogout = async function montaxxLogout() {
  if (!confirm("Deseja sair do sistema MONTAXX?")) return;

  signingOut = true;
  try {
    await flushCloudSync(); // garante que nada em edição se perca
  } catch (_) { /* segue com o logout mesmo assim */ }

  try {
    stopTeamWatch();
    stopCloudSync();
    await signOut(auth);
    // Limpa o cache local: o aparelho pode ser compartilhado com a equipe
    (window.MONTAXX_STORAGE_KEYS || []).forEach((k) => localStorage.removeItem(k));
  } finally {
    signingOut = false;
    location.reload();
  }
};

// --------------------------------------------------------------------------
// Gestão de equipe (somente administrador)
// --------------------------------------------------------------------------
function stopTeamWatch() {
  if (unsubscribeTeam) {
    unsubscribeTeam();
    unsubscribeTeam = null;
  }
}

function startTeamWatch() {
  if (unsubscribeTeam) return;
  const q = query(collection(db, USERS_COLLECTION), orderBy("name"));

  unsubscribeTeam = onSnapshot(q,
    (snap) => renderTeam(snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()))),
    (err) => {
      console.error("[MONTAXX] Erro ao carregar a equipe:", err);
      const list = $("team-list");
      if (list) {
        list.innerHTML = '<p class="team-empty">Não foi possível carregar a equipe: ' + escapeHtml(friendlyError(err)) + "</p>";
      }
    }
  );
}

function renderTeam(users) {
  const list = $("team-list");
  if (!list) return;

  if (!users.length) {
    list.innerHTML = '<p class="team-empty">Nenhum acesso cadastrado ainda.</p>';
    return;
  }

  list.innerHTML = users.map((u) => {
    const isAdmin = u.role === ROLE_ADMIN;
    const active = u.active !== false;
    const isSelf = currentProfile && u.uid === currentProfile.uid;
    const selfTag = isSelf ? ' <span class="team-self">você</span>' : "";
    const action = isAdmin
      ? '<span class="team-action-void">—</span>'
      : '<button class="btn-erp btn-erp-outline btn-sm" onclick="window.toggleTeamMember(\'' +
        escapeHtml(u.uid) + "', " + active + ')">' + (active ? "Desativar" : "Reativar") + "</button>";

    return '' +
      '<div class="team-row' + (active ? "" : " is-inactive") + '">' +
        '<div class="team-avatar">' + escapeHtml(initials(u.name || u.email)) + "</div>" +
        '<div class="team-data">' +
          "<strong>" + escapeHtml(u.name || "(sem nome)") + selfTag + "</strong>" +
          "<span>" + escapeHtml(u.email || "") + "</span>" +
        "</div>" +
        '<span class="team-tag ' + (isAdmin ? "is-admin" : "is-staff") + '">' +
          (isAdmin ? "Administrador" : "Funcionário") +
        "</span>" +
        action +
      "</div>";
  }).join("");
}

window.openNewEmployeeModal = function openNewEmployeeModal() {
  if (!currentProfile || currentProfile.role !== ROLE_ADMIN) return;
  ["new-emp-name", "new-emp-email", "new-emp-password"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  const modal = $("modal-new-employee");
  if (modal) modal.classList.add("open");
};

window.saveNewEmployee = async function saveNewEmployee() {
  if (!currentProfile || currentProfile.role !== ROLE_ADMIN) return;

  const name = ($("new-emp-name") || {}).value;
  const emailRaw = ($("new-emp-email") || {}).value;
  const password = ($("new-emp-password") || {}).value;
  const btn = $("btn-save-employee");

  const cleanName = (name || "").trim();
  const email = (emailRaw || "").trim().toLowerCase();

  if (!cleanName || !email || !password) {
    alert("Preencha o nome, o e-mail e a senha do funcionário.");
    return;
  }
  if (password.length < 6) {
    alert("A senha precisa ter no mínimo 6 caracteres.");
    return;
  }
  if (isAdminEmail(email)) {
    alert("Este e-mail é de administrador e entra pelo login do Google.");
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = "Criando acesso…"; }

  try {
    // App secundário: cria o usuário SEM derrubar a sessão do administrador
    const cred = await createUserWithEmailAndPassword(workerAuth, email, password);
    await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});

    await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), {
      name: cleanName,
      email,
      role: ROLE_STAFF,
      active: true,
      provider: "password",
      createdAt: serverTimestamp(),
      createdBy: currentProfile.email
    });

    await signOut(workerAuth);

    const modal = $("modal-new-employee");
    if (modal) modal.classList.remove("open");
    if (window.showToast) window.showToast("Acesso criado para " + cleanName + ".");
  } catch (err) {
    console.error("[MONTAXX] Erro ao criar funcionário:", err);
    alert("Não foi possível criar o acesso: " + friendlyError(err));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Criar Acesso"; }
  }
};

window.toggleTeamMember = async function toggleTeamMember(uid, isActive) {
  if (!currentProfile || currentProfile.role !== ROLE_ADMIN) return;

  const acao = isActive ? "desativar" : "reativar";
  if (!confirm("Deseja " + acao + " este acesso?")) return;

  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { active: !isActive });
    if (window.showToast) {
      window.showToast("Acesso " + (isActive ? "desativado" : "reativado") + ".");
    }
  } catch (err) {
    alert("Não foi possível alterar o acesso: " + friendlyError(err));
  }
};

// --------------------------------------------------------------------------
// Ligações de eventos da tela de login
// --------------------------------------------------------------------------
function bindGate() {
  // Aponta todos os links "ver site" para o endereço configurado
  document.querySelectorAll("[data-site-link]").forEach((a) => { a.href = SITE_URL; });

  const btnGoogle = $("btn-login-google");
  const formStaff = $("form-login-staff");
  const btnForgot = $("btn-forgot-password");

  if (btnGoogle) btnGoogle.addEventListener("click", loginWithGoogle);
  if (formStaff) formStaff.addEventListener("submit", loginWithPassword);
  if (btnForgot) btnForgot.addEventListener("click", recoverPassword);

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".auth-pane").forEach((p) => {
        p.classList.toggle("active", p.id === tab.dataset.target);
      });
      showAuthError("");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindGate);
} else {
  bindGate();
}

// Retorno do login por redirecionamento (celulares que bloqueiam popup)
getRedirectResult(auth).catch((err) => {
  if (err && err.code) showAuthError(friendlyError(err));
});
