# 🌿 BahiaOpenSource (BOS)

Uma rede social de código aberto para conectar criadores, desenvolvedores e profissionais da comunidade Bahia.

## 🎯 Meta

Gerar receita e monetizar a plataforma em **máximo 3 meses** (deadline: ~Janeiro 2027).

---

## 📁 Estrutura do Projeto

```
BahiaOpenSource/
├── .claude/                 # 🤖 Contexto para Claude Code (não commitar)
│   ├── docs/               # Documentação técnica
│   │   ├── CLAUDE.md       # Guia completo do projeto
│   │   └── CODE_REDUCTION_MAP.md
│   └── memory/             # Memória persistente
│       ├── MEMORY.md       # Índice de memórias
│       ├── user_profile.md
│       ├── project_bos.md
│       ├── tech_stack.md
│       ├── code_conventions.md
│       ├── feature_status.md
│       ├── monetization_strategy.md
│       └── README.md
│
├── .agents/                 # Agents do Claude Code
│   └── skills/
│
├── src/                     # 📦 Código-fonte
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── ui/            # shadcn components (Button, Input, Dialog, etc)
│   │   ├── layouts/       # MainLayout, AuthLayout
│   │   └── [features]/
│   ├── pages/             # Páginas da aplicação
│   │   ├── Home.tsx
│   │   ├── Auth/          # Login, Register
│   │   ├── Feed/          # Feed principal
│   │   ├── Profile/       # Perfil de usuário
│   │   └── UiDemo.tsx
│   ├── contexts/          # React Contexts
│   │   └── AuthContext.tsx
│   ├── services/          # API/DB calls
│   │   └── publications.ts
│   ├── lib/               # Utilitários
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── main.tsx
│
├── public/                 # Assets estáticos
│
├── node_modules/          # Dependências (ignorado no git)
│
├── package.json           # Dependências e scripts
├── package-lock.json
│
├── 📋 Arquivos de Configuração
├── vite.config.ts         # Vite bundler
├── tsconfig.json          # TypeScript
├── tailwind.config.js     # TailwindCSS
├── postcss.config.js      # PostCSS
├── eslint.config.cjs      # ESLint
├── .eslintrc.cjs          # ESLint (legacy)
├── .prettierrc             # Prettier
├── commitlint.config.js   # Commitlint
├── components.json        # shadcn config
├── vercel.json            # Vercel deploy
│
├── .env                   # Variáveis de ambiente (não commitar)
├── .gitignore
├── .husky/                # Git hooks
│
├── supabase_updates.sql   # Database migrations
└── README.md              # Este arquivo
```

---

## 🚀 Quick Start

### Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (pedir variáveis Supabase)
cp .env.example .env

# 3. Iniciar dev server
npm run dev
```

Acessar em: `http://localhost:5173`

### Scripts Principais

```bash
npm run dev              # Dev server
npm run build            # Build produção
npm run preview          # Preview da build
npm run lint             # Verificar código
npm run lint:fix         # Corrigir automaticamente
npm run format           # Formatar com Prettier
```

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS v4 + shadcn/ui
- **Icons**: Phosphor Icons
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel
- **Quality**: ESLint + Prettier + Husky

**Detalhes completos**: Ver [`.claude/docs/CLAUDE.md`](.claude/docs/CLAUDE.md)

---

## 📊 Status do Projeto

### ✅ Implementado (MVP)

- Autenticação (Supabase Auth)
- Feed de publicações
- Perfil de usuário
- UI polida (Phosphor Icons, shadcn)

### ⏳ Pendente (Crítico)

- **Monetização** (Premium, Sponsored Posts, Creator Fund)
- Analytics & Tracking
- Interações avançadas (like, comment, follow)
- Notificações em tempo real

**Roadmap completo**: Ver [`/memory/feature_status.md`](.claude/memory/feature_status.md)

---

## 💰 Plano de Monetização (3 Meses)

| Semana    | Feature                          | Receita             |
| --------- | -------------------------------- | ------------------- |
| 1-2       | Premium Membership (R$ 9,90/mês) | R$ 200-500/mês      |
| 2-3       | Sponsored Posts (R$ 100-500)     | R$ 500-2k/mês       |
| 3-4       | Analytics Dashboard              | Upsell premium      |
| **Total** | **4 semanas**                    | **R$ 700-2.5k/mês** |

**Estratégia detalhada**: Ver [`/memory/monetization_strategy.md`](.claude/memory/monetization_strategy.md)

---

## 🤖 Usando Claude Code

Não comite a pasta `.claude/` - ela contém contexto para Claude Code.

### Para Desenvolvedores

- Leia [`.claude/docs/CLAUDE.md`](.claude/docs/CLAUDE.md) para entender a arquitetura
- Siga as convenções em [`.claude/memory/code_conventions.md`](.claude/memory/code_conventions.md)

### Para Claude AI

- Claude carregará automaticamente as memórias de [`.claude/memory/`](.claude/memory/)
- Use referências como `[[monetization_strategy]]` nas conversas

---

## 📞 Contato

**Mantido por**: Alexandre (alexandre21farias@gmail.com)

---

## 📝 License

(Adicione informação de licença aqui)

---

**Última atualização**: 2026-10-09
