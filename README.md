# Easy Ponto

Sistema de controle de ponto do Supermercado Baratão. Ele lê a empresa, os funcionários e as batidas do relógio de ponto (Control iD iDClass).

Hoje a loja usa o Secullum, então o Easy Ponto também importa o relatório **Cartão Ponto** exportado de lá. Essa importação existe para facilitar a migração de um sistema para o outro, não para complementar o uso diário: ela traz o que o aparelho não tem (departamento, função, data de admissão, número da folha e escala de horários) e as batidas incluídas manualmente no Secullum.

## Como rodar

Pré-requisitos: Node 24 (versão no `.nvmrc`), pnpm (versão no `packageManager` do `package.json`) e Docker.

```bash
pnpm install
pnpm dev
```

O `pnpm dev` sobe o Postgres, roda as migrations e inicia o servidor em [http://localhost:3000](http://localhost:3000). Os containers continuam rodando depois de encerrar o servidor: use `pnpm services:stop` para pará-los ou `pnpm services:down` para removê-los.

### Administrador

Ainda não há login: as páginas privadas (`/configuracoes`, `/registros-de-ponto`) carregam o administrador cujo `id` está na variável `ADMIN_USER_ID`. Sem ele, essas páginas dão erro. O servidor lê esse administrador e as credenciais do relógio sozinho, e a senha do relógio nunca vai para o navegador.

1. Com o `pnpm dev` rodando, crie o administrador no banco local:

   ```bash
   docker compose -f src/infra/compose.yml exec database psql -U postgres -d easy_ponto -c "INSERT INTO admin_users (id, updated_at) VALUES (gen_random_uuid(), now()) RETURNING id"
   ```

2. Coloque o `id` retornado no `.env.local`, que é ignorado pelo git:

   ```bash
   ADMIN_USER_ID=<id>
   ```

3. Reinicie o `pnpm dev`. Em `/configuracoes`, cadastre o IP, o login e a senha do relógio de ponto e importe a empresa.

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
| `pnpm migrations:generate <nome>`           | Gera uma migration a partir de `src/infra/database/contract.prisma`            |
| `pnpm migrations:up`                        | Roda as migrations pendentes no banco local                                    |
| `pnpm database:generate`                    | Gera os tipos do banco a partir do contrato (também roda no `postinstall`)     |
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
- `models/` guarda as regras de negócio de cada domínio (inclusive a comunicação com o relógio de ponto, em `models/device`), `repositories/` as queries, `entry/` a adaptação das Server Actions aos models e `infra/` a base técnica (banco, datas e erros).
- O `synchronizationModel` reúne as sincronizações: empresa, funcionários (pelo PIS), batidas do AFD (ignorando os NSRs já salvos) e a importação do relatório do Secullum para a migração (funcionários pelo nome, as batidas marcadas com `*`, que não estão no AFD, e as escalas, a partir do primeiro dia do período do relatório).
- O `journeyModel` calcula a jornada de cada dia (carga esperada, horas trabalhadas, faltas, atrasos, folgas descontadas do banco de horas e extras) a partir das batidas, escalas, feriados e justificativas do Easy Ponto, nunca dos totais do Secullum. As tolerâncias ficam em constantes em `src/models/journey/utils.ts`, porque as regras ainda vão passar por uma revisão com base na CLT (#65).
- O `hoursBankModel` soma esses dias por funcionário no relatório de horas (`/relatorio-de-horas`): saldo = anterior + extras 60% + extras 100% + ajustes − faltas − atrasos − folgas. Fechar um período salva o saldo de cada funcionário, que vira o saldo anterior do próximo período. Um período fechado mostra os valores salvos em vez de recalcular, o próximo deve começar no dia seguinte, só o último fechamento pode ser reaberto e os ajustes com data num período fechado não podem mudar.
- As batidas do AFD de um PIS sem funcionário salvo são descartadas, até a #30 decidir como guardar o histórico de ex-funcionários.
- Datas e horários são salvos em UTC com o horário local (`07:27` vira `07:27Z`), sempre pelo `dayjs` de `@/infra/dayjs`. A data atual vem de `wallClockNow()`, no horário de São Paulo.
- `actions.ts` com `'use server'` é só para mutações chamadas pelo cliente; dados lidos por uma Server Component vêm de um `data.ts`. As páginas que leem o banco renderizam a cada requisição.
- Os formulários usam `useFormState` (os novos usam `useActionState`, o nome atual no React 19) com Server Actions que chamam o `handleFormAction()`: os erros do Zod viram mensagens nos campos, e os outros erros viram um toast.
- Todo registro que pode ser cadastrado também pode ser editado, e todos os campos do formulário são editáveis, menos os dados imutáveis (como os que vêm do AFD).

### Interface

- shadcn/ui (sobre Base UI) e Tailwind CSS v4, com o tema do shadcn e a paleta do Tailwind como vêm. Componentes novos entram com `pnpm shadcn:add <componente>`.
- Componentes compartilhados ficam em `src/app/components`, e hooks compartilhados do cliente em `src/app/hooks`.
- O dark mode usa o `next-themes`: segue o sistema por padrão e pode ser trocado no cabeçalho.

### Banco de dados

- Postgres com Prisma Next. O schema é o contrato em `src/infra/database/contract.prisma`, e as migrations são geradas a partir dele em `src/infra/database/migrations`.
- Os testes usam outro container (`database-test`, porta `5433`, em memória), com o `.env.test`, então nunca mexem nos dados de desenvolvimento.

### Testes

- Vitest e Playwright. Os testes unitários ficam junto do código que testam, os de integração ficam em `src/tests/integration` e chamam os models no banco de testes, os externos ficam em `src/tests/external` e usam o aparelho real, e os end-to-end ficam em `src/tests/e2e`.
- Os testes end-to-end sobem um servidor próprio na porta `3001`, ligado ao banco de testes, com um administrador fixo (o `ADMIN_USER_ID` do `.env.test`). Dá para rodá-los com o `pnpm dev` aberto, mas não ao mesmo tempo que os de integração, que usam o mesmo banco.
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
