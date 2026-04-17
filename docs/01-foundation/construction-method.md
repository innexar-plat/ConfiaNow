# Metodo de Construcao Modular

## Objetivo

Criar um metodo de trabalho que permita construir o produto modulo por modulo sem perder contexto, mantendo documentacao, contrato, implementacao e testes sincronizados.

## Principio central

Nao trabalhar por arquivo solto nem por tela solta.

O trabalho sempre acontece por modulo fechado.

Cada modulo deve passar por 6 estados:

1. definicao
2. contrato
3. dados
4. implementacao
5. validacao
6. handoff

O proximo modulo so comeca quando o anterior gera um pacote de saida suficiente.

## Unidade de trabalho

A menor unidade oficial do projeto e o modulo.

Cada modulo precisa fechar:

- objetivo de negocio
- escopo de front
- escopo de back
- escopo de app
- modelo de banco
- endpoints
- testes
- dependencias com outros modulos
- status de pronto para handoff

## Ordem de construcao recomendada

1. 00-core-platform
2. 01-authentication-verification
3. 02-profiles-catalog
4. 03-search-discovery
5. 04-leads-contact-requests
6. 05-badge-trust-scoring
7. 06-reviews-reputation
8. 11-admin-moderation
9. 09-provider-dashboard
10. 10-client-dashboard
11. 07-in-app-communication
12. 08-evidence-documentation
13. 12-notifications-engagement
14. 13-monetization-billing
15. 14-analytics-reporting
16. 15-growth-cms
17. 16-integrations-automation

## Ciclo oficial por modulo

### Etapa 1 - Definicao

Entradas obrigatorias:
- blueprint validado
- README do modulo em `docs/modules/...`
- dependencias conhecidas do modulo anterior

Saidas obrigatorias:
- objetivo do modulo travado
- fora de escopo definido
- atores envolvidos
- fluxos principais do modulo

### Etapa 2 - Contrato

Saidas obrigatorias:
- endpoints completos
- autenticacao e autorizacao por endpoint
- request e response padronizados
- erros previstos
- eventos e webhooks, se existirem

### Etapa 3 - Dados

Saidas obrigatorias:
- entidades e tabelas
- relacoes
- indices principais
- regras de retencao
- campos auditaveis
- migration criada no mesmo avance quando houver mudanca de schema
- migration aplicada localmente e validada antes de seguir
- nome da migration registrado no README do modulo ou no handoff

### Etapa 4 - Implementacao

Saidas obrigatorias:
- backend do modulo
- frontend do modulo
- mobile impactado ou explicitamente adiado
- componentes compartilhados mapeados

### Etapa 5 - Validacao

Saidas obrigatorias:
- testes unitarios
- testes de integracao
- testes de componente
- E2E minimo quando o modulo for critico
- validacao de contrato e typecheck

### Etapa 6 - Handoff

Saidas obrigatorias:
- resumo do que foi entregue
- pendencias aceitas
- riscos remanescentes
- interfaces expostas ao proximo modulo
- decisoes tecnicas tomadas

## Regra para nao perder contexto

Todo modulo encerrado deve produzir um pacote de contexto de handoff.

Esse handoff deve ser salvo em `docs/handoffs/` com nome padronizado do modulo e data, e os handoffs antigos podem ser movidos para `docs/handoffs/archive/`.

Esse pacote deve responder:

- o que este modulo entrega
- quais endpoints agora existem
- quais tabelas ou entidades foram criadas
- quais eventos ele publica
- quais componentes reutilizaveis ele criou
- quais regras de negocio ele passou a impor
- o que o proximo modulo pode assumir como pronto

Sem esse pacote, o modulo nao esta concluido.

## Regra para IA trabalhar bem

Quando a IA iniciar um modulo, ela deve seguir esta ordem:

1. ler blueprint
2. ler docs de foundation relevantes
3. ler README do modulo atual
4. ler handoff do modulo anterior
5. atualizar plano do modulo
6. executar definicao, contrato, dados, implementacao e validacao
7. gerar e aplicar migrations sempre que o schema mudar no modulo atual
8. escrever handoff final do modulo

## Checkpoint obrigatorio anti-salto de modulo

Antes de iniciar qualquer novo modulo, especialmente quando o comando do usuario for apenas `continue` ou equivalente, a IA deve executar um checkpoint formal de sequencia.

Passo obrigatorio:

1. reler `docs/01-foundation/construction-method.md`
2. listar os arquivos existentes em `docs/handoffs/`
3. montar a ordem oficial dos modulos a partir deste arquivo
4. comparar a ordem oficial com os handoffs realmente existentes
5. selecionar o primeiro modulo da ordem oficial que ainda nao possui handoff concluido
6. somente depois abrir o README desse modulo e iniciar o trabalho

Fontes proibidas para decidir o proximo modulo:

- resumo da conversa
- aba aberta no editor
- ultimo modulo citado em mensagem anterior
- memoria temporaria sem revalidacao nos arquivos fonte

Se a IA identificar que um modulo posterior foi entregue antes de um modulo anterior na ordem oficial, ela deve registrar a divergencia no handoff atual e retomar a sequencia a partir do primeiro modulo faltante.

## Regra obrigatoria de migrations

Sempre que um modulo alterar o banco de dados, a migration deve ser feita no mesmo ciclo de trabalho.

Nao deixar alteracao de schema para depois.

Obrigatorio em cada avance com mudanca de banco:

- atualizar o schema
- gerar a migration correspondente
- aplicar a migration localmente
- validar seed, build e testes impactados
- registrar no handoff qual migration foi criada

Se a migration ainda nao puder ser aplicada por dependencia externa real, o modulo nao pode ser marcado como pronto. Nesse caso deve ficar em aberto com bloqueio explicitado.

## Revisao obrigatoria de completude ao fim do modulo

Antes de encerrar um modulo, a IA deve revisar explicitamente se existe algo faltando em:

- UI web
- API
- banco de dados
- app mobile impactado ou adiado com justificativa
- componentes compartilhados
- estados de erro, loading e vazio
- autorizacao e seguranca
- testes unitarios, integracao, componente e E2E minimo
- documentacao e handoff

Se qualquer uma dessas areas estiver incompleta, o modulo deve permanecer em aberto ou registrar pendencia aceita no handoff.

## O que nao fazer

- nao abrir varios modulos ao mesmo tempo
- nao implementar endpoint sem documentacao minima
- nao criar tabela sem o modulo explicitar responsabilidade
- nao alterar schema sem gerar migration no mesmo avance
- nao seguir para o proximo modulo sem handoff
- nao escolher o proximo modulo sem comparar `construction-method.md` com `docs/handoffs/`
- nao deixar teste como tarefa futura padrao

## Definicao de pronto do modulo

Um modulo esta pronto quando:

- documentacao esta atualizada
- contrato da API esta claro
- modelo de dados esta fechado
- migrations do modulo foram criadas e aplicadas quando houve mudanca de schema
- implementacao minima existe
- testes minimos passaram
- handoff foi escrito
- revisao de completude foi executada e registrada