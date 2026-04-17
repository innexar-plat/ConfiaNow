---
applyTo: "**"
description: "Use when: writing database queries, creating migrations, designing schemas, working with ORM, optimizing queries, N+1 problem, indexes, transactions, naming tables and columns."
---

# Banco de Dados — Padrão Profissional

## 1. Nomenclatura

| Elemento | Padrão | Exemplos |
|----------|--------|---------|
| Tabelas | `snake_case`, plural | `users`, `order_items`, `financial_transactions` |
| Colunas | `snake_case` | `created_at`, `user_id`, `is_active` |
| Chaves primárias | `id` (UUID por padrão) | `id UUID DEFAULT gen_random_uuid()` |
| Chaves estrangeiras | `{tabela_singular}_id` | `user_id`, `order_id` |
| Índices | `idx_{tabela}_{coluna(s)}` | `idx_users_email`, `idx_orders_user_id_status` |
| Constraints | `{tipo}_{tabela}_{coluna}` | `uq_users_email`, `fk_orders_user_id` |

---

## 2. Schema e Migrations

- **Toda mudança** no schema deve ter migration
- Migrations são **versionadas** e **rastreáveis** no git
- Toda migration deve ter `up` e `down` (reversível)
- Nunca deletar migration antiga (mesmo que "vazia")
- Testar migration em ambiente de staging antes da produção

### Campos padrão em toda tabela
```sql
id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP   NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMP   NULL       -- para soft delete (quando aplicável)
```

---

## 3. Boas Práticas de Query

### Proibido — N+1 Query
```typescript
// ❌ PROIBIDO — N+1 (1 query para lista + N queries para cada item)
const orders = await orderRepository.find();
for (const order of orders) {
  order.user = await userRepository.findOne(order.userId); // N queries!
}

// ✅ Correto — JOIN / eager loading
const orders = await orderRepository.find({ relations: ['user'] });
// ou com QueryBuilder:
const orders = await orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.user', 'user')
  .getMany();
```

### Usar índices para colunas filtradas frequentemente
```sql
-- Colunas usadas em WHERE, ORDER BY, JOIN
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
```

### Paginação obrigatória em listagens
```typescript
// ✅ Sempre paginar
const [items, total] = await repository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
  order: { createdAt: 'DESC' },
});
```

---

## 4. Transações

Usar transações para operações que devem ser **atômicas** (tudo ou nada):

```typescript
// ✅ Transação com TypeORM
await dataSource.transaction(async (manager) => {
  const order = await manager.save(Order, orderData);
  await manager.save(OrderItem, items.map(i => ({ ...i, orderId: order.id })));
  await manager.update(Inventory, { productId }, { quantity: () => 'quantity - 1' });
});
```

**Quando usar transações:**
- Criar registro + atualizar outro
- Transferência de saldo
- Estoque + pedido
- Qualquer operação em múltiplas tabelas que deve ser consistente

---

## 5. Performance

- **SELECT \*** proibido em produção (selecionar apenas colunas necessárias)
- Evitar queries dentro de loops
- Usar `EXPLAIN ANALYZE` para otimizar queries lentas (>100ms)
- Cache para queries frequentes e pesadas (Redis)
- Soft delete preferível ao hard delete em dados importantes
- Particionar tabelas grandes (>10M linhas)

---

## 6. Segurança

- **Nunca** interpolar input do usuário em queries
- Usar apenas ORM ou prepared statements
- Usuário do banco com permissões mínimas (não usar `root`/`admin` em produção)
- Dados sensíveis (CPF, cartão) encriptados no banco
- Backups automáticos configurados e testados

---

## 7. Soft Delete

Para dados importantes, usar soft delete (marcar como deletado, não remover):

```typescript
// Entidade com soft delete
@Entity()
@Index(['deletedAt']) // importante para filtrar registros ativos
class User {
  @DeleteDateColumn()
  deletedAt: Date | null;
}

// Queries automaticamente filtram deletedAt IS NULL com TypeORM
```

---

## 8. Tipos de Dados Corretos

| Dado | Tipo recomendado |
|------|-----------------|
| ID | UUID |
| Dinheiro/valor | DECIMAL(15,2) — nunca FLOAT |
| Data/hora | TIMESTAMP WITH TIME ZONE |
| Status/enum | VARCHAR com constraint ou ENUM |
| Texto longo | TEXT |
| Flags booleanas | BOOLEAN |
| JSON estruturado | JSONB (PostgreSQL) |
