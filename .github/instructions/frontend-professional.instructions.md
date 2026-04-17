---
applyTo: "**/*.{jsx,tsx,js,ts,vue,svelte}"
description: "Use when: writing frontend code, creating components, hooks, pages, services, state management, UI, React, Vue, Svelte. Applies Component-Based Architecture, Atomic Design, DDD, DRY, KISS, YAGNI."
---

# Frontend Profissional — Arquitetura e Princípios (2026)

## 1. Arquitetura Base (Obrigatória)

Toda aplicação frontend DEVE seguir **Component-Based Architecture** com **Atomic Design** e organização por domínio (**DDD**).

### Estrutura de pastas padrão

```
/src
  /components       ← componentes atômicos globais (atoms, molecules, organisms)
  /modules          ← domínios de negócio (crm, finance, users...)
  /pages            ← entrypoints de rota (somente composição)
  /services         ← chamadas de API globais
  /hooks            ← hooks globais reutilizáveis
  /store            ← estado global (Zustand, Redux...)
  /utils            ← helpers puros, sem efeitos colaterais
```

---

## 2. Organização por Domínio (DDD no Frontend)

Igual ao backend — cada módulo é independente e autocontido:

```
/modules
  /crm
    /components     ← componentes do domínio CRM
      LeadCard.jsx
      LeadList.jsx
    /pages
      LeadsPage.jsx
    /hooks
      useLeads.js
    /services
      leads.service.js

  /finance
    /components
    /pages
    /hooks
    /services

  /users
    /components
    /pages
    /hooks
    /services
```

> Facilita escalar, manter e entender o ERP por domínio de negócio.

---

## 3. Atomic Design (Padrão de Componentização)

| Nível | O que é | Exemplos |
|-------|---------|---------|
| **Atoms** | Elementos base, sem dependências | `Button`, `Input`, `Badge`, `Avatar` |
| **Molecules** | Combinação de atoms | `FormField`, `SearchBar`, `UserCard` |
| **Organisms** | Seções completas de UI | `UserTable`, `LeadsKanban`, `Sidebar` |
| **Pages** | Tela final — só composição, zero lógica | `LeadsPage`, `DashboardPage` |

```
/components
  /atoms
    Button.jsx
    Input.jsx
  /molecules
    FormField.jsx
    UserCard.jsx
  /organisms
    UserTable.jsx
    LeadsKanban.jsx
```

---

## 4. Regra de Componentização (A Mais Importante)

**Um componente = uma responsabilidade.**

```
❌ UserDashboardWithEverything.jsx   ← proibido

✅ UserCard.jsx
✅ UserList.jsx
✅ UserStats.jsx
✅ UserDashboard.jsx   ← apenas compõe os acima
```

### Tamanho ideal
| Tipo | Linhas |
|------|--------|
| Componente | 50–150 linhas |
| Hook | até 100 linhas |
| Service | até 80 linhas |
| Função | até 30 linhas |

---

## 5. Princípios Obrigatórios (CORE)

### DRY (Don't Repeat Yourself)
- Proibido duplicar componentes
- Criar componentes reutilizáveis antes de copiar
- Verificar se já existe antes de criar

### KISS (Keep It Simple, Stupid)
- UI simples > UI complexa
- Evitar lógica desnecessária no JSX/template
- Se está difícil de ler, refatorar

### Separation of Concerns

| Responsabilidade | Onde fica |
|-----------------|-----------|
| UI e renderização | Componente (`.jsx`/`.tsx`) |
| Lógica e estado | Hook (`use*.js`) |
| Chamadas de API | Service (`*.service.js`) |
| Estado global | Store (Zustand/Redux) |

**Nunca chamar API diretamente dentro de um componente grande.**

---

## 6. Fluxo de Dados Padrão

```
UI (Component) → Hook → Service → API → Backend
                  ↓
              Store (estado global quando necessário)
```

### Exemplos corretos

```jsx
// ✅ Correto — componente limpo, lógica no hook
function LeadsPage() {
  const { leads, isLoading, createLead } = useLeads();

  return <LeadList leads={leads} onAdd={createLead} isLoading={isLoading} />;
}
```

```javascript
// ✅ Hook — lógica isolada
function useLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    const data = await leadsService.findAll();
    setLeads(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  return { leads, isLoading, createLead };
}
```

```javascript
// ✅ Service — só chamadas de API
const leadsService = {
  findAll: () => api.get('/leads'),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};
```

---

## 7. Gerenciamento de Estado

| Escopo | Solução |
|--------|---------|
| Local do componente | `useState` |
| Compartilhado entre componentes próximos | `props` / `context` |
| Global (auth, tema, carrinho) | Store (Zustand ou Redux) |
| Cache de servidor | React Query / SWR |

### Regras
- **Preferir estado local** — mover para global só quando necessário
- **Zustand** para projetos pequenos/médios (simples, leve)
- **Redux Toolkit** para projetos grandes com estado complexo
- **React Query / SWR** para cache de dados do servidor (evita duplicar estado)

---

## 8. Hooks — Padrão Obrigatório

Toda lógica de negócio vai em hooks customizados:

```javascript
// Nomenclatura: use + Domínio + Ação (opcional)
useUser()           // dados e ações do usuário atual
useAuth()           // autenticação
useLeads()          // CRUD de leads
useLeadFilters()    // filtros de leads
usePermissions()    // verificação de permissões
```

### Regras de hooks
- Um hook = uma responsabilidade
- Nunca retornar JSX de um hook
- Testar hooks separadamente dos componentes
- Hooks globais em `/hooks/`, hooks de domínio em `/modules/[domain]/hooks/`

---

## 9. Performance Obrigatória

- **Lazy loading** em todas as páginas (`React.lazy` + `Suspense`)
- **Code splitting** por rota e por módulo
- **`memo`** em componentes que recebem muitas props e renderizam frequentemente
- **`useMemo`** para cálculos pesados
- **`useCallback`** para funções passadas como props
- Evitar re-renders desnecessários (verificar com React DevTools Profiler)
- **Virtualização** para listas longas (react-virtual, react-window)

```jsx
// ✅ Lazy loading de páginas
const LeadsPage = React.lazy(() => import('./modules/crm/pages/LeadsPage'));

// ✅ Virtualização para listas grandes
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## 10. Segurança no Frontend

- **Nunca confiar nos dados recebidos** — validar antes de usar
- Validar inputs com Zod, Yup ou React Hook Form
- Proteger rotas privadas com guard de autenticação
- Nunca armazenar tokens em `localStorage` — usar httpOnly cookies
- Sanitizar HTML antes de renderizar (`dangerouslySetInnerHTML` proibido sem sanitização)
- Variáveis de ambiente: apenas prefixo público (`NEXT_PUBLIC_`, `VITE_`) no frontend

---

## 11. Naming Conventions

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Arquivos de componente | PascalCase | `UserCard.jsx`, `LeadList.tsx` |
| Arquivos de hook | camelCase com `use` | `useLeads.js`, `useAuth.ts` |
| Arquivos de service | kebab-case com `.service` | `leads.service.js` |
| Arquivos de store | kebab-case com `.store` | `auth.store.ts` |
| Funções/variáveis | camelCase | `handleSubmit`, `isLoading` |
| Constantes | UPPER_SNAKE_CASE | `MAX_ITEMS_PER_PAGE` |
| Tipos/Interfaces | PascalCase | `LeadData`, `UserProps` |
| CSS classes | kebab-case | `lead-card`, `user-avatar` |

---

## 12. UI/UX Moderno (2026)

Tendências obrigatórias em produtos profissionais:

- **Animações suaves** com Framer Motion (transições de página, microinterações)
- **Loading skeleton** em vez de spinner simples
- **Optimistic updates** — atualizar UI antes da confirmação do servidor
- **Dark mode** suportado via CSS variables / Tailwind
- **Mobile-first** — sempre responsivo
- **Feedback visual** em toda ação do usuário (toast, loading state, confirmação)

---

## 13. Regras para Uso com IA

A IA NUNCA deve gerar código sem seguir a estrutura acima.

Para cada feature, sempre gerar:
1. `Component` — UI pura, sem lógica de negócio
2. `Hook` (`use*.js`) — lógica e estado
3. `Service` (`*.service.js`) — chamadas de API

Validar código gerado para:
- Lógica de negócio NÃO está no JSX
- API NÃO é chamada diretamente no componente
- Sem duplicação de código
- Componentes pequenos e focados

---

## 14. Testes Automatizados Obrigatórios

- Toda criação ou alteração de **componente, módulo, hook ou serviço** deve incluir testes automatizados no mesmo PR.
- Cobertura mínima obrigatória de **90%** para o escopo alterado.
- Cobertura global mínima do projeto deve permanecer em **90%** ou mais.
- O CI deve bloquear merge quando testes falharem ou quando a cobertura ficar abaixo do mínimo.

---

## 15. Documentação Obrigatória

- Toda criação ou alteração de **componente, módulo, hook, página ou serviço** deve incluir atualização de documentação no mesmo PR.
- Mudanças de fluxo de tela devem atualizar documentação funcional (README, guia de módulos ou docs de produto).
- Mudanças de contrato com backend devem atualizar exemplos de integração e payloads esperados.
- PR sem documentação consistente com o comportamento implementado deve ser bloqueado.

---

## Regra de Ouro

> **Componente limpo = UI pura. Lógica vai no hook. API vai no service.**
