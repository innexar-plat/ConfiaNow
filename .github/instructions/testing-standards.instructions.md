---
applyTo: "**/*.{test,spec}.{ts,js,py,cs,java}"
description: "Use when: writing unit tests, integration tests, e2e tests, test coverage, test structure, mocking, TDD, testing services, repositories, controllers."
---

# Testes — Padrão Profissional

## 1. Pirâmide de Testes

```
        /\
       /E2E\          ← poucos, lentos, alto custo
      /------\
     /Integra-\       ← médios, testam fluxo completo
    /  ção     \
   /------------\
  / Unit Tests   \    ← muitos, rápidos, isolados
 /________________\
```

---

## 2. Testes Unitários (Obrigatório)

**O que testar:** Services, regras de negócio, funções utilitárias, validações

### Estrutura padrão (AAA)
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const dto = { email: 'test@email.com', password: '123456', name: 'Test' };
      mockRepository.save.mockResolvedValue({ id: 'uuid', ...dto });

      // Act
      const result = await userService.createUser(dto);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.password).not.toBe(dto.password); // deve estar hasheado
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({ id: 'existing' });

      // Act & Assert
      await expect(userService.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

### Regras
- Nomear: `should [expected behavior] when [context]`
- Um `expect` principal por teste (podem ter auxiliares)
- Mockar dependências externas (banco, APIs, email)
- Testar caminho feliz + casos de erro + edge cases
- Não testar implementação — testar comportamento

---

## 3. Testes de Integração (Obrigatório)

**O que testar:** Endpoints HTTP, fluxos completos, integração com banco de dados

```typescript
describe('POST /users', () => {
  it('should return 201 with created user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'test@email.com', password: 'password123', name: 'Test' })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      email: 'test@email.com',
    });
    expect(response.body.password).toBeUndefined(); // nunca retornar senha
  });

  it('should return 400 when email is invalid', async () => {
    await request(app)
      .post('/users')
      .send({ email: 'not-an-email', password: 'password123' })
      .expect(400);
  });
});
```

---

## 4. Nomenclatura

| Arquivo | Convenção |
|---------|-----------|
| Testes unitários | `user.service.spec.ts` |
| Testes de integração | `user.controller.spec.ts` ou `users.e2e-spec.ts` |
| Fixtures/mocks | `user.mock.ts`, `__mocks__/` |
| Factories | `user.factory.ts` |

---

## 5. Cobertura (Coverage)

| Nível | Mínimo aceitável |
|-------|-----------------|
| Components / Services / Modules | ≥ 90% |
| Controllers / Hooks / Utilities | ≥ 90% |
| Cobertura global do projeto | ≥ 90% |
| Repositórios | Testar via integração |

---

## 6. Mocking

- Mockar **dependências externas** (banco, APIs, email, SMS)
- **Não mockar** o que está sendo testado
- Usar factories para criar dados de teste (evitar dados hardcoded espalhados)
- Resetar mocks entre testes (`beforeEach(() => jest.clearAllMocks())`)

---

## 7. TDD (Opcional — Altamente Recomendado)

```
1. Escrever teste que falha (RED)
2. Implementar código mínimo para passar (GREEN)
3. Refatorar mantendo testes verdes (REFACTOR)
```

Benefícios: design mais limpo, menos bugs, documentação viva.

---

## 8. Boas Práticas

- Testes devem ser **independentes** (não depender de ordem de execução)
- Banco de dados de teste isolado (in-memory ou container separado)
- Não usar `setTimeout` ou sleeps em testes
- Limpar estado após cada teste
- CI deve rodar todos os testes antes do merge
- Testes lentos (>5s) devem ser investigados

---

## 9. Obrigatoriedade Estrutural

- Toda criação ou alteração de **componente, módulo ou serviço** deve incluir testes automatizados no mesmo PR.
- PR sem testes automatizados para o escopo alterado é bloqueado.
- PR com cobertura abaixo de **90%** (escopo alterado e cobertura global) é bloqueado.
- O pipeline de CI deve falhar automaticamente quando os gates de teste e cobertura não forem atendidos.
