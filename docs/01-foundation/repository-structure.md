# Estrutura do Repositorio

## Recomendacao

```text
/apps
  /web              -> Next.js
  /api              -> Fastify
  /admin            -> opcional; pode iniciar dentro do web
  /mobile           -> Expo no futuro

/packages
  /ui               -> componentes compartilhados
  /config           -> eslint, tsconfig, prettier, env schema
  /types            -> tipos compartilhados
  /validation       -> schemas Zod compartilhados
  /api-client       -> cliente tipado da API

/docs
  /01-foundation
  /modules

/infra
  /docker
  /github
  /scripts
```

## Estrutura Backend por Modulo

```text
/apps/api/src/modules
  /auth
  /profiles
  /search
  /leads
  /trust
  /reviews
  /chat
  /evidence
  /provider-dashboard
  /client-dashboard
  /admin
  /notifications
  /billing
  /analytics
  /cms
  /integrations
```

Cada modulo deve ter:

```text
/controllers
/services
/repositories
/entities
/dtos
/tests
```

## Estrutura Web por Dominio

```text
/apps/web/src
  /app
  /features
  /components
  /lib
  /services
  /stores
  /hooks
```

`features` deve refletir os modulos do produto.