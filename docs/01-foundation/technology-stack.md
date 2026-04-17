# Tecnologia Recomendada

## Decisao

Usar Next.js como stack web principal.

## Motivo

- produto depende de SEO local para paginas de cidade, bairro e categoria
- precisa de paginas publicas performaticas e indexaveis
- precisa de area autenticada para cliente, negocio e admin
- React continua sendo a base compartilhada com o app mobile futuro

## Stack Web

- framework: Next.js 16
- linguagem: TypeScript estrito
- UI: Tailwind CSS v4
- componentes: shadcn/ui como base, customizados com identidade propria
- formularios: React Hook Form + Zod
- dados no cliente: TanStack Query
- estado global leve: Zustand
- testes de componente: Vitest + Testing Library
- E2E: Playwright

## Stack Mobile Futuro

- framework: Expo + React Native
- compartilhamento: tokens de design, types, contratos e validacoes

## Stack Backend

- runtime: Node.js LTS
- framework: Fastify
- validacao: Zod
- ORM: Prisma
- autenticacao: JWT de curta duracao + refresh token em cookie httpOnly no web
- filas: BullMQ
- cache e rate limit distribuido: Redis
- observabilidade: OpenTelemetry + logs estruturados

## Banco e Infra

- banco principal: PostgreSQL
- storage: S3 ou Cloudflare R2
- CDN: Cloudflare
- monitoramento: Sentry + metricas de aplicacao
- CI/CD: GitHub Actions

## O que nao construir agora

- microservicos
- multi-tenant real
- GraphQL
- app mobile nativo no primeiro ciclo
- complexidade de event sourcing

## Recomendacao de arquitetura

Comecar com monorepo e modular monolith.