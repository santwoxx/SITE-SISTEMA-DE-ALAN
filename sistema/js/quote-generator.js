// MONTAXX ERP - Gerador Profissional de Orçamentos e Propostas
(function() {
  let proposalItems = [
    { desc: "Montagem de Guarda-Roupa Casal 6 Portas", qty: 1, unitPrice: 220.00 }
  ];

  function initQuoteGenerator() {
    renderProposalItems();
    populateClientsDropdown();
    setupQuoteListeners();
  }

  function populateClientsDropdown() {
    const select = document.getElementById("quote-client-select");
    if (!select) return;
    const clients = window.MONTAXX_STORE.getClients();
    select.innerHTML = clients.map(c => `
      <option value="${c.id}">${c.name} (${c.phone})</option>
    `).join("");
  }

  function renderProposalItems() {
    const container = document.getElementById("quote-items-container");
    if (!container) return;

    container.innerHTML = proposalItems.map((item, idx) => {
      const subtotal = item.qty * item.unitPrice;
      return `
        <div style="display: grid; grid-template-columns: 2fr 0.8fr 1fr 1fr 40px; gap: 10px; align-items: center; margin-bottom: 10px;">
          <input type="text" class="form-control" value="${item.desc}" onchange="window.updateProposalItem(${idx}, 'desc', this.value)" placeholder="Descrição do serviço ou móvel">
          <input type="number" class="form-control" value="${item.qty}" min="1" onchange="window.updateProposalItem(${idx}, 'qty', this.value)">
          <input type="number" class="form-control" value="${item.unitPrice}" step="0.50" onchange="window.updateProposalItem(${idx}, 'unitPrice', this.value)" placeholder="Preço Un.">
          <div style="font-weight: 700; color: var(--primary); text-align: right; padding-right: 10px;">
            R$ ${subtotal.toFixed(2)}
          </div>
          <button type="button" class="btn-erp btn-erp-danger btn-sm" onclick="window.removeProposalItem(${idx})" title="Remover Item">✕</button>
        </div>
      `;
    }).join("");

    calculateTotals();
  }

  window.addProposalItem = function() {
    proposalItems.push({ desc: "", qty: 1, unitPrice: 0.00 });
    renderProposalItems();
  };

  window.removeProposalItem = function(idx) {
    if (proposalItems.length > 1) {
      proposalItems.splice(idx, 1);
      renderProposalItems();
    }
  };

  window.updateProposalItem = function(idx, field, value) {
    if (field === 'qty') proposalItems[idx].qty = parseInt(value) || 1;
    else if (field === 'unitPrice') proposalItems[idx].unitPrice = parseFloat(value) || 0;
    else proposalItems[idx].desc = value;
    renderProposalItems();
  };

  function calculateTotals() {
    let subtotal = 0;
    proposalItems.forEach(i => {
      subtotal += (i.qty * i.unitPrice);
    });

    const discount = parseFloat(document.getElementById("quote-discount")?.value) || 0;
    const fee = parseFloat(document.getElementById("quote-fee")?.value) || 0;
    const total = Math.max(0, subtotal - discount + fee);

    const subEl = document.getElementById("quote-subtotal-val");
    const totEl = document.getElementById("quote-total-val");

    if (subEl) subEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (totEl) totEl.textContent = `R$ ${total.toFixed(2)}`;
  }

  function setupQuoteListeners() {
    const discountInput = document.getElementById("quote-discount");
    const feeInput = document.getElementById("quote-fee");

    if (discountInput) discountInput.addEventListener("input", calculateTotals);
    if (feeInput) feeInput.addEventListener("input", calculateTotals);
  }

  // Envia Proposta Formatada via WhatsApp
  window.sendProposalWhatsApp = function() {
    const clientId = document.getElementById("quote-client-select")?.value;
    const client = window.MONTAXX_STORE.getClients().find(c => c.id === clientId);
    const settings = window.MONTAXX_STORE.getSettings();

    if (!client) {
      alert("Selecione um cliente.");
      return;
    }

    let subtotal = 0;
    let itemsText = "";
    proposalItems.forEach(item => {
      const lineSub = item.qty * item.unitPrice;
      subtotal += lineSub;
      itemsText += `• ${item.qty}x ${item.desc} — R$ ${lineSub.toFixed(2)}\n`;
    });

    const discount = parseFloat(document.getElementById("quote-discount")?.value) || 0;
    const fee = parseFloat(document.getElementById("quote-fee")?.value) || 0;
    const total = Math.max(0, subtotal - discount + fee);
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

    const message = 
`*ORÇAMENTO & PROPOSTA COMERCIAL - MONTAXX* 🛠️
-----------------------------------------------
Prezado(a) *${client.name}*, segue a discriminação do seu orçamento:

📋 *ITENS / SERVIÇOS:*
${itemsText}
${discount > 0 ? `🎁 Desconto Especial: - R$ ${discount.toFixed(2)}\n` : ""}${fee > 0 ? `🚗 Taxa de Deslocamento/Frete: + R$ ${fee.toFixed(2)}\n` : ""}💰 *VALOR TOTAL: R$ ${total.toFixed(2)}*

💳 *FORMAS DE PAGAMENTO:*
• Pix: Desconto especial à vista
  Chave Pix: ${settings.pixKey || "11999999999"}
  Titular: ${settings.pixName || "MONTAXX Serviços"}
• Cartão de Crédito em até 10x ou 12x

🛡️ *GARANTIA & QUALIDADE MONTAXX:*
• 90 dias de garantia técnica com ajuste fino gratuito.
• Ferramental de precisão com nível a laser e ambiente limpo ao finalizar.
• Proposta válida até: ${validUntil}.

Para aprovar e agendar o melhor dia e horário, basta responder esta mensagem!`;

    const waUrl = `https://api.whatsapp.com/send?phone=${client.phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // Imprime Folha A4 / Salva PDF
  window.printProposal = function() {
    const clientId = document.getElementById("quote-client-select")?.value;
    const client = window.MONTAXX_STORE.getClients().find(c => c.id === clientId) || { name: "Cliente", phone: "-", address: "-" };
    const settings = window.MONTAXX_STORE.getSettings();

    const printContainer = document.getElementById("printable-sheet");
    if (!printContainer) return;

    let subtotal = 0;
    const itemsRows = proposalItems.map(item => {
      const lineSub = item.qty * item.unitPrice;
      subtotal += lineSub;
      return `
        <tr>
          <td>${item.desc}</td>
          <td style="text-align: center;">${item.qty}</td>
          <td style="text-align: right;">R$ ${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold;">R$ ${lineSub.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const discount = parseFloat(document.getElementById("quote-discount")?.value) || 0;
    const fee = parseFloat(document.getElementById("quote-fee")?.value) || 0;
    const total = Math.max(0, subtotal - discount + fee);
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
    const today = new Date().toLocaleDateString('pt-BR');

    printContainer.innerHTML = `
      <div class="print-header">
        <div>
          <h1 style="font-size: 22pt; font-weight: 900; margin: 0; color: #000;">
            MONTA<span style="color: #FFB800;">XX</span>
          </h1>
          <div style="font-size: 9pt; color: #64748B;">MONTAGENS E SERVIÇOS DE MANUTENÇÃO & MÓVEIS</div>
        </div>
        <div class="print-company-info">
          <strong>${settings.companyName || "MONTAXX Montagens"}</strong><br>
          WhatsApp: ${settings.phone || "(11) 99999-9999"}<br>
          ${settings.city || "São Paulo - SP"}
        </div>
      </div>

      <div class="print-title-box">
        <div class="print-title">PROPOSTA COMERCIAL & ORÇAMENTO</div>
        <div style="font-size: 10pt; color: #64748B;">Emissão: ${today} • Validade: ${validUntil}</div>
      </div>

      <div class="print-section">
        <div class="print-section-title">Dados do Cliente</div>
        <div><strong>Nome:</strong> ${client.name}</div>
        <div><strong>Telefone / WhatsApp:</strong> ${client.phone}</div>
        <div><strong>Endereço de Atendimento:</strong> ${client.address}</div>
      </div>

      <div class="print-section">
        <div class="print-section-title">Discriminação de Serviços e Produtos</div>
        <table class="print-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="text-align: center; width: 60px;">Qtd</th>
              <th style="text-align: right; width: 110px;">Valor Unitário</th>
              <th style="text-align: right; width: 110px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <div style="overflow: hidden;">
        <div class="print-totals">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10pt;">
            <span>Subtotal:</span>
            <span>R$ ${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10pt; color: #16A34A;">
            <span>Desconto:</span>
            <span>- R$ ${discount.toFixed(2)}</span>
          </div>` : ''}
          ${fee > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10pt;">
            <span>Deslocamento/Frete:</span>
            <span>+ R$ ${fee.toFixed(2)}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14pt; font-weight: 900; border-top: 2px solid #000; padding-top: 6px; margin-top: 6px;">
            <span>TOTAL:</span>
            <span>R$ ${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="print-section" style="margin-top: 20px;">
        <div class="print-section-title">Condições de Pagamento e Termos</div>
        <p style="font-size: 9pt; color: #475569; margin-bottom: 6px;">
          • Pagamento via Pix: Chave Pix <strong>${settings.pixKey || "11999999999"}</strong> (${settings.pixName || "Carlos Montaxx"}).<br>
          • Cartão de Crédito em até 10x ou 12x com taxas da maquininha.<br>
          • <strong>Garantia de 90 dias:</strong> Cobre regulagens de corrediças, dobradiças e fixações executadas pela MONTAXX.
        </p>
      </div>

      <div class="print-signatures">
        <div class="signature-box">
          ${settings.ownerName || "Carlos Montaxx"}<br>
          <strong>MONTAXX Serviços Especializados</strong>
        </div>
        <div class="signature-box">
          ${client.name}<br>
          <strong>Cliente (Aprovação)</strong>
        </div>
      </div>
    `;

    window.print();
  };

  // Imprime Ordem de Serviço Específica
  window.printWorkOrder = function(orderId) {
    const order = window.MONTAXX_STORE.getOrders().find(o => o.id === orderId);
    if (!order) return;
    const settings = window.MONTAXX_STORE.getSettings();
    const printContainer = document.getElementById("printable-sheet");
    if (!printContainer) return;

    printContainer.innerHTML = `
      <div class="print-header">
        <div>
          <h1 style="font-size: 22pt; font-weight: 900; margin: 0; color: #000;">
            MONTA<span style="color: #FFB800;">XX</span>
          </h1>
          <div style="font-size: 9pt; color: #64748B;">COMPROVANTE DE ORDEM DE SERVIÇO</div>
        </div>
        <div class="print-company-info">
          <strong>${settings.companyName}</strong><br>
          Contato: ${settings.phone}
        </div>
      </div>

      <div class="print-title-box">
        <div class="print-title">ORDEM DE SERVIÇO Nº ${order.id}</div>
        <div style="font-size: 10pt;">Data de Execução: ${order.date} às ${order.time}</div>
      </div>

      <div class="print-section">
        <div class="print-section-title">Dados do Cliente</div>
        <div><strong>Cliente:</strong> ${order.clientName}</div>
        <div><strong>Telefone:</strong> ${order.clientPhone}</div>
        <div><strong>Endereço:</strong> ${order.address}</div>
      </div>

      <div class="print-section">
        <div class="print-section-title">Serviço Realizado</div>
        <div><strong>Tipo:</strong> ${order.serviceType}</div>
        <div><strong>Detalhes:</strong> ${order.description}</div>
        <div style="margin-top: 8px;"><strong>Valor Total:</strong> R$ ${Number(order.price).toFixed(2)} (${order.paymentMethod} - ${order.paymentStatus})</div>
      </div>

      <div class="print-section">
        <div class="print-section-title">Termo de Garantia e Aceite do Cliente</div>
        <p style="font-size: 9pt; color: #475569;">
          Declaro que o serviço e/ou móvel acima foi entregue e instalado com perfeito alinhamento e funcionamento, em conformidade com o solicitado. Garantia de 90 dias concedida a partir desta data.
        </p>
      </div>

      <div class="print-signatures" style="margin-top: 50px;">
        <div class="signature-box">
          MONTAXX Serviços<br>
          <strong>Técnico Montador</strong>
        </div>
        <div class="signature-box">
          ${order.clientName}<br>
          <strong>Assinatura do Cliente</strong>
        </div>
      </div>
    `;

    window.print();
  };

  window.initQuoteGenerator = initQuoteGenerator;
})();
