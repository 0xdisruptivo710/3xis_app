# Sistema 3X App -- Guia Completo

> Documento de referencia completa do sistema 3X App.
> Destinado a desenvolvedores, gestores de produto, equipe comercial e administradores de lojas.

---

## Sumario

1. [Visao Geral do Sistema](#1-visao-geral-do-sistema)
2. [Como Funciona o Acesso](#2-como-funciona-o-acesso)
3. [Estrutura de Usuarios e Permissoes](#3-estrutura-de-usuarios-e-permissoes)
4. [Modulos do Aplicativo (SDR)](#4-modulos-do-aplicativo-sdr)
5. [Painel Admin](#5-painel-admin)
6. [Como Escalar e Vender o Sistema](#6-como-escalar-e-vender-o-sistema)
7. [Estrutura Tecnica Resumida](#7-estrutura-tecnica-resumida)
8. [Variaveis de Ambiente](#8-variaveis-de-ambiente)
9. [FAQ -- Perguntas Frequentes](#9-faq--perguntas-frequentes)

---

## 1. Visao Geral do Sistema

### O que e o 3X App

O **3X App** e uma plataforma web progressiva (PWA) de suporte, treinamento e acompanhamento de desempenho para **SDRs (Sales Development Representatives)** de lojas de veiculos novos e seminovos.

O sistema funciona como um "copiloto digital" da SDR, oferecendo tudo o que ela precisa no dia a dia: roteiro de ligacoes, scripts de vendas, respostas para objecoes, checklist de tarefas, controle de metas e um sistema de gamificacao que transforma o treinamento em algo engajante e progressivo.

### Para quem e

O 3X App foi projetado para tres perfis de usuario:

- **SDRs em Treinamento**: Profissionais de pre-venda de lojas de veiculos que usam o app diariamente para organizar sua rotina, estudar scripts, acompanhar metas e evoluir no treinamento gamificado.
- **Supervisoras / Coaches 3X**: Lideres de equipe que acompanham o progresso das SDRs, configuram metas, inserem conteudo e monitoram performance.
- **Administradores de Loja**: Gestores que contratam o sistema, convidam usuarios e gerenciam toda a operacao via painel admin.

### Qual problema resolve

O mercado automotivo sofre com alta rotatividade de SDRs, falta de padronizacao no atendimento de pre-venda e dificuldade de treinar novas profissionais de forma rapida e eficaz. O 3X App resolve esses problemas ao:

- **Padronizar a rotina da SDR** com checklists e rituais matinais especificos para o mercado automotivo.
- **Disponibilizar scripts prontos** para todas as etapas do funil de vendas, incluindo respostas para as objecoes mais comuns.
- **Gamificar o treinamento** com sistema de XP, niveis, fases, missoes e badges, tornando o aprendizado engajante e mensuravel.
- **Dar visibilidade para a gestao** com dashboards de performance, acompanhamento de metas e rankings por loja.
- **Reduzir o tempo de ramp-up** de novas SDRs, que passam a ter um guia completo acessivel do celular.

---

## 2. Como Funciona o Acesso

### Modelo de Licenciamento

O 3X App opera no modelo **SaaS por loja**. Cada loja de veiculos adquire uma licenca que da direito ao uso do sistema para sua equipe.

**Planos disponiveis:**

| Plano | Limite de Usuarios | Descricao |
|-------|--------------------|-----------|
| **Basic** | Ate 10 usuarios | Ideal para lojas pequenas com equipe enxuta |
| **Pro** | Ate 30 usuarios | Para lojas medias com equipe de pre-venda estruturada |
| **Enterprise** | Ilimitado | Para redes de concessionarias e operacoes de grande porte |

Apos a compra, o administrador da loja recebe um **codigo de acesso unico** por email, que sera usado para ativar a conta e vincular a loja ao sistema.

---

### Fluxo de Primeiro Acesso (Admin da Loja)

O primeiro acesso e realizado pelo administrador da loja, que e a pessoa responsavel pela compra da licenca.

**Passo a passo:**

1. **Compra da licenca**: O admin (gerente/dono da loja) realiza a compra em uma plataforma de checkout externa (Stripe, Hotmart, Kiwify, etc.).
2. **Recebimento do codigo**: Apos a confirmacao do pagamento, o sistema envia automaticamente um email com o **codigo de acesso** unico.
3. **Acesso a pagina de registro**: O admin acessa a URL `/register` no navegador.
4. **Preenchimento dos dados**: Na pagina de registro, o admin insere:
   - Codigo de acesso recebido por email
   - Nome completo
   - Email corporativo
   - Senha desejada
5. **Validacao automatica**: O sistema valida o codigo de acesso, cria a conta com perfil `admin` e vincula automaticamente a loja correspondente.
6. **Redirecionamento**: O admin e redirecionado ao **Painel Admin**, onde pode comecar a configurar a loja e convidar membros da equipe.

---

### Fluxo de Convite de SDRs

Apos o admin configurar sua conta, o proximo passo e convidar as SDRs e supervisoras da equipe.

**Passo a passo:**

1. **Acesso ao painel**: O admin entra no Painel Admin e navega ate a secao **Usuarios**.
2. **Iniciar convite**: Clica em **"Convidar Usuario"**.
3. **Preencher dados do convite**:
   - Email da pessoa a ser convidada
   - Cargo: **SDR** ou **Supervisora**
4. **Envio do convite**: O sistema envia um email automatico com um **link de convite**. Este link e valido por **7 dias**.
5. **Registro da SDR**: A SDR clica no link recebido e e direcionada a uma pagina de registro com alguns dados pre-preenchidos (loja ja vinculada, cargo definido). Ela precisa apenas informar:
   - Nome completo
   - Senha desejada
6. **Vinculacao automatica**: Ao completar o registro, a SDR e automaticamente vinculada a loja do admin que a convidou, com as permissoes corretas de acordo com o cargo.
7. **Primeiro acesso ao app**: A SDR e redirecionada ao app e pode comecar a utilizar todos os modulos imediatamente.

---

### Fluxo de Login

O 3X App oferece dois metodos de autenticacao, ambos disponiveis na tela de login:

- **Email + Senha**: Metodo tradicional. A SDR insere seu email e a senha definida no registro.
- **Magic Link**: Metodo sem senha. A SDR insere apenas seu email e recebe um link de acesso direto por email. Ao clicar no link, e autenticada automaticamente.

Ambos os metodos sao gerenciados pelo **Supabase Auth**, garantindo seguranca e simplicidade.

---

## 3. Estrutura de Usuarios e Permissoes

O sistema possui tres perfis de usuario, cada um com niveis de acesso especificos:

| Perfil | Acesso | O que pode fazer |
|--------|--------|------------------|
| **Admin** | Painel Admin + App SDR | Gerenciar todos os usuarios da loja (convidar, desativar, alterar cargo). Configurar e gerenciar conteudo (scripts, videoaulas, checklist templates, rituais). Definir metas de vendas para SDRs individuais ou para a loja toda. Visualizar relatorios de performance e ranking. Usar todas as funcionalidades do app como uma SDR. |
| **Supervisora** | Painel Admin (acesso parcial) + App SDR | Visualizar dados de desempenho de todas as SDRs da mesma loja. Configurar metas de vendas. Gerenciar conteudo (scripts, videos, checklists). Usar todas as funcionalidades do app como uma SDR. Nao pode convidar/remover usuarios nem alterar configuracoes da loja. |
| **SDR** | App SDR apenas | Usar todas as funcionalidades do app: dashboard, checklist, rituais, scripts, vendas, gamificacao, notas, calendario, videoaulas, ranking e perfil. Nao tem acesso ao painel admin. |

### Isolamento de Dados por Loja

Cada loja opera de forma completamente isolada. Os dados de uma loja **nunca** sao visiveis para usuarios de outra loja. Esse isolamento e garantido a nivel de banco de dados por meio de **Row Level Security (RLS)** do PostgreSQL, utilizando o campo `store_id` como chave de segmentacao.

- SDRs so veem seus proprios dados pessoais.
- Supervisoras veem os dados de todas as SDRs da mesma loja.
- Admins veem todos os dados da loja que administram.

---

## 4. Modulos do Aplicativo (SDR)

O app da SDR e organizado em modulos acessiveis por uma barra de navegacao inferior (mobile) ou sidebar (desktop). Cada modulo atende a uma necessidade especifica da rotina de pre-venda automotiva.

---

### 4.1 Dashboard (Tela Inicial)

O Dashboard e a primeira tela que a SDR ve ao abrir o app. Funciona como um resumo executivo do dia.

**O que mostra:**

- **Saudacao personalizada** com o nome da SDR e horario do dia (bom dia, boa tarde, boa noite).
- **Resumo de XP**: XP acumulado na semana, streak atual de dias consecutivos, nivel atual com barra de progresso visual ate o proximo nivel.
- **Proximas atividades**: Ate 3 eventos do calendario programados para as proximas horas.
- **Checklist do dia**: Progresso visual (barra de porcentagem) das tarefas do dia.
- **Ritual matinal**: Se o ritual do dia ainda nao foi concluido, aparece em destaque com call-to-action.
- **Ultima videoaula**: Card da videoaula mais recente publicada pelo admin.
- **Cards de acesso rapido**: Botoes grandes e touch-friendly para navegacao rapida a todos os modulos (Vendas, Scripts, Game, Notas, Calendario, etc.).

---

### 4.2 Checklist Diario

O checklist e a ferramenta de organizacao diaria da SDR. Contem tarefas pre-configuradas pela supervisora/admin, focadas especificamente na rotina de uma SDR de loja de veiculos.

**Checklist padrao sugerido para SDR automotiva:**

- Revisar pipeline de leads (site, portais, redes sociais)
- Responder todos os leads novos recebidos (WhatsApp, email, chat do site)
- Realizar ligacoes de prospeccao ativa
- Fazer follow-up de clientes em negociacao
- Confirmar test drives agendados para o dia
- Enviar propostas comerciais pendentes
- Verificar estoque atualizado e novos veiculos disponiveis
- Registrar todas as atividades do dia no modulo de vendas
- Estudar pelo menos um script novo ou ficha tecnica de veiculo
- Assistir a videoaula do dia
- Reportar resultados para a supervisora

**Funcionalidades:**

- **Itens pre-configurados**: Definidos pelo admin/supervisora no painel. Todas as SDRs da loja recebem o mesmo template base.
- **Itens pessoais**: A SDR pode adicionar suas proprias tarefas ao checklist do dia.
- **Reset automatico**: Todo dia a meia-noite (00h), o checklist e reiniciado automaticamente via job agendado (Vercel Cron).
- **Progresso visual**: Barra de porcentagem que preenche conforme a SDR marca itens como concluidos.
- **XP por conclusao**: Cada item marcado como concluido gera XP. Completar o checklist inteiro gera um bonus adicional de +50 XP.
- **Historico**: A SDR pode consultar o historico de conclusao de checklists em dias anteriores.

---

### 4.3 Rituais Matinais

Os rituais matinais sao uma rotina de preparacao exibida ao abrir o app pela manha. O objetivo e criar um habito de alta performance antes de iniciar o dia de trabalho.

**Rituais sugeridos para SDR automotiva:**

| Ritual | Categoria | Duracao | Descricao |
|--------|-----------|---------|-----------|
| Revisar metas do dia | Profissional | 5 min | Olhar suas metas e definir prioridades |
| Checar novos leads da noite | Profissional | 5 min | Verificar leads que entraram apos o expediente |
| Revisar estoque disponivel | Profissional | 5 min | Conhecer os veiculos disponiveis para oferecer |
| Organizar agenda | Profissional | 5 min | Confirmar test drives, retornos e reunioes do dia |
| Leitura motivacional | Mental | 10 min | Ler algo que inspire e motive para o dia |
| Hidratacao e preparo pessoal | Fisico | 5 min | Beber agua, se preparar fisicamente |
| Visualizacao de fechamento | Mental | 5 min | Visualizar mentalmente o fechamento de vendas |
| Estudo de ficha tecnica | Profissional | 10 min | Estudar detalhes de um veiculo especifico |

**Funcionalidades:**

- **Exibicao matinal**: Ao abrir o app pela manha, os rituais aparecem em destaque se ainda nao foram realizados.
- **Categorias**: Mental, Fisico, Profissional -- cada uma com icone e cor distintos.
- **Confirmacao**: A SDR marca cada ritual como realizado.
- **XP**: Cada ritual concluido concede XP (+20 por ritual). Completar todos os rituais do dia da um bonus.
- **Notificacao push**: O app pode enviar uma notificacao no horario configurado pela SDR para lembrar dos rituais.
- **Personalizacao**: O admin pode adicionar, remover ou editar os rituais disponiveis no painel.

---

### 4.4 Acompanhamento de Vendas

O modulo de vendas e o coracao do 3X App. Permite que a SDR registre diariamente suas atividades de pre-venda e acompanhe seu desempenho em relacao as metas.

**Metricas registradas diariamente:**

| Metrica | Descricao |
|---------|-----------|
| Ligacoes realizadas | Total de ligacoes feitas no dia |
| Contatos alcancados | Ligacoes que resultaram em conversa efetiva |
| Agendamentos | Test drives ou visitas agendadas |
| Test drives realizados | Test drives que de fato aconteceram |
| Propostas enviadas | Propostas comerciais formalizadas |
| Fechamentos | Vendas efetivadas |

**Funcionalidades:**

- **Registro diario**: Tela simples e rapida para a SDR inserir os numeros do dia. Um registro por dia, com possibilidade de editar ate o fim do dia.
- **Metas**: A supervisora/admin define metas diarias, semanais e mensais para cada metrica. As metas podem ser por SDR individual ou padrao para toda a loja.
- **Indicadores visuais por cor**:
  - **Vermelho**: Abaixo de 70% da meta
  - **Amarelo**: Entre 70% e 100% da meta
  - **Verde**: Meta atingida ou superada
- **Graficos de performance**:
  - Grafico de linha: Evolucao ao longo dos dias/semanas
  - Grafico de barras: Comparativo entre metricas
- **Historico**: Filtro por periodo (dia, semana, mes) com visualizacao detalhada.
- **XP por atividade**: Registrar atividades gera +10 XP. Atingir a meta diaria gera +100 XP. Meta semanal: +300 XP.
- **Animacao de conquista**: Quando a SDR atinge a meta diaria, uma animacao de celebracao e exibida.

---

### 4.5 Scripts e Objecoes

A biblioteca de scripts e um repositorio organizado de roteiros de vendas e respostas para objecoes, especificos para o mercado de veiculos novos e seminovos.

**Categorias de scripts:**

| Categoria | Descricao | Exemplos |
|-----------|-----------|----------|
| **Abordagem Inicial** | Primeiros contatos com o cliente | Script para ligacao fria, abordagem por WhatsApp, recepcao presencial |
| **Qualificacao** | Entender o perfil e necessidade do cliente | Perguntas para descobrir orcamento, preferencia de veiculo, urgencia |
| **Apresentacao** | Apresentar o veiculo ideal | Como destacar diferenciais, comparar com concorrencia |
| **Negociacao** | Conduzir a negociacao | Argumentos sobre entrada, parcela, valor da troca, financiamento |
| **Fechamento** | Tecnicas para fechar a venda | Fechamento por escassez, por urgencia, por beneficio |
| **Objecoes** | Respostas para resistencias comuns | "Esta caro", "Vou pensar", "Vi mais barato", "Preciso falar com meu marido/esposa" |

**Funcionalidades:**

- **Navegacao por categorias**: Cada categoria tem uma cor e icone proprios para facilitar a identificacao.
- **Cards de objecao**: Para scripts do tipo objecao, o card mostra claramente a **objecao do cliente** e a **resposta sugerida**, separadas visualmente.
- **Busca full-text**: Campo de busca por palavra-chave que pesquisa no titulo e conteudo de todos os scripts.
- **Favoritar**: A SDR pode favoritar scripts para acesso rapido. Favoritos ficam salvos no banco de dados.
- **Gerenciamento pelo admin**: O admin/supervisora pode adicionar, editar e desativar scripts pelo painel admin.

---

### 4.6 Videoaulas

O modulo de videoaulas permite que a equipe acesse conteudo de treinamento em video, organizado por categorias e integrado ao YouTube.

**Categorias de video:**

| Categoria | Descricao |
|-----------|-----------|
| Onboarding | Primeiros passos na 3X e na loja |
| Tecnicas de Vendas | Como vender mais e melhor |
| Objecoes | Como superar resistencias em video |
| Motivacao | Conteudo motivacional e de mindset |
| Produto | Conhecimento de veiculos, fichas tecnicas |
| Processo | Rotinas e processos da pre-venda |

**Como funciona:**

- **Cadastro pelo admin**: O admin acessa o painel, vai em Conteudo > Videos e cadastra videos informando o **YouTube Video ID** (ex: `dQw4w9WgXcQ`). O sistema busca automaticamente o titulo, thumbnail e duracao via YouTube Data API.
- **Sem upload de video**: O 3X App **nao armazena videos**. Todos os videos sao embedados diretamente do YouTube, o que elimina custos de armazenamento e streaming.
- **Player responsivo**: O player embed do YouTube se adapta a tela do dispositivo (mobile e desktop).
- **Marcacao automatica**: Quando a SDR assiste a mais de 80% de um video, ele e automaticamente marcado como "assistido".
- **XP**: Cada video assistido integralmente concede +30 XP.
- **Notas com timestamp**: A SDR pode criar notas vinculadas ao video com marcacao de tempo (ex: "Aos 2:30 -- tecnica de espelhamento"), facilitando a revisao posterior.
- **Progresso visual**: Cada categoria mostra uma barra de progresso indicando quantos videos ja foram assistidos.

---

### 4.7 Gamificacao

O sistema de gamificacao e o que torna o treinamento no 3X App engajante e viciante. Ele transforma acoes do dia a dia em progresso mensuravel.

#### Sistema de XP e Niveis

A SDR acumula XP (pontos de experiencia) ao realizar acoes no app. Conforme acumula XP, avanca de nivel:

| Nivel | Nome | XP Necessario |
|-------|------|---------------|
| 1 | Iniciante SDR | 0 -- 500 XP |
| 2 | Aprendiz de Vendas | 501 -- 1.500 XP |
| 3 | Vendedora em Ascensao | 1.501 -- 3.000 XP |
| 4 | SDR Profissional | 3.001 -- 5.000 XP |
| 5 | Expert 3X | 5.001 -- 8.000 XP |
| 6 | Mestre das Vendas | 8.001+ XP |

#### Fontes de XP

| Acao | XP Concedido |
|------|--------------|
| Completar checklist diario inteiro | +50 |
| Assistir videoaula completa | +30 |
| Registrar atividade de vendas | +10 |
| Atingir meta diaria | +100 |
| Atingir meta semanal | +300 |
| Completar ritual matinal | +20 |
| Streak de 7 dias consecutivos | +200 bonus |
| Completar fase do game | +500 |

#### Fases e Missoes

O treinamento e dividido em fases, cada uma com missoes especificas:

**Fase 1 -- "O Comeco"**
- Assistir os 3 primeiros videos introdutorios
- Completar o perfil
- Registrar a primeira atividade de vendas
- Recompensa: Badge "Primeiro Passo" + 500 XP

**Fase 2 -- "Construindo Fundacoes"**
- Completar 5 checklists diarios seguidos
- Estudar 10 scripts da biblioteca
- Registrar atividades por 5 dias seguidos
- Recompensa: Badge "Fundacao Solida" + 500 XP

**Fase 3 -- "A Batalha das Objecoes"**
- Ler todos os scripts de objecao
- Assistir modulo de objecoes no YouTube
- Favoritar 3 scripts de objecao
- Recompensa: Badge "Quebradora de Objecoes" + 500 XP

**Fase 4 -- "Performance de Elite"**
- Atingir meta diaria por 10 dias no mes
- Completar todos os rituais por 2 semanas seguidas
- Assistir todos os videos publicados do mes
- Recompensa: Badge "Elite 3X" + 500 XP

#### Badges (Conquistas)

Badges sao medalhas visuais que a SDR desbloqueia ao cumprir requisitos especificos. Badges bloqueados aparecem em cinza com opacidade reduzida; ao serem desbloqueados, ganham cor vibrante e animacao dourada.

Tipos de badge: Fase, Streak, Performance, Especial.

#### Streak (Dias Consecutivos)

O streak conta quantos dias seguidos a SDR usou o app de forma ativa (completou pelo menos uma acao que gera XP). Streaks longos geram bonus de XP.

#### Ranking por Loja

O ranking mostra a posicao de cada SDR em relacao as colegas da mesma loja, baseado no XP acumulado no periodo (semanal ou mensal). O ranking e sempre **intra-loja** -- SDRs de lojas diferentes nunca se comparam.

---

### 4.8 Notas

O modulo de notas e um bloco de anotacoes pessoal da SDR dentro do app.

**Funcionalidades:**

- **CRUD completo**: Criar, editar e deletar notas.
- **Categorias**: Reuniao, Treinamento, Ideia, Cliente, Pessoal -- cada uma com cor distinta.
- **Fixar nota**: Notas podem ser fixadas no topo da lista para acesso rapido.
- **Compartilhar**: A SDR pode compartilhar uma nota com sua supervisora.
- **Busca**: Busca full-text por titulo e conteudo.
- **Notas de video**: Notas podem ser vinculadas a uma videoaula especifica, com marcacao de timestamp.

---

### 4.9 Calendario

O calendario permite a SDR visualizar e organizar seus compromissos.

**Funcionalidades:**

- **Visualizacoes**: Mensal e semanal, com design responsivo.
- **Tipos de evento**: Reuniao de equipe, Treinamento, Lembrete pessoal, Meta.
- **CRUD**: Criar, editar e deletar eventos.
- **Notificacao**: Alerta via Web Push 30 minutos antes do evento.
- **Eventos de equipe**: Eventos marcados como "equipe" sao visiveis para todas as SDRs da mesma loja.
- **Cores por tipo**: Cada tipo de evento tem uma cor associada para facil identificacao visual.

---

### 4.10 Perfil e Configuracoes

A tela de perfil reune informacoes pessoais e configuracoes do app.

**Informacoes exibidas:**

- Foto de perfil (upload via Supabase Storage)
- Nome, cargo e loja
- Estatisticas: XP total, badges conquistados, streak atual, videos assistidos, porcentagem de checklist do mes

**Configuracoes disponiveis:**

- Notificacoes (ativar/desativar por tipo, configurar horario do lembrete matinal)
- Tema visual (claro ou escuro)
- Botao **"Instalar App"** que aciona o prompt de instalacao do PWA no dispositivo

---

## 5. Painel Admin

O Painel Admin e uma interface separada do app da SDR, acessivel apenas por usuarios com perfil **Admin** ou **Supervisora**. Ele permite gerenciar todos os aspectos da operacao da loja dentro do 3X App.

### 5.1 Dashboard Admin

Visao geral com indicadores-chave:

- Total de usuarios cadastrados na loja
- Usuarios ativos hoje
- XP medio da equipe na semana
- Total de vendas registradas na semana
- Taxa de conclusao de checklist (porcentagem media)
- Grafico de evolucao de atividades da equipe

### 5.2 Gerenciamento de Usuarios

- **Listagem completa**: Todos os usuarios da loja com filtros por cargo (SDR, Supervisora, Admin) e status (ativo/inativo).
- **Convidar usuario**: Enviar convite por email para novas SDRs ou supervisoras.
- **Editar usuario**: Alterar cargo, desativar/reativar conta.
- **Visualizar perfil**: Ver estatisticas detalhadas de uma SDR especifica (XP, streak, videos assistidos, metas atingidas).

### 5.3 Gerenciamento de Conteudo

#### Scripts
- Adicionar novos scripts a qualquer categoria
- Editar scripts existentes
- Ativar/desativar scripts (scripts desativados nao aparecem para as SDRs)
- Criar novas categorias de script

#### Videoaulas
- Cadastrar videos informando o YouTube Video ID
- Organizar videos por categoria
- Definir ordem de exibicao
- Publicar/despublicar videos

#### Checklist Templates
- Definir os itens padrao do checklist diario
- Configurar recompensa de XP por item
- Definir ordem dos itens

#### Rituais
- Adicionar novos rituais com titulo, descricao, categoria e duracao
- Editar rituais existentes
- Ativar/desativar rituais

### 5.4 Configuracao de Metas

- Definir metas de vendas por SDR individual ou padrao para toda a loja
- Tipos de meta: diaria, semanal, mensal
- Metricas: ligacoes, contatos, agendamentos, test drives, propostas, fechamentos
- Definir periodo de vigencia

### 5.5 Relatorios

- **Performance por SDR**: Graficos individuais de evolucao de cada metrica de vendas
- **Comparativo de equipe**: Visao lado a lado do desempenho de todas as SDRs
- **Taxa de conclusao**: Porcentagem media de conclusao de checklists e rituais
- **Ranking de XP**: Classificacao da equipe por XP acumulado
- **Filtros por periodo**: Dia, semana, mes, periodo customizado
- **Exportacao**: Possibilidade futura de exportar relatorios em CSV/PDF

---

## 6. Como Escalar e Vender o Sistema

### Modelo de Negocio

O 3X App e vendido como **SaaS (Software as a Service)** no modelo de assinatura mensal por loja.

| Plano | Usuarios | Preco Sugerido | Funcionalidades |
|-------|----------|----------------|-----------------|
| **Basic** | Ate 10 | R$ 197/mes | Todos os modulos do app SDR + Painel admin basico |
| **Pro** | Ate 30 | R$ 397/mes | Tudo do Basic + Relatorios avancados + Suporte por email |
| **Enterprise** | Ilimitado | R$ 697/mes | Tudo do Pro + Suporte prioritario + Personalizacao de conteudo |

### Fluxo Completo de Venda

O processo de venda e totalmente automatizado, desde a compra ate a ativacao:

1. **Descoberta**: O cliente (dono da loja ou gerente comercial) conhece o 3X App atraves de uma landing page, indicacao ou campanha de marketing.

2. **Escolha do plano**: Na landing page, o cliente escolhe o plano que melhor se encaixa no tamanho da sua equipe.

3. **Checkout**: O pagamento e processado em uma plataforma externa (Stripe, Hotmart, Kiwify ou similar). O 3X App **nao processa pagamentos diretamente**.

4. **Webhook de confirmacao**: Apos a confirmacao do pagamento, a plataforma de checkout envia um webhook para o 3X App contendo os dados da compra (email do comprador, plano escolhido).

5. **Criacao automatica**: Ao receber o webhook, o sistema:
   - Cria uma nova loja no banco de dados
   - Gera uma licenca ativa vinculada a loja
   - Gera um codigo de acesso unico (ex: `3X-A7B9C2D4`)
   - Associa o limite de usuarios conforme o plano

6. **Envio do codigo**: O codigo de acesso e enviado automaticamente por email para o comprador.

7. **Ativacao**: O comprador acessa `/register`, insere o codigo e cria sua conta admin conforme descrito na secao 2.

8. **Convite da equipe**: O admin convida suas SDRs e supervisoras pelo painel admin.

### Checkout Externo

O checkout e gerenciado por uma plataforma de pagamento externa. Essa separacao traz vantagens:

- **Simplicidade**: O 3X App nao precisa lidar com processamento de pagamento, emissao de nota fiscal ou gestao de assinaturas.
- **Flexibilidade**: E possivel trocar a plataforma de checkout sem alterar o app.
- **Seguranca**: Dados de cartao de credito nunca trafegam pelo sistema.

A integracao entre o checkout e o 3X App e feita via **webhook**. Apos o pagamento ser confirmado, o checkout faz uma requisicao HTTP POST para a API do 3X App (`/api/v1/webhooks/checkout`) com os dados necessarios para criar a loja e gerar o codigo.

### Renovacao e Cancelamento

- **Renovacao automatica**: A assinatura e renovada automaticamente pela plataforma de checkout. Enquanto a assinatura estiver ativa, o acesso ao 3X App continua funcionando normalmente.
- **Cancelamento**: Se o cliente cancelar a assinatura, o webhook de cancelamento desativa a licenca da loja. Os dados sao mantidos por 90 dias para caso o cliente deseje reativar.
- **Inadimplencia**: Se o pagamento falhar, o sistema pode entrar em modo "somente leitura" ate a regularizacao.

### Escalabilidade Tecnica

O 3X App foi projetado para escalar horizontalmente sem alteracoes de arquitetura:

- **Multi-tenant nativo**: Cada loja e completamente isolada por `store_id` combinado com Row Level Security (RLS) no PostgreSQL. Adicionar 100 ou 1.000 lojas nao exige nenhuma mudanca de codigo.
- **Supabase**: O banco de dados PostgreSQL gerenciado pelo Supabase escala automaticamente. O plano pode ser ajustado conforme a demanda cresce.
- **Vercel**: A plataforma de deploy oferece Edge Network global com auto-scaling. Nao ha necessidade de gerenciar servidores, containers ou load balancers.
- **PWA**: Por ser um Progressive Web App, nao ha custos de publicacao na App Store ou Play Store. Atualizacoes sao instantaneas -- basta fazer deploy e todos os usuarios recebem a versao mais recente.

---

## 7. Estrutura Tecnica Resumida

### Stack Tecnologica

```
Frontend:    Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
Estado:      Zustand (estado global) + React Hook Form + Zod (formularios)
Animacoes:   Framer Motion (gamificacao, transicoes)
Backend:     Supabase (Auth, Database, Storage, Edge Functions)
Banco:       PostgreSQL (gerenciado pelo Supabase) com Row Level Security
Auth:        Supabase Auth (email/senha + magic link)
Storage:     Supabase Storage (avatares e anexos)
Videos:      YouTube embed (nao faz upload -- usa YouTube Video ID)
Push:        Web Push API via Service Worker + Supabase Edge Functions
PWA:         next-pwa + Workbox (instalavel em iOS/Android pelo browser)
Deploy:      Vercel (auto-deploy por push no GitHub, Edge Network global)
CI/CD:       GitHub Actions (lint, typecheck, testes, migration check)
Monitoramento: Vercel Analytics + Sentry (erros)
```

### Arquitetura

O projeto segue os principios da **Clean Architecture** com separacao clara de camadas:

```
Presentation  -->  Interface Adapters  -->  Application (Use Cases)  -->  Domain  -->  Infrastructure
   (Next.js)        (Hooks, Stores)        (Regras de negocio)       (Entidades)    (Supabase, YouTube)
```

A regra de dependencia e rigida: camadas internas nunca dependem de camadas externas. O dominio nao conhece Supabase, Next.js ou qualquer tecnologia especifica.

### Monorepo

O projeto e organizado como monorepo usando pnpm workspaces + Turborepo:

```
apps/
  app/        --> App SDR (Next.js) --> deploy em app.3x.com.br
  admin/      --> Painel Admin (Next.js) --> deploy em admin.3x.com.br

packages/
  domain/         --> Entidades, Value Objects, Interfaces de repositorio
  application/    --> Use Cases, DTOs, Event Bus
  infrastructure/ --> Repositorios Supabase, servicos YouTube, Web Push
  shared/         --> Utilitarios e tipos compartilhados

supabase/
  migrations/     --> Scripts SQL versionados (001_ ate 012_)
  functions/      --> Edge Functions (cron jobs, webhooks)
```

---

## 8. Variaveis de Ambiente

Todas as variaveis de ambiente sao configuradas no **dashboard da Vercel** (Settings > Environment Variables), separadas por ambiente (Production, Preview, Development). **Nunca commite valores reais no repositorio.**

### Variaveis Publicas (expostas ao browser)

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://xxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anonima do Supabase (segura para client-side, protegida por RLS) | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` | ID do canal do YouTube da 3X | `UCxxxxxxxx` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave publica VAPID para Web Push | `BN...` |
| `NEXT_PUBLIC_APP_URL` | URL do app em producao | `https://app.3x.com.br` |
| `NEXT_PUBLIC_APP_ENV` | Ambiente atual | `production`, `preview` ou `development` |

### Variaveis Secretas (apenas server-side)

| Variavel | Descricao | Onde e usada |
|----------|-----------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de servico do Supabase (bypassa RLS) | API Routes, Server Components, Edge Functions |
| `YOUTUBE_API_KEY` | Chave da YouTube Data API v3 | Busca de metadados de videos |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID para Web Push | Envio de notificacoes push |
| `VAPID_SUBJECT` | Email de contato para VAPID | `mailto:dev@3x.com.br` |
| `SENTRY_DSN` | URL de conexao do Sentry | Rastreamento de erros |
| `SENTRY_AUTH_TOKEN` | Token de autenticacao do Sentry | Upload de source maps |

### Como gerar as chaves VAPID

```bash
npx web-push generate-vapid-keys
```

O comando gera um par de chaves publica/privada. A chave publica vai em `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e a privada em `VAPID_PRIVATE_KEY`.

### Importante

- Variaveis com prefixo `NEXT_PUBLIC_` sao expostas ao browser. So use esse prefixo para valores que podem ser publicos.
- A `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta no client-side. Ela bypassa toda a seguranca de RLS e deve ser usada exclusivamente em API Routes e Server Components.
- O arquivo `.env.example` no repositorio contem o template com todas as variaveis necessarias (sem valores reais).

---

## 9. FAQ -- Perguntas Frequentes

### Acesso e Onboarding

**P: Como uma nova loja comeca a usar o 3X App?**
R: O fluxo e: compra no checkout externo --> recebe codigo de acesso por email --> acessa `/register` e cria conta admin --> convida suas SDRs pelo painel admin.

**P: As SDRs precisam baixar um aplicativo na loja (App Store / Play Store)?**
R: Nao. O 3X App e um PWA (Progressive Web App). As SDRs acessam pelo navegador do celular e podem "instalar" o app na tela inicial tocando em "Instalar App" nas configuracoes do perfil. Ele funciona como um app nativo, com icone na home screen e tela cheia.

**P: Quanto tempo demora para uma SDR comecar a usar?**
R: Menos de 2 minutos. Basta clicar no link de convite, criar nome e senha, e ja esta dentro do app.

**P: O convite por email expira?**
R: Sim. O link de convite e valido por 7 dias. Apos esse periodo, o admin precisa enviar um novo convite.

### Dados e Seguranca

**P: Os dados de uma loja sao visiveis para outra loja?**
R: Nao, em nenhuma hipotese. O isolamento e garantido a nivel de banco de dados por Row Level Security (RLS). Cada consulta ao banco filtra automaticamente pelo `store_id` do usuario autenticado.

**P: E possivel uma SDR ver os dados de outra SDR?**
R: Nao. Cada SDR so ve seus proprios dados. A supervisora e o admin veem dados de todas as SDRs da mesma loja, mas nunca de outras lojas.

**P: Os dados sao criptografados?**
R: Sim. Toda comunicacao entre o app e o servidor e feita via HTTPS. As senhas sao hasheadas pelo Supabase Auth (bcrypt). Os dados no banco PostgreSQL sao armazenados em servidores gerenciados pelo Supabase com criptografia em repouso.

### Conteudo e Videos

**P: Como adicionar novas videoaulas?**
R: O admin acessa o Painel Admin --> Conteudo --> Videos --> "Adicionar Video". Basta colar o YouTube Video ID (ex: `dQw4w9WgXcQ`, que e o codigo que aparece na URL do YouTube apos `v=`). O sistema busca automaticamente o titulo, thumbnail e duracao.

**P: Preciso fazer upload de video?**
R: Nao. Os videos ficam no YouTube. O 3X App apenas faz o embed. Isso elimina custos de armazenamento e streaming.

**P: Posso usar videos de qualquer canal do YouTube?**
R: Sim. Basta que o video seja publico ou nao-listado no YouTube. Videos privados nao podem ser embedados.

### Gamificacao

**P: O que acontece quando a SDR atinge o nivel maximo?**
R: No nivel 6 (Mestre das Vendas), a SDR continua acumulando XP normalmente. Novos niveis e fases podem ser adicionados pelo admin conforme o programa de treinamento evolui.

**P: O ranking e entre lojas?**
R: Nao. O ranking e sempre intra-loja. SDRs de uma loja so competem entre si, nunca com SDRs de outras lojas.

**P: O streak zera se a SDR nao usar o app no fim de semana?**
R: Depende da configuracao. Por padrao, o streak considera apenas dias uteis. O admin pode configurar para incluir fins de semana se desejar.

### Tecnico

**P: O sistema funciona offline?**
R: Parcialmente. Scripts, checklists e conteudo ja visualizado ficam em cache e podem ser acessados offline. Porem, acoes que exigem gravacao no banco de dados (registrar vendas, completar checklist, etc.) precisam de conexao com a internet.

**P: O app funciona em qual dispositivo?**
R: Em qualquer dispositivo com navegador moderno (Chrome, Safari, Firefox, Edge). Funciona em celulares Android, iPhones, tablets e desktops. O design e mobile-first, otimizado para uso no celular.

**P: Como atualizar o app?**
R: As atualizacoes sao automaticas. Ao fazer deploy de uma nova versao na Vercel, todos os usuarios recebem a versao atualizada na proxima vez que abrirem o app. Nao e necessario "atualizar" na loja de aplicativos porque nao e um app nativo.

**P: Qual o custo de infraestrutura?**
R: O custo e composto por: Supabase (plano gratuito para ate 50.000 usuarios ativos/mes, planos pagos a partir de USD 25/mes) + Vercel (plano gratuito para projetos pessoais, Pro a partir de USD 20/mes) + Dominio (custo anual). Para a maioria das operacoes ate 50 lojas, o custo de infra fica abaixo de USD 100/mes.

---

*Documento gerado para o projeto 3X App.*
*Versao: 1.0.0*
