# Padrao de API

## Base

- estilo: REST
- prefixo: `/api/v1`
- autenticacao: Bearer token para app e cliente tipado; refresh token em cookie no web quando aplicavel
- formato de erro: RFC 9457 Problem Details

## Regras

- recursos no plural
- toda listagem com `page`, `limit`, `sortBy`, `order`
- todo POST mutavel preparado para idempotencia quando houver risco de reenvio
- endpoints administrativos separados por escopo e autorizacao

## Resposta de sucesso

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

## Resposta de erro

```json
{
  "type": "https://dominio.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "email is invalid",
  "instance": "/api/v1/auth/register/client"
}
```

## Documentacao obrigatoria

- OpenAPI 3.1
- exemplos reais por endpoint
- contratos de request e response
- codigos 200, 201, 400, 401, 403, 404, 409, 422 e 429 quando aplicavel