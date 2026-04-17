---
applyTo: "**"
description: "Use when: writing git commit messages, creating branches, reviewing git workflow, merging, pull requests, versioning."
---

# Git Workflow Profissional

## 1. Estrutura de Branches

```
main          ← produção (protegida, nunca commitar direto)
develop       ← integração (base para novas features)
feature/*     ← novas funcionalidades
fix/*         ← correções de bugs
hotfix/*      ← correções urgentes em produção
release/*     ← preparação de release
chore/*       ← tarefas técnicas (deps, config, refactor)
```

### Exemplos de nomes de branch
```
feature/user-authentication
feature/payment-gateway
fix/login-redirect-bug
hotfix/critical-sql-injection
chore/update-dependencies
release/v2.1.0
```

---

## 2. Conventional Commits (Padrão obrigatório)

### Formato
```
<tipo>(<escopo>): <descrição curta em imperativo>

[corpo opcional — explica o quê e por quê]

[rodapé opcional — breaking changes, issues]
```

### Tipos de commit

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação (sem mudança de lógica) |
| `refactor` | Refatoração sem nova feature ou bug |
| `test` | Adicionar ou corrigir testes |
| `chore` | Manutenção, dependências, build |
| `perf` | Melhoria de performance |
| `ci` | Mudanças em CI/CD |
| `revert` | Reverter commit anterior |

### Exemplos corretos
```
feat(auth): add JWT refresh token support

fix(users): correct email validation regex

docs(api): update authentication endpoint docs

test(orders): add integration tests for checkout flow

chore(deps): update TypeScript to 5.4
```

### Regras
- Descrição em **inglês**, imperativo, minúsculo, sem ponto final
- Máximo 72 caracteres na primeira linha
- Escopos entre parênteses são opcionais, mas recomendados
- `BREAKING CHANGE:` no rodapé quando quebra compatibilidade

---

## 3. Fluxo de Trabalho

```
1. git checkout develop
2. git pull origin develop
3. git checkout -b feature/minha-feature
4. [desenvolver e commitar incrementalmente]
5. git push origin feature/minha-feature
6. Abrir Pull Request → develop
7. Code review obrigatório
8. Merge após aprovação (squash recomendado)
```

---

## 4. Regras de PR (Pull Request)

- **Título** segue o mesmo padrão dos commits
- **Descrição** deve conter:
  - O que foi feito e por quê
  - Como testar
  - Screenshots (se for interface)
  - Link da issue/task relacionada
- Mínimo 1 aprovação antes de mergear
- CI deve estar verde antes do merge
- Sem conflicts antes do merge
- PRs pequenos são preferíveis (máximo ~400 linhas)

---

## 5. Boas Práticas

- Commitar frequentemente (commits pequenos e atômicos)
- Nunca commitar código comentado
- Nunca commitar credenciais, tokens ou segredos
- `.gitignore` sempre atualizado
- Tags semânticas para releases: `v1.2.3`
- Rebase interativo para limpar histórico antes do PR
