# Handoffs de Modulos

Esta pasta guarda os pacotes de contexto de saida de cada modulo.

## Regra

- todo modulo finalizado deve gerar um handoff aqui
- o proximo modulo deve sempre ler o handoff do modulo anterior antes de comecar
- handoffs antigos podem ser movidos para `archive/`

## Nome recomendado

```text
NN-modulo-nome-YYYY-MM-DD.md
```

Exemplo:

```text
01-authentication-verification-2026-04-17.md
```

## Conteudo minimo

- o que foi entregue
- endpoints existentes
- tabelas e entidades criadas
- componentes compartilhados criados
- regras de negocio ativas
- pendencias aceitas
- riscos remanescentes
- revisao de completude do modulo
- o que o proximo modulo pode assumir como pronto

## Status atual dos handoffs

- 00-core-platform: entregue
- 01-authentication-verification: entregue
- 02-profiles-catalog: entregue
- 03-search-discovery: entregue
- 04-leads-contact-requests: entregue
- 05-badge-trust-scoring: entregue
- 06-reviews-reputation: entregue
- 07-in-app-communication: entregue
- 08-evidence-documentation: entregue
- 09-provider-dashboard: entregue
- 10-client-dashboard: entregue
- 11-admin-moderation: entregue
- 12-notifications-engagement: entregue
- 13-monetization-billing: entregue
- 14-analytics-reporting: entregue
- 14-analytics-reporting: entregue
- 15-growth-cms: entregue
- 16-integrations-automation: entregue

## Observacao de sequencia

Os modulos 09 e 10 ja foram regularizados com handoff completo. A escolha do proximo modulo continua devendo seguir a ordem oficial e a ausencia de handoff.

## Regra operacional para escolher o proximo modulo

Sempre que o trabalho avancar por `continue` ou comando equivalente, o proximo modulo deve ser escolhido assim:

1. ler `docs/01-foundation/construction-method.md`
2. listar os handoffs existentes nesta pasta
3. encontrar o primeiro modulo da ordem oficial que ainda nao tem handoff
4. iniciar esse modulo e apenas esse modulo

Nao usar resumo de conversa, contexto de editor ou memoria de chat como fonte unica para escolher a sequencia.