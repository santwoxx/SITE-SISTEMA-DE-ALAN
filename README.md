# MONTAXX — Ecossistema Digital (Site Institucional & Sistema ERP)

Solução completa desenvolvida para a marca **MONTAXX (Montagens e Serviços de Manutenção & Venda de Móveis)**.

O projeto está dividido em duas aplicações autônomas e independentes, prontas para deploy na **Vercel**:

---

## 📁 Estrutura do Projeto

- **`/site`**: Site institucional de alta conversão, catálogo de móveis com fotos em alta definição, calculadora interativa de orçamento instantâneo e integração direta para WhatsApp.
- **`/sistema`**: Sistema de gestão (ERP / Dashboard Administrativo) para controle de Ordens de Serviço (Kanban), agenda de montagens, rotas Waze/Google Maps, controle de estoque de móveis, emissão de propostas comerciais em PDF/WhatsApp, gestão de clientes (CRM) e fluxo de caixa.

---

## 🚀 Como Fazer o Deploy na Vercel

Você fará **dois projetos separados** dentro da sua conta da Vercel a partir do mesmo repositório do GitHub (ou fazendo upload):

### 1️⃣ Deploy do SITE (Landing Page & Loja)
1. No painel da **Vercel**, clique em **"Add New..."** ➔ **"Project"**.
2. Selecione o repositório deste projeto.
3. Na seção **"Root Directory"**, clique em **Edit** e selecione a pasta:
   ```
   site
   ```
4. Em **Framework Preset**, deixe **"Other"** (projeto estático HTML/CSS/JS ultrarrápido).
5. Clique em **"Deploy"**.
6. Pronto! Seu site estará no ar (ex: `montaxx.vercel.app`).

---

### 2️⃣ Deploy do SISTEMA (ERP / Gestão do Montador)
1. No painel da **Vercel**, clique novamente em **"Add New..."** ➔ **"Project"**.
2. Selecione o mesmo repositório.
3. Na seção **"Root Directory"**, clique em **Edit** e selecione a pasta:
   ```
   sistema
   ```
4. Em **Framework Preset**, deixe **"Other"**.
5. Clique em **"Deploy"**.
6. Pronto! Seu sistema de gestão estará no ar (ex: `gestao-montaxx.vercel.app` ou `app.montaxx.com.br`).

---

## 🎨 Identidade Visual & Design System

Extraído diretamente das peças de comunicação visual da MONTAXX:
- **Amarelo Ouro / Construção**: `#FFB800` (Acentos de ação, destaques e botões de alta visibilidade)
- **Preto Ônix & Grafite Profundo**: `#0B0C10`, `#141720` (Contraste premium e estética industrial moderna)
- **Branco Puro & Cinzas Construtivos**: `#FFFFFF`, `#E2E8F0`, `#94A3B8` (Alta legibilidade técnica)
- **Tipografia**: *Plus Jakarta Sans* (Google Fonts)

---

## 🛠️ Tecnologias Utilizadas
- **HTML5 Semântico**: Otimizado para SEO, acessibilidade e compartilhamento em redes sociais (OpenGraph).
- **CSS3 Moderno**: Variáveis CSS, Glassmorphism, CSS Grid & Flexbox, micro-animações e responsividade total para celulares e computadores.
- **JavaScript Vanilla Modular**: Sem dependências pesadas, carregamento instantâneo, compatível com qualquer dispositivo.
- **Persistência Reativa (Sistema ERP)**: `LocalStorage` com suporte a download de **Backup JSON** e importação em novos aparelhos.
