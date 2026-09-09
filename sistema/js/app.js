// MONTAXX ERP - Controlador Principal da Aplicação & Roteamento
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initModals();
  initSettings();
  
  // Inicializa visualizações
  if (window.renderDashboard) window.renderDashboard();
  if (window.initOSManager) window.initOSManager();
  if (window.renderFurniture) window.renderFurniture();
  if (window.initQuoteGenerator) window.initQuoteGenerator();
  if (window.initClientManager) window.initClientManager();
  if (window.initFinancial) window.initFinancial();
});

// 1. Navegação entre Abas do ERP
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link-item");
  const views = document.querySelectorAll(".view-panel");
  const pageTitle = document.getElementById("topbar-page-title");
  const sidebar = document.getElementById("erp-sidebar");
  const toggleBtn = document.getElementById("btn-toggle-sidebar");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetViewId = link.getAttribute("data-view");

      // Atualiza link ativo
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Atualiza painel visível
      views.forEach(v => v.classList.remove("active"));
      const targetEl = document.getElementById(targetViewId);
      if (targetEl) targetEl.classList.add("active");

      // Atualiza título da barra superior
      if (pageTitle) {
        pageTitle.textContent = link.querySelector("span")?.textContent || "Painel";
      }

      // Fecha sidebar no mobile ao clicar
      if (sidebar && sidebar.classList.contains("mobile-open")) {
        sidebar.classList.remove("mobile-open");
      }

      // Gatilhos específicos ao abrir aba
      if (targetViewId === "view-quotes" && window.initQuoteGenerator) {
        window.initQuoteGenerator();
      }
    });
  });

  // Toggle do menu mobile
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });
  }
}

// 2. Sistema de Modais
function initModals() {
  // Fecha modais com data-close ou botão X
  document.querySelectorAll(".erp-modal-close, [data-modal-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".erp-modal-overlay").forEach(m => m.classList.remove("open"));
    });
  });

  // Fecha clicando no backdrop
  document.querySelectorAll(".erp-modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  });

  // Tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".erp-modal-overlay").forEach(m => m.classList.remove("open"));
    }
  });
}

// 3. Sistema de Notificações Toast
window.showToast = function(message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span style="color: var(--primary); font-size: 1.1rem;">⚡</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// 4. Configurações, Backup e Restauração
function initSettings() {
  const settings = window.MONTAXX_STORE.getSettings();

  // Carrega configurações nos campos
  const setField = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  };

  setField("settings-company-name", settings.companyName);
  setField("settings-owner-name", settings.ownerName);
  setField("settings-phone", settings.phone);
  setField("settings-email", settings.email);
  setField("settings-pix", settings.pixKey);
  setField("settings-city", settings.city);

  // Salvar Configurações
  const saveBtn = document.getElementById("btn-save-settings");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const updated = {
        companyName: document.getElementById("settings-company-name")?.value.trim(),
        ownerName: document.getElementById("settings-owner-name")?.value.trim(),
        phone: document.getElementById("settings-phone")?.value.trim(),
        email: document.getElementById("settings-email")?.value.trim(),
        pixKey: document.getElementById("settings-pix")?.value.trim(),
        city: document.getElementById("settings-city")?.value.trim()
      };
      window.MONTAXX_STORE.updateSettings(updated);
      window.showToast("Configurações da MONTAXX salvas com sucesso!");
    });
  }

  // Backup Export
  const exportBtn = document.getElementById("btn-export-backup");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      window.MONTAXX_STORE.exportJSON();
      window.showToast("Arquivo de backup baixado para o seu computador!");
    });
  }

  // Backup Import
  const importInput = document.getElementById("input-import-backup");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = window.MONTAXX_STORE.importJSON(event.target.result);
        if (result.success) {
          window.showToast("Dados restaurados do backup com sucesso!");
          setTimeout(() => location.reload(), 1000);
        } else {
          alert("Erro ao importar backup: " + result.error);
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset to Demo
  const resetBtn = document.getElementById("btn-reset-demo");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Deseja restaurar os dados de demonstração da MONTAXX? (Isso sobrescreverá cadastros não salvos em backup).")) {
        window.MONTAXX_STORE.resetToDefault();
        window.showToast("Dados padrão restaurados!");
        setTimeout(() => location.reload(), 800);
      }
    });
  }
}
