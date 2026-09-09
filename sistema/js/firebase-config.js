// ==========================================================================
// MONTAXX ERP — Inicialização do Firebase (App / Auth / Firestore / Analytics)
// Módulo ES: importado por auth.js e cloud-sync.js
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getAnalytics,
  isSupported as analyticsSupported
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

// --------------------------------------------------------------------------
// Credenciais públicas do projeto (podem ficar no cliente com segurança:
// a proteção real dos dados é feita pelas Regras do Firestore — firestore.rules)
// --------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyBM5KP_TymI9OK6hFMNt2_QYF6k_vYmzM4",
  authDomain: "sistema-de-alan.firebaseapp.com",
  projectId: "sistema-de-alan",
  storageBucket: "sistema-de-alan.firebasestorage.app",
  messagingSenderId: "444485916633",
  appId: "1:444485916633:web:120f6801460403e9e8abc8",
  measurementId: "G-J02CKZ2MLE"
};

// --------------------------------------------------------------------------
// Administradores do sistema (login exclusivo via Google).
// Esta lista precisa ser idêntica à do arquivo firestore.rules.
// --------------------------------------------------------------------------
export const ADMIN_EMAILS = [
  "brisasofc@gmail.com",
  "montaxxsolucoes@gmail.com"
];

// Caminhos usados no Firestore
export const ERP_DOC_PATH = { collection: "erp", id: "montaxx" };
export const USERS_COLLECTION = "users";

// --------------------------------------------------------------------------
// Endereço público do site institucional.
// Local (dev-server.js) funciona com "/site/". Em produção o site e o sistema
// são DOIS projetos separados na Vercel, então troque aqui pelo domínio real,
// ex.: "https://montaxx.vercel.app" — todos os links do sistema seguem esta
// constante (marcados no HTML com data-site-link).
// --------------------------------------------------------------------------
export const SITE_URL = "/site/";

// --------------------------------------------------------------------------
// App principal (sessão do usuário logado)
// --------------------------------------------------------------------------
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Mantém o montador logado mesmo fechando o navegador
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[MONTAXX] Não foi possível ativar a persistência de sessão:", err);
});

// Firestore com cache offline (o montador continua trabalhando sem sinal
// no apartamento do cliente e sincroniza sozinho ao voltar a internet)
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (err) {
    console.warn("[MONTAXX] Cache offline indisponível, usando modo online:", err);
    return getFirestore(app);
  }
})();

// --------------------------------------------------------------------------
// App secundário — usado APENAS para o administrador cadastrar funcionários.
// Sem ele, o createUserWithEmailAndPassword trocaria a sessão do admin
// pela sessão do funcionário recém-criado.
// --------------------------------------------------------------------------
export const workerApp = initializeApp(firebaseConfig, "montaxx-user-factory");
export const workerAuth = getAuth(workerApp);

// --------------------------------------------------------------------------
// Analytics (opcional — só funciona em HTTPS/localhost e se o navegador aceitar)
// --------------------------------------------------------------------------
analyticsSupported()
  .then((ok) => { if (ok) getAnalytics(app); })
  .catch(() => { /* ambiente sem suporte a analytics: ignorar silenciosamente */ });

// Verifica se o e-mail pertence à lista de administradores
export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}
