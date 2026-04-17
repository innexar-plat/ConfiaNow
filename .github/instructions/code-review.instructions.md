---
description: "Use when: reviewing code, doing code review, analyzing pull requests, checking code quality, giving feedback on implementation."
---

# Code Review — Checklist Profissional

## Como Usar

Ao revisar um PR, percorrer cada categoria abaixo. Uma flag `❌` bloqueia o merge.

---

## 1. Arquitetura e Design

- [ ] Segue Clean Architecture (Controller → Service → Repository)
- [ ] Responsabilidades separadas corretamente
- [ ] Não há lógica de negócio no controller
- [ ] Não há acesso ao banco no service diretamente
- [ ] Segue os princípios SOLID
- [ ] Sem duplicação de código (DRY)
- [ ] Solução não é mais complexa que o necessário (KISS/YAGNI)

---

## 2. Código e Legibilidade

- [ ] Nomes descritivos para funções, variáveis e classes
- [ ] Funções com responsabilidade única e tamanho razoável (≤30 linhas)
- [ ] Arquivos com tamanho razoável (≤300 linhas)
- [ ] Sem código comentado (se não usa, deletar)
- [ ] Sem TODOs sem issue vinculada
- [ ] Sem `console.log` ou `print` de debug em produção
- [ ] Código é legível sem precisar de explicação

---

## 3. Segurança

- [ ] Input validado com DTO/schema
- [ ] Autenticação verificada em todas as rotas protegidas
- [ ] Autorização verificada (recurso pertence ao usuário?)
- [ ] Sem segredos ou credenciais hardcoded no código
- [ ] Sem SQL/NoSQL injection possível
- [ ] Dados sensíveis não aparecem em logs ou responses
- [ ] Headers de segurança configurados
- [ ] Rate limiting presente em rotas públicas críticas

---

## 4. Testes

- [ ] Testes unitários para a lógica de negócio
- [ ] Cobertura adequada (mínimo 70%)
- [ ] Testes cobrem casos de erro e edge cases
- [ ] Testes passam no CI
- [ ] Sem testes frágeis ou dependentes de ordem

---

## 5. Performance

- [ ] Queries otimizadas (sem N+1)
- [ ] Paginação em listagens
- [ ] Índices necessários criados no banco
- [ ] Operações pesadas assíncronas (não bloqueiam o event loop)
- [ ] Cache utilizado onde faz sentido

---

## 6. Banco de Dados

- [ ] Migration criada para mudanças no schema
- [ ] Migration é reversível (down migration)
- [ ] Relacionamentos e constraints corretos
- [ ] Sem dado sensível sem proteção
- [ ] Transações usadas onde necessário (operações atômicas)

---

## 7. API e Contratos

- [ ] Códigos HTTP corretos (200, 201, 400, 401, 403, 404, 409, 422, 500)
- [ ] Resposta de erro padronizada
- [ ] Paginação no formato padrão do projeto
- [ ] Não quebra contrato de versões anteriores (ou é breaking change intencional)
- [ ] Documentação atualizada (Swagger/OpenAPI)

---

## 8. Git e PR

- [ ] Título e commits seguem Conventional Commits
- [ ] PR é pequeno e focado (≤400 linhas quando possível)
- [ ] Descrição explica o quê e por quê
- [ ] Sem arquivos desnecessários no PR
- [ ] Sem conflitos com a branch base

---

## Critérios de Aprovação

| Flag | Ação |
|------|------|
| ❌ Bloqueante | Deve ser corrigido antes do merge |
| ⚠️ Importante | Deve ser discutido, pode ser em follow-up |
| 💬 Sugestão | Opcional, melhoria futura |

---

## Tom do Code Review

- Comentários sobre o **código**, nunca sobre a pessoa
- Sugerir, não impor: "O que você acha de..." em vez de "Troca isso para..."
- Explicar o **porquê** de cada pedido de mudança
- Reconhecer o que foi bem feito
- PR bloqueado = oportunidade de aprendizado, não punição
