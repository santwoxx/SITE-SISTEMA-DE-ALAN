// MONTAXX - Script Principal do Site (Minimalist Corporate)
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initCatalog();
  initModal();
  initFaq();
  initScrollEffects();
});

// 1. Navbar & Mobile Drawer
function initNavbar() {
  const navToggle = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  const navbar = document.querySelector(".navbar");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navMenu.classList.toggle("open");
      document.body.classList.toggle("menu-locked");
    });

    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("active");
        navMenu.classList.remove("open");
        document.body.classList.remove("menu-locked");
      });
    });
  }

  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// 2. Catálogo de Móveis
function initCatalog() {
  const container = document.getElementById("furniture-grid");
  const filterBtns = document.querySelectorAll(".catalog-filter-tab");

  if (!container || !window.MONTAXX_CATALOG) return;

  function renderProducts(category = "all") {
    const products = (category === "all") 
      ? window.MONTAXX_CATALOG 
      : window.MONTAXX_CATALOG.filter(p => p.category === category);

    if (products.length === 0) {
      container.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 40px 0; color: var(--text-tertiary);">Nenhum produto cadastrado nesta categoria.</div>`;
      return;
    }

    container.innerHTML = products.map(product => {
      const formattedCash = product.priceCash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `
        <div class="product-card" data-id="${product.id}">
          <div class="product-image-box">
            <span class="product-badge-pill">${product.badge}</span>
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <div class="product-content">
            <span class="product-sub-cat">${product.categoryLabel} • Cód: ${product.id}</span>
            <h3 class="product-title">${product.name}</h3>
            
            <div class="product-specs">
              <div><strong>Dimensões:</strong> ${product.dimensions}</div>
              <div class="product-benefit">✓ ${product.included}</div>
            </div>

            <div class="product-price-block">
              <div class="price-main">${formattedCash} <span style="font-size: 0.75rem; color: var(--brand-gold); font-weight: 600;">à vista no Pix</span></div>
              <div class="price-condition">ou ${product.installments}</div>
            </div>

            <div class="product-footer-actions">
              <a href="https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent('Olá MONTAXX! Tenho interesse no móvel: ' + product.name + ' (Cód: ' + product.id + '). Poderia me passar mais detalhes?')}" 
                 target="_blank" 
                 class="btn-consult-whatsapp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
                Consultar Disponibilidade
              </a>
              <button type="button" class="btn-specs-icon" onclick="openProductModal('${product.id}')" title="Ver ficha técnica">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const category = btn.getAttribute("data-category");
      renderProducts(category);
    });
  });

  renderProducts("all");
}

// 3. Modal de Especificações do Produto
function initModal() {
  const modal = document.getElementById("product-modal");
  const closeBtn = document.getElementById("modal-close");

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      modal.classList.remove("open");
    }
  });
}

window.openProductModal = function(id) {
  const modal = document.getElementById("product-modal");
  const product = window.MONTAXX_CATALOG?.find(p => p.id === id);
  if (!modal || !product) return;

  const content = document.getElementById("modal-product-content");
  const formattedCash = product.priceCash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const colorsHtml = product.colors.map(c => `<span style="background: var(--bg-surface-elevated); border: 1px solid var(--border-light); padding: 3px 8px; border-radius: 4px; font-size: 0.78rem;">${c}</span>`).join(" ");

  content.innerHTML = `
    <div class="modal-grid">
      <div class="modal-gallery">
        <img src="${product.image}" alt="${product.name}" class="modal-main-img">
        <div class="modal-badge-float">${product.badge}</div>
      </div>
      <div>
        <span style="font-size: 0.75rem; color: var(--brand-gold); font-weight: 700; text-transform: uppercase;">${product.categoryLabel} • CÓD: ${product.id}</span>
        <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-pure); margin: 6px 0 14px; line-height: 1.25;">${product.name}</h2>
        
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-light); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px;">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-pure);">${formattedCash} <span style="font-size: 0.75rem; color: var(--brand-gold); font-weight: 700;">À VISTA NO PIX</span></div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">ou ${product.installments} sem juros</div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--success); margin-bottom: 16px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <strong>Diferencial MONTAXX:</strong> ${product.included}
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; margin-bottom: 18px; border-top: 1px solid var(--border-hairline); border-bottom: 1px solid var(--border-hairline); padding: 12px 0;">
          <div><strong style="color: var(--text-pure);">Dimensões:</strong> <span style="color: var(--text-secondary);">${product.dimensions}</span></div>
          <div><strong style="color: var(--text-pure);">Material:</strong> <span style="color: var(--text-secondary);">${product.material}</span></div>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;"><strong style="color: var(--text-pure);">Cores:</strong> ${colorsHtml}</div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 22px;">${product.description}</p>

        <a href="https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent('Olá! Gostaria de reservar o ' + product.name + ' (Cód: ' + product.id + '). Poderia me atender?')}" 
           target="_blank" 
           class="btn-primary-corporate btn-block" 
           style="padding: 12px;">
          Falar com Consultor no WhatsApp
        </a>
      </div>
    </div>
  `;

  modal.classList.add("open");
};

// 4. FAQ
function initFaq() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    if (!question) return;
    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      faqItems.forEach(other => other.classList.remove("open"));
      if (!isOpen) {
        item.classList.add("open");
      }
    });
  });
}

// 5. Scroll suave
function initScrollEffects() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
}
