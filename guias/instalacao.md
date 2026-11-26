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

## 2. Preencha o `.env`

Abra o `.env` e preencha:

- `POSTGRES_PASSWORD`: uma senha forte para o banco.
- `BETTER_AUTH_SECRET`: a chave que protege as sessões de login. Gere uma com `openssl rand -base64 32` e cole o resultado. Sem ela, o app não deixa ninguém entrar.
- `BETTER_AUTH_URL`: o endereço que os computadores da loja abrem, por exemplo `http://192.168.0.10:3003`.

Depois, deixe o arquivo legível só pelo seu usuário:

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

## 4. Crie a conta do administrador

Abra `http://<IP do servidor>:3003/entrar`. Na primeira vez, o app mostra a configuração inicial: informe o nome da empresa, o seu nome, o seu e-mail e uma senha. Essa página só aparece enquanto não existe nenhuma conta, e é com esse e-mail e essa senha que você entra depois.

## 5. Configure o relógio de ponto

Em `Configurações`, cadastre o IP, o login e a senha do relógio de ponto e clique em `Sincronizar`, no quadro da empresa, para trazer os dados dela do relógio. Para o endereço do relógio e o do servidor não mudarem, reserve um IP fixo para os dois no roteador.

Ao sincronizar os registros de ponto, cada funcionário com um CPF válido cadastrado no relógio ganha uma conta. Ele entra pela aba CPF da página de entrada com a senha padrão: os cinco primeiros dígitos do CPF seguidos do último nome, em minúsculas e sem acentos. No primeiro acesso, o app pede uma senha nova. Se ele esquecer a senha, redefina-a em `Funcionários`.

> [!WARNING]
> Os dados de ponto são dados pessoais dos funcionários (LGPD). Nunca libere a porta 3003 para a internet no roteador.

Para parar o app, use `docker compose stop`. Para iniciá-lo de novo, `docker compose up -d`.

## Próximos passos

- [Atualização](./atualizacao.md): como instalar uma versão nova.
- [Backup e restauração](./backup.md): como guardar uma cópia do banco.
