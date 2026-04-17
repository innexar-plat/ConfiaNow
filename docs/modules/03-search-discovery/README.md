# Modulo 03 - Search Discovery

## Status

- pronto para handoff com pendencias aceitas

## Fora de escopo nesta primeira entrega real

- busca por bairro e geolocalizacao real
- filtro por selo e reputacao consolidada
- ranking por leads respondidos e tempo medio de resposta real
- destaque patrocinado e boost pago
- paginação cursor-based com observabilidade de buscas pesadas

## Atores envolvidos

- visitante publico
- cliente autenticado em descoberta inicial
- negocio publicado que deseja ser encontrado

## Fluxos principais desta fase

- visitante abre a home e descobre negocios publicados com filtros simples
- visitante filtra por cidade e categoria
- visitante acessa pagina publica de categoria
- visitante recebe sugestoes simples de cidade, categoria e negocio
- visitante visualiza listas publicas de categorias e cidades disponiveis

## Objetivo

Permitir descoberta publica por categoria, cidade, bairro, selo e reputacao.

## Front

- home de busca
- pagina de categoria
- filtros laterais
- cards de negocio
- ordenacao e paginação

## Back

- motor de busca filtrada
- sugestoes e autosuggest
- ranking por distancia, reputacao e responsividade
- pagina de categorias e regioes em alta
- primeira versao real com ranking pragmatico por completude, publicacao e densidade do perfil

## App

- busca com geolocalizacao
- filtros mobile-first
- atalhos para categorias recentes

## Banco

- search_snapshots
- categories
- cities
- business_search_index

## Modelo de dados desta fase

- `categories`: catalogo normalizado de categorias publicas habilitadas
- `cities`: catalogo normalizado de cidades publicas habilitadas
- `business_search_index`: indice denormalizado de descoberta a partir do perfil publicado
- `search_snapshots`: fotografia simples de buscas e filtros para alimentar trending inicial

## Endpoints

- GET /api/v1/businesses
- GET /api/v1/search/suggestions
- GET /api/v1/categories
- GET /api/v1/categories/:slug
- GET /api/v1/cities
- GET /api/v1/discovery/trending
- GET /api/v1/discovery/top-rated

## Autenticacao e autorizacao por endpoint

- `GET /api/v1/businesses`: publico
- `GET /api/v1/search/suggestions`: publico
- `GET /api/v1/categories`: publico
- `GET /api/v1/categories/:slug`: publico
- `GET /api/v1/cities`: publico
- `GET /api/v1/discovery/trending`: publico
- `GET /api/v1/discovery/top-rated`: publico

## Regras de negocio desta fase

- apenas perfis publicados entram na descoberta publica
- cidade e categoria devem refletir o estado publicado mais recente do negocio
- busca textual deve considerar nome do negocio, headline, descricao e categorias
- resultados retornam apenas dados necessarios para listagem publica
- enquanto modulos 05 e 06 nao existirem, score inicial de descoberta nao depende de reputacao real

## Testes

- unitario de score de ranking
- integracao de filtros e ordenacao
- componente de busca e cards
- E2E de busca publica com filtro por cidade e selo

## Estrategia de implementacao desta fase

- ampliar schema Prisma com tabelas de discovery e indice publico
- criar camada compartilhada `@platform/discovery` para filtros, score e sugestoes
- expor endpoints publicos de busca, categorias, cidades e discovery inicial
- transformar a home em pagina funcional de descoberta e adicionar pagina de categoria

## Implementado nesta fase

- schema Prisma ampliado com `categories`, `cities`, `business_search_index` e `search_snapshots`
- migration aplicada: `20260417165105_add_search_discovery`
- pacote compartilhado `@platform/discovery` com score inicial, sincronizacao do indice, filtros, sugestoes e listas publicas
- sincronizacao automatica do indice de busca sempre que perfil, servicos ou portfolio sao alterados
- endpoints publicos reais de busca, sugestoes, categorias, cidades, trending e top-rated
- home convertida em pagina real de discovery com filtros por categoria e cidade
- pagina publica `categories/[slug]` para descoberta por categoria
- testes unitarios de score e testes de integracao das rotas publicas de discovery

## Revisao de completude desta fase

- UI web: completa para a primeira fatia real da descoberta publica
- API: completa para a primeira fatia real da descoberta publica
- banco: completo para a primeira fatia real da descoberta publica
- app mobile: adiado com justificativa; sem implementacao mobile nesta fase
- componentes compartilhados: completo para esta fase com `@platform/discovery`
- estados de erro, loading e vazio: parcial-alta
- autorizacao e seguranca: completa para endpoints publicos e exclusao de perfis nao publicados
- testes unitarios e integracao: completos para a primeira fatia
- testes de componente e E2E: pendentes aceitos
- documentacao e handoff: completos nesta entrega

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