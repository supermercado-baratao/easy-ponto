# Easy Ponto

Sistema de controle de ponto do Supermercado Baratão. Ele lê a empresa, os funcionários e as batidas do relógio de ponto (Control iD iDClass).

Hoje a loja usa o Secullum, então o Easy Ponto também importa o relatório **Cartão Ponto** exportado de lá. Essa importação existe para facilitar a migração de um sistema para o outro, não para complementar o uso diário: ela traz o que o aparelho não tem (departamento, função, data de admissão, número da folha e escala de horários), as batidas incluídas manualmente no Secullum e as justificativas (férias, atestados, compensações e outras).

## Como rodar

Pré-requisitos: Node 24 (versão no `.nvmrc`), pnpm (versão no `packageManager` do `package.json`) e Docker.

```bash
pnpm install
pnpm dev
```

O `pnpm dev` sobe o Postgres, roda as migrations e inicia o servidor em [http://localhost:3000](http://localhost:3000). Os containers continuam rodando depois de encerrar o servidor: use `pnpm services:stop` para pará-los ou `pnpm services:down` para removê-los.

### Primeiro acesso

O login usa o [better-auth](https://www.better-auth.com/), e cada conta pertence a uma ou mais empresas. Não há cadastro público:

1. Com o `pnpm dev` rodando, abra [http://localhost:3000/entrar](http://localhost:3000/entrar). Enquanto não existe nenhuma conta, o app leva para `/configuracao-inicial`, onde você cadastra a empresa e a conta de quem a administra (e-mail e senha).
2. Em `/configuracoes`, escolha o modelo do relógio de ponto, cadastre o IP, o login e a senha, importe a empresa e informe os adicionais de hora extra de cada tipo de dia. Enquanto isso não for feito, o app leva quem administra a empresa para essa página.
3. Ao sincronizar, cada funcionário com um CPF válido ganha uma conta. Ele entra pela aba CPF de `/entrar` com a senha padrão: os cinco primeiros dígitos do CPF seguidos do último nome, em minúsculas e sem acentos (`Maria Aparecida Souza`, CPF `123.456.789-10` → `12345souza`). No primeiro acesso, o app pede uma senha nova. Se o funcionário esquecer a senha, o administrador a redefine para a senha padrão em `/funcionarios`.

Cada conta tem um papel na empresa: o proprietário e o administrador editam tudo, o visualizador consulta todas as páginas sem editar nada e o funcionário só acessa `/meu-ponto`, onde consulta, sem editar, os próprios registros de ponto e a jornada de cada dia do mês, com os totais do mês. Em `/membros`, o proprietário e o administrador dão acesso a outras pessoas com uma senha temporária, que precisa ser trocada no primeiro acesso: o administrador gerencia os visualizadores, e só o proprietário gerencia os administradores e transfere a propriedade. Os funcionários são geridos em `/funcionarios`.

O servidor lê a empresa ativa e as credenciais do relógio pela sessão, e a senha do relógio nunca vai para o navegador. O `.env.development` já traz um `BETTER_AUTH_SECRET` local. Como a migração deste login exige um banco vazio, recrie o banco de desenvolvimento (`docker compose -f src/infra/compose.yml down -v` e `pnpm dev`) se ele for de uma versão anterior.

### Relógio de ponto

As credenciais do aparelho real usadas pelos testes externos e pelo `pnpm test:mocks:create` também ficam no `.env.local`: `DEVICE_IP`, `DEVICE_LOGIN`, `DEVICE_PASSWORD` e `DEVICE_SESSION_TOKEN`. Nunca coloque essas credenciais nem dados reais de funcionários (nomes, PIS, CPF) em arquivos commitados, issues ou pull requests.

## Scripts

| Script                                      | O que faz                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                                  | Sobe o banco, roda as migrations e inicia o servidor                           |
| `pnpm build` / `pnpm start`                 | Gera e serve o build de produção                                               |
| `pnpm test` / `pnpm test:watch`             | Roda os testes unitários (uma vez ou em modo watch)                            |
| `pnpm test:integration`                     | Sobe os bancos, roda as migrations no de testes e roda os testes de integração |
| `pnpm test:external`                        | Roda os testes que usam o relógio de ponto real (fora do CI)                   |
| `pnpm test:e2e` / `pnpm test:e2e:ui`        | Roda os testes end-to-end (ou na interface do Playwright)                      |
| `pnpm test:mocks:create`                    | Gera os dados falsos de `src/tests/_mocks` a partir do aparelho real           |
| `pnpm services:up` / `stop` / `down`        | Sobe, para ou remove os containers                                             |
| `pnpm migrations:generate <nome>`           | Gera uma migration a partir de `src/infra/database/schema.ts`                  |
| `pnpm migrations:up`                        | Roda as migrations pendentes no banco local                                    |
| `pnpm eslint:check` / `pnpm eslint:fix`     | Verifica (e corrige) com ESLint                                                |
| `pnpm prettier:check` / `pnpm prettier:fix` | Verifica (e reescreve) a formatação                                            |
| `pnpm type-check`                           | Gera os tipos das rotas e roda o `tsc --noEmit`                                |
| `pnpm shadcn:add <componente>`              | Adiciona um componente do shadcn/ui                                            |

## Convenções do projeto

As convenções completas estão no [`AGENTS.md`](./AGENTS.md), e o fluxo do planejamento ao merge está em [`docs/development-workflow.md`](./docs/development-workflow.md). Os destaques estão abaixo.

### Idioma

- Issues, template de issue, este README e tudo que o usuário vê (interface, rotas, toasts e mensagens de erro) ficam em português.
- Código, comentários, descrições de testes, commits, branches, pull requests, `AGENTS.md` e `docs/` ficam em inglês.

### Arquitetura

- O código do servidor é dividido em camadas, e os imports só descem: `app` → `entry` → `models` → `repositories` → `infra`, com `constants` disponível para todas, sem importar nenhuma delas. O ESLint garante essa direção, e só os repositories acessam o cliente do banco.
- `models/` guarda as regras de negócio de cada domínio (inclusive a comunicação com o relógio de ponto, em `models/device`, com um adaptador para cada modelo de relógio), `repositories/` as queries, `entry/` a adaptação das Server Actions aos models e `infra/` a base técnica (banco, datas e erros).
- Os relatórios da migração também têm um adaptador para cada sistema de origem, em `models/time-card-report`. O adaptador só lê o arquivo (`read`) e devolve os dados normalizados (`TTimeCardReport`): o período, o cadastro da empresa, os funcionários, as escalas, as batidas, as justificativas pelo código do sistema de origem e os totais do banco de horas, com os funcionários identificados pelo nome. Encontrar os funcionários salvos e gravar os dados ficam a cargo do `synchronizationModel`. O sistema de origem é escolhido no select ao lado de cada botão de importação.
- Para adicionar um formato de relatório, escreva o adaptador em `src/models/time-card-report/adapters/<sistema>/` (a leitura, os códigos e as regras próprias do sistema ficam ali, junto com os testes), adicione o formato a `TIME_CARD_REPORT_FORMATS` e `TIME_CARD_REPORT_FORMAT_LABELS` (`src/models/time-card-report/utils.ts`) e registre o adaptador em `ADAPTERS` (`src/models/time-card-report/model.ts`). Hoje só existe o `secullum`.
- O `synchronizationModel` reúne as sincronizações: empresa, funcionários (pelo PIS), batidas do AFD (ignorando os NSRs já salvos) e a importação do relatório do Secullum para a migração (funcionários pelo nome, as batidas marcadas com `*`, que não estão no AFD, as escalas, a partir do primeiro dia do período do relatório, e as justificativas), gravando tudo numa única transação.
- As justificativas do relatório do Secullum são lidas pelos códigos nas células de batida. Um código em todos os pares da escala do dia cobre o dia inteiro, e os dias seguidos com o mesmo código viram um único intervalo. Um código em só alguns pares cobre aquele turno, com o horário do par na escala. `Feriado` e `Falta` são ignorados, assim como `Folga` (descanso da escala) num dia sem horário na escala. Num dia de trabalho da escala (rodízio da 5x2 ou loja fechada), `Folga` é um código como os outros, para o dia não virar falta. Maiúsculas fazem diferença: `FOLGA` é um código da loja. Um código usa o tipo escolhido para ele numa importação anterior ou, se não houver, o tipo cujo nome é exatamente o código, com as mesmas maiúsculas. Se não houver nenhum dos dois, a importação pergunta, antes de gravar, qual tipo cadastrado corresponde a ele. "Cadastrar um novo tipo" abre o cadastro de tipos, com o código como nome, e o tipo salvo fica escolhido para o código. A escolha fica salva para a empresa, então cada código é perguntado uma vez só. Uma justificativa que se sobrepõe a outra já cadastrada é ignorada e, se não for a mesma, contada no aviso do fim da importação.
- Uma escrita que precisa participar de uma transação maior recebe o `tx` opcional e roda com `runInTransaction` (`src/infra/database/client.ts`), porque uma transação não abre outra.
- O `journeyModel` calcula a jornada de cada dia (carga esperada, horas trabalhadas, faltas, atrasos, compensações descontadas do banco de horas e extras) a partir das batidas, da escala de cada funcionário (com os ajustes de dia), dos feriados e das justificativas do Easy Ponto, nunca dos totais do Secullum. Um dia sem escala em vigor não é calculado. As tolerâncias são as das regras da jornada da empresa, e as extras do dia são divididas pelas faixas de adicional do tipo de dia (dia útil, folga da escala ou feriado). Um tipo de dia ainda sem faixas guarda as extras como "sem adicional". As tabelas mostram uma coluna para cada adicional. As batidas ainda são agrupadas por data, então o turno que passa da meia-noite ainda não é casado com as batidas do dia seguinte.
- O `hoursBankModel` soma esses dias por funcionário no relatório de horas (`/relatorio-de-horas`): saldo = anterior + extras de todos os adicionais + ajustes − faltas − atrasos − compensações. Fechar um período salva o saldo de cada funcionário, que vira o saldo anterior do próximo período. Um período fechado mostra os valores salvos em vez de recalcular, o próximo deve começar no dia seguinte, só o último fechamento pode ser reaberto e os ajustes com data num período fechado não podem mudar.
- O saldo inicial do banco de horas vem do Cartão Ponto do Secullum, num relatório que começa quando o banco começou (saldo zero): `synchronizationModel.importInitialBalance` soma, por funcionário, faltas, extras (as colunas de 60% e 100%, salvas como esses dois adicionais) e ajustes dos totais do relatório, conta cada código de justificativa do dia (7:20 o dia inteiro, 3:20 meio dia, nunca `Folga`) e credita o dia inteiro num feriado trabalhado, como a planilha usada antes da migração. Os códigos são resolvidos como na importação do Cartão Ponto, e só os de tipos que descontam do banco de horas entram no saldo. O resultado é salvo como um fechamento marcado como inicial, que vai até o último dia do relatório. Ele só pode ser importado antes do primeiro fechamento, e descartá-lo é reabrir esse fechamento. Os funcionários são encontrados pelo nome, e os que não estão no Easy Ponto são avisados e ignorados.
- Cada empresa já nasce com os tipos de justificativa padrão, que podem ser editados ou removidos: "Compensação", que desconta do banco de horas, e "Abono", "Atestado médico", "Ausência legal", "Férias" e "Licença", que abonam. Cada tipo tem só um nome, que não se repete na empresa, nem com outras maiúsculas e minúsculas, e uma descrição opcional do que ele é e de quando usá-lo, que os tipos padrão já trazem. A observação da justificativa guarda o motivo daquele caso, como o de um abono, e aparece ao passar o mouse sobre a justificativa na tabela de registros de ponto. "Folga" é só o descanso da escala, e o dia descontado do banco de horas é uma compensação. A lista é uma organização do produto, não uma validação jurídica, até a revisão com base na CLT (#65).
- A situação do funcionário (Registrado, Experiência, Afastado ou Desligado) só é editada em `/funcionarios`: a sincronização cria os funcionários novos como Registrado e nunca a sobrescreve. Férias e compensações são justificativas, não situações. A lista de funcionários esconde os desligados, a não ser que o filtro peça por eles.
- As escalas da empresa (`/escalas`) repetem um ciclo de 1 a 35 dias, cada um de trabalho (até 3 pares de entrada e saída) ou de folga. Cada escala guarda versões com a data de início, para mudar os horários a partir de uma data sem alterar o passado. Um horário antes do anterior é do dia seguinte, como no 12x36 noturno. Os modelos 6x1, 5x2 e 12x36 só preenchem o formulário: o Easy Ponto não cria nenhuma escala sozinho. Uma escala ligada a algum funcionário não pode ser removida, porque os vínculos são o histórico dos funcionários.
- Cada funcionário é ligado às escalas em `/funcionarios`, com a data de início, a data de fim opcional e o dia do ciclo em que ele está no início, o que dá a cada um uma folga diferente na mesma escala. Ao mudar de escala, o vínculo antigo é encerrado e continua no histórico. Um funcionário pode seguir mais de uma escala ao mesmo tempo: os pares das escalas em vigor no dia se somam, então o vínculo é recusado quando os horários se sobrepõem ou o dia passa de 3 pares. Um ajuste de dia substitui o dia inteiro: folga, trabalho com a carga da escala (troca de folga) ou outra carga. O ajuste é planejamento da escala e não desconta do banco de horas. A importação do relatório do Secullum transforma o "Horário de Trabalho" numa escala de 7 dias, começando na segunda-feira, que os funcionários com o mesmo horário compartilham, e liga cada um a ela desde o primeiro dia do período.
- Cada empresa tem as suas regras da jornada (`journeyRulesModel`, editadas em `/configuracoes`): as tolerâncias por batida e por dia, os limites dos alertas (pausa máxima, jornada diária máxima e tempo máximo sem pausa) e os adicionais de hora extra. A empresa nova começa com as regras da CLT, que a convenção ou o acordo coletivo pode alterar, e sem adicionais, já que cada empresa segue a sua convenção. Os adicionais são faixas por tipo de dia (dia útil, folga e feriado), cada uma até um limite de horas extras no dia, e a última vale para as demais horas (por exemplo, as 2 primeiras a 50% e as demais a 100%).
- A agenda de expedientes (`/expedientes`) mostra os dias da escala de cada funcionário de hoje até 6 dias depois (marcando os ajustados), com as escalas em vigor hoje, o almoço e a jornada de cada dia, e destaca o almoço, a jornada e o tempo sem intervalo acima dos limites das regras da jornada da empresa. O filtro por horário procura a primeira entrada ou a última saída de qualquer um desses dias.
- O planejamento de férias (`/ferias`) guarda o mês de férias de cada funcionário por ano e mostra o ano por mês. Registrar as férias cria uma justificativa do dia inteiro, do tipo escolhido na hora, ligada ao planejamento. O mês de férias já registradas só muda depois que a justificativa é removida. Os períodos aquisitivo e concessivo ainda vão passar pela revisão com base na CLT (#65).
- O calendário (`/calendario`) planeja a carga de cada dia do mês: 7:20 do dia 11 ao 26 e 8:00 no começo e no fim do mês, sem carga aos domingos e nos feriados. Ele mostra o total de cada semana e do mês, a jornada padrão (dias trabalhados × 7:20) e o excedente. É só um planejamento: o cálculo da jornada não usa essas cargas. Os valores ficam em `src/models/journey/utils.ts` até a revisão com base na CLT (#65).
- As batidas do AFD de um PIS sem funcionário salvo são descartadas, até a #30 decidir como guardar o histórico de ex-funcionários.
- Datas e horários são salvos em UTC com o horário local (`07:27` vira `07:27Z`), sempre pelo `dayjs` de `@/infra/dayjs`. A data atual vem de `wallClockNow()`, no horário de São Paulo.
- `actions.ts` com `'use server'` é só para mutações chamadas pelo cliente; dados lidos por uma Server Component vêm de um `data.ts`. As páginas que leem o banco renderizam a cada requisição.
- Os formulários usam `useFormState` (os novos usam `useActionState`, o nome atual no React 19) com Server Actions que chamam o `handleFormAction()`: os erros do Zod viram mensagens nos campos, os erros conhecidos (`KnownError`, como `ValidationError` e os erros do relógio de ponto) viram um toast com a mensagem e o que fazer, e os inesperados viram um toast genérico, sem expor detalhes internos. As actions que não são envio de formulário usam o `handleAction()`, com o mesmo tratamento. Depois de um erro, a action devolve os valores digitados (menos as senhas), porque o React limpa o formulário ao fim da action.
- Todo registro que pode ser cadastrado também pode ser editado, e todos os campos do formulário são editáveis, menos os dados imutáveis (como os que vêm do AFD).

### Interface

- shadcn/ui (sobre Base UI) e Tailwind CSS v4, com o tema do shadcn e a paleta do Tailwind como vêm. Componentes novos entram com `pnpm shadcn:add <componente>`.
- Componentes compartilhados ficam em `src/app/components`, hooks compartilhados do cliente em `src/app/hooks` e textos e helpers da interface usados por mais de uma rota (como os rótulos de situação e dos dias da semana) em `src/app/utils`.
- Um seletor de arquivo é um `Button` que abre um `<input type="file">` escondido, para ser acessível pelo teclado.
- O dark mode usa o `next-themes`: segue o sistema por padrão e pode ser trocado no cabeçalho.

### Banco de dados

- Postgres com Drizzle ORM. O schema fica em `src/infra/database/schema.ts`, e as migrations são geradas a partir dele em `src/infra/database/migrations`.
- Os testes usam outro container (`database-test`, porta `5433`, em memória), com o `.env.test`, então nunca mexem nos dados de desenvolvimento.

### Produção

- O app roda no servidor da loja, na mesma rede do relógio de ponto, a partir da imagem `ghcr.io/supermercado-baratao/easy-ponto`, com o `compose.yaml` da raiz (app e Postgres, sem porta do banco publicada). Os guias de [instalação](./guias/instalacao.md), [atualização](./guias/atualizacao.md) e [backup](./guias/backup.md) estão em `guias/`.
- Em produção, o app aplica as migrations pendentes ao iniciar (`src/instrumentation.ts`).
- Para publicar uma versão, atualize a `version` do `package.json` e crie a tag `vX.Y.Z` correspondente. O `.github/workflows/release.yml` gera a imagem para `linux/amd64` e `linux/arm64`, testa a imagem com um Postgres, publica no GHCR e cria o release.

### Testes

- Vitest e Playwright. Os testes unitários ficam junto do código que testam, os de integração ficam em `src/tests/integration` e chamam os models no banco de testes, os externos ficam em `src/tests/external` e usam o aparelho real, e os end-to-end ficam em `src/tests/e2e`.
- Os testes end-to-end sobem um servidor próprio na porta `3001`, ligado ao banco de testes. O projeto `setup` do Playwright entra com o administrador criado pelo `global-setup.ts` e guarda a sessão em `playwright/.auth/`, que os outros testes reaproveitam. Dá para rodá-los com o `pnpm dev` aberto, mas não ao mesmo tempo que os de integração, que usam o mesmo banco.
- Os testes externos não rodam no CI nem nos hooks. Rode `pnpm test:external` só quando nada mais puder verificar a mudança.
- Só testamos a lógica que escrevemos, não o comportamento de bibliotecas ou do framework.

### Git hooks e CI

- **Hooks do Husky:**
  - `pre-commit` roda o `lint-staged` (ESLint, Prettier e os testes unitários relacionados aos arquivos staged).
  - `commit-msg` adiciona o emoji do prefixo e roda o `commitlint`.
  - `pre-push` roda o type-check e os testes de integração e end-to-end.
- **Commits** em inglês, no imperativo e em minúsculas, com prefixo semântico, por exemplo `✨ feat: add punch records page`. Basta digitar `feat: ...`, já que o hook adiciona o emoji.
- **Branches:** cada issue vai para uma branch nova chamada `<scope>/<title>#<issue>`, por exemplo `feat/punch-records-page#12`. Nada de uma issue é commitado direto na `main`.
- **Issues** são criadas pelo template **Tarefa** (`.github/ISSUE_TEMPLATE/task.md`). Marque cada item concluído antes de fechar a issue.
- **GitHub Actions** (`.github/workflows/ci.yml`) roda em todo pull request: commitlint, type-check, ESLint, Prettier e os testes unitários, de integração e end-to-end.

### Assistente de IA

- `AGENTS.md` (importado pelo `CLAUDE.md`) documenta as convenções para agentes de código.
- `.mcp.json` configura os servidores MCP `context7` (documentação de bibliotecas) e `playwright`.
- `.claude/` tem a skill `new-component`, para adicionar componentes shadcn ou compartilhados, a skill `review-copy`, que revisa nomes, comentários, descrições de testes, textos da interface e documentação, o subagente `ui-reviewer`, que revisa semântica e acessibilidade da interface, e um `settings.json` que pede confirmação antes de todo `git commit`.

#### Chave da API do Context7

O `.mcp.json` lê a chave da variável de ambiente `CONTEXT7_API_KEY` (`"Authorization": "Bearer ${CONTEXT7_API_KEY}"`), então ela nunca vai para o repositório. O Claude Code expande a variável ao iniciar.

1. Gere uma chave no painel do [Context7](https://context7.com).
2. Defina a variável de uma destas formas:
   - **No shell (todos os projetos):** exporte-a no perfil do shell. No fish, rode `set -Ux CONTEXT7_API_KEY <sua-chave>`. No bash ou zsh, adicione `export CONTEXT7_API_KEY=<sua-chave>` ao `~/.bashrc` ou `~/.zshrc`.
   - **Só neste projeto:** adicione-a ao `.claude/settings.local.json`, que é ignorado pelo git:

     ```json
     {
       "env": {
         "CONTEXT7_API_KEY": "<sua-chave>"
       }
     }
     ```

3. Reinicie o Claude Code e rode `/mcp` para conferir se o `context7` está conectado.

Nunca coloque a chave no `.mcp.json` nem no `.claude/settings.json`, já que os dois são commitados.

## Licença

[MIT](./LICENSE)
