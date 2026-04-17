# Estrategia de Testes

## Camadas obrigatorias

- unitario: regras de negocio, calculo de selo, validacoes, filtros, ranqueamento
- componente: formularios, listagens, estados visuais criticos
- integracao: API + banco + storage mockado + filas quando aplicavel
- contrato: OpenAPI e schemas compartilhados
- E2E: jornadas criticas do cliente, negocio e admin

## Regra por modulo

Todo modulo documentado deve prever:

- testes unitarios de servicos
- testes de integracao de endpoints
- testes de componente front
- pelo menos 1 fluxo E2E se o modulo for critico para o negocio

## Fluxos E2E minimos

- cadastro e verificacao de negocio
- busca publica e abertura de lead
- resposta do negocio ao lead
- submissao e aprovacao manual de avaliacao
- revisao administrativa e mudanca de selo

## Gate minimo de CI

- lint
- typecheck
- testes unitarios e de integracao
- validacao do OpenAPI
- E2E smoke dos fluxos criticos