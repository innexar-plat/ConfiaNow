# Checklist Final de Release

## Objetivo

Fechar a prontidao operacional do produto depois da conclusao dos modulos funcionais.

## Gate tecnico obrigatorio

- `npm run typecheck`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run validate:release`

## Cobertura minima exigida

- gate automatico de cobertura no root para linhas, funcoes e statements em 90% ou mais
- smoke E2E obrigatorio para web publica, autenticacao admin e API publica

## Smoke E2E obrigatorio

- home publica com busca renderizada
- pagina de trust badges acessivel
- signin web acessivel
- acesso admin no web validado por fluxo demo protegido
- navegacao admin em settings, analytics, pages e integrations
- API publica respondendo health, config e trust badges

## Verificacoes de banco e ambiente

- migrations locais aplicadas sem erro
- `.env.example` alinhado ao setup necessario
- seed local disponivel para conta admin e dados minimos de navegacao

## Verificacoes operacionais antes de publicar

- build de API concluida
- build do web concluida
- CI do workflow principal verde
- endpoints publicos respondendo sem erro 5xx
- area admin autenticada navegavel

## O que este checklist nao garante

- comportamento de provedores externos reais em producao
- monitoracao pos-deploy e rollback automatico
- cobertura total de todos os ramos de interface

## Comando de fechamento

```bash
npm run validate:release
```