# Atualização

As versões novas do app são publicadas como imagens Docker. Atualizar troca só o app: os funcionários, as batidas e o resto do banco ficam no volume do Postgres e continuam lá.

As novidades de cada versão ficam na página de [releases](https://github.com/supermercado-baratao/easy-ponto/releases) do projeto.

## Antes de atualizar

[Faça um backup](./backup.md#fazendo-o-backup). Ao iniciar, uma versão nova pode ajustar o banco para o formato dela, e uma versão antiga pode não funcionar com esse banco. O backup é o que permite voltar para a versão anterior se algo der errado.

## Atualizando

Na pasta `easy-ponto` (a mesma da [instalação](./instalacao.md)):

```bash
docker compose pull
docker compose up -d
```

O `pull` baixa a imagem nova e o `up -d` recria o app com ela. Ao iniciar, o app ajusta o banco sozinho. Abra o app no navegador e confira se os funcionários e as batidas estão lá.

Para apagar as imagens antigas, que não são mais usadas, rode:

```bash
docker image prune
```

## Escolhendo a versão

O `compose.yaml` usa a imagem `ghcr.io/supermercado-baratao/easy-ponto:latest`, que é sempre a versão mais recente. Para controlar quando o app muda de versão, troque o `latest` na linha `image` por uma destas opções:

| Tag               | Recebe                                                      |
| ----------------- | ----------------------------------------------------------- |
| `latest`          | Todas as versões novas                                      |
| `1.0` (exemplo)   | Só as correções da versão 1.0 (`1.0.1`, `1.0.2`...)         |
| `1.0.0` (exemplo) | Nada: o app fica nessa versão até você trocar a tag de novo |

Depois de mudar a tag, rode `docker compose pull` e `docker compose up -d`.

## Voltando para a versão anterior

Se a versão nova der problema:

1. Troque a tag da linha `image` no `compose.yaml` pela versão que você usava antes, por exemplo `1.0.0`.
2. [Restaure o backup](./backup.md#restaurando) feito antes da atualização. Não pule este passo: a versão antiga pode não funcionar com o banco ajustado pela versão nova.

Os dados salvos depois do backup se perdem. Se o problema não for urgente, abra uma [issue](https://github.com/supermercado-baratao/easy-ponto/issues) contando o que aconteceu, sem nomes, PIS ou CPF de funcionários.
