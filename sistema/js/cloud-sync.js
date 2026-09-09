// ==========================================================================
// MONTAXX ERP — Sincronização em nuvem (Firestore <-> Store local)
//
// Estratégia: o Store local (localStorage) continua sendo a fonte reativa da
// interface. Esta camada apenas:
//   1. Baixa o documento da empresa e injeta no Store (tempo real, onSnapshot).
//   2. Intercepta o save() do Store e envia as alterações para o Firestore.
// Assim todo o ERP já existente funciona sem precisar ser reescrito, e o
// administrador e os funcionários passam a enxergar os MESMOS dados.
// ==========================================================================

import { db, ERP_DOC_PATH } from "./firebase-config.js";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const DATA_KEYS = ["settings", "clients", "inventory", "orders", "transactions", "proposals"];
const PUSH_DEBOUNCE_MS = 700;

const erpDocRef = doc(db, ERP_DOC_PATH.collection, ERP_DOC_PATH.id);

let unsubscribeSnapshot = null;
let originalSave = null;
let pushTimer = null;
let applyingRemote = false;   // trava anti-eco: evita reenviar o que acabou de chegar
let hasFirstSnapshot = false; // só envia depois de conhecer o estado do servidor
let activeProfile = null;

// --------------------------------------------------------------------------
// Indicador visual de sincronização (chip na barra superior)
// --------------------------------------------------------------------------
function setStatus(state, label) {
  const el = document.getElementById("sync-status");
  if (!el) return;
  el.dataset.state = state;
  el.textContent = label;
  el.hidden = false;
}

// Remove undefined/funções — o Firestore rejeita valores undefined
function sanitize(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function buildPayload(data) {
  const payload = {};
  DATA_KEYS.forEach((key) => {
    const fallback = key === "settings" ? {} : [];
    payload[key] = sanitize(data[key] ?? fallback);
  });
  return payload;
}

// --------------------------------------------------------------------------
// Envio para a nuvem (com debounce, para não gravar a cada tecla digitada)
// --------------------------------------------------------------------------
async function pushNow() {
  const store = window.MONTAXX_STORE;
  if (!store || !hasFirstSnapshot) return;

  const payload = buildPayload(store.data);
  payload._updatedAt = serverTimestamp();
  payload._updatedBy = activeProfile?.email || "desconhecido";
  payload._updatedByName = activeProfile?.name || "";

  try {
    setStatus("saving", "Salvando…");
    await setDoc(erpDocRef, payload, { merge: true });
    setStatus("ok", "Sincronizado");
  } catch (err) {
    console.error("[MONTAXX] Falha ao enviar dados para a nuvem:", err);
    setStatus("error", "Erro ao salvar");
    if (window.showToast) {
      window.showToast("Sem conexão com a nuvem. Os dados ficam salvos neste aparelho e sobem sozinhos depois.");
    }
  }
}

function schedulePush() {
  if (applyingRemote || !hasFirstSnapshot) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
}

// --------------------------------------------------------------------------
// Recebimento da nuvem
// --------------------------------------------------------------------------
function applyRemote(remote) {
  const store = window.MONTAXX_STORE;
  const merged = { ...store.data };
  DATA_KEYS.forEach((key) => {
    if (remote[key] !== undefined && remote[key] !== null) merged[key] = remote[key];
  });

  applyingRemote = true;
  try {
    originalSave.call(store, merged); // grava no localStorage e re-renderiza as telas
  } finally {
    applyingRemote = false;
  }
}

// --------------------------------------------------------------------------
// API pública
// --------------------------------------------------------------------------
export function startCloudSync(profile) {
  const store = window.MONTAXX_STORE;
  if (!store) {
    console.error("[MONTAXX] Store local não encontrado — sincronização cancelada.");
    return;
  }

  activeProfile = profile;
  if (unsubscribeSnapshot) return; // já está rodando

  // Intercepta o save() do Store uma única vez
  if (!originalSave) {
    originalSave = store.save;
    store.save = function patchedSave(dataToSave) {
      originalSave.call(this, dataToSave);
      schedulePush();
    };
  }

  setStatus("saving", "Conectando…");

  unsubscribeSnapshot = onSnapshot(
    erpDocRef,
    async (snap) => {
      // Ignora o eco da nossa própria gravação otimista
      if (snap.metadata.hasPendingWrites) return;

      if (!snap.exists()) {
        // Primeiro acesso da empresa: sobe o conteúdo atual como base
        hasFirstSnapshot = true;
        try {
          await setDoc(erpDocRef, {
            ...buildPayload(store.data),
            _createdAt: serverTimestamp(),
            _updatedAt: serverTimestamp(),
            _updatedBy: activeProfile?.email || ""
          });
          setStatus("ok", "Sincronizado");
        } catch (err) {
          console.error("[MONTAXX] Falha ao criar a base na nuvem:", err);
          setStatus("error", "Sem permissão");
        }
        return;
      }

      applyRemote(snap.data());
      hasFirstSnapshot = true;
      setStatus(snap.metadata.fromCache ? "offline" : "ok",
                snap.metadata.fromCache ? "Offline (local)" : "Sincronizado");
    },
    (err) => {
      console.error("[MONTAXX] Erro na escuta do Firestore:", err);
      setStatus("error", "Sem conexão");
    }
  );
}

export function stopCloudSync() {
  clearTimeout(pushTimer);
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
  const store = window.MONTAXX_STORE;
  if (originalSave && store) {
    store.save = originalSave;
    originalSave = null;
  }
  hasFirstSnapshot = false;
  activeProfile = null;
  const el = document.getElementById("sync-status");
  if (el) el.hidden = true;
}

// Força o envio imediato (usado antes do logout, para não perder alterações)
export async function flushCloudSync() {
  clearTimeout(pushTimer);
  if (hasFirstSnapshot) await pushNow();
}
