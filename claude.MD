# CLAUDE.md — 3X App · Guia Completo de Desenvolvimento

> Este arquivo é a fonte única de verdade para todos os agentes que trabalham neste projeto.
> Todo código, decisão arquitetural e fluxo de trabalho deve estar alinhado com as diretrizes aqui descritas.

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Agentes e Responsabilidades](#3-agentes-e-responsabilidades)
4. [Arquitetura do Sistema](#4-arquitetura-do-sistema)
5. [Módulos e Funcionalidades](#5-módulos-e-funcionalidades)
6. [Schema do Banco de Dados (Supabase)](#6-schema-do-banco-de-dados-supabase)
7. [Princípios de Desenvolvimento](#7-princípios-de-desenvolvimento)
8. [Estrutura de Pastas](#8-estrutura-de-pastas)
9. [Convenções de Código](#9-convenções-de-código)
10. [Fluxo de Trabalho Git](#10-fluxo-de-trabalho-git)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Configuração de Deploy na Vercel](#12-configuração-de-deploy-na-vercel)
13. [Checklist de Entrega por Módulo](#13-checklist-de-entrega-por-módulo)

---

## 1. Visão Geral do Projeto

### Produto
**3X App** — Plataforma web (PWA) de suporte e treinamento para SDRs (Sales Development Representatives) de lojas de veículos.

### Objetivo
Elevar o desempenho das SDRs da 3X através de:
- Acompanhamento diário de metas e atividades de pré-venda
- Scripts e respostas para objeções de clientes
- Treinamento gamificado com fases progressivas
- Ferramentas de organização (notas, calendário, checklist)
- Rituais matinais de alta performance
- Acesso às videoaulas da 3X via YouTube

### Deploy — Vercel (plataforma única)

| App | URL | Ambiente |
|-----|-----|----------|
| App SDR (PWA) | `app.3x.com.br` | production |
| Painel Admin | `admin.3x.com.br` | production |
| Staging SDR | `app-staging.3x.com.br` | staging |
| Staging Admin | `admin-staging.3x.com.br` | staging |

### Usuários-Alvo
| Perfil | Descrição |
|--------|-----------|
| **SDR em Treinamento** | Usuária principal; acessa o app via browser/PWA instalado |
| **Supervisora / Coach 3X** | Acompanha progresso, insere conteúdo e configura metas |
| **Admin 3X** | Gerencia usuários, conteúdo e configurações globais |

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Framework Principal** | Next.js 14 (App Router) + TypeScript | SSR/SSG, PWA, file-based routing, nativo na Vercel |
| **PWA** | next-pwa + Workbox | Instalável em iOS/Android via browser, offline parcial |
| **Estilização** | TailwindCSS + shadcn/ui | Design system consistente, componentes acessíveis |
| **Animações** | Framer Motion | Micro-interações de gamificação e transições |
| **Estado Global** | Zustand | Leve, sem boilerplate excessivo |
| **Formulários** | React Hook Form + Zod | Validação robusta com tipagem forte |
| **Backend / BaaS** | Supabase | Auth, Database, Storage, Realtime, Edge Functions |
| **Banco de Dados** | PostgreSQL (via Supabase) | Relacional, robusto, RLS nativo |
| **Auth** | Supabase Auth (magic link + email/senha) | Fluxo simples e seguro |
| **Storage** | Supabase Storage | Avatares e anexos |
| **YouTube** | YouTube Data API v3 | Listagem e embed de videoaulas |
| **Push** | Web Push API + Supabase Edge Functions | Notificações via browser (sem app nativo) |
| **Deploy** | **Vercel** | CI/CD integrado, Preview Deployments, Edge Network global |
| **CI adicional** | GitHub Actions | Lint, testes e migration check antes do merge |
| **Monitoramento** | Vercel Analytics + Sentry | Performance e rastreamento de erros |

### Por que Next.js + Vercel (PWA em vez de React Native)?
- **Deploy unificado**: tudo na Vercel — sem App Store, sem Play Store, sem EAS Build
- **PWA**: instalável em iOS e Android via browser, ícone na home screen, funciona offline
- **Server Components**: reduzem bundle e melhoram performance no mobile
- **API Routes**: backend integrado no mesmo projeto — menos infra para gerenciar
- **Preview Deployments**: cada PR ganha uma URL própria para revisão imediata
- **Custo zero de infra adicional**: Vercel gerencia Edge Network, CDN e cache automaticamente

---

## 3. Agentes e Responsabilidades

> Cada agente opera de forma autônoma dentro de seu domínio. Ao receber uma tarefa, o agente deve:
> 1. Ler as seções relevantes deste CLAUDE.md
> 2. Executar dentro dos princípios SOLID e Clean Architecture
> 3. Registrar decisões relevantes como ADR em `/docs/adr/`

---

### 🏗️ AGENT: ARCHITECT
**Função:** Guardião da arquitetura, modelagem de dados e fluxos do sistema.

**Responsabilidades:**
- Desenhar e manter diagramas de fluxo de cada módulo (Mermaid)
- Definir contratos de API (request/response shapes) antes de qualquer implementação
- Criar e atualizar o schema SQL do Supabase com migrations versionadas
- Revisar Pull Requests sob aspecto arquitetural
- Escrever ADRs para todas as decisões relevantes
- Garantir que a Regra de Dependência da Clean Architecture seja respeitada
- Modelar eventos de domínio (EDA) quando módulos se comunicam
- Definir políticas de RLS (Row Level Security) do Supabase
- Definir estrutura de rotas do Next.js App Router por domínio

**Artefatos de responsabilidade:**
```
/docs/adr/              → Architecture Decision Records
/docs/flows/            → Diagramas de fluxo (Mermaid)
/docs/contracts/        → Contratos de API (OpenAPI/JSON Schema)
/supabase/migrations/   → Scripts SQL versionados
```

**Regras:**
- Nenhuma tabela nova sem migration documentada e versionada
- Todo evento de domínio nomeado no passado: `ChecklistCompleted`, `LevelAdvanced`
- Toda API externa (YouTube, Web Push) deve ter Anti-Corruption Layer
- Rotas de API organizadas por domínio: `/api/v1/[domain]/`

---

### 💻 AGENT: BACKEND DEV
**Função:** Implementação das regras de negócio, use cases, infraestrutura e API Routes.

**Responsabilidades:**
- Implementar Use Cases da camada de aplicação
- Escrever Entities e Value Objects do domínio
- Implementar Repositories concretos (Supabase) contra interfaces do domínio
- Desenvolver API Routes do Next.js (`/api/v1/`) para operações server-side
- Desenvolver Edge Functions do Supabase (cron jobs, webhooks)
- Implementar serviço de integração com YouTube Data API
- Implementar Web Push via Supabase Edge Functions
- Garantir idempotência em operações de escrita
- Escrever testes unitários para use cases (Vitest)
- Implementar retry e circuit breaker para chamadas externas

**Artefatos de responsabilidade:**
```
/packages/domain/         → Entities, Value Objects, Repository Interfaces
/packages/application/    → Use Cases, DTOs, Event Bus, Event Handlers
/packages/infrastructure/ → Supabase repositories, YouTube, Web Push
/apps/app/src/app/api/    → Next.js API Routes
/supabase/functions/      → Edge Functions (cron, webhooks)
```

**Regras:**
- Nunca importar infraestrutura dentro do domínio
- Use Cases recebem e retornam DTOs, nunca Entities diretamente para fora
- Toda operação de escrita publica evento de domínio
- Client-side usa Supabase com anon key + RLS
- Server-side (API Routes) pode usar service_role key — nunca expor no client
- API Routes sempre validam payload com Zod antes de processar

---

### 📱 AGENT: FRONTEND DEV
**Função:** Implementação das telas, componentes, PWA e experiência do usuário.

**Responsabilidades:**
- Implementar todas as páginas do App SDR (Next.js App Router)
- Implementar o Painel Admin (Next.js App Router)
- Consumir Use Cases via hooks customizados (Interface Adapter)
- Gerenciar estado global com Zustand
- Configurar e manter manifest PWA e service worker (next-pwa)
- Layout responsivo mobile-first com TailwindCSS
- Garantir acessibilidade (WCAG AA) nas telas principais
- Animações de gamificação com Framer Motion
- Feedback visual: loading skeletons, error boundaries, empty states
- Implementar Web Push: solicitação de permissão e registro no service worker

**Artefatos de responsabilidade:**
```
/apps/app/src/app/       → Páginas Next.js App Router (SDR)
/apps/admin/src/app/     → Páginas Next.js App Router (Admin)
/apps/app/src/components/→ Componentes reutilizáveis
/apps/app/src/hooks/     → Custom hooks (Interface Adapters)
/apps/app/src/stores/    → Zustand stores
/apps/app/public/        → manifest.json, ícones PWA, sw.js
```

**Regras:**
- Nenhuma chamada direta ao Supabase dentro de componentes — usar hooks
- Server Components para dados estáticos/SSR; Client Components só onde há interatividade
- Todo componente com interface TypeScript definida para suas props
- Páginas "burras" — lógica de negócio nos hooks, nunca nas páginas
- Implementar `loading.tsx` e `error.tsx` em todas as rotas do App Router
- Animações Framer Motion para: level up, badge unlock, ganho de XP, completar fase

---

### 🎨 AGENT: DESIGNER
**Função:** Design system, identidade visual e experiência do usuário.

**Responsabilidades:**
- Criar e manter tokens de design (cores, tipografia, espaçamento, bordas, sombras)
- Wireframes e protótipos de alta fidelidade para cada módulo
- Definir componentes base do design system via shadcn/ui + customizações
- Criar assets de gamificação: ícones de fases, badges, avatares, ilustrações
- Garantir consistência visual entre App SDR e Painel Admin
- Criar ilustrações para onboarding, empty states e conquistas desbloqueadas
- Especificar animações e micro-interações para o Frontend Dev (Framer Motion)
- Garantir experiência mobile-first: touch targets mínimos de 44px

**Artefatos de responsabilidade:**
```
/design/tokens/     → tokens.json exportado → tailwind.config.ts
/design/assets/     → SVGs, badges locked/unlocked, ilustrações
/design/wireframes/ → Links para protótipos Figma
```

**Paleta de Cores — 3X Brand:**
```
--color-primary:    #FF6B00   (laranja 3X — energia, ação, CTAs)
--color-secondary:  #1A1A2E   (azul-escuro — confiança, headers, sidebar)
--color-accent:     #FFD700   (dourado — conquistas, XP, gamificação)
--color-surface:    #F8F8F8   (fundo claro)
--color-on-surface: #212121   (texto principal)
--color-success:    #00C853
--color-warning:    #FFB300
--color-error:      #D50000
--color-muted:      #9E9E9E   (badges locked, conteúdo inativo)
```

**Tipografia:**
```
font-display: 'Montserrat'  (títulos, níveis, conquistas — 700/800)
font-body:    'Inter'        (corpo de texto — 400/500)
```

**Regras:**
- Mobile-first sempre (breakpoints: 480 / 768 / 1024 / 1280px)
- Contraste mínimo WCAG AA em todos os pares texto/fundo
- Badges: versão locked (cinza + 40% opacidade) e unlocked (colorida + sombra accent)
- Touch targets mínimos: 44×44px em elementos interativos

---

### ⚙️ AGENT: DEVOPS
**Função:** Infraestrutura, CI/CD e qualidade de entrega — tudo centrado na Vercel.

**Responsabilidades:**
- Configurar e manter os dois projetos na Vercel (App SDR + Admin)
- Configurar domínios customizados na Vercel
- Gerenciar ambientes: `development`, `preview`, `production`
- Configurar variáveis de ambiente por ambiente no dashboard da Vercel
- Configurar pipeline GitHub Actions (lint, typecheck, testes, migration check)
- Integrar GitHub → Vercel para Preview Deployments automáticos por PR
- Configurar Supabase CLI e versionamento de migrations
- Gerenciar segredos: Vercel env vars + Supabase Vault para Edge Functions
- Configurar Sentry com source maps via plugin Vercel
- Configurar Vercel Analytics e Web Vitals
- Garantir headers de segurança no `next.config.ts` e `vercel.json`

**Artefatos de responsabilidade:**
```
/.github/workflows/    → GitHub Actions (ci.yml)
/supabase/             → CLI config, migrations, seed, functions
/apps/app/vercel.json  → Config Vercel app SDR
/apps/admin/vercel.json→ Config Vercel admin
/apps/*/next.config.ts → Configuração Next.js + PWA + headers
/.env.example          → Template de variáveis de ambiente
/docs/devops/          → Runbooks, procedures de rollback
```

**Projetos Vercel:**
```
Projeto 1: 3x-app
  Root Directory:  apps/app
  Framework:       Next.js
  Build Command:   pnpm turbo build --filter=app
  Domains:         app.3x.com.br

Projeto 2: 3x-admin
  Root Directory:  apps/admin
  Framework:       Next.js
  Build Command:   pnpm turbo build --filter=admin
  Domains:         admin.3x.com.br
```

**Pipeline GitHub Actions → Vercel:**
```
PR aberto    → CI passa → Vercel cria Preview Deployment (URL única)
Push develop → CI passa → Deploy automático em staging
Push main    → CI passa → Deploy automático em production
```

**Jobs do CI (`.github/workflows/ci.yml`):**
```yaml
jobs:
  quality:
    steps:
      - lint          # ESLint + Prettier
      - typecheck     # tsc --noEmit
      - unit-tests    # Vitest
      - migration-check  # supabase db diff --local
```

**Regras:**
- Nunca commitar `.env` com valores reais — Vercel env vars dashboard
- Migrations são imutáveis após merge na main
- Todo deploy em production requer CI verde + PR aprovado
- Rodar `supabase db push` em staging antes de production
- Manter `develop` sempre sincronizado com staging

---

## 4. Arquitetura do Sistema

### Visão de Camadas (Clean Architecture)

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                           │
│           Next.js App Router — App SDR + Admin Panel             │
│   Server Components (RSC) │ Client Components │ API Routes        │
│                    Vercel Edge Network                            │
├──────────────────────────────────────────────────────────────────┤
│                  INTERFACE ADAPTERS LAYER                         │
│   Custom Hooks │ Zustand Stores │ API Route Handlers             │
│   DTOs ↔ ViewModels │ Server Actions │ Presenters                │
├──────────────────────────────────────────────────────────────────┤
│               APPLICATION LAYER (USE CASES)                       │
│  CompleteChecklist │ AdvanceGameLevel │ CreateNote                │
│  AddCalendarEvent  │ TrackSalesActivity │ WatchLesson             │
│  AwardXP           │ CheckStreak       │ CompleteRitual           │
├──────────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                                 │
│  Entities: User, SDR, GameLevel, Note, Checklist                 │
│  Value Objects: XPScore, StreakCount, Progress                   │
│  Repository Interfaces │ Domain Events │ Domain Services          │
├──────────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                             │
│  SupabaseUserRepo │ SupabaseGameRepo │ YouTubeService            │
│  WebPushService   │ SupabaseNoteRepo │ SupabaseClient            │
│  Supabase Edge Functions (cron, webhooks)                        │
└──────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados — Client Side
```
Page / Component
  └─► Custom Hook (Interface Adapter)
        └─► Use Case (Application Layer)
              ├─► Domain Entity / Domain Logic
              └─► Repository Interface
                    └─► Supabase Repository (Infrastructure)
                          └─► PostgreSQL (Supabase) via anon key + RLS
```

### Fluxo de Dados — Server Side
```
Next.js API Route / Server Action
  └─► Zod Validation
        └─► Use Case (Application Layer)
              ├─► Domain Entity
              └─► Repository Interface
                    └─► Supabase Admin Client (service_role — server only)
                          └─► PostgreSQL (Supabase) — sem RLS restriction
```

### Event-Driven: Eventos de Domínio

| Evento | Emissor | Handlers |
|--------|---------|----------|
| `ChecklistCompleted` | Checklist Use Case | AwardXPHandler, SendCongratsPushHandler |
| `GameLevelAdvanced` | Game Use Case | UnlockBadgeHandler, NotifyCoachHandler |
| `DailyStreakAchieved` | Streak Use Case | AwardBonusXPHandler, PushStreakReminderHandler |
| `SalesActivityLogged` | Sales Use Case | UpdateLeaderboardHandler, CheckGoalHandler |
| `MorningRitualCompleted` | Ritual Use Case | AwardXPHandler |
| `VideoLessonWatched` | Video Use Case | TrackProgressHandler, AwardXPHandler |
| `MissionCompleted` | Game Use Case | AwardPhaseXPHandler, UnlockBadgeHandler |

### Roteamento Next.js App Router

```
/                              → Redirect → /dashboard (se autenticado)

/(auth)/
  login/                       → Página de login (magic link + senha)
  onboarding/                  → Configuração inicial do perfil

/(app)/                        → Layout autenticado SDR (sidebar + bottom nav)
  dashboard/                   → Home com resumo diário
  sales/                       → Acompanhamento de vendas
  sales/history/               → Histórico de performance
  game/                        → Gamificação (fases e missões)
  game/badges/                 → Todas as conquistas
  scripts/                     → Biblioteca de scripts
  scripts/[categoryId]/        → Scripts por categoria
  notes/                       → Lista de notas
  notes/[noteId]/              → Editar nota
  calendar/                    → Calendário mensal/semanal
  checklist/                   → Checklist do dia
  rituals/                     → Rituais matinais do dia
  videos/                      → Videoaulas por categoria
  videos/[videoId]/            → Player + notas do vídeo
  leaderboard/                 → Ranking da loja
  profile/                     → Perfil e configurações

/(admin)/                      → Layout admin (role: admin ou supervisor)
  admin/dashboard/
  admin/users/
  admin/content/scripts/
  admin/content/videos/
  admin/content/checklist/
  admin/content/rituals/
  admin/goals/
  admin/reports/

/api/v1/
  auth/callback/               → Callback Supabase Auth
  sales/                       → CRUD atividades (server-side)
  game/xp/                     → Concessão de XP (idempotente)
  notifications/subscribe/     → Registro de push subscription
  webhooks/supabase/           → Receber eventos do Supabase
  cron/reset-checklist/        → Vercel Cron: reset diário
  cron/check-streaks/          → Vercel Cron: verificar streaks
  cron/send-morning-push/      → Vercel Cron: push matinal
```

---

## 5. Módulos e Funcionalidades

### 5.1 🏠 Dashboard (Home)
- Saudação personalizada com horário e nome
- Resumo diário: XP da semana, streak atual, nível + barra de progresso
- Próximas atividades do calendário (max 3)
- Checklist do dia com progresso visual (%)
- Cards de acesso rápido touch-friendly para todos os módulos
- Ritual matinal do dia em destaque (se não concluído)
- Última videoaula adicionada

### 5.2 📊 Acompanhamento de Vendas
- Registro diário: ligações, contatos, agendamentos, test drives, propostas, fechamentos
- Metas diárias/semanais/mensais configuradas pela supervisora
- Gráficos de performance: linha (evolução) e barra (comparativo)
- Histórico com filtros por período
- Status por cor: abaixo (vermelho), na meta (amarelo), acima (verde)
- Animação de badge ao atingir meta do dia

### 5.3 💬 Scripts e Objeções
- Biblioteca categorizada: Abordagem, Qualificação, Apresentação, Negociação, Fechamento, Objeções
- Objeções comuns com respostas sugeridas
- Busca full-text por palavra-chave
- Favoritar scripts (persistido no banco)
- Admin adiciona/edita via painel
- Cards visuais com `objection` + `response` claramente separados

### 5.4 🎮 Treinamento Gamificado

#### Progressão de Níveis:
```
Nível 1: Iniciante SDR          (0 – 500 XP)
Nível 2: Aprendiz de Vendas     (501 – 1.500 XP)
Nível 3: Vendedora em Ascensão  (1.501 – 3.000 XP)
Nível 4: SDR Profissional       (3.001 – 5.000 XP)
Nível 5: Expert 3X              (5.001 – 8.000 XP)
Nível 6: Mestre das Vendas      (8.001+ XP)
```

#### Fontes de XP:
| Ação | XP |
|------|----|
| Completar checklist diário | +50 |
| Assistir videoaula completa | +30 |
| Registrar atividade de vendas | +10 |
| Atingir meta diária | +100 |
| Atingir meta semanal | +300 |
| Ritual matinal completo | +20 |
| Streak de 7 dias | +200 bônus |
| Completar fase do game | +500 |

#### Fases e Missões:
```
Fase 1 — "O Começo"
  1.1: Assista os 3 primeiros vídeos introdutórios
  1.2: Complete seu perfil
  1.3: Registre sua primeira atividade de vendas
  → Badge: "Primeiro Passo" + 500 XP

Fase 2 — "Construindo Fundações"
  2.1: Complete 5 checklists diários seguidos
  2.2: Estude 10 scripts da biblioteca
  2.3: Registre atividades por 5 dias seguidos
  → Badge: "Fundação Sólida" + 500 XP

Fase 3 — "A Batalha das Objeções"
  3.1: Leia todos os scripts de objeção
  3.2: Assista módulo de objeções no YouTube
  3.3: Favorite 3 scripts de objeção
  → Badge: "Quebradora de Objeções" + 500 XP

Fase 4 — "Performance de Elite"
  4.1: Atinja meta diária por 10 dias no mês
  4.2: Complete todos os rituais por 2 semanas seguidas
  4.3: Assista todos os vídeos publicados do mês
  → Badge: "Elite 3X" + 500 XP
```

### 5.5 📝 Notas
- Criar, editar, deletar notas (rich text simples)
- Categorias: Reunião, Treinamento, Ideia, Cliente, Pessoal
- Busca full-text
- Fixar notas no topo
- Compartilhar com supervisora
- Notas vinculadas a um vídeo (com timestamp)

### 5.6 📅 Calendário
- Visualização mensal e semanal responsiva
- Tipos: Reunião de equipe, Treinamento, Lembrete, Meta
- Criar/editar/deletar eventos
- Notificação Web Push 30min antes
- Eventos de equipe visíveis para toda a loja

### 5.7 ✅ Checklist
- Template diário configurado pela supervisora/admin
- SDR adiciona itens pessoais
- Reset automático às 00h via Vercel Cron + Edge Function
- Barra de progresso visual com %
- XP por item marcado
- Histórico de completion por data

**Checklist Padrão 3X:**
```
☐ Ritual matinal realizado
☐ Verificar metas do dia no app
☐ Revisar pipeline de clientes
☐ Realizar ligações programadas
☐ Registrar atividades no app
☐ Assistir videoaula do dia
☐ Estudar 1 script novo
☐ Atualizar status de leads
```

### 5.8 🌅 Rituais Matinais
- Rotina exibida ao abrir o app de manhã
- Categorias: Mental, Físico, Profissional
- Confirmar rituais realizados → ganha XP
- Notificação push no horário configurado pela SDR
- Admin customiza rituais disponíveis

### 5.9 🎬 Videoaulas
- Admin cadastra playlist ID ou vídeo individual (YouTube)
- Listagem por categorias com progresso visual
- Player embed YouTube responsivo
- Marcação de "assistido" automática (>80% do vídeo) + XP
- Notas vinculadas ao vídeo com timestamp

### 5.10 🏆 Ranking
- Ranking por loja (não entre lojas)
- Semanal e mensal
- Posição da SDR em destaque
- Baseado em XP do período
- Anonimização opcional pela supervisora

### 5.11 👤 Perfil e Configurações
- Foto de perfil (upload Supabase Storage)
- Estatísticas: XP, badges, streak, vídeos, % checklist do mês
- Configurações de notificação
- Tema claro/escuro
- Botão "Instalar App" (PWA prompt)

---

## 6. Schema do Banco de Dados (Supabase)

> Execute os scripts abaixo no SQL Editor do Supabase **em ordem numérica**.
> Salve cada bloco em `/supabase/migrations/` com prefixo numérico.
> Nunca edite uma migration já aplicada em produção — crie uma nova.

### 001 — Extensões

```sql
-- /supabase/migrations/001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

---

### 002 — Lojas e Perfis

```sql
-- /supabase/migrations/002_stores_and_profiles.sql

CREATE TABLE public.stores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  city       TEXT,
  state      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  avatar_url       TEXT,
  role             TEXT NOT NULL DEFAULT 'sdr'
                   CHECK (role IN ('sdr', 'supervisor', 'admin')),
  store_id         UUID REFERENCES public.stores(id),
  xp_total         INTEGER NOT NULL DEFAULT 0,
  current_level    INTEGER NOT NULL DEFAULT 1,
  streak_days      INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Função reutilizada em todos os triggers de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criar perfil automaticamente após registro no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nova SDR'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 003 — Gamificação

```sql
-- /supabase/migrations/003_gamification.sql

CREATE TABLE public.game_levels (
  id           SERIAL PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  xp_required  INTEGER NOT NULL,
  description  TEXT,
  icon_url     TEXT
);

INSERT INTO public.game_levels (level_number, name, xp_required, description) VALUES
  (1, 'Iniciante SDR',          0,    'Seus primeiros passos na pré-venda'),
  (2, 'Aprendiz de Vendas',     501,  'Construindo as bases do sucesso'),
  (3, 'Vendedora em Ascensão',  1501, 'Evoluindo a cada dia'),
  (4, 'SDR Profissional',       3001, 'Dominando as técnicas de venda'),
  (5, 'Expert 3X',              5001, 'Referência na equipe'),
  (6, 'Mestre das Vendas',      8001, 'O topo da performance 3X');

CREATE TABLE public.badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_url        TEXT NOT NULL,
  icon_locked_url TEXT NOT NULL,
  badge_type      TEXT NOT NULL
                  CHECK (badge_type IN ('phase', 'streak', 'performance', 'special')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.game_phases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number INTEGER NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  badge_id     UUID REFERENCES public.badges(id),
  xp_reward    INTEGER NOT NULL DEFAULT 500,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.game_missions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id     UUID NOT NULL REFERENCES public.game_phases(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN (
    'watch_videos', 'complete_checklist', 'log_sales',
    'complete_profile', 'read_scripts', 'favorite_scripts',
    'complete_rituals', 'streak_days', 'hit_daily_goal'
  )),
  target_count INTEGER NOT NULL DEFAULT 1,
  xp_reward    INTEGER NOT NULL DEFAULT 50,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.user_mission_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES public.game_missions(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

CREATE TABLE public.user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Histórico de XP com constraint de idempotência
CREATE TABLE public.xp_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'checklist', 'video', 'sales_log', 'daily_goal',
    'weekly_goal', 'ritual', 'streak', 'mission', 'manual'
  )),
  source_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_type, source_id)
);
```

---

### 004 — Acompanhamento de Vendas

```sql
-- /supabase/migrations/004_sales.sql

CREATE TABLE public.sales_goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id     UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  goal_type    TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  metric       TEXT NOT NULL CHECK (metric IN (
    'calls_made', 'contacts_reached', 'appointments_set',
    'test_drives', 'proposals_sent', 'sales_closed'
  )),
  target_value INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sales_activities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made       INTEGER NOT NULL DEFAULT 0,
  contacts_reached INTEGER NOT NULL DEFAULT 0,
  appointments_set INTEGER NOT NULL DEFAULT 0,
  test_drives      INTEGER NOT NULL DEFAULT 0,
  proposals_sent   INTEGER NOT NULL DEFAULT 0,
  sales_closed     INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE TRIGGER sales_activities_updated_at
  BEFORE UPDATE ON public.sales_activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

### 005 — Scripts e Objeções

```sql
-- /supabase/migrations/005_scripts.sql

CREATE TABLE public.script_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#FF6B00',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.script_categories (name, description, sort_order) VALUES
  ('Abordagem Inicial', 'Primeiros contatos com o cliente',   1),
  ('Qualificação',      'Entender perfil e necessidade',      2),
  ('Apresentação',      'Apresentar o veículo ideal',         3),
  ('Negociação',        'Condições e formas de pagamento',    4),
  ('Fechamento',        'Técnicas para fechar a venda',       5),
  ('Objeções',          'Respostas para resistências comuns', 6);

CREATE TABLE public.scripts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.script_categories(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  objection   TEXT,
  response    TEXT,
  tags        TEXT[],
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.user_favorite_scripts (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  script_id  UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, script_id)
);

CREATE INDEX scripts_fts_idx ON public.scripts
  USING GIN (to_tsvector('portuguese', title || ' ' || content));
```

---

### 006 — Notas

```sql
-- /supabase/migrations/006_notes.sql

CREATE TABLE public.note_categories (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name  TEXT NOT NULL,
  color TEXT DEFAULT '#1A1A2E'
);

INSERT INTO public.note_categories (name, color) VALUES
  ('Reunião',     '#4CAF50'),
  ('Treinamento', '#FF6B00'),
  ('Ideia',       '#FFD700'),
  ('Cliente',     '#2196F3'),
  ('Pessoal',     '#9C27B0');

CREATE TABLE public.notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.note_categories(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Sem título',
  content     TEXT NOT NULL DEFAULT '',
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX notes_fts_idx ON public.notes
  USING GIN (to_tsvector('portuguese', title || ' ' || content));
```

---

### 007 — Calendário

```sql
-- /supabase/migrations/007_calendar.sql

CREATE TABLE public.calendar_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  event_type       TEXT NOT NULL DEFAULT 'personal'
                   CHECK (event_type IN ('team_meeting','training','personal_reminder','goal','other')),
  color            TEXT DEFAULT '#FF6B00',
  start_datetime   TIMESTAMPTZ NOT NULL,
  end_datetime     TIMESTAMPTZ,
  is_all_day       BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_minutes INTEGER DEFAULT 30,
  is_team_event    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX calendar_events_user_date_idx
  ON public.calendar_events (user_id, start_datetime);
```

---

### 008 — Checklist

```sql
-- /supabase/migrations/008_checklist.sql

CREATE TABLE public.checklist_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID REFERENCES public.stores(id),
  title      TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.checklist_template_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  xp_reward   INTEGER NOT NULL DEFAULT 10,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.daily_checklists (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed      BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checklist_date)
);

CREATE TABLE public.daily_checklist_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES public.daily_checklists(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_custom    BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward    INTEGER NOT NULL DEFAULT 10,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
```

---

### 009 — Rituais Matinais

```sql
-- /supabase/migrations/009_rituals.sql

CREATE TABLE public.rituals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  ritual_type  TEXT NOT NULL CHECK (ritual_type IN ('mental', 'physical', 'professional')),
  duration_min INTEGER NOT NULL DEFAULT 5,
  benefit      TEXT,
  icon         TEXT DEFAULT '🌅',
  xp_reward    INTEGER NOT NULL DEFAULT 20,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.rituals (title, description, ritual_type, duration_min, benefit, icon) VALUES
  ('Meditação',              'Reserve 5 minutos para respirar e focar sua mente',  'mental',       5,  'Clareza mental e foco',       '🧘'),
  ('Leitura Motivacional',   'Leia algo que te inspire para o dia',                'mental',       10, 'Motivação e aprendizado',     '📖'),
  ('Exercício Leve',         'Movimente seu corpo antes de começar o dia',         'physical',     15, 'Energia e disposição',        '🏃'),
  ('Visualização de Metas',  'Visualize seus objetivos sendo alcançados',          'mental',       5,  'Foco e determinação',         '🎯'),
  ('Hidratação Matinal',     'Beba pelo menos 2 copos de água ao acordar',         'physical',     2,  'Hidratação e clareza',        '💧'),
  ('Revisão de Prioridades', 'Defina as 3 tarefas mais importantes do dia',        'professional', 5,  'Produtividade e organização', '📋'),
  ('Gratidão',               'Escreva 3 coisas pelas quais você é grata',          'mental',       3,  'Bem-estar e positividade',    '🙏');

CREATE TABLE public.user_daily_rituals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ritual_id    UUID NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,
  ritual_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ritual_id, ritual_date)
);
```

---

### 010 — Videoaulas

```sql
-- /supabase/migrations/010_videos.sql

CREATE TABLE public.video_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#FF6B00',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.video_categories (name, description, sort_order) VALUES
  ('Onboarding',         'Primeiros passos na 3X',           1),
  ('Técnicas de Vendas', 'Como vender mais e melhor',        2),
  ('Objeções',           'Como superar as resistências',     3),
  ('Motivação',          'Conteúdo motivacional',            4),
  ('Produto',            'Conhecimento de veículos',         5),
  ('Processo',           'Rotinas e processos da pré-venda', 6);

CREATE TABLE public.video_lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id      UUID NOT NULL REFERENCES public.video_categories(id),
  youtube_video_id TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  thumbnail_url    TEXT,
  duration_seconds INTEGER,
  xp_reward        INTEGER NOT NULL DEFAULT 30,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  published_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_video_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id         UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  watch_percentage INTEGER NOT NULL DEFAULT 0 CHECK (watch_percentage BETWEEN 0 AND 100),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  last_watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_awarded       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, video_id)
);

CREATE TABLE public.video_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  timestamp_s INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 011 — Notificações Web Push

```sql
-- /supabase/migrations/011_notifications.sql

CREATE TABLE public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  morning_ritual      BOOLEAN NOT NULL DEFAULT TRUE,
  morning_ritual_time TIME NOT NULL DEFAULT '07:00',
  daily_goal_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_reminder  BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_time      TIME NOT NULL DEFAULT '08:30',
  streak_warning      BOOLEAN NOT NULL DEFAULT TRUE,
  level_up            BOOLEAN NOT NULL DEFAULT TRUE,
  new_content         BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

### 012 — Row Level Security (RLS)

```sql
-- /supabase/migrations/012_rls.sql

-- Habilitar RLS
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checklists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rituals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rituals               ENABLE ROW LEVEL SECURITY;

-- SDR acessa apenas seus próprios dados
CREATE POLICY "own_profile"         ON public.profiles              FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_sales"           ON public.sales_activities      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_notes"           ON public.notes                 FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_calendar"        ON public.calendar_events       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_checklist"       ON public.daily_checklists      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rituals"         ON public.user_daily_rituals    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_video_progress"  ON public.user_video_progress   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_missions"        ON public.user_mission_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_badges"          ON public.user_badges           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_xp"              ON public.xp_transactions       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_push"            ON public.push_subscriptions    FOR ALL USING (auth.uid() = user_id);

-- Supervisoras veem membros e vendas da mesma loja
CREATE POLICY "supervisor_store_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = profiles.store_id
    )
  );

CREATE POLICY "supervisor_store_sales"
  ON public.sales_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles s
      JOIN public.profiles m ON m.id = sales_activities.user_id
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
        AND s.store_id = m.store_id
    )
  );

-- Eventos de equipe visíveis para toda a loja
CREATE POLICY "team_events_visible"
  ON public.calendar_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_team_event = TRUE
      AND EXISTS (
        SELECT 1 FROM public.profiles viewer
        JOIN public.profiles owner ON owner.id = calendar_events.user_id
        WHERE viewer.id = auth.uid()
          AND viewer.store_id = owner.store_id
      )
    )
  );

-- Conteúdo público para qualquer usuário autenticado
CREATE POLICY "auth_read_scripts"
  ON public.scripts       FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);
CREATE POLICY "auth_read_videos"
  ON public.video_lessons FOR SELECT USING (auth.role() = 'authenticated' AND is_published = TRUE);
CREATE POLICY "auth_read_rituals"
  ON public.rituals       FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Admin gerencia conteúdo
CREATE POLICY "admin_manage_scripts"
  ON public.scripts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_manage_videos"
  ON public.video_lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));
```

---

## 7. Princípios de Desenvolvimento

### 7.1 Orientação a Objetos
- 4 pilares: **Encapsulamento, Herança, Polimorfismo, Abstração**
- Composição sobre herança quando apropriado
- Classes com responsabilidade única e coesa
- Sem classes anêmicas (apenas getters/setters sem comportamento)

### 7.2 SOLID aplicado ao 3X App
| Princípio | Aplicação prática |
|-----------|------------------|
| **S** | `AwardXPUseCase` só concede XP. `CheckStreakUseCase` só verifica streak. |
| **O** | Novos tipos de missão via `IMissionStrategy` sem modificar código existente. |
| **L** | `SupabaseUserRepository` substitui `InMemoryUserRepository` nos testes sem quebrar contratos. |
| **I** | `IReadableScriptRepository` e `IWritableScriptRepository` separados. |
| **D** | Use Cases dependem de `INoteRepository`, nunca de `SupabaseNoteRepository` diretamente. |

### 7.3 Clean Architecture — Regra de Dependência
```
Domain ← Application ← Infrastructure
Domain ← Application ← Presentation (Next.js)
```
**PROIBIDO:** `Domain → Infrastructure`, `Domain → Next.js`, `Application → Next.js specifics`

### 7.4 Server vs Client Components
```typescript
// Server Component (default) — dados do servidor, sem estado
export default async function ScriptsPage() {
  const scripts = await getScriptsUseCase.execute();
  return <ScriptsList scripts={scripts} />;
}

// Client Component — apenas onde há interatividade real
'use client';
export function ChecklistItem({ item }: Props) {
  const { toggle } = useChecklist();
  return <button onClick={() => toggle(item.id)}>{item.label}</button>;
}
```

### 7.5 Idempotência
- XP: `UNIQUE(user_id, source_type, source_id)` em `xp_transactions`
- Checklist: `UNIQUE(user_id, checklist_date)`
- Video progress: `UNIQUE(user_id, video_id)`
- Vercel Cron jobs verificam execução anterior antes de processar

---

## 8. Estrutura de Pastas

```
3x-app/                              # Monorepo root (pnpm workspaces + Turborepo)
│
├── apps/
│   ├── app/                         # Next.js — App SDR → deploy Vercel projeto 1
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   │   ├── (auth)/login/
│   │   │   │   ├── (auth)/onboarding/
│   │   │   │   ├── (app)/           # Layout autenticado SDR
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── sales/
│   │   │   │   │   ├── game/
│   │   │   │   │   ├── scripts/
│   │   │   │   │   ├── notes/
│   │   │   │   │   ├── calendar/
│   │   │   │   │   ├── checklist/
│   │   │   │   │   ├── rituals/
│   │   │   │   │   ├── videos/
│   │   │   │   │   ├── leaderboard/
│   │   │   │   │   └── profile/
│   │   │   │   └── api/v1/          # API Routes (server-side)
│   │   │   │       ├── sales/
│   │   │   │       ├── game/xp/
│   │   │   │       ├── notifications/subscribe/
│   │   │   │       ├── webhooks/supabase/
│   │   │   │       └── cron/
│   │   │   │           ├── reset-checklist/
│   │   │   │           ├── check-streaks/
│   │   │   │           └── send-morning-push/
│   │   │   ├── components/
│   │   │   ├── hooks/               # Custom hooks (Interface Adapters)
│   │   │   └── stores/              # Zustand stores
│   │   ├── public/
│   │   │   ├── manifest.json        # PWA manifest
│   │   │   └── icons/               # Ícones PWA (72→512px)
│   │   ├── next.config.ts           # Next.js + next-pwa
│   │   └── vercel.json              # Headers + Cron config
│   │
│   └── admin/                       # Next.js — Painel Admin → deploy Vercel projeto 2
│       ├── src/app/
│       │   ├── (auth)/
│       │   ├── (admin)/
│       │   │   ├── dashboard/
│       │   │   ├── users/
│       │   │   ├── content/
│       │   │   ├── goals/
│       │   │   └── reports/
│       │   └── api/v1/
│       └── next.config.ts
│
├── packages/
│   ├── domain/                      # Entities, Value Objects, Interfaces
│   ├── application/                 # Use Cases, DTOs, Event Bus, Handlers
│   ├── infrastructure/              # Supabase repos, YouTube, Web Push
│   └── shared/                      # Utils, constants, types comuns
│
├── supabase/
│   ├── migrations/                  # 001_ → 012_ (SQL versionado)
│   ├── functions/                   # Edge Functions Supabase
│   │   ├── award-xp/
│   │   ├── send-push-notification/
│   │   └── check-daily-streaks/
│   ├── seed.sql
│   └── config.toml
│
├── design/
│   ├── tokens/                      # tokens.json → tailwind.config.ts
│   ├── assets/                      # SVGs, badges, ilustrações
│   └── wireframes/                  # Links Figma
│
├── docs/
│   ├── adr/
│   ├── flows/
│   └── devops/
│
├── .github/workflows/ci.yml
├── package.json                     # pnpm workspaces
├── turbo.json
├── tailwind.config.ts               # Config compartilhada
└── CLAUDE.md
```

---

## 9. Convenções de Código

```typescript
// Entidades: PascalCase substantivo
class SalesActivity { }
class GameLevel { }

// Use Cases: PascalCase verbo+substantivo
class CompleteChecklistUseCase { }
class AwardXPUseCase { }

// Interfaces: prefixo I
interface INoteRepository { }
interface IEventBus { }

// DTOs
interface CreateNoteDTO { }
interface SalesActivityResponseDTO { }

// Eventos de domínio: passado + Event
class ChecklistCompletedEvent { }
class GameLevelAdvancedEvent { }

// Hooks React: prefixo use
function useChecklist() { }
function useSalesTracker() { }

// Zustand stores
const useGameStore = create(...)

// Server Actions Next.js: prefixo action
async function actionAwardXP(data: AwardXPDTO) { }
```

**Commits (Conventional Commits):**
```
feat(game): add XP award on checklist completion
fix(sales): prevent duplicate activity for same date
refactor(notes): extract search logic to domain service
docs(adr): record decision for PWA over React Native
test(checklist): add unit tests for reset use case
chore(deps): upgrade next to 14.x
ci(vercel): configure staging preview environment
```

---

## 10. Fluxo de Trabalho Git

```
main         ← production → auto-deploy Vercel → app.3x.com.br
develop      ← staging   → auto-deploy Vercel → app-staging.3x.com.br
feature/*    ← funcionalidades novas
fix/*        ← correções
release/*    ← preparação de release
```

**Ciclo:**
1. Branch `feature/nome` a partir de `develop`
2. Commits atômicos (Conventional Commits)
3. PR aberto → **Vercel cria Preview Deployment automático** com URL única
4. CI: lint + typecheck + testes + migration check
5. Review aprovado + CI verde → merge squash em `develop`
6. Auto-deploy em staging para validação
7. PR `develop` → `main` → deploy production automático
8. Tag semântica: `git tag v1.0.0`

---

## 11. Variáveis de Ambiente

```bash
# .env.example — configurar no dashboard Vercel, NUNCA commitar valores reais

# Supabase (público — seguro para client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Supabase (secreto — apenas server-side / Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# YouTube Data API
YOUTUBE_API_KEY=AIzaSy...
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxxxxxxx

# Web Push VAPID (gerar com: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=xxxx...
VAPID_SUBJECT=mailto:dev@3x.com.br

# App
NEXT_PUBLIC_APP_URL=https://app.3x.com.br
NEXT_PUBLIC_APP_ENV=production   # development | preview | production

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
```

**No Vercel Dashboard:**
- `Settings → Environment Variables`
- Configurar por ambiente: Production / Preview / Development
- `NEXT_PUBLIC_*` = expostas ao browser
- Demais = server-only (API Routes, Server Components, Edge Functions)

---

## 12. Configuração de Deploy na Vercel

### vercel.json (App SDR)

```json
{
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options",        "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy",        "value": "strict-origin-when-cross-origin" },
        { "key": "X-XSS-Protection",       "value": "1; mode=block" },
        { "key": "Permissions-Policy",     "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control",          "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ],
  "crons": [
    { "path": "/api/v1/cron/reset-checklist",   "schedule": "0 3 * * *" },
    { "path": "/api/v1/cron/check-streaks",     "schedule": "0 4 * * *" },
    { "path": "/api/v1/cron/send-morning-push", "schedule": "0 10 * * *" }
  ]
}
```

### next.config.ts (App SDR com PWA)

```typescript
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-cache', expiration: { maxEntries: 50 } },
    },
    {
      urlPattern: /^https:\/\/img\.youtube\.com\/.*/,
      handler: 'CacheFirst',
      options: { cacheName: 'youtube-thumbnails', expiration: { maxAgeSeconds: 86400 } },
    },
  ],
});

const nextConfig = pwaConfig({
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
      { hostname: 'img.youtube.com' },
    ],
  },
});

export default nextConfig;
```

### manifest.json (PWA)

```json
{
  "name": "3X — Treinamento SDR",
  "short_name": "3X App",
  "description": "Plataforma de treinamento e acompanhamento para SDRs da 3X",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1A1A2E",
  "theme_color": "#FF6B00",
  "lang": "pt-BR",
  "categories": ["business", "education", "productivity"],
  "icons": [
    { "src": "/icons/icon-72x72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96x96.png",   "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## 13. Checklist de Entrega por Módulo

Antes de marcar qualquer módulo como concluído, o agente responsável confirma:

```
[ ] Migration SQL criada em /supabase/migrations/ e aplicada em staging
[ ] RLS policies configuradas e testadas para as novas tabelas
[ ] Interfaces de repositório definidas em /packages/domain/
[ ] Use Cases implementados com DTOs em /packages/application/
[ ] Repositório concreto Supabase em /packages/infrastructure/
[ ] Eventos de domínio identificados e handlers implementados
[ ] API Route Next.js criada para operações server-side (se necessário)
[ ] Custom hook criado para o módulo
[ ] Server Components usados onde não há interatividade
[ ] Telas implementadas com loading.tsx e error.tsx
[ ] Responsividade mobile-first validada (320px → 1280px)
[ ] PWA: dados críticos em cache para uso offline
[ ] Painel admin atualizado (se aplicável)
[ ] Testes unitários para Use Cases (Vitest, >80% cobertura)
[ ] Preview Deployment Vercel revisado e aprovado
[ ] CI GitHub Actions verde (lint + typecheck + tests + migration check)
[ ] ADR registrado se houve decisão arquitetural relevante
```

---

## 📌 Notas Finais para os Agentes

> **Todo agente deve ler este arquivo completo antes de iniciar qualquer tarefa.**

### Ordem de Desenvolvimento Recomendada
```
Sprint 1  → Setup monorepo + Auth + Profiles + Stores + Layout base + PWA
Sprint 2  → Dashboard + Checklist + Rituais Matinais
Sprint 3  → Sales Tracker (core do produto)
Sprint 4  → Gamificação completa (XP, níveis, fases, missões, badges)
Sprint 5  → Scripts e Objeções
Sprint 6  → Calendário + Notas
Sprint 7  → Videoaulas (YouTube integration)
Sprint 8  → Leaderboard + Painel Admin completo
Sprint 9  → Web Push Notifications + Vercel Cron
Sprint 10 → Polimento, testes E2E, performance, PWA offline
```

### Prioridade de Qualidade
```
Domínio > Application > Infraestrutura > Apresentação
```

### Regras Invioláveis
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client-side
- Nunca bypassar RLS sem justificativa documentada em ADR
- Nunca importar packages de infra dentro do domínio
- Nunca commitar secrets — usar Vercel Environment Variables

---

*Documento mantido pelo AGENT: ARCHITECT.*
*Versão: 1.1.0 — Deploy unificado na Vercel (Next.js PWA + Admin)*