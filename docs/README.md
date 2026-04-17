# Documentacao do Projeto

Esta pasta transforma o blueprint em especificacao de execucao.

## Objetivo

- definir stack tecnica
- definir estrutura de repositorio
- detalhar cada modulo com front, back, app, banco, API e testes
- preparar a base para implementacao web em React e app mobile em etapa posterior

## Decisao Principal

Para este produto, a recomendacao inicial e:

- web: Next.js com React e TypeScript
- app mobile futuro: Expo + React Native
- backend: Fastify + TypeScript + Zod + Prisma
- banco: PostgreSQL

Vite continua valido para prototipos ou ferramentas internas, mas nao e a melhor escolha como stack principal do produto porque o projeto depende de SEO, paginas publicas por cidade/categoria e renderizacao hibrida.

## Estrutura

- [technology-stack](01-foundation/technology-stack.md)
- [repository-structure](01-foundation/repository-structure.md)
- [api-standards](01-foundation/api-standards.md)
- [testing-strategy](01-foundation/testing-strategy.md)
- [construction-method](01-foundation/construction-method.md)
- [module-delivery-checklist](01-foundation/module-delivery-checklist.md)
- [module-handoff-template](01-foundation/module-handoff-template.md)
- [handoffs](handoffs)
- [modules](modules)

## Convencoes

- toda feature nova precisa nascer com documentacao do modulo, contrato de API, modelo de dados e estrategia de testes
- endpoints publicos devem ser versionados em `/api/v1`
- toda listagem deve ser paginada
- todo modulo deve ter pelo menos testes unitarios, integracao de API e fluxo critico de interface
- o time e a IA devem trabalhar um modulo por vez, fechando contexto, contrato, implementacao e validacao antes de abrir o proximo