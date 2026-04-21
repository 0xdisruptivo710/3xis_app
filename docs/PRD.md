# PRD — 3X App

> **Product Requirements Document + Mapa de Arquitetura**
> Versão: 1.0 · Última atualização: 2026-04-21
> Stack: Next.js 14 · TypeScript · Supabase · TailwindCSS · pnpm + Turborepo · Vercel

---

## 1. O que é o produto

**3X App** é uma plataforma SaaS multi-tenant de **treinamento e acompanhamento para SDRs (Sales Development Representatives) de lojas de veículos**.

Cada loja contrata uma licença e suas SDRs usam o app (PWA) para:

- Registrar atividades diárias de pré-venda (ligações, agendamentos, test drives, propostas, fechamentos)
- Acompanhar metas individuais e da loja
- Acessar biblioteca de scripts e respostas para objeções
- Progredir em um sistema gamificado (XP, níveis, fases, missões, badges)
- Cumprir checklist e rituais matinais
- Assistir videoaulas (YouTube)
- Comparar performance no ranking interno da loja

Supervisoras acompanham as SDRs. Admins de loja gerenciam usuários e conteúdo. O **super_admin** (3X, dono da plataforma) tem visão cross-store sobre todas as lojas, licenças e usuários.

---

## 2. Personas e hierarquia de acesso

| Role | Onde acessa | Vê | Faz |
|------|-------------|----|----|
| `sdr` | App SDR | Apenas seus próprios dados | Registra atividades, completa checklist, ganha XP |
| `supervisor` | App SDR + Admin | Todas as SDRs da MESMA loja | Acompanha equipe, envia convites para SDRs |
| `admin` | Admin | Toda a loja (usuários, conteúdo, metas) | Gerencia loja, convida supervisoras |
| `super_admin` | Admin (área `/platform`) | Todas as lojas + métricas globais | Cria/inspeciona lojas, gera códigos de acesso, vê tudo |

A separação é garantida por **Row Level Security (RLS)** no PostgreSQL — não confiamos em filtros de aplicação para isolamento de dados.

---

## 3. Como uma SDR entra no sistema

Há **três caminhos** de cadastro:

```
┌───────────────────────────────────────────────────────────┐
│  CAMINHO A — Convite por link (fluxo principal)           │
├───────────────────────────────────────────────────────────┤
│  Admin de loja → cria convite em /admin/users             │
│    └─→ gera token único em x3_invitations                 │
│         └─→ link app.3x.com.br/register?token=XXX         │
│              └─→ SDR define nome + senha                  │
│                   └─→ vinculada à store_id + role         │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  CAMINHO B — Código de acesso (dono de loja se cadastra)  │
├───────────────────────────────────────────────────────────┤
│  Lead compra licença → recebe código tipo 3X-ABCD-1234    │
│    └─→ digita em app.3x.com.br/register                   │
│         └─→ valida x3_access_codes                        │
│              └─→ cria conta com role='admin'              │
│                   └─→ cria x3_store_licenses              │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  CAMINHO C — Super admin (3X) por seed                    │
├───────────────────────────────────────────────────────────┤
│  pnpm seed:super-admin                                    │
│    └─→ scripts/seed-super-admin.mjs                       │
│         └─→ Supabase Auth Admin API cria usuário          │
│              └─→ UPSERT em x3_profiles com role           │
└───────────────────────────────────────────────────────────┘
```

### Recuperação de acesso

| Situação | Solução |
|----------|---------|
| Esqueci minha senha | `/forgot-password` → email com link → `/reset-password` |
| Não recebi/perdi convite | Admin clica "Reenviar" em `/admin/users` (aba Convites) — copia novo link |
| Sessão expirada | Login → "Reenviar acesso por email" (magic link, só se a conta já existe) |

---

## 4. Estrutura de pastas (raiz do monorepo)

```
3x-app/
├── apps/                   # Aplicações Next.js (deploy individual)
│   ├── app/                #   → App SDR (PWA) — app.3x.com.br
│   └── admin/              #   → Painel Admin — admin.3x.com.br
├── packages/               # Código compartilhado entre os apps (workspaces pnpm)
│   ├── domain/             #   → Entities, Value Objects, interfaces
│   ├── application/        #   → Use Cases, DTOs, event bus
│   ├── infrastructure/     #   → Repositórios concretos (Supabase, YouTube, push)
│   └── shared/             #   → Utils, constantes, tipos comuns
├── supabase/
│   ├── migrations/         # SQL versionado (numerado 000_ → 015_)
│   └── functions/          # Edge Functions Supabase
├── scripts/                # Scripts utilitários Node (seed, manutenção)
├── docs/
│   ├── adr/                # Architecture Decision Records
│   ├── flows/              # Diagramas Mermaid de fluxos
│   ├── devops/             # Runbooks de deploy/rollback
│   └── PRD.md              # Este documento
├── design/
│   ├── tokens/             # tokens.json → tailwind.config.ts
│   ├── assets/             # SVGs, badges, ilustrações
│   └── wireframes/         # Links Figma
├── .github/workflows/      # GitHub Actions (CI: lint + typecheck + tests)
├── claude.MD               # Guia para agentes IA — fonte única de verdade
├── package.json            # Scripts root + dependências da raiz
├── pnpm-workspace.yaml     # Define packages/* e apps/* como workspaces
├── turbo.json              # Pipeline Turborepo (build, dev, test)
└── tsconfig.json           # Base TS estendida pelos workspaces
```

### Por que monorepo?
- Os dois apps (SDR e Admin) **compartilham domínio**: mesmas entidades, mesmas regras, mesmo banco
- Mudar uma migração ou DTO **deve refletir em ambos** sem PR cross-repo
- **Turborepo** dá cache incremental: typecheck/build só roda no que mudou
- Deploy independente: cada app é um projeto Vercel separado

---

## 5. `apps/app/` — App SDR (PWA)

Aplicação Next.js 14 (App Router) servida em `app.3x.com.br`. Instalável como PWA em iOS/Android.

```
apps/app/
├── public/
│   ├── manifest.json       # Manifest PWA (nome, ícones, theme_color)
│   ├── icons/              # 72×72 → 512×512 (any + maskable)
│   └── sw.js               # Service worker (gerado por next-pwa em build)
├── src/
│   ├── app/                # App Router (file-based routing)
│   │   ├── (auth)/         # Layout autenticação — sem sidebar, fundo escuro
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   ├── register/        # Convite OU código de acesso
│   │   │   ├── onboarding/      # Setup inicial pós-cadastro
│   │   │   ├── forgot-password/ # Solicitar reset
│   │   │   └── reset-password/  # Definir nova senha
│   │   │
│   │   ├── (app)/          # Layout autenticado SDR — sidebar + bottom nav
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/       # Home com resumo diário
│   │   │   ├── sales/           # Registro e histórico de atividades
│   │   │   ├── game/            # Fases, missões, badges
│   │   │   ├── scripts/         # Biblioteca categorizada
│   │   │   ├── notes/           # CRUD de notas
│   │   │   ├── calendar/        # Eventos mensal/semanal
│   │   │   ├── checklist/       # Checklist do dia
│   │   │   ├── rituals/         # Rituais matinais
│   │   │   ├── videos/          # Videoaulas (YouTube embed)
│   │   │   ├── leaderboard/     # Ranking da loja
│   │   │   └── profile/         # Perfil + configurações
│   │   │
│   │   └── api/v1/         # API Routes (server-side)
│   │       ├── auth/callback/   # Troca code → session (magic link, reset)
│   │       ├── sales/
│   │       ├── game/xp/         # Concessão idempotente de XP
│   │       ├── notifications/subscribe/
│   │       ├── webhooks/supabase/
│   │       └── cron/            # Vercel Cron (reset checklist, streaks, push)
│   │
│   ├── components/         # Componentes UI reutilizáveis
│   ├── hooks/              # Custom hooks (Interface Adapters)
│   ├── stores/             # Zustand stores (estado global cliente)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        # createClient browser (anon key + RLS)
│   │       ├── server.ts        # createServerClient (Server Components)
│   │       └── middleware.ts    # updateSession + redirects auth
│   └── middleware.ts       # Next.js middleware (chama updateSession)
├── next.config.ts          # Config Next + next-pwa (runtime caching)
├── vercel.json             # Headers de segurança + Cron jobs
└── package.json
```

### Padrão de roteamento

- **Route Groups** `(auth)` e `(app)` agrupam por **layout**, sem aparecer na URL
- `loading.tsx` e `error.tsx` em cada rota crítica (App Router convention)
- Server Components por padrão; `'use client'` só onde há interatividade real

### Fluxo de autenticação no middleware

```
Request → middleware.ts → updateSession()
  ├─ user existe?
  │    NÃO → rota é pública? (/login, /register, /forgot, /reset)
  │           SIM → segue
  │           NÃO → redirect /login
  │    SIM → rota é de auth? (e não /reset-password)
  │           SIM → redirect /dashboard
  │           NÃO → segue (com cookie session refresh)
```

---

## 6. `apps/admin/` — Painel Admin

Aplicação Next.js 14 servida em `admin.3x.com.br`. Sem PWA, desktop-first mas responsivo.

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/           # Apenas email + senha (sem registro público)
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   ├── (admin)/         # Layout autenticado — sidebar fixa esquerda
│   │   │   ├── layout.tsx       # Carrega role do user; mostra "Plataforma" só p/ super_admin
│   │   │   ├── dashboard/       # Visão geral da loja do admin
│   │   │   ├── users/           # CRUD de usuários + convites + criar lojas
│   │   │   ├── content/
│   │   │   │   ├── scripts/     # Gerenciar biblioteca de scripts
│   │   │   │   ├── videos/      # Cadastrar videoaulas YouTube
│   │   │   │   ├── checklist/   # Editar template diário
│   │   │   │   └── rituals/     # Configurar rituais matinais
│   │   │   ├── goals/           # Definir metas por SDR/loja
│   │   │   ├── reports/         # Relatórios de performance
│   │   │   │
│   │   │   └── platform/        # ⚡ ÁREA SUPER ADMIN (3X) — guard server-side
│   │   │       ├── layout.tsx       # Bloqueia quem não é super_admin
│   │   │       ├── page.tsx         # Dashboard global (lojas, licenças, convites)
│   │   │       └── stores/[storeId]/page.tsx  # Drill-in por loja
│   │   │
│   │   └── api/v1/auth/callback/  # Mesmo padrão do app (magic link, reset)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts        # Inclui createAdminClient (service_role)
│   │   │   └── middleware.ts    # updateSession + checagem de role admin/supervisor/super_admin
│   │   └── utils.ts             # cn() helper para Tailwind
│   └── middleware.ts
├── next.config.ts
└── package.json
```

### Diferenças vs App SDR
- **Sem registro público** — admins só nascem via código de acesso (no app SDR) ou inserção manual
- **Middleware checa role** — sessão sem `admin`/`supervisor`/`super_admin` é deslogada e redirecionada com erro
- **Sem PWA** — uso desktop predominante por administradores

---

## 7. `packages/` — Código compartilhado (Clean Architecture)

```
packages/
├── domain/                 # Camada mais interna — sem dependências
│   ├── entities/           #   User, SDR, Store, GameLevel, Note, Checklist...
│   ├── value-objects/      #   XPScore, StreakCount, Progress
│   ├── repositories/       #   Interfaces (IUserRepository, INoteRepository)
│   ├── events/             #   Domain events (ChecklistCompleted, LevelAdvanced)
│   └── services/           #   Domain services (lógica que não cabe em entity)
│
├── application/            # Use Cases — orquestram domínio
│   ├── use-cases/          #   CompleteChecklistUseCase, AwardXPUseCase...
│   ├── dtos/               #   Input/Output dos use cases
│   ├── event-bus/          #   Interface + in-memory implementation
│   └── handlers/           #   Reações a eventos (AwardXPHandler, NotifyCoachHandler)
│
├── infrastructure/         # Implementações concretas — fala com mundo externo
│   ├── supabase/           #   Repositórios Supabase (implementam interfaces de domain)
│   ├── youtube/            #   YouTube Data API v3 client
│   ├── web-push/           #   Web Push via VAPID
│   └── anti-corruption/    #   Adapters que protegem o domínio de schemas externos
│
└── shared/                 # Utils sem dependência de framework
    ├── constants/
    ├── types/
    └── utils/
```

### Regra de Dependência (inviolável)

```
Domain   ←  Application  ←  Infrastructure
Domain   ←  Application  ←  Presentation (apps/*)
```

- Domain **não** importa nada de Application, Infrastructure ou Next.js
- Application **não** importa Infrastructure ou Next.js — depende de interfaces
- Presentation injeta Infrastructure nos Use Cases

---

## 8. `supabase/`

```
supabase/
├── migrations/             # SQL idempotente, versionado, executado em ordem
│   ├── 000_reset_and_full_setup.sql        # Setup completo (dev/reset)
│   ├── 001_extensions.sql                  # uuid-ossp, pg_trgm
│   ├── 002_stores_and_profiles.sql         # Lojas, perfis, trigger handle_new_user
│   ├── 003_gamification.sql                # XP, badges, fases, missões
│   ├── 004_sales.sql                       # Atividades e metas
│   ├── 005_scripts.sql                     # Biblioteca de scripts
│   ├── 006_notes.sql                       # Notas com FTS
│   ├── 007_calendar.sql                    # Eventos
│   ├── 008_checklist.sql                   # Templates + execuções diárias
│   ├── 009_rituals.sql                     # Rituais matinais
│   ├── 010_videos.sql                      # Videoaulas + progresso
│   ├── 011_notifications.sql               # Web Push subscriptions
│   ├── 012_rls.sql                         # RLS básico (own data)
│   ├── 013_x3_prefix_and_licensing.sql     # Renomeia para x3_*, adiciona licenciamento
│   ├── 014_complete_rls_policies.sql       # RLS completo para admin operations
│   └── 015_super_admin_role.sql            # Role super_admin + bypass policies
│
└── functions/              # Edge Functions (Deno)
    ├── award-xp/
    ├── send-push-notification/
    └── check-daily-streaks/
```

### Convenção de migrations
- **Numeradas e imutáveis** — uma migration aplicada em prod nunca é editada; cria-se uma nova
- **Idempotentes quando possível** — `IF EXISTS`, `IF NOT EXISTS`, `CREATE OR REPLACE`
- **Prefixo `x3_`** em todas as tabelas — evita conflito com schemas internos do Supabase

### Tabelas-chave de auth/licenciamento

| Tabela | Função |
|--------|--------|
| `auth.users` | Nativa do Supabase Auth |
| `x3_profiles` | Perfil estendido (role, store_id, xp, streak) — criado por trigger |
| `x3_stores` | Lojas (revendas de veículos) |
| `x3_store_licenses` | Licença ativa por loja (plano, max_users, expiração) |
| `x3_access_codes` | Códigos para auto-cadastro de admins (vendas) |
| `x3_invitations` | Convites com token único (admin/supervisor → SDR) |

---

## 9. `scripts/`

```
scripts/
└── seed-super-admin.mjs    # Cria/promove usuário super_admin (idempotente)
```

Comando: `pnpm seed:super-admin`

Lê `.env.local` da raiz ou de `apps/*`. Usa `SUPABASE_SERVICE_ROLE_KEY` para criar o usuário via Admin API. Senha aleatória é impressa no terminal se não fornecida via `SUPER_ADMIN_PASSWORD`.

---

## 10. `docs/`

```
docs/
├── adr/                    # Architecture Decision Records (1 por decisão)
├── flows/                  # Diagramas Mermaid (auth, gamificação, etc.)
├── devops/                 # Runbooks: deploy, rollback, incidentes
├── PRD.md                  # ESTE documento — visão de produto + arquitetura
└── SISTEMA_3X_GUIA_COMPLETO.md  # Guia geral do projeto
```

### Quando criar um ADR
Toda decisão arquitetural relevante e **irreversível sem custo**. Exemplos:
- "Por que escolhemos PWA em vez de React Native"
- "Por que prefixamos tabelas com `x3_`"
- "Por que adicionamos role `super_admin` em vez de usar uma tabela separada"

---

## 11. `design/`

```
design/
├── tokens/                 # tokens.json → import no tailwind.config.ts
├── assets/                 # SVGs (badges locked/unlocked, ilustrações)
└── wireframes/             # README com links Figma
```

### Paleta 3X
| Token | Cor | Uso |
|-------|-----|-----|
| `primary` | `#FF6B00` | CTAs, ações principais (laranja 3X) |
| `secondary` | `#1A1A2E` | Headers, sidebar, fundos escuros |
| `accent` | `#FFD700` | XP, conquistas, gamificação |
| `success` | `#00C853` | Metas batidas, status positivo |
| `warning` | `#FFB300` | Próximo da meta |
| `error` | `#D50000` | Abaixo da meta, erros |

---

## 12. Fluxo de desenvolvimento

```
feature/* → develop → main
                       ↓
                  Vercel deploy production
```

```bash
# Setup
pnpm install                        # Instala dependências de todo monorepo
cp .env.example .env.local          # Configurar Supabase URL + keys

# Desenvolvimento
pnpm dev                            # Inicia ambos apps em paralelo
pnpm dev:app                        # Só o App SDR (porta 3000)
pnpm dev:admin                      # Só o Admin (porta 3001)

# Qualidade
pnpm lint                           # ESLint em todos workspaces
pnpm typecheck                      # tsc --noEmit
pnpm test                           # Vitest

# Build
pnpm build                          # Build completo (Turborepo cache)
pnpm build:app                      # Só App SDR
pnpm build:admin                    # Só Admin

# Banco de dados
supabase db push                    # Aplica migrations no projeto Supabase
pnpm seed:super-admin               # Cria/promove super admin
```

---

## 13. Variáveis de ambiente

### Públicas (browser)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxx
NEXT_PUBLIC_APP_URL=https://app.3x.com.br
NEXT_PUBLIC_APP_ENV=production
```

### Server-only (NUNCA expor)
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Bypass RLS — só API Routes / scripts
YOUTUBE_API_KEY=AIza...
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:dev@3x.com.br
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=xxx
```

Configurar no **Vercel Dashboard → Settings → Environment Variables** por ambiente (Production / Preview / Development).

---

## 14. Deploy

| App | Projeto Vercel | Root Directory | Build Command |
|-----|----------------|----------------|---------------|
| App SDR | `3x-app` | `apps/app` | `pnpm turbo build --filter=app` |
| Admin | `3x-admin` | `apps/admin` | `pnpm turbo build --filter=admin` |

- Cada PR gera **Preview Deployment** automático (URL única)
- Push em `develop` → deploy staging
- Push em `main` → deploy production

---

## 15. Roadmap das próximas entregas

| Sprint | Foco |
|--------|------|
| ✅ 1 | Setup monorepo + Auth + Profiles + Stores + PWA |
| ✅ 2 | Recuperação de senha + reenvio de acesso + super_admin |
| 🚧 3 | Sales Tracker (núcleo do produto) |
| ⏳ 4 | Gamificação completa (XP, níveis, fases, missões, badges) |
| ⏳ 5 | Scripts e Objeções |
| ⏳ 6 | Calendário + Notas |
| ⏳ 7 | Videoaulas (YouTube integration) |
| ⏳ 8 | Leaderboard + Painel Admin completo |
| ⏳ 9 | Web Push + Vercel Cron |
| ⏳ 10 | Polimento, E2E, performance, PWA offline |

---

## 16. Glossário rápido

| Termo | Significado |
|-------|-------------|
| **SDR** | Sales Development Representative — pré-vendedora |
| **PWA** | Progressive Web App — instalável via browser |
| **RLS** | Row Level Security — filtro de linhas por usuário no PostgreSQL |
| **RSC** | React Server Component |
| **ADR** | Architecture Decision Record |
| **Use Case** | Ação de aplicação (verbo + substantivo) — `CompleteChecklistUseCase` |
| **DTO** | Data Transfer Object — input/output entre camadas |
| **Idempotência** | Operação que pode rodar N vezes com o mesmo efeito |
| **Magic Link** | Login sem senha via link enviado por email |
| **Service Role Key** | Chave Supabase que bypassa RLS — **somente server-side** |
