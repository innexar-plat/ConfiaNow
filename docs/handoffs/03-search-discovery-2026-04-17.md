# Modulo

- nome: 03-search-discovery
- status: pronto para abrir o modulo 04 com pendencias aceitas
- data: 2026-04-17

## Entregas realizadas

- front: home publica transformada em busca funcional, filtros por categoria e cidade, cards de negocio e pagina publica de categoria
- back: endpoints publicos reais para busca, sugestoes, categorias, cidades, trending e top-rated
- app: impacto documentado; sem implementacao mobile nesta fase
- banco: Prisma + PostgreSQL ampliados com `categories`, `cities`, `business_search_index` e `search_snapshots`
- testes: unitario de score de ranking e integracoes reais de discovery publico, filtros e endpoints auxiliares

## Revisao final de completude

- UI web completa: sim para a primeira entrega real do modulo
- API completa: sim para a primeira entrega real do modulo
- banco completo: sim para a primeira entrega real do modulo
- app completo ou adiado com justificativa: adiado com justificativa
- testes minimos completos: sim
- documentacao completa: sim

## Endpoints entregues

- GET /api/v1/businesses
- GET /api/v1/search/suggestions
- GET /api/v1/categories
- GET /api/v1/categories/:slug
- GET /api/v1/cities
- GET /api/v1/discovery/trending
- GET /api/v1/discovery/top-rated

## Entidades e tabelas

- categories: catalogo normalizado de categorias publicas habilitadas para discovery
- cities: catalogo normalizado de cidades publicas habilitadas para discovery
- business_search_index: indice denormalizado sincronizado a partir do perfil publicado
- search_snapshots: fotografia simples das buscas publicas para apoiar trending inicial

## Componentes reutilizaveis criados

- `@platform/discovery`: regras compartilhadas de score, busca, sugestoes, categorias e cidades
- home publica de discovery: base para leads, growth e SEO futuro
- pagina `categories/[slug]`: base para expansao por categoria e conteudo programatico

## Regras de negocio ativas

- apenas perfis publicados entram no discovery publico
- o indice de busca precisa refletir o estado mais recente do perfil publicado
- busca textual considera nome, headline, descricao, cidade, estado e categorias
- ranking inicial prioriza publicacao, verificacao e completude do perfil
- resultados publicos retornam apenas dados necessarios para descoberta

## Dependencias resolvidas

- descoberta publica em cima do catalogo do modulo 02: resolvida com indice denormalizado sincronizado
- filtros publicos de cidade e categoria: resolvidos com tabelas dedicadas e sincronizacao de referencia
- home funcional de busca: resolvida diretamente no Next.js com pacote compartilhado
- migration obrigatoria do modulo: resolvida com `20260417165105_add_search_discovery`

## Pendencias aceitas

- item: adicionar geolocalizacao real, bairro e proximidade
- impacto: medio
- prioridade: alta

- item: integrar reputacao e selo reais no ranking quando os modulos 05 e 06 estiverem prontos
- impacto: medio
- prioridade: alta

- item: adicionar testes de componente do web e E2E da busca publica
- impacto: medio
- prioridade: media

- item: evoluir suggestions para autosuggest mais rico com debounce e analytics dedicados
- impacto: baixo
- prioridade: media

## Riscos remanescentes

- risco: ranking ainda nao usa reputacao real, distancia real ou responsividade operacional
- mitigacao: conectar os modulos 05, 06 e 14 ao score quando estiverem entregues

- risco: snapshots de busca ainda sao simples e podem crescer rapido sem politica de retencao
- mitigacao: adicionar retencao e agregacao operacional em modulo de analytics

- risco: a home usa renderizacao server-first sem UX refinada de autosuggest em tempo real
- mitigacao: evoluir interacao quando discovery avancar para componente dedicado

## O que o proximo modulo pode assumir como pronto

- existe busca publica funcional sobre negocios publicados
- existe filtro publico por cidade e categoria
- existe pagina publica por categoria pronta para aprofundar acquisition e SEO
- existe indice denormalizado sincronizado com alteracoes do catalogo
- existe base de categories, cities e snapshots para discovery inicial

## Leitura obrigatoria para o proximo modulo

- `blueprint-plataforma-local.md`
- `docs/01-foundation/construction-method.md`
- `docs/01-foundation/module-delivery-checklist.md`
- `docs/01-foundation/module-handoff-template.md`
- `docs/modules/04-leads-contact-requests/README.md`
- `docs/handoffs/03-search-discovery-2026-04-17.md`