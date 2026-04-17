---
applyTo: "**"
description: "Use when: writing authentication, authorization, input validation, handling user data, APIs exposed to the internet, database queries, file uploads, environment variables, secrets management, OWASP security."
---

# Segurança — Padrão OWASP (2026)

## Princípios Base

- **Nunca confiar no frontend** — validar tudo no backend
- **Defense in depth** — múltiplas camadas de proteção
- **Least privilege** — acesso mínimo necessário
- **Fail securely** — erros não expõem informação sensível

---

## 1. Validação de Input (A03 - Injection)

**SEMPRE validar e sanitizar toda entrada de dados:**

```typescript
// ✅ Correto — usar DTOs com validação
class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MaxLength(100)
  name: string;
}
```

- Validar tipos, formatos, tamanhos e ranges
- Usar bibliotecas de validação (Zod, Joi, class-validator)
- Rejeitar entradas inválidas com erro 400
- Nunca interpoler input do usuário em queries (usar ORM/prepared statements)

---

## 2. Autenticação (A07 - Auth Failures)

- **JWT**: usar HS256 ou RS256, sempre verificar assinatura
- Refresh tokens com rotação automática
- Expiração curta para access tokens (15min–1h)
- Armazenar refresh token em httpOnly cookie
- Rate limiting em rotas de login (máximo 5 tentativas)
- Bloqueio temporário após tentativas excessivas
- Senha nunca em logs ou respostas da API
- Hash de senhas com bcrypt (salt rounds ≥ 12) ou Argon2

---

## 3. Autorização (A01 - Broken Access Control)

- Verificar permissões em **todo** endpoint protegido
- Autenticação ≠ Autorização (separar responsabilidades)
- RBAC (Role-Based Access Control) ou ABAC
- Nunca expor IDs sequenciais — usar UUIDs
- Verificar se o recurso pertence ao usuário autenticado

```typescript
// ✅ Correto — verificar ownership
const order = await orderRepository.findOne({ id, userId: currentUser.id });
if (!order) throw new ForbiddenException();
```

---

## 4. Dados Sensíveis (A02 - Cryptographic Failures)

- HTTPS obrigatório em produção
- Nunca logar senhas, tokens, CPF, cartão, etc.
- Variáveis sensíveis em variáveis de ambiente (`.env`) — nunca no código
- `.env` nunca commitado no repositório
- Dados sensíveis em banco: encriptar em repouso
- Máscarar dados em responses (`***-***-1234`)

---

## 5. Injeção (A03 - Injection)

- **SQL Injection**: usar ORM (TypeORM, Prisma, Sequelize) ou prepared statements
- **NoSQL Injection**: validar tipos antes de queries MongoDB
- **Command Injection**: nunca executar comandos com input do usuário
- **LDAP Injection**: escapar caracteres especiais
- **XSS**: sanitizar HTML, usar Content-Security-Policy

```typescript
// ❌ PROIBIDO — SQL injection
const users = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ Correto — parameterized query
const users = await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

---

## 6. Configuração de Segurança (A05 - Misconfiguration)

- Desabilitar X-Powered-By (não expor stack)
- Headers de segurança obrigatórios:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security`
- CORS configurado explicitamente (não `*` em produção)
- Remover rotas de debug em produção
- Variáveis de ambiente diferentes por ambiente (dev/staging/prod)

---

## 7. Rate Limiting e DOS (A04 - Insecure Design)

- Rate limiting em todas as rotas públicas
- Throttling por IP e por usuário
- Limitar tamanho de payload (ex: 10MB máximo)
- Paginação obrigatória em listagens

---

## 8. Dependências (A06 - Vulnerable Components)

- Rodar `npm audit` / `pip audit` regularmente
- Atualizar dependências mensalmente
- Usar Snyk ou Dependabot em CI/CD
- Nunca usar versão com vulnerabilidade conhecida crítica

---

## 9. Logging e Monitoramento (A09)

- Logar tentativas de login com falha
- Logar mudanças de permissão
- Logar acesso a dados sensíveis
- **NUNCA** logar dados sensíveis (senhas, tokens, CPF)
- Alertas para comportamento suspeito (múltiplos erros 401/403)

---

## Checklist Rápido por PR

- [ ] Input validado com DTO/schema
- [ ] Autenticação verificada na rota
- [ ] Autorização verificada no service
- [ ] Sem segredos no código
- [ ] Sem SQL interpolated
- [ ] Dados sensíveis não aparecem em logs
