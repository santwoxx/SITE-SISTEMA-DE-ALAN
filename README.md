# MONTAXX — Ecossistema Digital (Site Institucional & Sistema ERP)

Solução completa desenvolvida para a marca **MONTAXX (Montagens e Serviços de Manutenção & Venda de Móveis)**.

O projeto está dividido em duas aplicações autônomas e independentes, prontas para deploy na **Vercel**:

---

## 📁 Estrutura do Projeto

- **`/site`**: Site institucional de alta conversão, catálogo de móveis com fotos em alta definição, calculadora interativa de orçamento instantâneo e integração direta para WhatsApp.
- **`/sistema`**: Sistema de gestão (ERP / Dashboard Administrativo) para controle de Ordens de Serviço (Kanban), agenda de montagens, rotas Waze/Google Maps, controle de estoque de móveis, emissão de propostas comerciais em PDF/WhatsApp, gestão de clientes (CRM) e fluxo de caixa.

---

## 🔐 Firebase — Login e Dados na Nuvem (Sistema ERP)

O ERP deixou de depender só do navegador: agora tem **login obrigatório** e os dados ficam
**na nuvem (Firestore)**, sincronizados em tempo real entre todos os aparelhos da equipe.

### Como cada um entra

| Perfil | Como entra | O que enxerga |
|---|---|---|
| **Administrador** | Botão **Entrar com Google** | Tudo: Painel, OS, Móveis, Propostas, Clientes, **Financeiro**, **Configurações** e **Equipe** |
| **Funcionário / Montador** | **E-mail e senha** criados pelo administrador | Painel, Ordens de Serviço, Móveis, Propostas e Clientes |

Administradores autorizados (definidos em `sistema/js/firebase-config.js` **e** em `firestore.rules`):

- `brisasofc@gmail.com`
- `montaxxsolucoes@gmail.com`

> O papel de administrador **só é concedido a quem entra pelo Google**. Mesmo que alguém
> crie uma senha usando um desses e-mails, continua sem poderes de administrador —
> a checagem é feita no token de autenticação e repetida nas regras do Firestore.

---

### ⚙️ Configuração no Console do Firebase (5 minutos, uma única vez)

Projeto: **`sistema-de-alan`** → <https://console.firebase.google.com/project/sistema-de-alan>

**1. Ligar os dois métodos de login**
   - Menu **Authentication** ▸ **Get started**
   - Aba **Sign-in method**:
     - Ative **Google** (escolha o e-mail de suporte do projeto)
     - Ative **E-mail/senha** *(deixe "Link de e-mail" desligado)*

**2. Criar o banco de dados**
   - Menu **Firestore Database** ▸ **Criar banco de dados**
   - Escolha o modo **produção** e a região **`southamerica-east1` (São Paulo)** — menor latência no Brasil

**3. Publicar as regras de segurança** *(passo obrigatório — é o que protege os dados)*
   - Abra o arquivo **`firestore.rules`** na raiz deste projeto
   - Copie todo o conteúdo em **Firestore Database ▸ Regras** e clique em **Publicar**

   Ou, pelo terminal, com o [Firebase CLI](https://firebase.google.com/docs/cli):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```

**4. Autorizar os domínios de produção**
   - **Authentication ▸ Settings ▸ Authorized domains** ▸ **Add domain**
   - Inclua o domínio da Vercel do sistema (ex.: `gestao-montaxx.vercel.app`) e o domínio
     próprio, se houver (`app.montaxx.com.br`).
   - Sem isso o login com Google retorna `auth/unauthorized-domain`.

**5. Primeiro acesso**
   - Abra o sistema e entre com uma das contas Google de administrador.
   - Os dados de demonstração sobem automaticamente para a nuvem nesse primeiro login.

---

### 👷 Cadastrando funcionários

1. Entre como **administrador**
2. Vá em **Configurações & Backup ▸ Equipe & Acessos ao Sistema**
3. Clique em **+ Novo Funcionário** e informe nome, e-mail e uma senha inicial (mín. 6 caracteres)
4. Entregue o e-mail e a senha ao montador

O administrador **não perde a sessão** ao criar um acesso (o cadastro usa uma instância
secundária do Firebase). Para bloquear alguém, use **Desativar** na lista da equipe —
o acesso é recusado no login e também pelas regras do Firestore.

O funcionário pode trocar a própria senha pelo link **"Esqueci minha senha"** na tela de acesso.

---

### 🗂️ Como os dados ficam organizados no Firestore

```
erp/montaxx     -> documento único com settings, clients, inventory,
                   orders, transactions e proposals (o ERP inteiro)
users/{uid}     -> name, email, role ("admin" | "funcionario"),
                   active, provider, createdAt, lastLogin
```

**Sincronização:** o `localStorage` continua funcionando como cache local, então o montador
usa o sistema **sem internet** dentro do apartamento do cliente; ao recuperar o sinal, tudo
sobe sozinho. O indicador no topo da tela mostra o estado: `Sincronizado`, `Salvando…`,
`Offline (local)` ou `Erro ao salvar`.

Ao **sair do sistema**, o cache local é apagado — importante porque o celular ou notebook
pode ser compartilhado entre montadores.

---

### 🌐 Ajuste obrigatório após o deploy

Site e sistema são **dois projetos separados** na Vercel, então o caminho `/site/` só existe
no servidor local. Depois de publicar, abra `sistema/js/firebase-config.js` e troque:

```js
export const SITE_URL = "/site/";
// para o endereço real, por exemplo:
export const SITE_URL = "https://montaxx.vercel.app";
```

Todos os links "Ver Site" / "Voltar ao site" do sistema seguem essa única constante.

---

### 🔒 Sobre as chaves do Firebase no código

As credenciais em `firebase-config.js` são **públicas por design** — todo app web do Firebase
as expõe. Elas apenas identificam o projeto; **não dão acesso a nada**. Quem protege os dados
é o arquivo `firestore.rules` (passo 3 acima). Por isso, **nunca publique o sistema sem ter
publicado as regras**.
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
- **Firebase (Sistema ERP)**: Authentication (Google + e-mail/senha) e Cloud Firestore com cache offline,
  sincronizando a equipe em tempo real. `LocalStorage` segue como cache local, com **Backup JSON** para exportar e importar.
