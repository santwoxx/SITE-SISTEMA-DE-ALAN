// MONTAXX - Script Principal (Estilo Homy Casa Clean Retail)
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initCatalog();
  initModal();
  initFaq();
  initGallery();
  initScrollEffects();
});

// 1. Navbar & Mobile Drawer
function initNavbar() {
  const navToggle = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  const header = document.getElementById("site-header");

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
    if (header) {
      if (window.scrollY > 30) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
  });
}

// 2. Vitrine de Produtos (Homy Casa Card Style)
function initCatalog() {
  const container = document.getElementById("furniture-grid");
  const filterTabs = document.querySelectorAll(".catalog-filter-tab");

  if (!container || !window.MONTAXX_CATALOG) return;

  function renderProducts(category = "all") {
    const products = (category === "all") 
      ? window.MONTAXX_CATALOG 
      : window.MONTAXX_CATALOG.filter(p => p.category === category);

    if (products.length === 0) {
      container.innerHTML = `<div style="grid-column: span 4; text-align: center; padding: 40px 0; color: var(--text-muted);">Nenhum produto nesta categoria no momento.</div>`;
      return;
    }

    container.innerHTML = products.map(p => {
      const formattedCash = p.priceCash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const formattedOld = p.priceOld ? p.priceOld.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "";

      const swatchesHtml = (p.colors || []).map(colorHex => `
        <span class="swatch-dot" style="background-color: ${colorHex};" title="${colorHex}"></span>
      `).join("");

      return `
        <div class="product-clean-card" data-id="${p.id}">
          <div class="product-image-container" onclick="openProductModal('${p.id}')" style="cursor: pointer;">
            <span class="product-tag-pill">${p.badge}</span>
            ${p.discountPct ? `<div class="discount-circle-badge">${p.discountPct}</div>` : ""}
            <img src="${p.image}" alt="${p.name}" loading="lazy">
          </div>

          <div class="product-clean-body">
            <div class="product-color-swatches">
              ${swatchesHtml}
            </div>

            <h3 class="product-clean-title" onclick="openProductModal('${p.id}')" style="cursor: pointer;">
              ${p.name}
            </h3>

            <div class="product-clean-meta">
              <span>Dimensões: ${p.dimensions}</span>
              <span class="free-assembly">✨ ${p.included}</span>
            </div>

            <div class="product-pricing-clean">
              <div class="price-row-clean">
                <span class="current-price">${formattedCash}</span>
                ${formattedOld ? `<span class="old-price">${formattedOld}</span>` : ""}
              </div>
              <div class="installments-text">ou ${p.installments}</div>
            </div>

            <button type="button" class="btn-buy-clean" onclick="openProductModal('${p.id}')">
              Ver Detalhes & Comprar
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const cat = tab.getAttribute("data-category");
      renderProducts(cat);
    });
  });

  renderProducts("all");
}

// 3. Modal de Detalhes
function initModal() {
  const modal = document.getElementById("product-modal");
  const closeBtn = document.getElementById("modal-close");

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
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
  const formattedOld = product.priceOld ? product.priceOld.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "";

  const colorsList = (product.colorNames || []).map(name => `
    <span style="background: #F3F4F6; border: 1px solid #E5E7EB; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; color: #111827;">${name}</span>
  `).join(" ");

  content.innerHTML = `
    <div class="modal-grid">
      <div class="modal-gallery">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div>
        <span style="font-size: 0.75rem; color: #D97706; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">${product.categoryLabel} • CÓD: ${product.id}</span>
        <h2 style="font-size: 1.5rem; font-weight: 900; color: #111827; margin: 6px 0 12px; line-height: 1.25;">${product.name}</h2>
        
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 1.7rem; font-weight: 900; color: #111827;">${formattedCash}</span>
            ${formattedOld ? `<span style="font-size: 1rem; color: #9CA3AF; text-decoration: line-through;">${formattedOld}</span>` : ""}
            <span style="font-size: 0.75rem; background: #FEF3C7; color: #92400E; padding: 2px 6px; border-radius: 4px; font-weight: 800;">À VISTA NO PIX</span>
          </div>
          <div style="font-size: 0.82rem; color: #6B7280; margin-top: 4px;">ou em ${product.installments} no cartão de crédito</div>
        </div>

        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; color: #065F46; font-weight: 700; margin-bottom: 16px;">
          ✓ Vantagem Exclusiva: ${product.included}
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; margin-bottom: 18px; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 12px 0;">
          <div><strong style="color: #111827;">Dimensões:</strong> <span style="color: #4B5563;">${product.dimensions}</span></div>
          <div><strong style="color: #111827;">Estrutura:</strong> <span style="color: #4B5563;">${product.material}</span></div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 4px;">
            <strong style="color: #111827;">Cores:</strong> ${colorsList}
          </div>
        </div>

        <p style="font-size: 0.88rem; color: #4B5563; line-height: 1.6; margin-bottom: 22px;">${product.description}</p>

        <a href="https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent('Olá MONTAXX! Tenho interesse no móvel: ' + product.name + ' (Cód: ' + product.id + ') anunciado no site. Poderia me confirmar o prazo de entrega?')}" 
           target="_blank" 
           style="background: #25D366; color: #FFF; font-weight: 800; font-size: 0.95rem; padding: 14px 20px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          Comprar / Reservar no WhatsApp
        </a>
      </div>
    </div>
  `;

  modal.classList.add("open");
};

// 4. FAQ
function initFaq() {
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      if (item) item.classList.toggle("open");
    });
  });
}

// 6. Galeria de Projetos Executados (filtro por ambiente + lightbox)
function initGallery() {
  const grid = document.getElementById("gallery-grid");
  const lightbox = document.getElementById("gallery-lightbox");
  if (!grid || !lightbox) return;

  const items = Array.from(grid.querySelectorAll(".gallery-item"));
  const pills = Array.from(document.querySelectorAll(".gallery-filter-pill"));
  const emptyMsg = document.getElementById("gallery-empty");

  const lbImg = document.getElementById("lightbox-img");
  const lbSource = document.getElementById("lightbox-source");
  const lbTitle = document.getElementById("lightbox-title");
  const lbDesc = document.getElementById("lightbox-desc");
  const lbCounter = document.getElementById("lightbox-counter");

  let visible = items.slice();   // itens do filtro ativo (define o prev/next)
  let current = 0;
  let lastFocused = null;

  // --- Masonry: altura de cada card a partir da proporcao real da foto ------
  // Usa os atributos width/height do <img>, entao nao depende do download e
  // nao causa salto de layout (CLS).
  const ROW = 4;      // grid-auto-rows
  const GAP = 18;     // margin-bottom do card

  function layout() {
    const cols = getComputedStyle(grid).gridTemplateColumns.split(" ");
    const colWidth = parseFloat(cols[0]);
    if (!colWidth) return;

    items.forEach(item => {
      const img = item.querySelector("img");
      const w = Number(img.getAttribute("width"));
      const h = Number(img.getAttribute("height"));
      if (!w || !h) return;
      const height = colWidth * (h / w);
      item.style.gridRowEnd = "span " + Math.ceil((height + GAP) / ROW);
    });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
  layout();

  // --- Filtro por ambiente -------------------------------------------------
  function applyFilter(filter) {
    visible = items.filter(item => {
      const match = filter === "all" || item.dataset.ambiente === filter;
      item.hidden = !match;
      return match;
    });
    if (emptyMsg) emptyMsg.hidden = visible.length > 0;
  }

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      applyFilter(pill.dataset.filter);
    });
  });

  // --- Lightbox ------------------------------------------------------------
  function show(index) {
    if (!visible.length) return;
    current = (index + visible.length) % visible.length;
    const item = visible[current];

    lbSource.srcset = item.dataset.fullWebp || "";
    lbImg.src = item.dataset.full;
    lbImg.width = item.dataset.fullW || "";
    lbImg.height = item.dataset.fullH || "";
    lbImg.alt = item.dataset.titulo + " — projeto executado pela MONTAXX";
    lbTitle.textContent = item.dataset.titulo;
    lbDesc.textContent = item.dataset.desc;
    lbCounter.textContent = (current + 1) + " / " + visible.length;
  }

  function open(index) {
    lastFocused = document.activeElement;
    show(index);
    lightbox.classList.add("open");
    document.body.classList.add("menu-locked");
    document.getElementById("lightbox-close").focus();
  }

  function close() {
    lightbox.classList.remove("open");
    document.body.classList.remove("menu-locked");
    lbImg.src = "";
    lbSource.srcset = "";
    if (lastFocused) lastFocused.focus();
  }

  items.forEach(item => {
    item.addEventListener("click", () => open(visible.indexOf(item)));
  });

  document.getElementById("lightbox-close").addEventListener("click", close);
  document.getElementById("lightbox-prev").addEventListener("click", () => show(current - 1));
  document.getElementById("lightbox-next").addEventListener("click", () => show(current + 1));

  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
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
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}
