# Modulo 15 - Growth CMS

## Status: CONCLUIDA

## Objetivo

Gerir paginas publicas, conteudo programatico, SEO local e campanhas de aquisicao para maximizar aquisicao organica via conteudo estruturado por cidade e categoria.

## Atores

- Admin: CRUD de paginas CMS, configuracao de SEO, visualizacao de atribuicao de campanha
- Visitante anonimo: acessa paginas de cidade, categoria e landing pages publicas
- Cliente/Business: recebe atribuicao UTM ao criar conta a partir de pagina de campanha

## Fluxos principais

1. Admin cria pagina CMS com slug, titulo, secoes de conteudo e metadados SEO
2. Visitante acessa `/cities/:slug` e ve negocios verificados da cidade com SEO otimizado
3. Visitante acessa `/categories/:slug` e ve negocios da categoria com SEO otimizado
4. Visitante acessa `/p/:slug` e ve pagina CMS com conteudo gerenciavel
5. Lead criado a partir de pagina com UTM recebe atribuicao de campanha registrada

## Front

- `/cities/[slug]` - pagina de cidade com lista de negocios verificados e SEO local
- `/categories/[slug]` - pagina de categoria com lista de negocios e SEO da categoria
- `/p/[slug]` - pagina CMS generica (landing pages, conteudo editorial)
- `/admin/pages` - listagem e gestao de paginas CMS pelo admin
- componente reutilizavel `CmsPageRenderer` para renderizar secoes de conteudo

## Back

- CMS headless basico (CRUD de paginas e secoes)
- SEO metadados e slugs programaticos por cidade e categoria
- tracking de campanha e UTM via `campaign_attribution`
- package `@platform/cms` com toda a logica de dominio

## App

- fora do MVP; somente conteudo institucional quando necessario

## Banco

- pages: slug, titulo, tipo (CMS/CITY/CATEGORY), status, author, SEO inline
- page_sections: bloco de conteudo vinculado a page (titulo, corpo, ordem, tipo)
- seo_metadata: metadados SEO reutilizaveis por slug e entidade (title, description, og_image, canonical)
- campaign_attribution: registro de origem UTM vinculado a user no cadastro

## Endpoints

- GET /api/v1/pages/:slug (publico)
- GET /api/v1/seo/cities/:slug (publico)
- GET /api/v1/seo/categories/:slug (publico)
- GET /api/v1/admin/pages (admin)
- POST /api/v1/admin/pages (admin)
- PATCH /api/v1/admin/pages/:id (admin)
- DELETE /api/v1/admin/pages/:id (admin)

## Testes

- integracao: GET /pages/:slug encontrado e nao encontrado
- integracao: CRUD admin de paginas
- integracao: SEO cidade e categoria
- componente: CmsPageRenderer com secoes e estado vazio

## Dependencias

- modulo 02 (profiles-catalog): paginas de cidade e categoria listam BusinessProfile verificados
- modulo 03 (search-discovery): slug de cidade e categoria referencia categorias e localizacoes existentes
- modulo 04 (leads): lead criado a partir de pagina com UTM recebe atribuicao

## Fora de escopo

- integracao com CMS externo (Contentful, Sanity, Strapi)
- editor WYSIWYG no admin (edicao via JSON de secoes nesta fase)
- A/B testing de landing pages
- sistema de blog com comentarios