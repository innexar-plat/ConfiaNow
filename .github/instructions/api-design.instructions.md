---
applyTo: "**"
description: "Use when: designing REST API, creating endpoints, defining HTTP methods, status codes, request/response format, pagination, error handling, versioning, API authentication."
---

# API Design — Padrão REST Profissional

## 1. Nomenclatura de Endpoints

- **Substantivos no plural** para recursos (nunca verbos)
- Letras minúsculas e hífens para separar palavras

```
✅ GET    /users
✅ GET    /users/:id
✅ POST   /users
✅ PATCH  /users/:id
✅ DELETE /users/:id
✅ GET    /users/:id/orders
✅ POST   /orders/:id/cancel    ← ação como sub-recurso

❌ GET    /getUsers
❌ POST   /createUser
❌ GET    /user_list
❌ DELETE /deleteUser?id=123
```

---

## 2. Métodos HTTP

| Método | Uso | Idempotente |
|--------|-----|-------------|
| `GET` | Buscar dados (sem efeito colateral) | ✅ |
| `POST` | Criar recurso | ❌ |
| `PUT` | Substituir recurso completo | ✅ |
| `PATCH` | Atualizar parcialmente | ✅ |
| `DELETE` | Remover recurso | ✅ |

---

## 3. Códigos HTTP Corretos

| Código | Quando usar |
|--------|-------------|
| `200 OK` | Sucesso geral (GET, PATCH, DELETE) |
| `201 Created` | Recurso criado com sucesso (POST) |
| `204 No Content` | Sucesso sem corpo de resposta |
| `400 Bad Request` | Input inválido, validação falhou |
| `401 Unauthorized` | Não autenticado |
| `403 Forbidden` | Autenticado mas sem permissão |
| `404 Not Found` | Recurso não existe |
| `409 Conflict` | Conflito (ex: email duplicado) |
| `422 Unprocessable Entity` | Dados válidos mas inválidos semanticamente |
| `429 Too Many Requests` | Rate limit atingido |
| `500 Internal Server Error` | Erro inesperado no servidor |

---

## 4. Formato de Resposta Padrão

### Sucesso — listagem
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Sucesso — item único
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@email.com",
    "createdAt": "2026-01-15T14:30:00Z"
  }
}
```

### Erro — formato padrão
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be a valid email address" },
    { "field": "password", "message": "password must be at least 8 characters" }
  ]
}
```

---

## 5. Paginação Padrão

```
GET /users?page=1&limit=20&sortBy=createdAt&order=desc
```

| Parâmetro | Tipo | Padrão | Máximo |
|-----------|------|--------|--------|
| `page` | integer | 1 | - |
| `limit` | integer | 20 | 100 |
| `sortBy` | string | `createdAt` | - |
| `order` | `asc`\|`desc` | `desc` | - |

---

## 6. Versionamento de API

- Versão na URL: `/api/v1/users`, `/api/v2/users`
- Nunca quebrar contrato de uma versão existente
- Deprecar versões com aviso antecipado (mínimo 6 meses)
- Header `Deprecation: true` e `Sunset: 2027-01-01` em versões depreciadas

---

## 7. Autenticação

```
Authorization: Bearer <jwt_access_token>
```

- Access token no header `Authorization: Bearer`
- Refresh token em cookie `httpOnly; Secure; SameSite=Strict`
- Endpoints públicos documentados explicitamente
- Endpoints protegidos verificam token em cada requisição

---

## 8. Filtros e Busca

```
GET /orders?status=pending&userId=uuid&startDate=2026-01-01&endDate=2026-12-31
GET /products?search=notebook&category=electronics&minPrice=500&maxPrice=5000
```

- Parâmetros em `camelCase` na query string
- Validar todos os parâmetros de query
- Sanitizar antes de usar em queries

---

## 9. Documentação (Obrigatório)

- **Swagger/OpenAPI** para toda API
- Documentar todos os endpoints, parâmetros e respostas
- Exemplos reais nos schemas
- Marcar endpoints depreciados com `@deprecated`
- Manter documentação sincronizada com o código

---

## 10. Boas Práticas

- Respostas em **inglês** (campo `message`)
- Datas sempre em **ISO 8601 UTC** (`2026-01-15T14:30:00Z`)
- IDs sempre como **UUID** (nunca sequential integers em APIs públicas)
- Nunca retornar campos sensíveis (senha, tokens internos)
- CORS configurado com origens permitidas explicitamente
- Compressão gzip habilitada
- Timeout de requisição configurado (ex: 30s)
