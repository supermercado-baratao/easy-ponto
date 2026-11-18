# Instalação

Este guia instala o Easy Ponto no servidor da loja, que passa a servir o app para os outros computadores da rede. O app precisa rodar na loja porque conversa com o relógio de ponto pelo IP da rede local, e assim os dados de ponto dos funcionários também ficam na loja.

## O que você precisa

- Um servidor Linux ligado o tempo todo, na mesma rede do relógio de ponto, com o [Docker Engine](https://docs.docker.com/engine/install/) instalado (ele já inclui o `docker compose`).
- Internet para a instalação e as atualizações.

Os comandos são digitados no terminal do servidor. Se o seu usuário não estiver no grupo `docker`, coloque `sudo` antes de cada comando `docker`.

## 1. Baixe os arquivos de configuração

Crie uma pasta chamada `easy-ponto` e baixe para dentro dela o `compose.yaml`, que diz ao Docker qual imagem usar e onde guardar o banco, e o modelo das variáveis de ambiente:

```bash
mkdir easy-ponto
cd easy-ponto
curl -fsSLO https://raw.githubusercontent.com/supermercado-baratao/easy-ponto/main/compose.yaml
curl -fsSL -o .env https://raw.githubusercontent.com/supermercado-baratao/easy-ponto/main/.env.example
```

> [!IMPORTANT]
> Rode todos os comandos do Docker de dentro dessa pasta e não mude o nome dela. O Docker guarda o banco num volume com o nome da pasta (`easy-ponto_database`): numa pasta com outro nome, o app abre vazio, como se fosse a primeira vez.

## 2. Defina a senha do banco

Abra o `.env` e preencha o `POSTGRES_PASSWORD` com uma senha forte. Depois, deixe o arquivo legível só pelo seu usuário:

```bash
chmod 600 .env
```

O banco não fica exposto na rede: só o app fala com ele.

## 3. Inicie o app

```bash
docker compose up -d
```

Na primeira vez, o Docker baixa as imagens do app e do Postgres, o que pode levar alguns minutos. O app espera o banco ficar pronto e cria as tabelas sozinho. Depois, os dois ficam rodando em segundo plano e voltam sozinhos quando o servidor é reiniciado.

Abra `http://<IP do servidor>:3003/status` no navegador: a página mostra o estado do banco.

## 4. Crie o administrador

Ainda não há login: as páginas privadas carregam o administrador cujo `id` está na variável `ADMIN_USER_ID`. Crie o administrador no banco, trocando `postgres` e `easy_ponto` pelo `POSTGRES_USER` e pelo `POSTGRES_DB` do `.env`, se você os mudou:

```bash
docker compose exec database psql -U postgres -d easy_ponto -c "INSERT INTO admin_users (id, updated_at) VALUES (gen_random_uuid(), now()) RETURNING id"
```

Copie o `id` que o comando mostrou para a linha `ADMIN_USER_ID=` do `.env` e recrie o app para ele ler o valor novo:

```bash
docker compose up -d
```

## 5. Configure o relógio de ponto

Abra `http://<IP do servidor>:3003/configuracoes`, cadastre o IP, o login e a senha do relógio de ponto e importe a empresa. Para o endereço do relógio e o do servidor não mudarem, reserve um IP fixo para os dois no roteador.

> [!WARNING]
> Os dados de ponto são dados pessoais dos funcionários (LGPD), e o app ainda não tem login: qualquer pessoa que acesse o endereço pode usá-lo. Nunca libere a porta 3003 para a internet no roteador.

Para parar o app, use `docker compose stop`. Para iniciá-lo de novo, `docker compose up -d`.

## Próximos passos

- [Atualização](./atualizacao.md): como instalar uma versão nova.
- [Backup e restauração](./backup.md): como guardar uma cópia do banco.
