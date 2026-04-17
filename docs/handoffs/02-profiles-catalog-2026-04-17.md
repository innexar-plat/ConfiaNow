# Modulo

- nome: 02-profiles-catalog
- status: pronto para abrir o modulo 03 com pendencias aceitas
- data: 2026-04-17

## Entregas realizadas

- front: pagina publica de negocio por slug, painel autenticado de negocio para editar perfil, servicos e portfolio, e rotas server-first para mutacoes do catalogo
- back: endpoints reais para leitura publica do negocio e CRUD autenticado de perfil, servicos e portfolio com ownership por conta `business`
- app: impacto documentado; sem implementacao mobile nesta fase
- banco: Prisma + PostgreSQL ampliados com `business_profiles`, `business_services`, `portfolio_items` e `business_categories`
- testes: unitario de normalizacao de slug e integracoes reais do fluxo de publicacao e CRUD do catalogo

## Revisao final de completude

- UI web completa: sim para a primeira entrega real do modulo
- API completa: sim para a primeira entrega real do modulo
- banco completo: sim para a primeira entrega real do modulo
- app completo ou adiado com justificativa: adiado com justificativa
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/businesses/:slug
- GET /api/v1/businesses/:id/services
- GET /api/v1/businesses/:id/portfolio
- GET /api/v1/me/business-profile
- PATCH /api/v1/me/business-profile
- POST /api/v1/me/services
- PATCH /api/v1/me/services/:id
- DELETE /api/v1/me/services/:id
- POST /api/v1/me/portfolio-items
- PATCH /api/v1/me/portfolio-items/:id
- DELETE /api/v1/me/portfolio-items/:id

## Entidades e tabelas

- business_profiles: identidade publica do negocio, slug, contatos e status de publicacao
- business_services: lista de servicos ofertados pelo negocio com ordem de exibicao
- portfolio_items: portfolio publico do negocio com titulo, descricao e referencia de midia
- business_categories: categorias comerciais atreladas ao perfil publicado

## Componentes reutilizaveis criados

- `@platform/profiles`: regras compartilhadas de slug, ownership, leitura publica e CRUD autenticado do catalogo
- pagina publica por slug: base para discovery, leads, reputacao e SEO dinamico
- painel `dashboard/business-profile`: base para futuras etapas do dashboard do fornecedor

## Regras de negocio ativas

- apenas contas com papel `business` podem editar perfil, servicos e portfolio
- cada negocio possui slug publica unica
- leitura publica por slug so retorna perfis publicados
- servicos e portfolio respeitam ownership do negocio autenticado
- perfil publico pode existir e funcionar sem leads, reviews ou ranking

## Dependencias resolvidas

- catalogo publico do negocio: resolvido com slug, perfil publicado e pagina Next.js server-rendered
- persistencia real do catalogo: resolvido com novas tabelas Prisma em PostgreSQL
- reutilizacao entre API e web: resolvido com pacote compartilhado `@platform/profiles`
- seed de negocio operacional: resolvido para destravar testes e validacao manual do catalogo

## Pendencias aceitas

- item: adicionar upload binario real e galeria visual de portfolio
- impacto: medio
- prioridade: alta

- item: adicionar testes de componente do web e E2E do fluxo de publicacao
- impacto: medio
- prioridade: media

- item: adicionar moderacao editorial e workflow de publicacao assistida
- impacto: medio
- prioridade: media

- item: enriquecer SEO com metadata dinamica e estrutura local por cidade/categoria
- impacto: medio
- prioridade: media

## Riscos remanescentes

- risco: portfolio ainda armazena referencia textual de midia, sem storage binario nem transformacoes de imagem
- mitigacao: integrar storage S3/R2 e pipeline de imagem antes de abrir operacao real

- risco: estados de loading e erro do painel ainda sao basicos e baseados em redirect
- mitigacao: evoluir UX do painel quando o dashboard do fornecedor avancar

- risco: seed do negocio publica dados exemplificativos que podem confundir validacao manual
- mitigacao: manter ambiente local separado e substituir seed por onboarding guiado quando discovery estiver pronto

## O que o proximo modulo pode assumir como pronto

- existe perfil publico de negocio acessivel por slug
- existe CRUD autenticado de perfil, servicos e portfolio para contas `business`
- existe ownership validado no backend para recursos do catalogo
- existe pacote compartilhado reutilizavel para leitura publica e leitura do proprio negocio
- existe seed local de negocio publicado para testes e validacao manual

## Leitura obrigatoria para o proximo modulo

- `blueprint-plataforma-local.md`
- `docs/01-foundation/construction-method.md`
- `docs/01-foundation/module-delivery-checklist.md`
- `docs/01-foundation/module-handoff-template.md`
- `docs/modules/03-search-discovery/README.md`
- `docs/handoffs/02-profiles-catalog-2026-04-17.md`