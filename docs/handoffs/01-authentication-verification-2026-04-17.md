# Modulo

- nome: 01-authentication-verification
- status: pronto para abrir o modulo 02 com pendencias aceitas
- data: 2026-04-17

## Entregas realizadas

- front: signin real, cadastro de cliente, cadastro de negocio, logout, tela de verificacao com OTP e documentos, dashboard lendo sessao autenticada real e fallback demo mantido apenas para transicao
- back: cadastro real, login, refresh, logout, OTP de email e telefone, upload de documentos, consulta de status de verificacao e decisoes administrativas de approve/request-more-info/reject
- app: impacto documentado; sem implementacao mobile nesta fase
- banco: Prisma + PostgreSQL com tabelas reais para users, sessions, verification_requests, verification_documents, otp_codes, business_owners, platform_settings e audit_logs
- testes: unitarios de CPF/CNPJ e integracoes reais de cadastro, OTP, documentos, status e aprovacao administrativa

## Revisao final de completude

- UI web completa: parcial
- API completa: sim para a primeira entrega real do modulo
- banco completo: parcial
- app completo ou adiado com justificativa: adiado com justificativa
- testes minimos completos: parcial-alta
- documentacao completa: sim

## Endpoints entregues

- POST /api/v1/auth/register/client
- POST /api/v1/auth/register/business
- POST /api/v1/auth/sessions
- DELETE /api/v1/auth/sessions/current
- POST /api/v1/auth/refresh
- POST /api/v1/auth/verify-email/request
- POST /api/v1/auth/verify-email/confirm
- POST /api/v1/auth/verify-phone/request
- POST /api/v1/auth/verify-phone/confirm
- POST /api/v1/auth/documents
- GET /api/v1/auth/verification-status
- POST /api/v1/admin/verifications/:id/approve
- POST /api/v1/admin/verifications/:id/request-more-info
- POST /api/v1/admin/verifications/:id/reject

## Entidades e tabelas

- users: identidade principal, papel, email, telefone, hash de senha e status de verificacao
- sessions: refresh tokens persistidos, expiracao e revogacao
- verification_requests: esteira de verificacao por usuario
- verification_documents: documentos enviados para revisao
- otp_codes: codigos OTP por canal com expiracao e consumo
- business_owners: responsavel legal vinculado ao negocio
- platform_settings: configuracao base persistida do core
- audit_logs: rastreabilidade de autenticacao, verificacao e mudancas criticas

## Componentes reutilizaveis criados

- `packages/database`: client Prisma compartilhado e bootstrap de banco
- `packages/auth`: regras compartilhadas de autenticacao, sessao, OTP e verificacao
- formularios server-first do App Router para signin, cadastro e verificacao

## Regras de negocio ativas

- CPF, CNPJ, email e telefone nao podem ser duplicados
- nova conta sempre nasce em `pending_contact_verification`
- conta so avanca para `pending_review` depois de confirmar email, telefone e registrar ao menos um documento
- apenas admin autenticado pode decidir approve, request-more-info ou reject
- refresh token e persistido em banco e rotacionado no refresh
- logout revoga a sessao persistida

## Dependencias resolvidas

- persistencia real do core e da autenticacao: resolvida com Prisma + PostgreSQL
- sessao real para web e API: resolvida com access token em cookie `httpOnly` + refresh token persistido
- regra de verificacao documental inicial: resolvida com OTP, documentos e status persistidos
- seed operacional local: resolvido com admin local e settings base

## Pendencias aceitas

- item: integrar provedores reais de email e SMS para OTP
- impacto: medio
- prioridade: alta

- item: integrar storage real de arquivos de verificacao
- impacto: medio
- prioridade: alta

- item: adicionar OCR, biometria leve e antifraude externo
- impacto: medio
- prioridade: media

- item: construir painel admin completo para fila de verificacoes
- impacto: medio
- prioridade: alta

- item: adicionar testes de componente do web e E2E do onboarding completo
- impacto: medio
- prioridade: media

## Riscos remanescentes

- risco: OTP ainda usa codigo de desenvolvimento exposto apenas para fluxo local
- mitigacao: trocar para provedores reais no proximo ciclo operacional

- risco: arquivos de documentos ainda sao metadados persistidos, sem storage binario real
- mitigacao: conectar S3/R2 antes da operacao real de verificacao

- risco: fallback demo ainda existe e pode confundir validacao manual
- mitigacao: remover o demo quando o restante do core e do admin estiver totalmente migrado

## O que o proximo modulo pode assumir como pronto

- existe autenticacao real com sessao persistida e cookies `httpOnly`
- existe uma base de usuarios cliente, negocio e admin em banco
- existe status de verificacao persistido e consultavel
- existe estrutura de auditoria e settings persistidos
- existe bootstrap local de PostgreSQL, migration inicial e seed operacional
- web ja tem fluxo inicial de onboarding autenticado para continuar em perfis e catalogo

## Leitura obrigatoria para o proximo modulo

- `blueprint-plataforma-local.md`
- `docs/01-foundation/construction-method.md`
- `docs/01-foundation/module-delivery-checklist.md`
- `docs/01-foundation/module-handoff-template.md`
- `docs/modules/02-profiles-catalog/README.md`
- `docs/handoffs/01-authentication-verification-2026-04-17.md`