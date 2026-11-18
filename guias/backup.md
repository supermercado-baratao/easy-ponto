# Backup e restauração

Tudo o que o app guarda fica no banco Postgres: a empresa, os funcionários, as batidas, as escalas, as justificativas e o banco de horas. O backup é uma cópia do banco num único arquivo, feita com o `pg_dump`.

Faça um backup antes de cada [atualização](./atualizacao.md) e com frequência (todo dia, de preferência), e guarde uma cópia fora do servidor (num HD externo ou num serviço de nuvem). Se o servidor quebrar, é essa cópia que salva os dados de ponto.

> [!WARNING]
> O backup tem os dados pessoais dos funcionários (LGPD). Guarde as cópias num lugar com acesso restrito e nunca as compartilhe.

Os comandos são rodados na pasta `easy-ponto` da [instalação](./instalacao.md).

## Fazendo o backup

O app continua funcionando durante o backup:

```bash
docker compose exec -T database sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "easy-ponto-backup-$(date +%F).dump"
```

O arquivo `easy-ponto-backup-<data>.dump`, por exemplo `easy-ponto-backup-2026-11-18.dump`, aparece na pasta `easy-ponto`.

### Backup automático

Para fazer o backup todo dia às 23h e apagar os com mais de 30 dias, rode `crontab -e` com um usuário do grupo `docker` (ou `sudo crontab -e`) e adicione esta linha, trocando `/caminho/para/easy-ponto` pelo caminho da pasta:

```cron
0 23 * * * cd /caminho/para/easy-ponto && docker compose exec -T database sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "easy-ponto-backup-$(date +\%F).dump" && find . -name 'easy-ponto-backup-*.dump' -mtime +30 -delete
```

O cron não guarda a cópia fora do servidor: continue copiando os arquivos para outro lugar.

## Restaurando

A restauração **apaga os dados atuais do banco** e coloca no lugar os do backup. Tudo o que foi salvo depois do backup se perde.

1. Coloque o arquivo do backup na pasta `easy-ponto`.
2. Pare o app, restaure o banco e inicie o app de novo, trocando o nome do arquivo:

   ```bash
   docker compose stop app
   docker compose exec -T database sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < easy-ponto-backup-2026-11-18.dump
   docker compose up -d
   ```

3. Abra o app no navegador e confira se os funcionários e as batidas voltaram.

Para restaurar num servidor novo, siga a [instalação](./instalacao.md) até o passo 3 (iniciar o app), copie o arquivo do backup para a pasta `easy-ponto` e siga os passos acima. O administrador e o relógio de ponto vêm do backup: coloque no `ADMIN_USER_ID` do `.env` o mesmo `id` do servidor antigo. Se o backup veio de uma versão mais nova que a do `compose.yaml`, ajuste a tag da imagem antes de restaurar (veja [Escolhendo a versão](./atualizacao.md#escolhendo-a-versão)).
