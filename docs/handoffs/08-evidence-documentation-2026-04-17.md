# Handoff - Modulo 08 Evidence Documentation (2026-04-17)

## Resumo da entrega

O modulo 08 foi entregue com a primeira fatia real de evidencias e documentacao versionada. O sistema permite registrar arquivos com metadados completos, versionar documentos ao reenviar, vincular evidencias a entidades de verificacao/review/moderacao/mensagem, e rastrear cada mudanca relevante via trilha de eventos de storage.

## O que foi entregue

- modelagem de dados real para arquivos, versoes, vinculos de evidencia e eventos de storage
- extensao de `verification_documents` com `latest_file_id` e `version_number` para suporte a reenvio
- pacote compartilhado `@platform/evidence` com regras de negocio e validacoes de seguranca
- 6 endpoints REST com validacao zod e autorizacao por dono/admin
- handler server-first no web para reenvio de documento: `/auth/documents/[id]/resubmit`
- tela de verificacao atualizada com lista de documentos e formulario de reenvio inline
- trilha de eventos de storage (UPLOADED, VERSION_ADDED, LINKED, UNLINKED, DELETED, RESTORED)

## Endpoints ativos

- POST /api/v1/files
- GET /api/v1/files/:id
- DELETE /api/v1/files/:id
- POST /api/v1/evidence-links
- GET /api/v1/me/documents
- POST /api/v1/me/documents/:id/resubmit

## Entidades e tabelas criadas/alteradas

- novas:
  - `files`
  - `document_versions`
  - `evidence_links`
  - `storage_events`
- alteradas:
  - `verification_documents`: colunas `latest_file_id` e `version_number` adicionadas

## Enums adicionados

- `StoredFilePurpose`: VERIFICATION_DOCUMENT, REVIEW_EVIDENCE, MODERATION_EVIDENCE, CHAT_ATTACHMENT, GENERAL
- `StorageEventType`: UPLOADED, VERSION_ADDED, LINKED, UNLINKED, DELETED, RESTORED
- `EvidenceTargetType`: VERIFICATION_REQUEST, REVIEW, REVIEW_MODERATION, CONVERSATION_MESSAGE

## Migracao aplicada

- `20260417181715_add_evidence_documentation`

## Regras de negocio ativas

- todo arquivo nasce com versao 1 registrada em `document_versions`
- toda acao relevante no ciclo de vida do arquivo gera evento em `storage_events`
- reenvio de documento cria novo `stored_file`, vincula ao `verification_request` e incrementa `version_number` no `verification_document`
- reenvio de documento muda status de verificacao do usuario para `PENDING_REVIEW` automaticamente
- vinculo de evidencia exige arquivo ativo (nao deletado)
- leitura e soft delete de arquivo requerem autoria ou papel admin
- tipos de alvo de evidencia restritos a entidades existentes (VERIFICATION_REQUEST, REVIEW, REVIEW_MODERATION, CONVERSATION_MESSAGE)

## Validacoes de arquivo

- nome 2..160 chars
- mimeType 3..120 chars
- sizeBytes 1 byte ate 10 MB
- storageUrl valida (URL completa)
- checksumSha256 ate 200 chars (opcional)

## Validacoes executadas

- `npm run db:migrate -- --name add_evidence_documentation` (migration criada e aplicada)
- `npm run test:api` (36 testes passando, 0 falhas)
- `npm run build:api` (ok)
- `npm run build:web` (ok, rota /auth/documents/[id]/resubmit presente)

## Pendencias aceitas

- upload binario real para bucket de storage (S3/R2/GCS)
- scan antivirus/malware em arquivos enviados
- assinatura digital de documentos
- visualizador de PDF/imagem com anotacoes no frontend
- testes de componente para uploader e preview
- testes E2E completos para reenvio

## O que o proximo modulo pode assumir como pronto

- infraestrutura de arquivos e versionamento funcional no banco e API
- trilha de eventos de storage para auditoria de cada operacao
- sistema de vinculos de evidencia para qualquer entidade moderada
- reenvio de documentos de verificacao com mudanca automatica de status
- base pronta para integrar antivirus, bucket real e assinatura digital
