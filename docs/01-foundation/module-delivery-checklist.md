# Checklist de Entrega por Modulo

## Antes de codar

- README do modulo atualizado
- objetivo do modulo travado
- fora de escopo definido
- dependencias mapeadas
- endpoints listados
- tabelas e entidades listadas
- estrategia de testes definida

## Durante a construcao

- backend respeita o contrato documentado
- frontend usa estados e fluxos previstos
- app foi mapeado como entregue ou adiado
- schemas e tipos compartilhados foram atualizados
- migrations foram geradas no mesmo avance quando houve mudanca no banco
- migrations foram aplicadas localmente antes de seguir
- logs e erros seguem o padrao do projeto

## Antes de considerar pronto

- testes unitarios implementados
- testes de integracao implementados
- testes de componente implementados
- fluxo E2E critico implementado ou justificado
- documentacao do modulo atualizada com o que foi realmente entregue
- riscos e pendencias registrados
- handoff do modulo criado
- revisao final de completude executada
- UI web revisada com estados principais completos
- API revisada com endpoints, erros e autorizacao completos
- banco revisado com entidades, relacoes e migracoes documentadas
- nome da migration criada registrado no modulo ou handoff
- app revisado como entregue ou adiado com justificativa

## Bloqueadores de saida

- endpoint sem contrato
- regra de negocio sem teste minimo
- tela critica sem estados de erro e loading
- migracao de banco sem documentacao
- alteracao de schema sem migration aplicada no mesmo avance
- modulo sem handoff
- modulo sem revisao final de completude