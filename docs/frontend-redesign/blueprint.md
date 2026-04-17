# Blueprint — Frontend Redesign ConfiaNow

## Objetivo

Substituir o frontend provisório (cores marrons, serif, sem animações) pelo design system ConfiaNow completo:
verde confiança, Inter, animações suaves, componentes reutilizáveis, painéis organizados.

---

## Referências de Design

| Arquivo | Conteúdo |
|---------|----------|
| `confia_brand_identity.html` | Paleta, tipografia, animações, componentes visuais |
| `confianow_paginas_publicas.html` | Copy e estrutura das 6 páginas públicas + 3 estados de usuário |

---

## Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--green-primary` | `#1D9E75` | CTA, links ativos, ícones de verificação |
| `--green-anchor` | `#085041` | Hover, texto emphasis, headings de destaque |
| `--green-surface` | `#E1F5EE` | Backgrounds leves, tags verificado |
| `--green-border` | `#9FE1CB` | Bordas de cards ativos |
| `--amber-primary` | `#FAC775` | Selo em destaque, badges CTA |
| `--amber-surface` | `#FAEEDA` | Backgrounds de avisos |
| `--amber-text` | `#854F0B` | Texto sobre amber |
| `--blue-surface` | `#E6F1FB` | Estado informativo |
| `--blue-text` | `#185FA5` | Texto informativo |
| `--red-primary` | `#E24B4A` | Erros, perigo |
| `--red-surface` | `#FCEBEB` | Backgrounds de erro |
| `--ink` | `#1A2B3C` | Texto principal |
| `--muted` | `#556070` | Texto secundário |
| `--bg` | `#F5F7F4` | Fundo global |
| `--surface` | `#FFFFFF` | Cards e painéis |

---

## Tipografia

- **Família**: Inter (Google Fonts) — sem serifas, sem itálico
- **Display/Hero**: 500 weight, tight line-height (1.2–1.3)
- **Corpo**: 400 weight, 1.6–1.7 line-height
- **Label/Eyebrow**: 11–12px, uppercase, letter-spacing 0.08em

---

## Animações e Transições

| Nome | Descrição | Uso |
|------|-----------|-----|
| `fadeUp` | opacity 0→1 + translateY 16→0, 400ms ease-out | Entrada de seções, stagger 60ms |
| `sealPop` | scale 0.6→1.08→1, bounce spring | Selo verificado |
| `shimmer` | gradient sweep horizontal | Skeleton loaders |
| `pulse` | ring de sombra verde | Ícone de verificação ativo |
| `float` | translateY 0→-6→0, 3s | Elemento flutuante decorativo |
| `slideIn` | translateX -16→0 | Entradas de lista |
| `slideUp` | translateY 20→0 | Toast, modais |

**Regra de ouro**: movimento reforça confiança. Nada de parallax, glitch ou flash.

---

## Curvas de Easing

| Variável | Valor | Uso |
|----------|-------|-----|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Botões CTA, pop de selos |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Progress bars, fades |
| `--transition-fast` | `150ms ease-smooth` | Hover links |
| `--transition-base` | `200ms ease-smooth` | Hover cards, inputs |
| `--transition-spring` | `300ms ease-spring` | CTAs, badges |

---

## Módulos de Execução

### FE-01 — Design System Foundation
**Escopo**: globals.css, tokens, animações, classes utilitárias
**Entrega**: CSS custom properties + @keyframes + classes (btn, card, form, nav, tag)

### FE-02 — Biblioteca de Componentes UI
**Escopo**: `packages/ui/src/index.tsx` — componentes RSC-compatíveis
**Componentes**:
- `Surface` — card branco com sombra suave
- `Eyebrow` — label verde uppercase
- `InfoCard` — card com hover lift
- `Pill` / `Tag` — múltiplas variantes de cor
- `Badge` — selo verificado com animação
- `Avatar` — círculo com iniciais
- `StatCard` — número grande + label
- `PageHeader` — cabeçalho de página consistente
- `SectionLabel` — título de seção uppercase
- `EmptyState` — estado vazio com ícone
- `AlertBanner` — faixa de alerta/info

### FE-03 — Layout e Fonte
**Escopo**: `layout.tsx` — Inter via Google Fonts, meta tags
**Entrega**: HTML base com fonte e head corretos

### FE-04 — NavBar + DashboardShell
**Escopo**: `components/nav-bar.tsx`, `components/dashboard-shell.tsx`
**NavBar**: Logo, links públicos, botão Entrar/Cadastrar, indicador de usuário logado
**DashboardShell**: sidebar com ícones e links, área de conteúdo, header com breadcrumb

### FE-05 — Homepage Pública
**Escopo**: `app/page.tsx`
**Seções**:
1. Hero com busca (categoria + cidade + botão)
2. Tags de categorias populares
3. Grid de resultados com cards de prestador
4. Sidebar: Categorias em alta, Melhor avaliados, Como acessar

### FE-06 — Páginas de Autenticação
**Escopo**: signin, register/client, register/business
**Visual**: formulário centralizado, card lateral com instruções/benefícios

### FE-07 — Dashboard Cliente + Prestador
**Escopo**: `app/dashboard/page.tsx`
**Shell**: sidebar com links de navegação do painel
**Cliente**: stats row, favoritos, reviews pendentes, histórico, denúncias
**Prestador**: stats row, badge de confiança, leads pendentes, performance, recomendações

### FE-08 — Painel Admin
**Escopo**: `app/admin/layout.tsx` + todas as páginas admin
**Layout**: sidebar com seções (Moderação, Analytics, CMS, Config, Integrações)
**Dashboard admin**: métricas de plataforma, ações pendentes, acesso rápido

---

## Regras de Implementação

1. **React Server Components** por padrão — animações via CSS classes, não JS
2. **CSS classes globais** para interatividade (hover, focus) — não inline handlers
3. **Inline styles** apenas para valores dinâmicos ou únicos por página
4. **Sem Tailwind** — usar CSS custom properties + classes do globals.css
5. **Consistência**: todo card usa `Surface` ou `InfoCard`, todo header usa `PageHeader`
6. **Acessibilidade**: semântica HTML correta, ARIA labels nos ícones

---

## Status de Execução

| Módulo | Status |
|--------|--------|
| FE-01 Design System | ✅ Executado |
| FE-02 UI Components | ✅ Executado |
| FE-03 Layout + Font | ✅ Executado |
| FE-04 NavBar + Shell | ✅ Executado |
| FE-05 Homepage | ✅ Executado |
| FE-06 Auth Pages | ✅ Executado |
| FE-07 Dashboards | ✅ Executado |
| FE-08 Admin Panel | ✅ Executado |
