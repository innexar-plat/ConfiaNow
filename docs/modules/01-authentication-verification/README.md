# Modulo 01 - Authentication Verification

## Status

- pronto para handoff com pendencias aceitas

## Fora de escopo nesta primeira entrega real

- OCR e biometria com provedores externos
- antifraude comportamental e device fingerprint
- fila de revalidacao anual automatizada
- provedores reais de SMS, email transacional e storage S3/R2
- aprovacao massiva e painel operacional completo de verificacao

## Atores envolvidos

- cliente
- negocio
- administrador

## Fluxos principais desta fase

- cadastro real de cliente com sessao persistida
- cadastro real de negocio com sessao persistida
- login, refresh e logout com cookies `httpOnly`
- solicitacao e confirmacao de OTP de email e telefone
- envio de documentos de verificacao com persistencia em banco
- consulta do status de verificacao
- decisao administrativa de aprovacao, rejeicao e solicitacao de mais informacoes

## Objetivo

Cadastrar clientes e negocios, validar identidade, documentos e status de verificacao.

## Front

- cadastro de cliente
- cadastro de negocio e responsavel legal
- upload de documentos
- OTP de email e telefone
- tela de status da verificacao

## Back

- criacao de contas
- login, refresh e logout
- validacao de email e telefone
- pipeline de verificacao documental
- fila de revalidacao anual
- persistencia real com Prisma
- cookies `httpOnly` para refresh e token curto para acesso autenticado
- auditoria de eventos criticos de autenticacao e verificacao

## App

- login
- cadastro simplificado
- upload guiado de documentos
- status de verificacao

## Banco

- accounts
- sessions
- verification_requests
- verification_documents
- otp_codes
- business_owners
- audit_logs
- settings

## Modelo de dados desta fase

- `users`: identidade principal, papel, email, telefone, hash de senha, status de verificacao e flags de verificacao
- `sessions`: sessao persistida com refresh token hash, expiração e revogacao
- `verification_requests`: esteira de verificacao vinculada ao usuario
- `verification_documents`: documentos enviados para verificacao manual
- `otp_codes`: codigos OTP por canal com expiração e consumo
- `platform_settings`: configuracoes globais minimas para manter compatibilidade com o core
- `audit_logs`: rastreabilidade de login, logout, refresh, OTP, upload e decisao administrativa

## Endpoints

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

## Autenticacao e autorizacao por endpoint

- `POST /api/v1/auth/register/client`: publico
- `POST /api/v1/auth/register/business`: publico
- `POST /api/v1/auth/sessions`: publico
- `DELETE /api/v1/auth/sessions/current`: autenticado
- `POST /api/v1/auth/refresh`: autenticado por refresh cookie
- `POST /api/v1/auth/verify-email/request`: autenticado
- `POST /api/v1/auth/verify-email/confirm`: autenticado
- `POST /api/v1/auth/verify-phone/request`: autenticado
- `POST /api/v1/auth/verify-phone/confirm`: autenticado
- `POST /api/v1/auth/documents`: autenticado
- `GET /api/v1/auth/verification-status`: autenticado
- `POST /api/v1/admin/verifications/:id/approve`: admin
- `POST /api/v1/admin/verifications/:id/request-more-info`: admin
- `POST /api/v1/admin/verifications/:id/reject`: admin

## Regras de negocio desta fase

- um CPF ou CNPJ nao pode ser reutilizado por outra conta
- email e telefone tambem devem ser unicos
- o status inicial de toda conta nova e `pending_contact_verification`
- a conta so avanca para `pending_review` depois de email, telefone e pelo menos um documento enviados
- apenas administrador pode aprovar, rejeitar ou pedir mais informacoes de uma verificacao
- logout deve revogar a sessao persistida
- refresh deve rotacionar a sessao persistida

## Testes

- unitario de validacao de CPF/CNPJ e estados da verificacao
- integracao de cadastro e login
- integracao de aprovacao/rejeicao administrativa
- componente de formularios e upload
- E2E de cadastro completo de negocio

## Implementado nesta fase

- schema Prisma real para `users`, `sessions`, `verification_requests`, `verification_documents`, `otp_codes`, `business_owners`, `platform_settings` e `audit_logs`
- PostgreSQL local via `infra/docker/docker-compose.yml`
- migration inicial aplicada e seed com settings base e conta admin local
- pacote `@platform/database` com Prisma Client e bootstrap reutilizavel
- pacote `@platform/auth` com hash de senha, JWT de acesso, refresh token persistido, OTP, regras de verificacao e decisoes administrativas
- endpoints reais de cadastro, login, refresh, logout, OTP, upload de documentos e status de verificacao
- endpoints administrativos reais para aprovar, rejeitar e pedir mais informacoes em verificacoes
- integracao do core com sessao autenticada real, settings persistidos e audit logs em banco
- web com signin real, cadastro de cliente, cadastro de negocio e tela de verificacao conectada ao backend compartilhado
- fallback demo mantido apenas como rota auxiliar de transicao

## Revisao final de completude

- UI web completa: parcial, com signin, cadastro cliente, cadastro negocio e status de verificacao entregues; faltam componentes mais refinados de erro/loading, formularios com validacao rica no cliente e tela admin operacional completa para verificacoes
- API completa: sim para a primeira entrega real do modulo, com todos os endpoints documentados implementados
- banco completo: parcial, com schema Prisma e migration inicial entregues; storage real de arquivos e infraestrutura de filas ainda nao entraram
- app completo ou adiado com justificativa: adiado; o impacto mobile foi documentado, mas a implementacao continua fora do ciclo atual
- testes minimos completos: parcial-alta, com unitarios de CPF/CNPJ e integracoes reais de cadastro, OTP, documentos e aprovacao administrativa; faltam testes de componente do web e E2E do fluxo completo
- documentacao completa: sim para a fase entregue, incluindo README atualizado e handoff formal

## Pendencias aceitas

- integrar provedores reais de email e SMS para OTP
- integrar storage real para arquivos de verificacao
- implementar OCR, biometria leve e antifraude externo
- construir tela administrativa completa de moderacao de verificacoes no web
- adicionar testes de componente e E2E do onboarding completo

## Estrategia de implementacao desta fase

- Prisma com PostgreSQL para persistencia real
- Fastify com rotas reais de autenticacao e verificacao
- Next.js com formularios server-first para signin, cadastro e status de verificacao
- fallback demo mantido apenas como rota auxiliar de transicao ate a migracao completa do core