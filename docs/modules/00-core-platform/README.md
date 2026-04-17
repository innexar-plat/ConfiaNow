# Modulo 00 - Core Platform

## Status

- pronto para handoff com pendencias aceitas

## Fora de escopo nesta fase

- autenticacao real com access token e refresh token
- persistencia real com Prisma e PostgreSQL
- feature flags persistidas por ambiente
- app mobile implementado
- testes de componente e fluxo E2E automatizados

## Dependencias para os proximos modulos

- branding central em `packages/config`
- pacote UI inicial em `packages/ui`
- endpoints base do core em `/api/v1`
- sessao demo por cookie `httpOnly` para destravar guardas iniciais do web

## Objetivo

Sustentar autenticacao, configuracoes globais, auditoria, permissao e feature flags.

## Front

- guards de rota
- leitura de configuracao publica
- tratamento global de erro
- consentimento de termos e privacidade
- tela inicial com branding configuravel
- pagina demo de signin
- rota protegida demo para bootstrap de sessao
- componentes compartilhados base para superficies, cards e badges simples
- area administrativa demo protegida para settings iniciais

## Back

- RBAC por papel e permissao
- configuracoes publicas e privadas
- auditoria de acoes criticas
- health checks e readiness
- contexto de autenticacao demo por header para destravar a fundacao do modulo

## App

- bootstrap de sessao
- config publica e feature flags
- tratamento de refresh token e expiracao

## Banco

- users
- roles
- permissions
- user_roles
- settings
- feature_flags
- audit_logs

## Endpoints

- GET /api/v1/health/live
- GET /api/v1/health/ready
- GET /api/v1/config/public
- GET /api/v1/me
- GET /api/v1/me/permissions
- GET /api/v1/admin/settings
- PATCH /api/v1/admin/settings
- GET /api/v1/admin/audit-logs

## Implementado nesta fase

- home web conectada ao arquivo central de configuracao da plataforma
- bootstrap inicial do core com configuracao publica e branding desacoplado do nome definitivo
- endpoints base do core com estado mockado para sessao, permissoes, settings e audit logs
- rota protegida demo no web para provar o primeiro guard de acesso
- login demo por cookie httpOnly via route handler
- banner inicial de consentimento para preparar a camada de privacidade do core
- pacote `@platform/ui` iniciado para componentes compartilhados simples
- testes automatizados da API cobrindo configuracao publica, autenticacao basica e endpoints administrativos

## Testes

- unitario de regras de permissao
- integracao de acesso por papel
- componente para guards e bootstrap de sessao
- E2E de rota protegida
- testes de API implementados para endpoints base do core

## Revisao final de completude

- UI web completa: parcial, com home, signin demo, dashboard protegido, consent banner e area admin demo entregues; faltam estados dedicados de erro/loading/vazio em telas conectadas a dados reais
- API completa: parcial, com health, config publica, contexto de sessao, permissoes, settings e audit logs mockados; faltam persistencia real, DTOs mais completos e integracao com autenticacao real
- banco completo: adiado nesta fase; modelo alvo definido, mas sem schema Prisma, migracoes ou tabelas reais ainda
- app completo ou adiado com justificativa: adiado; o modulo registrou impacto esperado no app, mas a execucao mobile fica para etapa posterior do produto
- testes minimos completos: parcial; testes de API existem e passam, mas testes de componente e E2E foram mantidos como pendencia aceita desta fase
- documentacao completa: sim para a fase entregue, incluindo README do modulo e handoff formal

## Pendencias aceitas

- conectar web admin aos endpoints reais de settings e audit logs
- substituir sessao demo por autenticacao real no modulo 01
- implementar schema Prisma e persistencia das entidades do core
- adicionar testes de componente do web e E2E minimo do fluxo protegido