---
applyTo: "**/*.md"
description: "Use when: writing README, documentation, changelogs, API docs, code comments, JSDoc, docstrings, technical documentation."
---

# Documentação — Padrão Profissional

## 1. README.md (Obrigatório em todo projeto)

### Estrutura mínima obrigatória

```markdown
# Nome do Projeto

> Descrição curta em uma linha.

## Requisitos
- Node.js >= 20
- PostgreSQL >= 15
- Redis >= 7

## Instalação e Setup

\`\`\`bash
git clone https://github.com/org/projeto
cd projeto
cp .env.example .env
npm install
npm run db:migrate
npm run dev
\`\`\`

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string do banco | `postgresql://user:pass@localhost/db` |
| `JWT_SECRET` | Chave secreta para JWT | string aleatória de 64 chars |
| `PORT` | Porta da aplicação | `3000` |

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run test` | Executa todos os testes |
| `npm run test:cov` | Testes com cobertura |
| `npm run db:migrate` | Executa migrations |

## Estrutura do Projeto

\`\`\`
src/
  modules/     ← módulos por domínio
  common/      ← helpers, decorators, filtros globais
  config/      ← configurações da aplicação
  main.ts      ← entry point
\`\`\`

## Contribuição

Ver [CONTRIBUTING.md](./CONTRIBUTING.md)
```

---

## 2. Comentários no Código

### Quando comentar
- Decisões não óbvias (`// Usando setTimeout para evitar race condition com o webhook`)
- Workarounds com link para issue (`// TODO: remover após fix da lib. Issue: #234`)
- Regex complexos (`// Valida CPF no formato 000.000.000-00`)
- Algoritmos não triviais

### Quando NÃO comentar
- O que o código já diz claramente
- `// incrementa i por 1` em `i++`
- Código comentado — deletar, o git guarda o histórico

---

## 3. JSDoc / TSDoc (para funções públicas e complexas)

```typescript
/**
 * Processa pagamento e atualiza status do pedido.
 *
 * @param orderId - UUID do pedido a ser processado
 * @param paymentData - Dados do pagamento (cartão, PIX, etc.)
 * @returns Resultado do processamento com status e ID da transação
 * @throws {NotFoundException} Quando o pedido não é encontrado
 * @throws {PaymentException} Quando o pagamento é recusado pela operadora
 */
async processPayment(orderId: string, paymentData: PaymentDto): Promise<PaymentResult>
```

Usar JSDoc em:
- Funções públicas de services
- Funções utilitárias compartilhadas
- Tipos e interfaces complexas

---

## 4. CHANGELOG.md

Seguir o padrão [Keep a Changelog](https://keepachangelog.com):

```markdown
# Changelog

## [2.1.0] - 2026-03-15

### Added
- Autenticação via Google OAuth

### Changed
- Limite de rate limiting aumentado para 100 req/min

### Fixed
- Correção no cálculo de desconto com cupom + promoção

### Security
- Atualização do bcrypt para versão 5.x (CVE-2023-xxxx)

## [2.0.0] - 2026-01-10

### Breaking Changes
- Endpoint `/users` agora requer autenticação
```

---

## 5. Documentação de API (Swagger)

```typescript
@ApiOperation({ summary: 'Criar novo usuário' })
@ApiBody({ type: CreateUserDto })
@ApiResponse({ status: 201, description: 'Usuário criado', type: UserResponseDto })
@ApiResponse({ status: 400, description: 'Dados inválidos' })
@ApiResponse({ status: 409, description: 'Email já cadastrado' })
@Post()
async createUser(@Body() dto: CreateUserDto) {}
```

Documentar em Swagger:
- Todos os endpoints
- Todos os parâmetros (query, path, body)
- Todas as respostas possíveis (incluindo erros)
- Exemplos reais

---

## 6. .env.example (Obrigatório)

Manter `.env.example` sempre atualizado com todas as variáveis necessárias (sem valores reais):

```bash
# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Auth
JWT_SECRET=change-this-to-a-random-64-char-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379
```

---

## 7. Boas Práticas Gerais

- Documentação próxima ao código (não wiki separada que fica desatualizada)
- Atualizar README ao adicionar dependência ou mudar setup
- Atualizar CHANGELOG a cada release
- ADRs (Architecture Decision Records) para decisões importantes: `docs/adr/001-use-postgresql.md`
- Diagramas quando a arquitetura é complexa (usar Mermaid no markdown)

---

## 8. Documentação Obrigatória por Alteração

- Toda criação ou alteração de **componente, módulo, serviço, endpoint ou fluxo** deve incluir atualização de documentação no mesmo PR.
- Mudanças de API exigem atualização de **Swagger/OpenAPI** e exemplos de request/response.
- Mudanças de setup/config exigem atualização de **README** e **.env.example**.
- Mudanças de comportamento relevante exigem registro no **CHANGELOG**.

---

## 9. Gate de Qualidade de Documentação

- PR sem atualização de documentação para o escopo alterado é bloqueado.
- Revisão deve validar consistência entre código, contrato da API e documentação publicada.
- O CI deve bloquear merge quando checks de documentação falharem.
