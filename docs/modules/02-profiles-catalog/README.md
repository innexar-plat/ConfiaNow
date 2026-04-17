# Modulo 02 - Profiles Catalog

## Status

- pronto para handoff com pendencias aceitas

## Fora de escopo nesta primeira entrega real

- busca global e ranking do catalogo
- filtros por cidade, categoria e proximidade
- SEO programatico por cidade e categoria em larga escala
- upload binario real de imagens de portfolio
- moderacao editorial de perfil

## Atores envolvidos

- negocio autenticado
- visitante publico
- administrador para leitura e validacao futura

## Fluxos principais desta fase

- negocio autenticado edita seu perfil comercial
- negocio autenticado cadastra, atualiza e remove servicos
- negocio autenticado cadastra, atualiza e remove itens de portfolio
- visitante acessa a pagina publica do negocio por slug
- visitante visualiza servicos, portfolio e CTA de contato

## Objetivo

Publicar perfis de negocios, servicos, portfolio e informacoes comerciais.

## Front

- pagina publica do negocio
- blocos de portfolio
- lista de servicos
- CTA de contato
- pagina de edicao do perfil no painel

## Back

- CRUD de perfil do negocio
- CRUD de servicos
- CRUD de portfolio
- slug publica e SEO basico
- persistencia real com Prisma e PostgreSQL
- relacao direta com conta de negocio autenticada do modulo 01

## App

- visualizacao do perfil
- edicao rapida de descricao, horario e portfolio

## Banco

- businesses
- business_profiles
- business_services
- portfolio_items
- business_categories

## Modelo de dados desta fase

- `business_profiles`: identidade publica do negocio, slug, resumo, descricao, contatos comerciais, horario e flags de publicacao
- `business_services`: lista de servicos ofertados pelo negocio com descricao curta e ordem de exibicao
- `portfolio_items`: vitrine de trabalhos com titulo, descricao e referencia de imagem/arquivo
- `business_categories`: categorias comerciais vinculadas ao perfil do negocio

## Endpoints

- GET /api/v1/businesses/:slug
- GET /api/v1/businesses/:id/services
- GET /api/v1/businesses/:id/portfolio
- PATCH /api/v1/me/business-profile
- POST /api/v1/me/services
- PATCH /api/v1/me/services/:id
- DELETE /api/v1/me/services/:id
- POST /api/v1/me/portfolio-items
- PATCH /api/v1/me/portfolio-items/:id
- DELETE /api/v1/me/portfolio-items/:id

## Autenticacao e autorizacao por endpoint

- `GET /api/v1/businesses/:slug`: publico
- `GET /api/v1/businesses/:id/services`: publico
- `GET /api/v1/businesses/:id/portfolio`: publico
- `PATCH /api/v1/me/business-profile`: negocio autenticado
- `POST /api/v1/me/services`: negocio autenticado
- `PATCH /api/v1/me/services/:id`: negocio autenticado dono do recurso
- `DELETE /api/v1/me/services/:id`: negocio autenticado dono do recurso
- `POST /api/v1/me/portfolio-items`: negocio autenticado
- `PATCH /api/v1/me/portfolio-items/:id`: negocio autenticado dono do recurso
- `DELETE /api/v1/me/portfolio-items/:id`: negocio autenticado dono do recurso

## Regras de negocio desta fase

- apenas contas com papel `business` podem editar perfil, servicos e portfolio
- todo negocio deve ter slug unica e publica
- perfis publicos exibem apenas conteudo marcado como publicado
- servicos e portfolio devem respeitar ownership do negocio autenticado
- a pagina publica deve funcionar mesmo antes de existirem leads e reviews

## Testes

- unitario de normalizacao de slug e consistencia do perfil
- integracao de CRUD de servicos e portfolio
- componente de pagina publica do negocio
- E2E de editar perfil e refletir no publico

## Estrategia de implementacao desta fase

- ampliar schema Prisma com tabelas de catalogo de negocio
- criar camada compartilhada `@platform/profiles` para regras e acesso ao catalogo
- expor API real no Fastify para perfil, servicos e portfolio
- criar pagina publica por slug no Next.js e tela inicial de edicao do perfil no painel autenticado

## Implementado nesta fase

- schema Prisma ampliado com `business_profiles`, `business_services`, `portfolio_items` e `business_categories`
- seed operacional de negocio com perfil publicado, categorias, servicos e portfolio basicos
- pacote compartilhado `@platform/profiles` com regras de slug, ownership e CRUD do catalogo
- endpoints reais de leitura publica e edicao autenticada no Fastify
- pagina publica `businesses/[slug]` no Next.js
- painel `dashboard/business-profile` com formularios server-first para perfil, servicos e portfolio
- testes unitarios de slug e testes de integracao do fluxo principal do catalogo

## Revisao de completude desta fase

- UI web: completa para a primeira fatia do perfil publico e painel do negocio
- API: completa para a primeira fatia do catalogo
- banco: completo para a primeira fatia do catalogo
- app mobile: adiado com justificativa; sem implementacao mobile nesta fase
- componentes compartilhados: completo para esta fase com `@platform/profiles`
- estados de erro, loading e vazio: parcial-alta
- autorizacao e seguranca: completa para ownership e acesso publico controlado
- testes unitarios e integracao: completos para a primeira fatia
- testes de componente e E2E: pendentes aceitos
- documentacao e handoff: completos nesta entrega

## Pendencias aceitas

- item: adicionar upload binario real e galeria visual de portfolio
- impacto: medio
- prioridade: alta

- item: criar testes de componente do web e E2E do fluxo de publicacao
- impacto: medio
- prioridade: media

- item: adicionar moderacao editorial e workflow de publicacao assistida
- impacto: medio
- prioridade: media

- item: enriquecer SEO com metadata dinamica e estrutura local por cidade/categoria
- impacto: medio
- prioridade: media