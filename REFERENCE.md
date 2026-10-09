# 📖 Referência Rápida - BOS

Guia de referência rápida para desenvolvedores trabalhando no projeto.

## 🚀 Iniciar Desenvolvimento

```bash
# Dev server (Ctrl+C para parar)
npm run dev

# Terminal adicional para linting em tempo real
npm run lint
```

Acessar: `http://localhost:5173`

---

## 📂 Onde Encontrar Coisas

| O que você precisa        | Arquivo/Pasta                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Entender a arquitetura    | [`.claude/docs/CLAUDE.md`](./.claude/docs/CLAUDE.md)                                   |
| Ver padrões de código     | [`.claude/memory/code_conventions.md`](./.claude/memory/code_conventions.md)           |
| Adicionar novo componente | `src/components/`                                                                      |
| Adicionar nova página     | `src/pages/`                                                                           |
| Chamar Supabase           | `src/services/`                                                                        |
| Contexto global (auth)    | `src/contexts/AuthContext.tsx`                                                         |
| Integrar novo UI shadcn   | `src/components/ui/`                                                                   |
| Ver status das features   | [`.claude/memory/feature_status.md`](./.claude/memory/feature_status.md)               |
| Plano de monetização      | [`.claude/memory/monetization_strategy.md`](./.claude/memory/monetization_strategy.md) |

---

## 🛠️ Tarefas Comuns

### Adicionar Novo Componente

```tsx
// src/components/MyComponent.tsx
import React from "react";

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps): React.JSX.Element {
  return <div>{title}</div>;
}
```

### Usar Componente shadcn

```tsx
import { Button } from "@/components/ui/Button";
import { Heart } from "@phosphor-icons/react";

<Button onClick={() => console.log("clicked")}>
  <Heart size={20} /> Like
</Button>;
```

### Chamar Supabase

```tsx
// src/services/myservice.ts
import { supabase } from "@/lib/supabase";

export async function getData() {
  const { data, error } = await supabase.from("table_name").select("*");

  if (error) throw error;
  return data;
}
```

### Usar AuthContext

```tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>Welcome, {user.email}</div>;
}
```

---

## ✅ Checklist antes de Commitar

```bash
# 1. Verificar linting
npm run lint

# 2. Corrigir automaticamente
npm run lint:fix

# 3. Testar no navegador
npm run dev

# 4. Build para ter certeza
npm run build

# 5. Commitar com mensagem convencional
git add .
git commit -m "feat: descricao da feature"
```

**Tipos de commit**:

- `feat:` nova feature
- `fix:` correção de bug
- `refactor:` refatoração sem mudança de behavior
- `style:` formatação
- `docs:` documentação

---

## 🐛 Troubleshooting

### Port 5173 já está em uso

```bash
# Matar processo na porta
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### ESLint/Prettier erro

```bash
npm run lint:fix
```

### Build falha

```bash
# Limpar cache
rm -rf dist node_modules/.vite

# Rebuildar
npm run build
```

### TypeScript errors

```bash
# Validar TS
npx tsc --noEmit
```

---

## 🔗 Referências Externas

- **Supabase**: https://supabase.com/docs
- **React**: https://react.dev
- **TailwindCSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com
- **Phosphor Icons**: https://phosphoricons.com
- **Vite**: https://vitejs.dev

---

## 💾 Variáveis de Ambiente

Pedir ao Alexandre:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 📊 Stack em Uma Linha

React 19 + Vite + TypeScript + Supabase + TailwindCSS + shadcn/ui + Phosphor Icons

---

## 🎯 Próximos Passos Críticos

1. Implementar **Premium Membership**
2. Adicionar **Sponsored Posts**
3. Integrar **Payment (Stripe/PagSeguro)**
4. Setup **Analytics**

Veja [`monetization_strategy.md`](./.claude/memory/monetization_strategy.md)

---

**Última atualização**: 2026-10-09
