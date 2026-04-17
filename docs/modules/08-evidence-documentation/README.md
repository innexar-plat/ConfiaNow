# Modulo 08 - Evidence Documentation

## Objetivo

Armazenar e versionar documentos, provas operacionais e evidencias de moderacao.

## Escopo desta fase

Esta fase entrega a primeira fatia real do modulo com metadados persistidos em banco, versionamento de arquivo e vinculo de evidencias para auditoria.

Inclui:

- cadastro de arquivo com metadados e primeira versao
- leitura e soft delete de arquivo com trilha de eventos
- vinculo de evidencia para verificacao, review, moderacao e mensagem
- listagem de documentos do usuario autenticado
- reenvio de documento com nova versao e rastro de auditoria

Nao inclui nesta fase:

- upload binario para bucket real
- antivirus/scan de malware
- assinatura digital de documentos
- visualizador de PDF/imagem com anotacoes

## Front

- upload de documentos
- status de aprovacao
- visualizador de evidencias

## Back

- storage seguro
- validacao de tipo, tamanho e integridade
- vinculacao da evidencia a verificacao, review ou denuncia

## App

- captura de imagem
- envio de arquivo
- consulta de status documental

## Banco

- files
- evidence_links
- document_versions
- storage_events

## Contrato HTTP

### POST /api/v1/files

- autenticado
- request:
	- originalName (string)
	- mimeType (string)
	- sizeBytes (integer)
	- storageUrl (url)
	- checksumSha256 (string opcional)
	- purpose (enum opcional)
- response: 201 com arquivo criado e versao 1

### GET /api/v1/files/:id

- autenticado
- acesso permitido para dono do arquivo ou admin
- response: 200 com metadados, versoes e links

### DELETE /api/v1/files/:id

- autenticado
- somente dono do arquivo ou admin
- response: 200 com `success: true`

### POST /api/v1/evidence-links

- autenticado
- request:
	- fileId (uuid)
	- targetType (enum)
	- targetId (uuid)
	- description (string opcional)
- response: 201 com link criado

### GET /api/v1/me/documents

- autenticado
- response: 200 com documentos de verificacao do usuario e ultimo arquivo vinculado

### POST /api/v1/me/documents/:id/resubmit

- autenticado
- `:id` e o id de `verification_documents`
- request:
	- originalName (string)
	- mimeType (string)
	- sizeBytes (integer)
	- storageUrl (url)
	- checksumSha256 (string opcional)
- response: 200 com documento atualizado para nova versao

## Regras de negocio da fase

- todo arquivo nasce com versao 1 em `document_versions`
- toda mudanca relevante gera evento em `storage_events`
- reenvio de documento atualiza `verification_documents.latest_file_id` e incrementa `version_number`
- vinculo de evidencia exige arquivo existente e ativo
- tipos de alvo aceitos para evidencia:
	- VERIFICATION_REQUEST
	- REVIEW
	- REVIEW_MODERATION
	- CONVERSATION_MESSAGE
- validacoes de arquivo:
	- nome 2..160
	- mimeType 3..120
	- size 1 byte ate 10 MB
	- url valida

## Endpoints

- POST /api/v1/files
- GET /api/v1/files/:id
- DELETE /api/v1/files/:id
- POST /api/v1/evidence-links
- GET /api/v1/me/documents
- POST /api/v1/me/documents/:id/resubmit

## Testes

- unitario de validacao de arquivo
- integracao de upload e vinculo de evidencia
- componente de uploader e preview
- E2E de reenvio de documento recusado

## Criterio de conclusao desta fase

- migration criada e aplicada no mesmo avanco
- endpoints ativos com validacao e autorizacao
- testes de API para fluxo principal e erros criticos
- pagina de verificacao exibindo documentos e acao de reenvio
- handoff do modulo 08 atualizado

## Status desta fase

**CONCLUIDA** em 2026-04-17.

- migration `20260417181715_add_evidence_documentation` criada e aplicada
- pacote `@platform/evidence` implementado com validacao e regras de negocio
- 6 endpoints ativos (POST /files, GET /files/:id, DELETE /files/:id, POST /evidence-links, GET /me/documents, POST /me/documents/:id/resubmit)
- handler de reenvio no web: `/auth/documents/[id]/resubmit`
- tela de verificacao exibe documentos com acao de reenvio inline
- 36 testes passando (34 anteriores + 2 novos do modulo 08)
- build:api e build:web sem erros
