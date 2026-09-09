// MONTAXX - Calculadora de Orçamento Minimalista Corporativa
(function() {
  const SERVICES_LIST = [
    // Móveis
    { id: "m_gr6", name: "Guarda-Roupa Casal / 6 Portas com Espelho", category: "moveis", basePrice: 180, time: "2h30" },
    { id: "m_gr4", name: "Guarda-Roupa Solteiro / 3 a 4 Portas", category: "moveis", basePrice: 130, time: "1h45" },
    { id: "m_cozinha", name: "Armário de Cozinha Completo (Balcão + Aéreos)", category: "moveis", basePrice: 220, time: "3h00" },
    { id: "m_painel", name: "Painel de TV com Nicho ou Rack Ripado", category: "moveis", basePrice: 120, time: "1h30" },
    { id: "m_cama_bau", name: "Cama Box com Baú / Cama de Casal", category: "moveis", basePrice: 110, time: "1h15" },
    { id: "m_mesa", name: "Mesa de Jantar com 4 a 6 Cadeiras", category: "moveis", basePrice: 100, time: "1h00" },
    { id: "m_escritorio", name: "Mesa de Trabalho / Setup Corporativo", category: "moveis", basePrice: 90, time: "1h00" },
    { id: "m_comoda", name: "Cômoda / Gaveteiro com Corrediças", category: "moveis", basePrice: 80, time: "45min" },
    
    // Acessórios
    { id: "a_tv", name: "Instalação de Suporte de TV (Alvenaria ou Painel)", category: "acessorios", basePrice: 70, time: "40min" },
    { id: "a_chuveiro", name: "Instalação / Troca de Chuveiro Elétrico", category: "acessorios", basePrice: 60, time: "30min" },
    { id: "a_ventilador", name: "Instalação de Ventilador de Teto com Balanceamento", category: "acessorios", basePrice: 120, time: "1h15" },
    { id: "a_luminaria", name: "Instalação de Luminária, Plafon ou Pendente", category: "acessorios", basePrice: 50, time: "30min" },
    { id: "a_cortina", name: "Instalação de Varão ou Trilho Suíço de Cortina", category: "acessorios", basePrice: 45, time: "25min" },
    { id: "a_espelho", name: "Fixação de Espelho com Buchas Especiais ou Prateleira", category: "acessorios", basePrice: 40, time: "25min" },
    
    // Pisos
    { id: "p_laminado", name: "Instalação de Piso Laminado / Vinílico (por 10m²)", category: "pisos", basePrice: 250, time: "3h00" },
    { id: "p_rodape", name: "Instalação de Rodapés com Canto 45° (por 15 metros)", category: "pisos", basePrice: 150, time: "2h00" }
  ];

  let selectedItems = {};

  function initCalculator() {
    renderServiceOptions("all");
    setupFilterButtons();
    setupWhatsAppButton();
  }

  function renderServiceOptions(category) {
    const listContainer = document.getElementById("calc-items-grid");
    if (!listContainer) return;

    const filtered = (category === "all") 
      ? SERVICES_LIST 
      : SERVICES_LIST.filter(s => s.category === category);

    listContainer.innerHTML = filtered.map(item => {
      const qty = selectedItems[item.id] || 0;
      const isSelected = qty > 0;
      return `
        <div class="calc-item-card ${isSelected ? 'active' : ''}" data-id="${item.id}">
          <div style="flex-grow: 1;">
            <div class="calc-item-name">${item.name}</div>
            <div class="calc-item-meta">
              <span>⏱️ Duração: ~${item.time}</span> • 
              <span>Referência: <strong>R$ ${item.basePrice.toFixed(2).replace('.', ',')}</strong></span>
            </div>
          </div>
          <div class="calc-qty-control">
            <button type="button" class="btn-qty btn-minus" data-id="${item.id}" aria-label="Diminuir">−</button>
            <span class="qty-display" id="qty-${item.id}">${qty}</span>
            <button type="button" class="btn-qty btn-plus" data-id="${item.id}" aria-label="Aumentar">+</button>
          </div>
        </div>
      `;
    }).join("");

    attachQtyListeners();
  }

  function setupFilterButtons() {
    const filterBtns = document.querySelectorAll(".calc-filter-pill");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.getAttribute("data-category");
        renderServiceOptions(category);
      });
    });
  }

  function attachQtyListeners() {
    const container = document.getElementById("calc-items-grid");
    if (!container) return;

    container.querySelectorAll(".btn-plus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        selectedItems[id] = (selectedItems[id] || 0) + 1;
        updateItemUI(id);
        updateSummary();
      });
    });

    container.querySelectorAll(".btn-minus").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (selectedItems[id] && selectedItems[id] > 0) {
          selectedItems[id]--;
          if (selectedItems[id] === 0) delete selectedItems[id];
        }
        updateItemUI(id);
        updateSummary();
      });
    });
  }

  function updateItemUI(id) {
    const qtySpan = document.getElementById(`qty-${id}`);
    const card = document.querySelector(`.calc-item-card[data-id="${id}"]`);
    const qty = selectedItems[id] || 0;
    if (qtySpan) qtySpan.textContent = qty;
    if (card) {
      if (qty > 0) card.classList.add("active");
      else card.classList.remove("active");
    }
  }

  function updateSummary() {
    let total = 0;
    let count = 0;
    const summaryList = document.getElementById("calc-summary-items");
    const summaryTotal = document.getElementById("calc-summary-total");
    const discountContainer = document.getElementById("calc-summary-discount");

    const lines = [];

    for (const [id, qty] of Object.entries(selectedItems)) {
      if (qty > 0) {
        const item = SERVICES_LIST.find(s => s.id === id);
        if (item) {
          const sub = item.basePrice * qty;
          total += sub;
          count += qty;
          lines.push(`
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--border-hairline);">
              <span style="color: var(--text-secondary);">${item.name} (${qty}x)</span>
              <span style="font-weight: 700; color: var(--text-pure);">R$ ${sub.toFixed(2).replace('.', ',')}</span>
            </div>
          `);
        }
      }
    }

    let discount = (count >= 3) ? (total * 0.10) : 0;
    let finalTotal = Math.max(0, total - discount);

    if (summaryList) {
      if (lines.length === 0) {
        summaryList.innerHTML = `<div style="color: var(--text-tertiary); text-align: center; padding: 20px 0;">Selecione os serviços ao lado para simular.</div>`;
      } else {
        summaryList.innerHTML = lines.join("");
      }
    }

    if (discountContainer) {
      if (discount > 0) {
        discountContainer.innerHTML = `<div style="background: var(--success-subtle); color: var(--success); font-size: 0.78rem; font-weight: 600; padding: 6px 10px; border-radius: 4px; margin-bottom: 12px; text-align: center;">✓ Desconto Combo Aplicado (10% OFF): - R$ ${discount.toFixed(2).replace('.', ',')}</div>`;
        discountContainer.style.display = "block";
      } else {
        discountContainer.innerHTML = "";
        discountContainer.style.display = "none";
      }
    }

    if (summaryTotal) {
      summaryTotal.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    }

    const waBtn = document.getElementById("btn-calc-whatsapp");
    if (waBtn) {
      waBtn.disabled = (count === 0);
      waBtn.style.opacity = (count === 0) ? "0.6" : "1";
    }
  }

  function setupWhatsAppButton() {
    const btn = document.getElementById("btn-calc-whatsapp");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const keys = Object.keys(selectedItems).filter(k => selectedItems[k] > 0);
      if (keys.length === 0) return;

      const neighborhood = document.getElementById("calc-neighborhood")?.value.trim() || "A definir";
      const access = document.getElementById("calc-access")?.value || "Térreo / Elevador";

      let total = 0;
      let count = 0;
      let listTxt = "";

      keys.forEach(id => {
        const item = SERVICES_LIST.find(s => s.id === id);
        const qty = selectedItems[id];
        const sub = item.basePrice * qty;
        total += sub;
        count += qty;
        listTxt += `• ${qty}x ${item.name} (~R$ ${sub.toFixed(2)})\n`;
      });

      let discount = (count >= 3) ? (total * 0.10) : 0;
      let finalTotal = total - discount;

      const message = 
`*SOLICITAÇÃO DE ORÇAMENTO — MONTAXX*
---------------------------------------
Olá, gostaria de verificar disponibilidade para os seguintes serviços:

📋 *ITENS SELECIONADOS:*
${listTxt}
${discount > 0 ? `🎁 Desconto Combo (10%): -R$ ${discount.toFixed(2)}\n` : ""}💰 *Estimativa Total:* R$ ${finalTotal.toFixed(2)}

📍 *LOCAL E ACESSO:*
• Região/Bairro: ${neighborhood}
• Acesso: ${access}

Poderia me confirmar a disponibilidade técnica na agenda? Obrigado!`;

      const phone = "5511999999999";
      const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalculator);
  } else {
    initCalculator();
  }
})();
