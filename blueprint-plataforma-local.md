# Blueprint — Plataforma de Negócios e Serviços Locais Verificados

> Versão 1.0 | Status: Conceito / Pré-MVP

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Proposta de Valor](#2-proposta-de-valor)
3. [Personas e Usuários](#3-personas-e-usuários)
4. [Arquitetura de Módulos](#4-arquitetura-de-módulos)
5. [Módulo 00 — Core Platform](#5-módulo-00--core-platform)
6. [Módulo 01 — Autenticação e Verificação](#6-módulo-01--autenticação-e-verificação)
7. [Módulo 02 — Perfis e Catálogo](#7-módulo-02--perfis-e-catálogo)
8. [Módulo 03 — Busca e Descoberta](#8-módulo-03--busca-e-descoberta)
9. [Módulo 04 — Leads, Contato e Solicitações](#9-módulo-04--leads-contato-e-solicitações)
10. [Módulo 05 — Selo, Qualificação e Confiança](#10-módulo-05--selo-qualificação-e-confiança)
11. [Módulo 06 — Avaliações e Reputação](#11-módulo-06--avaliações-e-reputação)
12. [Módulo 07 — Comunicação In-App](#12-módulo-07--comunicação-in-app)
13. [Módulo 08 — Evidências e Documentação](#13-módulo-08--evidências-e-documentação)
14. [Módulo 09 — Painel do Prestador](#14-módulo-09--painel-do-prestador)
15. [Módulo 10 — Painel do Cliente](#15-módulo-10--painel-do-cliente)
16. [Módulo 11 — Administração e Moderação](#16-módulo-11--administração-e-moderação)
17. [Módulo 12 — Notificações e Engajamento](#17-módulo-12--notificações-e-engajamento)
18. [Módulo 13 — Monetização](#18-módulo-13--monetização)
19. [Módulo 14 — Analytics e Relatórios](#19-módulo-14--analytics-e-relatórios)
20. [Módulo 15 — Growth, Ads e Aquisição](#20-módulo-15--growth-ads-e-aquisição)
21. [Módulo 16 — Suporte e Atendimento Operacional](#21-módulo-16--suporte-e-atendimento-operacional)
22. [Módulo 17 — Trust, Safety e Risk](#22-módulo-17--trust-safety-e-risk)
23. [Módulo 18 — Financeiro Interno e Billing Ops](#23-módulo-18--financeiro-interno-e-billing-ops)
24. [Módulo 19 — CMS, SEO e Conteúdo Público](#24-módulo-19--cms-seo-e-conteúdo-público)
25. [Módulo 20 — Integrações e Automação](#25-módulo-20--integrações-e-automação)
26. [Regras de Negócio Gerais](#26-regras-de-negócio-gerais)
27. [Fluxos Críticos](#27-fluxos-críticos)
28. [Stack Tecnológica Sugerida](#28-stack-tecnológica-sugerida)
29. [Fases de Lançamento (Roadmap)](#29-fases-de-lançamento-roadmap)
30. [Métricas de Sucesso (KPIs)](#30-métricas-de-sucesso-kpis)
31. [Riscos e Mitigações](#31-riscos-e-mitigações)

---

## 1. Visão Geral

**Nome provisório:** ConfiaNow (ou similar — definir na fase de branding)

**Missão:** Conectar clientes verificados a empresas e profissionais locais verificados, reduzindo o risco de golpes e escolhas ruins por meio de verificação rigorosa, selo de confiança, curadoria e reputação baseada em evidências.

**Mercado-alvo inicial:** Serviços domésticos e técnicos em cidades de médio porte do litoral de São Paulo (Praia Grande, Santos, São Vicente, Guarujá). Expansão progressiva após validação.

**Diferencial central:** A plataforma não intermedeia pagamento nem contrato; ela intermedeia confiança. Nenhum negócio ganha visibilidade qualificada sem verificação real, análise operacional e aderência aos padrões da marca.

---

## 2. Proposta de Valor

### Para o cliente
- Encontrar apenas empresas e profissionais com verificação real
- Comparar negócios locais com mais segurança do que em diretórios e redes sociais
- Ver selo próprio da marca como indicador de qualidade e confiabilidade
- Avaliações moderadas e evidências reais de atendimento
- Contato rápido com negócios relevantes sem depender de busca dispersa

### Para o prestador
- Mais visibilidade do que grupos de WhatsApp e anúncios avulsos
- Perfil profissional com portfólio, prova social e histórico verificável
- Leads qualificados em vez de tráfego genérico
- Credencial de negócio verificado que gera confiança imediata
- Associação à marca da plataforma como ativo comercial recorrente

---

## 3. Personas e Usuários

### 3.1 Cliente

- Pessoa física que busca serviços domésticos, técnicos ou profissionais locais
- Principal dor: medo de golpe, prestador que some, serviço mal feito e sem garantia
- Comportamento: pesquisa no celular, compara preços, lê avaliações antes de contratar

### 3.2 Prestador Individual (Autônomo)

- Profissional autônomo: eletricista, encanador, diarista, pintor, técnico em informática etc.
- Principal dor: dificuldade de se destacar, calotes, falta de credibilidade formal
- Comportamento: usa WhatsApp para negociar, tem dificuldade com burocracia

### 3.3 Empresa / Negócio Local

- Pequena empresa prestadora de serviços com CNPJ
- Principal dor: concorrência com autônomos informais, falta de canal de vendas digital
- Comportamento: já tem alguma presença online, busca escalar atendimentos

### 3.4 Administrador da Plataforma

- Equipe interna responsável por verificação, moderação e suporte
- Funções: aprovar cadastros, revisar denúncias, monitorar abusos

---

## 4. Arquitetura de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE ACESSO                        │
│          App Mobile (iOS/Android) + Web (PWA)                │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     MÓDULOS CORE                             │
│                                                              │
│  [00] Core Platform   [01] Autenticação [02] Perfis          │
│  [03] Busca           [04] Leads        [05] Selo/Confiança  │
│  [06] Avaliações      [07] Comunicação  [08] Evidências      │
│  [09] Painel Prest.   [10] Painel Cli.  [11] Admin           │
│  [12] Notificações    [17] Trust/Risk   [20] Integrações     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  MÓDULOS DE SUPORTE                          │
│  [13] Monetização    [14] Analytics     [15] Growth/Ads      │
│  [16] Suporte Ops    [18] Billing Ops   [19] CMS/SEO         │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Módulo 00 — Core Platform

Este módulo consolida as capacidades transversais da plataforma. Ele não é um recurso isolado para o usuário final, mas a fundação técnica e operacional que sustenta todos os demais módulos.

### 5.1 Identidade, Papéis e Permissões

- Controle de acesso por papéis: cliente, prestador individual, empresa, moderador, suporte, financeiro e administrador
- Permissões granulares por ação crítica (aprovar cadastro, conceder selo, julgar denúncia, alterar configuração)
- Sessões, revogação de dispositivos e trilha de login

### 5.2 Configuração da Plataforma

- Parâmetros globais por categoria, cidade, região e operação
- Regras configuráveis de assinatura, critérios de verificação, prioridade de ranqueamento e renovação do selo
- Gestão de banners, textos institucionais, selos e regras de elegibilidade

### 5.3 Auditoria, Logs e Compliance

- Log imutável de ações críticas: aprovações, bloqueios, concessão ou remoção de selo, alterações financeiras e mudanças de configuração
- Versionamento de termos de uso, política de privacidade e consentimentos LGPD
- Registro de aceite com timestamp, IP, device e versão do documento aceito

### 5.4 Estratégia de Tenancy

- O MVP não será multi-tenant completo; a operação inicial será de tenant único
- A arquitetura deve nascer tenant-ready para expansão futura por praça, unidade operacional, franquia ou parceiro
- Todas as entidades estratégicas devem prever segmentação por `city_id`, `region_id` e `operation_unit_id` quando aplicável
- Branding, billing e isolamento completo por tenant ficam fora do MVP e só entram se houver necessidade real de white-label ou operação multiempresa

### 5.5 Serviços Transversais

- Storage centralizado de documentos, fotos, evidências e materiais de perfil
- Filas, jobs assíncronos e webhooks
- Feature flags para rollout gradual por cidade, nicho ou grupo de usuários
- Observabilidade: monitoramento, alertas, tracing e tratamento de incidentes
- Gestão de idioma, timezone, moeda e regionalização

---

## 6. Módulo 01 — Autenticação e Verificação

### 6.1 Cadastro do Cliente

**Dados obrigatórios:**
- Nome completo
- CPF (validado via API — ex: SerpAPI, Receita Federal)
- E-mail + celular (com dupla verificação por código OTP)
- Data de nascimento
- Foto de rosto (biometria leve — comparação com documento)

**Regras de negócio:**
- Um CPF = uma conta. Tentativa de duplicata bloqueia o cadastro e gera alerta.
- Celular verificado é obrigatório antes de iniciar contato qualificado com um negócio.
- Conta de cliente não paga taxa de cadastro.
- Conta é suspensa automaticamente após 3 avaliações com denúncia validada.

---

### 6.2 Cadastro do Prestador Individual

**Dados obrigatórios:**
- Nome completo
- CPF (validado)
- RG ou CNH (documento com foto — upload + validação manual ou OCR)
- Selfie com documento (biometria facial)
- Endereço residencial (CEP + número)
- Categoria de atuação (ex: elétrica, hidráulica, limpeza etc.)
- Área de cobertura (raio em km ou bairros/cidades selecionadas)

**Dados opcionais (aumentam pontuação de confiança):**
- Certificados ou cursos (upload de imagem)
- CREA, CRO, CRM ou registro de classe quando aplicável
- Referências de clientes externos (nome + telefone para checagem)

**Verificação de antecedentes:**
- Integração com serviço de checagem de antecedentes criminais (ex: Dataprev, serviços terceirizados como BrasilChecks)
- Resultado: APROVADO / REPROVADO / PENDENTE
- Prestador com condenação por estelionato, violência doméstica ou crimes patrimoniais: bloqueio permanente

**Taxa de verificação:**
- Cobrança única de R$ 29,90 a R$ 49,90 no cadastro
- Cobre o custo operacional da verificação
- Não reembolsável após início do processo

**Status do prestador:**
- `PENDENTE` — aguardando análise (prazo: até 72h úteis)
- `VERIFICADO` — aprovado, pode receber leads e visibilidade qualificada
- `SUSPENSO` — restrição temporária por denúncia ou inadimplência
- `BLOQUEADO` — banimento permanente

**Regras de negócio:**
- Prestador não verificado não aparece nas buscas.
- Revalidação obrigatória a cada 12 meses.
- Mudança de categoria exige nova análise parcial.
- Prestador com mais de 30 dias sem atividade recebe e-mail de reativação.

---

### 6.3 Cadastro de Empresa

**Dados obrigatórios:**
- CNPJ (validado na Receita Federal)
- Razão social e nome fantasia
- Endereço comercial
- Responsável legal: nome + CPF + cargo
- Contrato social ou certificado MEI (upload)
- E-mail empresarial + telefone comercial

**Verificação adicional:**
- Situação cadastral ativa na Receita Federal
- Ausência de débitos no SERASA (opcional, mas influencia score de confiança)

**Taxa de verificação empresa:**
- R$ 79,90 (única)

---

## 7. Módulo 02 — Perfis e Catálogo

### 7.1 Perfil do Prestador

**Campos exibidos publicamente:**
- Nome (ou nome comercial)
- Foto de perfil (validada — não pode ser imagem genérica)
- Categoria principal + categorias secundárias
- Descrição de serviços (máximo 500 caracteres)
- Área de cobertura
- Portfólio: até 20 fotos de serviços realizados
- Avaliação média + número de avaliações
- Taxa de resposta (% de leads respondidos em até 24h)
- Tempo médio de resposta
- Membro desde [data]
- Selos: `Verificado`, `Verificado Pro`, `Top Avaliado`, `Resposta Rápida`, `Sem Ocorrências`

**Campos privados (visíveis apenas para a plataforma):**
- Score interno de confiança (0–100)
- Histórico de denúncias recebidas
- Resultado de verificação de antecedentes

### 7.2 Perfil do Cliente

**Campos exibidos para prestadores:**
- Primeiro nome + inicial do sobrenome
- Número de contatos iniciados
- Taxa de resposta e engajamento no contato
- Avaliação média dada aos prestadores

### 7.3 Catálogo de Serviços

Cada prestador pode criar até 20 serviços com:
- Título do serviço
- Categoria
- Descrição detalhada
- Faixa de preço (mínimo e máximo) ou "orçamento sob consulta"
- Fotos do tipo de serviço
- Prazo estimado de execução
- Disponibilidade de agenda (dias e horários)
- Formas de contato aceitas: formulário, WhatsApp, telefone, site

---

## 8. Módulo 03 — Busca e Descoberta

### 8.1 Busca Principal

**Filtros disponíveis:**
- Localização (CEP, bairro, cidade ou "próximo a mim")
- Categoria de serviço
- Faixa de preço
- Avaliação mínima (ex: 4 estrelas ou mais)
- Disponibilidade (ex: "disponível hoje")
- Apenas verificados (padrão: sim)
- Tipo de atendimento: presencial, remoto, emergencial

**Ordenação:**
- Relevância (padrão — algoritmo interno)
- Menor faixa de preço
- Melhor avaliado
- Mais próximo
- Resposta mais rápida

### 8.2 Algoritmo de Relevância

Fatores e pesos:
- Distância ao cliente: 25%
- Score de avaliação: 25%
- Taxa de resposta a leads: 20%
- Completude do perfil: 15%
- Qualidade da verificação e selo ativo: 10%
- Destaque pago: 5% (bônus de posição)

**Regra:** Prestadores suspensos ou não verificados são excluídos de todos os resultados.

### 8.3 Descoberta Passiva

- Seção "Em alta na sua região" (baseada em contatos e interesse recentes)
- Seção "Bem avaliados perto de você"
- Categorias em destaque (sazonais — ex: "Ar-condicionado" no verão)
- Busca por voz (mobile)

---

## 9. Módulo 04 — Leads, Contato e Solicitações

### 9.1 Fluxo de Solicitação de Lead

1. Cliente encontra prestador e clica em "Entrar em contato" ou "Solicitar atendimento"
2. Preenche formulário:
   - Descrição do problema/serviço
   - Fotos (opcional, até 5)
       - Bairro/cidade do atendimento
       - Data e horário preferidos (até 3 opções)
   - Urgência: normal / urgente / emergência
3. Sistema notifica o prestador (push + e-mail)
4. Prestador tem até **24h** para responder, aceitar o contato ou recusar
5. Cliente escolhe continuar pelo chat da plataforma, WhatsApp, telefone ou site oficial do negócio
6. Plataforma registra a origem do lead e acompanha resposta, atendimento e eventual avaliação

### 9.2 Regras de Lead

- Cliente pode abrir solicitações para até 3 negócios por necessidade, evitando spam excessivo
- Lead expira automaticamente em 72h se não houver resposta do negócio
- Negócio pode aceitar, responder com orientações iniciais ou recusar o lead com justificativa
- A plataforma não participa da negociação comercial nem do fechamento do serviço

### 9.3 Regras de Contato

- Dados de contato completos do negócio podem ser liberados após lead validado ou conforme plano contratado
- Toda interação iniciada pela plataforma deve ser registrada para fins de analytics, moderação e ranking
- Mensagens automatizadas de boas-vindas e confirmação de recebimento podem ser enviadas pelo sistema

- Leads ignorados, recusas excessivas e resposta fora do SLA impactam score, visibilidade e elegibilidade ao selo

---

## 10. Módulo 05 — Selo, Qualificação e Confiança

### 10.1 Selo da Marca

- O selo da plataforma é o principal ativo de diferenciação comercial
- O uso do selo depende de verificação concluída, documentação válida e manutenção dos padrões mínimos de qualidade
- O selo pode ser suspenso, rebaixado ou removido em caso de fraude, baixa performance ou denúncias confirmadas
- A assinatura mensal não compra categoria de selo; ela habilita presença comercial e benefícios, mas o nível do selo depende de mérito verificado

### 10.2 Critérios de Qualificação

- Identidade validada
- Documento pessoal ou societário validado
- Presença local e área de atuação confirmadas
- Perfil completo com portfólio e descrição consistente
- Boa taxa de resposta e ausência de ocorrências graves

### 10.3 Pontuação de Confiança do Negócio (0–100)

Base sugerida para cálculo do selo:
- Cadastro completo e perfil preenchido: 10 pontos
- Documentação validada: 20 pontos
- Identidade do responsável validada: 15 pontos
- Portfólio e evidências mínimas aprovadas: 10 pontos
- Taxa de resposta dentro do SLA: 10 pontos
- Avaliações verificadas positivas: 20 pontos
- Tempo ativo e consistência operacional: 5 pontos
- Ausência de denúncias procedentes e penalidades graves: 10 pontos

Regras:
- A pontuação é revisada continuamente pela plataforma
- Denúncias procedentes, documentação vencida ou fraude derrubam a pontuação imediatamente
- Ouro exige consistência, não apenas volume de atendimentos

### 10.4 Níveis de Confiança

- `Bronze` — negócio verificado, documentação aprovada e pontuação mínima para entrada
- `Prata` — negócio consistente, com avaliações verificadas positivas, boa responsividade e histórico operacional saudável
- `Ouro` — negócio modelo, com padrão alto sustentado no tempo, excelente reputação e baixa incidência de ocorrências
- `Em Revisão` — queda de qualidade, denúncias, inconsistência documental ou perda temporária de elegibilidade

### 10.5 Critérios por Categoria do Selo

**Bronze**
- Faixa de 50 a 69 pontos
- Cadastro concluído
- Documentação obrigatória validada
- Perfil ativo com descrição, categoria e canais de contato consistentes

**Prata**
- Faixa de 70 a 84 pontos
- Mínimo de 5 avaliações verificadas positivas
- Janela mínima de 45 dias de operação ativa após entrada na plataforma
- Boa taxa de resposta a leads
- Ausência de ocorrências graves recentes

**Ouro**
- Faixa de 85 a 100 pontos
- Mínimo de 15 avaliações verificadas positivas
- Janela mínima de 120 dias de operação ativa e consistente
- Avaliações verificadas de alta qualidade com evidências reais
- Documentação sempre em dia
- Padrão de atendimento e reputação acima da média da categoria

### 10.6 Regras de Evolução entre Categorias

Regras iniciais do MVP:
- Bronze para Prata: mínimo de 5 avaliações verificadas publicadas, nota média igual ou superior a 4,2 e pelo menos 45 dias corridos de operação ativa na plataforma
- Prata para Ouro: mínimo de 15 avaliações verificadas publicadas, nota média igual ou superior a 4,6 e pelo menos 120 dias corridos de operação ativa na plataforma
- Para manter Prata ou Ouro, o negócio deve preservar a pontuação mínima da faixa, documentação válida e ausência de ocorrências graves procedentes
- A operação pode elevar os thresholds por categoria no futuro, mas o MVP começa com regra única para simplificar governança

### 10.7 Regras do Selo

- O selo não é permanente; ele depende de revalidação periódica
- O negócio não pode usar o selo fora das diretrizes visuais e comerciais da marca
- A plataforma pode exigir documentação complementar a qualquer momento
- Selo removido por fraude ou falsidade documental gera banimento e bloqueio de nova tentativa
- O selo pode subir ou descer de categoria conforme a pontuação real do negócio

### 10.8 Perda Automática vs Revisão Manual do Selo

**Perda automática ou bloqueio imediato:**
- Fraude de identidade confirmada
- Falsidade documental confirmada
- Uso indevido ou falsificação do selo da marca em canais externos
- Documento crítico vencido e não regularizado dentro do prazo operacional definido
- Banimento definitivo por decisão anterior já transitada internamente

**Rebaixamento ou suspensão após revisão manual:**
- Queda sustentada da nota média abaixo do mínimo da faixa
- Acúmulo de denúncias procedentes em janela curta
- Queda relevante de responsividade a leads
- Evidências de atendimento incompatíveis com o padrão prometido no perfil
- Reclamações recorrentes sobre conduta, qualidade ou comunicação

### 10.9 Matriz Operacional de Eventos e Consequências

| Evento | Consequência operacional | Prazo de correção | Impacto no selo |
|--------|--------------------------|-------------------|-----------------|
| Documento complementar pendente | Perfil entra em acompanhamento | 7 dias corridos | Mantém categoria atual até o vencimento do prazo |
| Documento crítico vencido | Bloqueio preventivo do perfil até regularização | 3 dias corridos | Selo suspenso automaticamente |
| Perfil incompleto ou inconsistência leve de cadastro | Notificação operacional | 5 dias corridos | Sem perda imediata; impede subida de categoria |
| Nota média abaixo do mínimo da faixa por período contínuo | Revisão manual do histórico | 15 dias corridos para recuperação | Pode rebaixar 1 categoria |
| Taxa de resposta abaixo do SLA por 30 dias | Advertência operacional | 15 dias corridos | Pode rebaixar 1 categoria ou impedir evolução |
| 2 denúncias procedentes em até 90 dias | Abertura de revisão formal | Imediato, com 48h para defesa | Rebaixamento ou suspensão após análise |
| Suspeita de avaliação manipulada | Congelamento das avaliações relacionadas | 5 dias úteis para apuração | Congela evolução do selo até decisão |
| Uso indevido do selo em redes sociais, site ou material comercial | Bloqueio preventivo e notificação jurídica/operacional | 48h para retirada quando aplicável | Suspensão imediata ou remoção definitiva em caso confirmado |
| Falsidade documental confirmada | Encerramento do cadastro | Sem prazo de correção | Remoção automática do selo e banimento |
| Fraude de identidade confirmada | Encerramento do cadastro | Sem prazo de correção | Remoção automática do selo e banimento |
| Queda recorrente de qualidade com múltiplas evidências | Revisão manual ampliada | 7 dias úteis | Rebaixamento, suspensão ou remoção conforme gravidade |
| Melhora sustentada após período de correção | Reavaliação operacional | 30 a 60 dias de consistência | Pode recuperar categoria anterior ou voltar a evoluir |

Regras de aplicação:
- Suspensão automática deve ser reservada para fatos objetivos, verificáveis e de alto risco para a credibilidade da marca
- Rebaixamento manual deve priorizar contexto, recorrência e material probatório, evitando punição desproporcional por evento isolado
- Todo evento com impacto no selo deve gerar registro de auditoria, motivo, data e responsável pela decisão

### 10.10 Transparência com o Usuário

- O selo indica verificação e curadoria, não garantia absoluta de resultado do serviço
- A plataforma recomenda contratação consciente, comparação entre perfis e registro do atendimento
- Todo critério de qualificação deve ser publicamente explicável em linguagem simples
- A página pública do selo deve explicar claramente a diferença entre Bronze, Prata e Ouro

---

## 11. Módulo 06 — Avaliações e Reputação

### 11.1 Avaliação do Serviço (Cliente → Prestador)

Disponível após interação verificada com o negócio, atendimento confirmado por uma das partes ou envio de evidências mínimas para moderação.

**Campos:**
- Nota geral (1–5 estrelas)
- Sub-notas: Pontualidade / Qualidade do trabalho / Comunicação / Limpeza
- Comentário (até 300 caracteres)
- Fotos do resultado (antes/depois — opcional, mas incentivado)
- Indicaria para amigos? (Sim / Não)
- Selo `Avaliação Verificada` após aprovação manual da equipe

### 11.2 Avaliação do Cliente (Prestador → Cliente)

- Nota geral (1–5 estrelas)
- Comentário privado (visível apenas para a plataforma)
- Indicadores: "Descreveu bem a necessidade" / "Respeitoso" / "Respondeu ao contato"
- Objetivo principal: proteger o ecossistema contra abuso, spam e mau comportamento recorrente
- Exibição pública opcional e resumida: `Cliente verificado` e `Bom histórico de contato`, sem expor detalhes sensíveis

### 11.3 Verificação de Autenticidade das Avaliações

- Avaliação só é possível após lead validado, contato confirmado ou revisão manual com evidências mínimas
- Fotos passam por análise de metadados (data/hora/localização compatível com o serviço)
- Sistema detecta padrão de avaliações em sequência do mesmo IP ou device (suspeita de manipulação)
- No MVP, 100% das avaliações passam por verificação manual da equipe antes de publicação
- A verificação manual considera coerência do relato, evidências visuais, contexto do lead e sinais de fraude
- Denúncia de avaliação falsa: revisão manual em até 5 dias úteis

**Provas aceitas na validação manual:**
- Fotos do antes e depois do serviço
- Prints de conversa que demonstrem continuidade do atendimento
- Comprovante de visita, execução ou comparecimento quando disponível
- Áudio, vídeo curto ou depoimento complementar enviado pelo cliente
- Evidências contextuais do lead no histórico interno da plataforma
- Comprovantes simples do negócio, como ordem de serviço, recibo ou registro operacional sem expor dados sensíveis desnecessários

**Regras para aceite da prova:**
- A evidência deve ser coerente com o serviço, a data aproximada e o contexto do lead
- Provas editadas, genéricas, duplicadas ou sem relação clara com o atendimento podem ser recusadas
- Quando houver dúvida razoável, a equipe pode solicitar complementação antes da publicação

### 11.4 Fluxo de Avaliação Verificada Manualmente

1. Cliente ou negócio envia avaliação após contato validado
2. Sistema marca a avaliação como `Pendente de verificação`
3. Equipe revisa texto, imagens, provas aceitas, contexto do atendimento e histórico das partes
4. Avaliação é `Aprovada`, `Solicitada complementação` ou `Rejeitada`
5. Apenas avaliações aprovadas recebem o selo `Avaliação Verificada` e entram no score público

### 11.5 Score de Confiança do Prestador (0–100)

Composto por:
- Média de avaliações (40%)
- Taxa de resposta a leads (20%)
- Qualidade e consistência da verificação (15%)
- Tempo de resposta (10%)
- Histórico de denúncias, suspensões e penalidades (15% — negativo)

**Faixas de confiança:**
- 85–100: Elegível a Ouro, sujeito a revisão operacional
- 70–84: Elegível a Prata
- 50–69: Elegível a Bronze
- 40–59: Alerta amarelo (notificação interna para melhorar)
- 0–39: Revisão obrigatória pela moderação

---

## 12. Módulo 07 — Comunicação In-App

### 12.1 Chat

- Mensagens de texto entre cliente e prestador após solicitação de lead iniciada
- Envio de fotos e arquivos (PDF, imagens — máximo 10 MB por arquivo)
- Indicador de leitura (visualizado / não visualizado)
- Todo o histórico de mensagens é armazenado e pode ser acessado pela moderação em caso de denúncia ou auditoria

### 12.2 Regras de Comunicação

- Compartilhamento de contato pode ser controlado pela plataforma conforme regra do plano e estágio do lead
- Dados de contato podem ser liberados após validação do lead ou por ação explícita do cliente no perfil do negócio
- Mensagens com linguagem abusiva geram alerta automático e podem levar à suspensão

### 12.3 Chamadas de Voz/Vídeo (Fase 2)

- Disponível apenas após lead aceito
- Gravação opcional para registro operacional e auditoria (mediante aceite de ambas as partes)

---

## 13. Módulo 08 — Evidências e Documentação

### 13.1 Evidências de Confiança

- Documentos de identidade, societários e comprovação de atuação local
- Certificados, licenças e registros profissionais quando aplicável
- Portfólio, fotos de serviços e evidências públicas de legitimidade do negócio
- Histórico de renovações, revalidações e ocorrências relacionadas ao selo

### 13.2 Validade e Armazenamento

- Documentação armazenada com retenção compatível com obrigações legais e operacionais
- Evidências relevantes podem ser acessadas pela operação para revisão, auditoria e moderação
- Histórico de mudanças do perfil e da qualificação fica disponível internamente

### 13.3 Uso Operacional

- A documentação serve para verificar autenticidade, sustentar o selo e justificar decisões da moderação
- A plataforma pode solicitar reenvio, atualização ou complementação de qualquer evidência vencida ou inconsistente

---

## 14. Módulo 09 — Painel do Prestador

### 14.1 Dashboard Principal

- Leads recebidos, respondidos e convertidos em contato
- Visualizações de perfil e cliques em contato
- Solicitações de atendimento em aberto
- Score de confiança atual com dicas de melhoria
- Status do selo e pendências de verificação

### 14.2 Gestão de Serviços

- Criar, editar e desativar serviços do catálogo
- Bloquear períodos de indisponibilidade
- Aceitar ou recusar solicitações com justificativa
- Configurar canais de contato e preferências de atendimento

### 14.3 Assinatura e Cobrança

- Plano atual, valor mensal e status da assinatura
- Histórico de cobranças, inadimplência e reativações
- Contratação de destaque, renovação do selo e add-ons comerciais
- Relatórios de leads e retorno percebido

### 14.4 Reputação

- Todas as avaliações recebidas
- Possibilidade de resposta pública a avaliações (máximo 200 caracteres)
- Histórico de penalidades e advertências

---

## 15. Módulo 10 — Painel do Cliente

### 15.1 Dashboard

- Contatos recentes e negócios salvos
- Histórico de leads enviados
- Atalhos para categorias mais usadas

### 15.2 Histórico e Favoritos

- Lista de prestadores favoritos
- Histórico completo de contatos, avaliações e respostas recebidas
- Possibilidade de recontatar com um clique

### 15.3 Denúncias e Suporte

- Denúncia de perfil, atendimento inadequado ou uso indevido do selo
- Upload de evidências (fotos, prints de chat)
- Acompanhamento do status da análise de moderação

---

## 16. Módulo 11 — Administração e Moderação

### 16.1 Painel Administrativo

- Fila de cadastros de prestadores para aprovação/reprovação
- Gestão de denúncias e revisões em aberto
- Fila manual de avaliações pendentes de validação
- Monitoramento de alertas automáticos (padrões suspeitos)
- Gestão de usuários (buscar, suspender, bloquear)
- Controle de selos, planos e elegibilidade

### 16.2 Fluxo de Verificação Manual

1. Recebe cadastro do prestador com documentos
2. Valida dados via APIs (CPF, CNPJ, antecedentes)
3. Verifica biometria facial (ferramenta de comparação)
4. Aprova ou solicita documentação adicional
5. Em caso de reprovação: notifica com motivo e possibilidade de recurso (1 vez)

### 16.3 Fluxo de Validação Manual das Avaliações

1. Avaliação entra na fila com status `Pendente`
2. Moderador verifica existência do lead, coerência do texto e material enviado
3. Imagens e evidências são checadas manualmente
4. Avaliação é aprovada, recusada ou devolvida para complementação
5. Avaliações aprovadas passam a influenciar o selo e o score do negócio

### 16.4 Gestão de Denúncias e Revisões

**Prazo:** Denúncias devem ser analisadas em até **5 dias úteis**

**Etapas:**
1. Cliente abre denúncia com descrição e evidências
2. Prestador é notificado e tem 48h para responder
3. Moderador analisa o material, histórico e contexto do perfil
4. Decisão: improcedente / advertência / suspensão / remoção do selo / banimento
5. Usuário é notificado com a decisão e, quando aplicável, prazo de correção

**Motivos típicos de revisão manual do selo:**
- Queda gradual de reputação
- Denúncias de qualidade de atendimento
- Suspeita de manipulação de avaliações
- Inconsistência entre perfil público e serviço percebido
- Baixa responsividade recorrente

**Motivos típicos de remoção automática do selo:**
- Fraude documental comprovada
- Identidade falsa comprovada
- Uso falsificado do selo da marca
- Descumprimento de exigência documental crítica após prazo final de regularização

### 16.5 Detecção de Fraudes

Alertas automáticos para:
- Mesmo CPF tentando múltiplos cadastros
- Padrão de avaliações suspeitas (mesma rede, intervalo curto)
- Uso indevido do selo em canais externos
- Picos artificiais de leads, cliques ou avaliações
- Prestador com muitas recusas, ausência de resposta ou denúncias repetidas

---

## 17. Módulo 12 — Notificações e Engajamento

### 17.1 Tipos de Notificação

**Para o prestador:**
- Nova solicitação de lead
- Lead aceito / recusado
- Mudança de status do selo
- Nova avaliação recebida
- Aviso de vencimento de verificação
- Alertas de penalidade

**Para o cliente:**
- Resposta de negócio recebida
- Liberação de canal de contato
- Lembrete para avaliar atendimento
- Decisão sobre denúncia enviada

### 17.2 Canais

- Push notification (app mobile)
- E-mail transacional
- SMS (para eventos críticos: verificação e segurança)
- WhatsApp Business API (Fase 2 — opt-in)

### 17.3 Engajamento

- E-mail de reativação para clientes sem novo contato em 60 dias
- E-mail de reativação para prestadores sem resposta em 30 dias
- Notificação de "Novo prestador na sua região" para clientes com histórico
- Campanha sazonal (ex: verão → serviços de A/C, reforma para festas)

---

## 18. Módulo 13 — Monetização

### 18.1 Assinatura Mensal dos Negócios (Receita Principal)

- Receita principal baseada em plano mensal pago por negócios e profissionais verificados
- A assinatura remunera verificação contínua, uso do selo, visibilidade qualificada e geração de leads
- Planos podem variar conforme categoria, região e volume de exposição

| Plano | Preço sugerido | Indicação |
|-------|----------------|-----------|
| Start | R$ 49,90/mês | profissional individual |
| Pro | R$ 99,90/mês | negócio com mais destaque |
| Premium Local | R$ 199,90/mês | empresa com operação mais estruturada |

### 18.2 Taxa de Verificação e Renovação

- Prestador individual: R$ 29,90–49,90 no cadastro
- Empresa: R$ 79,90–149,90 no cadastro
- Renovação anual: 50% do valor inicial
- Renovação do selo pode exigir nova revisão documental e manutenção da pontuação mínima da categoria

### 18.3 Benefícios do Plano Pago

- Elegibilidade comercial para exibir o selo conquistado, quando aprovado pela operação
- Destaque nas buscas
- Relatórios de visualização, cliques e leads
- Suporte prioritário
- Mais serviços no catálogo
- Personalização ampliada do perfil

### 18.4 Destaque Pontual (Boost)

- Prestador paga para aparecer em posição de destaque por período determinado
- Preços: R$ 9,90 (1 dia) / R$ 39,90 (7 dias) / R$ 99,90 (30 dias)
- Limitado a 3 prestadores em destaque por categoria/região

### 18.5 Regras de Negócio — Monetização

- Plataforma não cobra o cliente por nenhum serviço
- A monetização é 100% do lado do negócio verificado
- Negócio inadimplente pode perder destaque, canal de contato preferencial e uso do selo
- Resultados patrocinados nunca podem comprometer a confiança mínima do ranking orgânico

---

## 19. Módulo 14 — Analytics e Relatórios

### 19.1 Métricas Internas (Dashboard Admin)

- Volume de novos cadastros por semana (clientes e prestadores)
- Número de negócios verificados ativos por semana
- Taxa de conversão: visita ao perfil → clique em contato → lead enviado
- Tempo médio de resposta ao lead
- NPS (Net Promoter Score) pós-serviço
- Taxa de denúncias abertas vs. total de perfis ativos
- Tempo médio de validação manual das avaliações
- Percentual de avaliações aprovadas, recusadas e devolvidas para complementação
- Categorias mais demandadas por região

### 19.2 Relatórios para Prestadores

- Leads recebidos por período
- Ranking de serviços mais procurados
- Evolução do score de confiança
- Comparação com média da plataforma na mesma categoria

### 19.3 Ferramentas

- Integração com Google Analytics 4 (comportamento de usuário na plataforma)
- Mixpanel ou Amplitude para funis de conversão
- Redash ou Metabase para relatórios internos

---

## 20. Módulo 15 — Growth, Ads e Aquisição

### 20.1 Aquisição de Oferta e Demanda

- Landing pages por cidade, bairro, categoria e sazonalidade
- Captação de prestadores com funil dedicado de onboarding e pré-qualificação
- Campanhas para clientes com foco em intenção local de busca
- Gestão de CAC por canal, categoria e praça

### 20.2 Ads Internos da Plataforma

- Destaque patrocinado por categoria/região, integrado ao módulo de monetização
- Inventário limitado de slots premium para não degradar a confiança da busca
- Relatórios de impressões, cliques, leads e contatos originados por campanha patrocinada
- Regras de transparência: resultado patrocinado sempre sinalizado visualmente

### 20.3 Tracking e Atribuição

- Suporte a UTM, pixels de conversão e eventos server-side
- Atribuição entre campanha, cadastro, lead enviado e contato efetivo
- Segmentação de campanhas por cidade, idioma, categoria e tipo de público

### 20.4 CRM e Retenção

- Automação de campanhas para ativação, reativação e recuperação de abandono
- Segmentação por estágio do funil: visitante, lead, cadastrado, verificado, ativo, inativo
- Programa de indicação, cupons e campanhas sazonais

---

## 21. Módulo 16 — Suporte e Atendimento Operacional

### 21.1 Atendimento Omnichannel

- Central única para tickets vindos de app, web, e-mail, WhatsApp e chat de suporte
- Classificação por tipo: cadastro, assinatura, selo, denúncia, bug, segurança, fiscal
- SLAs por criticidade e fila operacional

### 21.2 Base de Conhecimento

- FAQ público para clientes e prestadores
- Artigos internos para operação, moderação e financeiro
- Macros de atendimento e respostas padronizadas

### 21.3 Operação Assistida

- Reenvio manual de notificações críticas
- Apoio operacional para casos de onboarding travado, cobrança, denúncia e revisão de selo
- Histórico completo de interações do usuário com a operação

---

## 22. Módulo 17 — Trust, Safety e Risk

### 22.1 Prevenção de Fraude

- Motor de regras para fraude de identidade, duplicidade de contas, comportamento anômalo e abuso promocional
- Score de risco por usuário, dispositivo, lead e comportamento de perfil
- Bloqueios preventivos, revisão manual e listas de observação

### 22.2 Segurança Operacional

- Detecção de compartilhamento indevido de contato antes do momento permitido
- Detecção de abuso, assédio, linguagem agressiva e padrões de golpe
- Políticas de escalonamento para suspensão, restrição ou banimento

### 22.3 Risco Financeiro e Reputacional

- Monitoramento de inadimplência, abuso de destaque, uso indevido do selo e denúncias recorrentes
- Indicadores de risco por categoria, região e tipo de prestador
- Trilha de decisão para casos sensíveis com potencial jurídico ou reputacional

---

## 23. Módulo 18 — Financeiro Interno e Billing Ops

### 23.1 Conciliação Financeira

- Conciliação entre gateway, assinaturas, taxas de verificação, boosts e recebimentos da plataforma
- Fechamento diário, semanal e mensal
- Detecção de divergências entre valores cobrados, recebidos, cancelados e estornados

### 23.2 Billing Operacional

- Gestão de cobrança de taxa de verificação, assinatura Pro e boosts patrocinados
- Regras de retry, inadimplência, suspensão por falta de pagamento e reativação
- Emissão de comprovantes, faturas e histórico financeiro da plataforma

### 23.3 Financeiro Gerencial

- Receita bruta, líquida, MRR, churn de assinantes e inadimplência
- Relatórios operacionais para contabilidade e auditoria
- Visão por cidade, categoria e cohort de prestadores

---

## 24. Módulo 19 — CMS, SEO e Conteúdo Público

### 24.1 Conteúdo Institucional e Comercial

- Gestão de páginas públicas: home, categorias, cidades, landing pages, termos, políticas e páginas de ajuda
- Edição de banners, destaques, provas sociais e campanhas sem depender de deploy
- Blocos reutilizáveis para páginas de aquisição por nicho e região

### 24.2 SEO Local

- Estrutura programática para páginas por cidade, bairro, serviço e combinação de intenção local
- Metadados, schema markup, FAQs e conteúdo otimizado para busca orgânica
- Controle de indexação, canonical e redirecionamentos

### 24.3 Conteúdo Multilíngue

- Gestão de conteúdo público em EN, PT e ES
- Detecção de idioma no primeiro acesso e troca manual persistente
- Revisão de conteúdo por idioma para preservar qualidade comercial e SEO

---

## 25. Módulo 20 — Integrações e Automação

### 25.1 Hub de Integrações

- Camada única para billing de assinatura, verificação documental, biometria, mapas, e-mail, SMS, push e analytics
- Adaptadores por provedor para reduzir lock-in tecnológico
- Gestão de credenciais, versionamento e fallback de provedores críticos

### 25.2 Eventos, Webhooks e Jobs

- Catálogo de eventos de domínio: cadastro aprovado, selo concedido, lead criado, cobrança confirmada, denúncia aberta, avaliação recebida
- Webhooks para parceiros externos e integrações futuras
- Jobs assíncronos para reprocessamento, retentativa e sincronização

### 25.3 Automação Operacional

- Regras automatizadas para notificações, campanhas, escalonamento de suporte e revisão de risco
- Gatilhos por comportamento do usuário e por status operacional
- Preparação para integrações futuras com CRM, ERP, NFSe, parceiros e canais de distribuição

---

## 26. Regras de Negócio Gerais

### 26.1 Elegibilidade

- Usuários devem ter 18 anos ou mais para criar conta (cliente ou prestador)
- Prestadores devem residir ou atuar no Brasil
- Empresas devem ter CNPJ ativo há pelo menos 6 meses

### 26.2 Proibições

- É proibido usar a plataforma para serviços ilegais, regulados sem devida licença (ex: serviços médicos sem CRM) ou atividades que violem o Código do Consumidor
- É proibido criar perfis falsos ou múltiplas contas
- É proibido solicitar dados pessoais sensíveis (ex: senha bancária) via chat
- É proibido usar indevidamente o selo da plataforma, simular verificação ou apresentar informações falsas de qualificação

### 26.3 Responsabilidade

- A plataforma é uma intermediadora de confiança e descoberta, não empregadora dos prestadores e não parte contratual na prestação do serviço
- A plataforma não se responsabiliza pela execução do serviço contratado entre cliente e negócio, exceto em casos de fraude comprovada na verificação ou erro material de qualificação
- A plataforma tem obrigação de sigilo sobre dados dos usuários conforme a LGPD

### 26.4 LGPD e Privacidade

- Dados de verificação (biometria, documentos) armazenados de forma criptografada
- Prazo de retenção de dados: 5 anos após encerramento da conta (obrigação fiscal)
- Direito de exclusão: solicitado pelo usuário, dados são anonimizados (exceto onde há obrigação legal de retenção)
- Encarregado de dados (DPO) designado antes do lançamento
- Política de privacidade e termos de uso em linguagem clara e acessível

### 26.5 Termos de Suspensão e Banimento

**Suspensão temporária (7–30 dias):**
- 3 recusas ou abandonos relevantes de lead em 30 dias sem justificativa adequada
- 2 denúncias com decisão desfavorável em 90 dias
- Avaliação média abaixo de 2.0 por mais de 30 dias

**Banimento permanente:**
- Fraude de identidade comprovada
- Antecedentes criminais em categorias vedadas
- Falsidade documental ou uso indevido recorrente do selo
- Comportamento abusivo ou assédio comprovado via chat

---

## 27. Fluxos Críticos

### 27.1 Fluxo Completo de Descoberta e Contato

```
Cliente busca serviço
       ↓
Encontra prestador verificado
       ↓
Solicita atendimento com fotos e descrição
       ↓
Prestador recebe notificação e responde em até 24h
       ↓
Cliente continua o contato pelo canal escolhido
       ↓
Plataforma registra o lead e a resposta
       ↓
Atendimento acontece fora da intermediação financeira da plataforma
       ↓
Cliente retorna para avaliar a experiência
       ↓
Ambos se avaliam
```

### 27.2 Fluxo de Denúncia e Revisão

```
Cliente abre denúncia com evidências
       ↓
Sistema notifica prestador (prazo: 48h para responder)
       ↓
Prestador apresenta sua versão + evidências
       ↓
Moderador analisa (prazo: 7 dias úteis)
       ↓
       ├── Improcedente → perfil mantido sem alterações
       ├── Procedente leve → advertência ou suspensão temporária
       └── Procedente grave → remoção do selo ou banimento
```

### 27.3 Fluxo de Verificação do Prestador

```
Prestador inicia cadastro
       ↓
Paga taxa de verificação
       ↓
Envia documentos + selfie com documento
       ↓
API valida CPF/CNPJ automaticamente
       ↓
Sistema consulta antecedentes (automatizado)
       ↓
Moderador revisa biometria facial (manual ou IA)
       ↓
       ├── Aprovado → status VERIFICADO, selo habilitado e perfil publicado
       ├── Pendente → solicita documentação adicional (prazo 5 dias)
       └── Reprovado → notifica motivo + direito de recurso único
```

---

## 28. Stack Tecnológica Sugerida

### 28.1 Frontend / Mobile

| Componente | Tecnologia |
|------------|-----------|
| App Mobile | React Native (iOS + Android simultâneos) |
| Web (PWA)  | Next.js |
| UI Kit     | Tailwind CSS + shadcn/ui |

### 28.2 Backend

| Componente | Tecnologia |
|------------|-----------|
| API Principal | Node.js + Fastify (ou NestJS) |
| Banco de dados | PostgreSQL (dados transacionais) |
| Cache | Redis |
| Fila de mensagens | Bull (Redis-based) ou RabbitMQ |
| Storage de arquivos | AWS S3 ou Cloudflare R2 |

### 28.3 Serviços Externos

| Funcionalidade | Serviço |
|---------------|---------|
| Billing de assinatura | Asaas, Stripe ou Pagar.me |
| Validação CPF/CNPJ | Receita Federal API + Serpro |
| Antecedentes criminais | BrasilChecks ou Idwall |
| Biometria facial | Idwall ou Unico Check |
| E-mail transacional | SendGrid ou Amazon SES |
| SMS | Twilio ou Zenvia |
| Push notifications | Firebase Cloud Messaging |
| Mapas e geolocalização | Google Maps Platform |

### 28.4 Infraestrutura

| Componente | Serviço |
|------------|---------|
| Hospedagem | AWS ou Railway (MVP) |
| CDN | Cloudflare |
| Monitoramento | Sentry + Datadog |
| CI/CD | GitHub Actions |

---

## 29. Fases de Lançamento (Roadmap)

### Fase 1 — MVP (0–3 meses)

**Objetivo:** Validar o modelo de confiança em 1 cidade e 1 nicho

**Funcionalidades incluídas:**
- Core Platform com RBAC, auditoria e configuração básica por cidade/categoria
- Cadastro e verificação básica (CPF + documento + antecedentes)
- Catálogo de prestadores
- Busca por categoria e localização
- Solicitação de lead via formulário
- Chat básico
- Avaliações simples (nota + comentário)
- Painel básico do prestador e do cliente
- Painel de administração para aprovação de cadastros
- CMS básico para páginas institucionais e de aquisição
- Selo da marca e assinatura mensal básica

**Meta:** 50 negócios verificados pagantes + 500 leads gerados

---

### Fase 2 — Crescimento (3–8 meses)

**Objetivo:** Escalar para a região e adicionar diferenciais de experiência

**Funcionalidades adicionadas:**
- Avaliações com foto (antes/depois)
- Plano Pro para prestadores
- Destaque pago (Boost)
- Growth stack com tracking, CRM e campanhas de aquisição
- App mobile nativo (React Native)
- Biometria facial aprimorada
- Chat com regras inteligentes de liberação de contato
- Relatórios avançados de leads e performance
- Hub de integrações e automações operacionais

**Meta:** 500 negócios verificados + 5.000 leads/mês + MRR consistente

---

### Fase 3 — Escala Nacional (8–18 meses)

**Objetivo:** Expansão para outras cidades e nichos

**Funcionalidades adicionadas:**
- Chamadas de voz/vídeo in-app
- WhatsApp Business API
- Integração com NFSe (nota fiscal eletrônica)
- Motor de recomendação por IA
- Verificação de antecedentes em tempo real
- API pública para parceiros (condomínios, imobiliárias, seguradoras)
- Programa de indicação (referral)
- Tenant-ready evoluindo para multi-tenant apenas se houver demanda comercial real

**Meta:** 10.000 negócios verificados + presença em 10 cidades + MRR escalável

---

## 30. Métricas de Sucesso (KPIs)

### Aquisição
- Número de cadastros de prestadores por semana
- Custo de aquisição por prestador verificado (CAC)
- Taxa de aprovação no processo de verificação

### Engajamento
- Taxa de resposta dos prestadores a leads (meta: >80%)
- Tempo médio de resposta (meta: <4h)
- Taxa de conversão visita → lead (meta: >8%)

### Qualidade
- NPS médio pós-serviço (meta: >50)
- Taxa de denúncias / total de perfis ativos (meta: <2%)
- Avaliação média dos prestadores ativos (meta: >4.2)

### Financeiro
- MRR mensal de assinaturas
- Receita líquida recorrente
- Churn de prestadores assinantes (meta: <5%/mês)
- Ticket médio por assinatura

### Growth e Operação
- CAC por cidade, categoria e canal
- Taxa de ativação de prestadores verificados
- Taxa de conversão de visita para lead por landing page/campanha
- SLA médio do suporte por tipo de chamado
- Taxa de fraude evitada / perdas por fraude

---

## 31. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Prestadores burlam verificação com documentos falsos | Média | Alto | Biometria facial + checagem cruzada de bases |
| Negócios não percebem valor para pagar assinatura mensal | Alta | Alto | Provar geração de leads, usar selo como ativo comercial e focar em categorias com ticket melhor |
| Custo de verificação inviabiliza cadastros | Média | Médio | Taxa de verificação parcial + planos acessíveis + onboarding assistido |
| Concorrentes copiam a estética do selo sem sustentar a operação | Alta | Médio | Fortalecer processo de qualificação, marca e prova pública de confiança |
| Baixo volume nas primeiras semanas (frango e ovo) | Alta | Alto | Começar pelo lado da oferta: verificar prestadores antes de abrir para clientes |
| Denúncias e moderação consumirem muita operação manual | Média | Médio | Automação de triagem, critérios claros de selo e playbooks operacionais |
| O selo perder credibilidade por critérios frouxos | Média | Crítico | Auditoria periódica, revalidação anual e suspensão rápida em caso de fraude |
| Vazamento de dados sensíveis (CPF, biometria) | Baixa | Crítico | Criptografia em repouso e em trânsito; pentest antes do lançamento; seguro de responsabilidade cibernética |

---

*Blueprint elaborado com base na visão estratégica do produto. Todos os valores, prazos e tecnologias são sugestões iniciais e devem ser validados com time técnico, jurídico e financeiro antes da implementação.*

---

**Versão:** 1.0  
**Data:** Abril de 2026  
**Status:** Rascunho para validação
