---
applyTo: "**"
description: "Use when: writing backend code, creating modules, services, controllers, repositories, entities, DTOs. Applies Clean Architecture, DDD, SOLID, DRY, KISS, YAGNI."
---

# Backend Profissional — Arquitetura e Princípios (2026)

## 1. Arquitetura Obrigatória

Toda aplicação backend DEVE seguir **Clean Architecture** com **Domain-Driven Design (DDD)**.

### Estrutura de pastas padrão (por domínio)

```
/modules
  /[domain]
    /controllers    ← recebe requisição, delega ao service
    /services       ← lógica de negócio
    /repositories   ← acesso ao banco de dados
    /entities       ← modelos de domínio
    /dtos           ← validação de entrada/saída
```

Exemplos de domínios:
- `/modules/users`
- `/modules/crm`
- `/modules/finance`
- `/modules/orders`

---

## 2. Princípios Obrigatórios (CORE)

### SOLID
| Princípio | Regra prática |
|-----------|---------------|
| **S** — Single Responsibility | 1 classe = 1 responsabilidade |
| **O** — Open/Closed | Extensível sem modificar a base |
| **L** — Liskov | Subclasses substituem a base sem quebrar |
| **I** — Interface Segregation | Interfaces pequenas e específicas |
| **D** — Dependency Inversion | Dependências sempre injetadas (nunca instanciadas diretamente) |

### DRY (Don't Repeat Yourself)
- Proibido duplicar lógica
- Reutilizar serviços e helpers existentes
- Antes de criar algo novo, verificar se já existe

### KISS (Keep It Simple, Stupid)
- Evitar overengineering
- Solução simples > solução complexa sempre
- Se parece complicado, está errado

### YAGNI (You Aren't Gonna Need It)
- Não criar features futuras
- Implementar apenas o necessário para a tarefa atual
- Sem abstrações prematuras

### Separation of Concerns
- `controller` ≠ `service` ≠ `repository` ≠ `database`
- Camadas nunca misturam responsabilidades

---

## 3. Fluxo Padrão Backend

```
Requisição → Controller → Service → Repository → Database
                  ↓           ↓
               DTO/Validation  Business Logic
```

**Proibido:**
- Controller acessar banco de dados diretamente
- Lógica de negócio no controller
- Lógica de query no service (usar repository)

---

## 4. Organização de Código

### Tamanho de arquivos
| Tamanho | Status |
|---------|--------|
| 50–150 linhas | ✅ Ideal |
| até 300 linhas | ⚠️ Aceitável |
| acima de 300 linhas | ❌ Refatorar obrigatoriamente |

### Funções
- Pequenas (máximo ~30 linhas)
- Nome claro: **verbo + substantivo** em camelCase
  - `createUser()`, `validateLead()`, `processPayment()`, `findActiveOrders()`
- Uma função = uma ação

---

## 5. Clean Code

- Nomes descritivos para variáveis, funções e classes
- Comentários explicam **por quê**, não **o quê**
- Código deve ser legível em menos de 30 segundos
- Evitar funções gigantes
- Evitar comentários desnecessários (se precisa de comentário, o código está complexo demais)

---

## 6. Naming Conventions

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Arquivos | kebab-case | `user.service.ts`, `auth.controller.ts` |
| Classes | PascalCase | `UserService`, `AuthController` |
| Funções/métodos | camelCase | `createUser()`, `findById()` |
| Variáveis | camelCase | `userId`, `isActive` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `JWT_SECRET` |
| Interfaces | PascalCase com `I` prefix (opcional) | `IUserRepository` |
| DTOs | PascalCase + `Dto` | `CreateUserDto`, `UpdateOrderDto` |

---

## 7. Regras para Uso com IA

A IA NUNCA deve gerar código sem seguir a estrutura acima.

Para cada feature, sempre gerar:
1. `controller` — recebe e valida requisição
2. `service` — implementa lógica de negócio
3. `repository` — acessa o banco de dados
4. `dto` — define e valida entrada/saída
5. `entity` — representa o modelo de domínio

Validar código gerado para:
- Evitar código duplicado
- Garantir que segue Clean Architecture
- Verificar que não mistura responsabilidades

---

## 8. Testes Automatizados Obrigatórios

- Toda criação ou alteração de **módulo, serviço, controller, repository, entity ou dto** deve incluir testes automatizados no mesmo PR.
- Cobertura mínima obrigatória de **90%** para o escopo alterado.
- Cobertura global mínima do projeto deve permanecer em **90%** ou mais.
- O CI deve bloquear merge quando testes falharem ou quando a cobertura ficar abaixo do mínimo.

---

## 9. Documentação Obrigatória

- Toda criação ou alteração de **módulo, serviço, controller, repository, entity ou dto** deve incluir atualização de documentação no mesmo PR.
- Endpoints novos/alterados devem ser documentados em **Swagger/OpenAPI** com exemplos reais.
- Alterações de comportamento devem atualizar **README** e **CHANGELOG** quando aplicável.
- PR sem documentação compatível com o código deve ser bloqueado.

---

## Regra de Ouro

> **Se está difícil de entender, está errado.**

Código profissional é simples, legível e bem organizado.
