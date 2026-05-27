# Gestão Agronegócio 4A Modular

Sistema em microsserviços com Core, Escritório e frontends separados.

## Ambiente de desenvolvimento

Suba bancos, Redis, backends e Nginx:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Quando alterar código de backend ou compose, recrie os serviços sem apagar os
volumes:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
```

Nesta etapa ainda não existem migrations manuais. Por isso, o desenvolvimento
usa `DB_SYNC_ALTER=true` para o Sequelize criar/ajustar tabelas automaticamente.
Em produção, defina `DB_SYNC_ALTER=false` explicitamente no `.env`.

Rode os fronts fora do Docker para usar hot reload:

```bash
cd frontend/front-login-home
npm run dev
```

```bash
cd frontend/front-escritorio
npm run dev
```

URLs principais:

- Login/Home: `http://localhost:5173`
- Escritório: `http://localhost:5174`
- API Docs: `http://localhost/api-docs/`
- Gateway Core: `http://localhost/api/core/*`
- Gateway Escritório: `http://localhost/api/escritorio/*`

## Primeiro usuário ADMIN

Não existe senha padrão e o sistema não cria ADMIN duplicado automaticamente.

Para criar o primeiro ADMIN pelo frontend:

1. Suba ou recrie o ambiente de desenvolvimento com `DB_SYNC_ALTER=true`.
2. Abra `http://localhost:5173`.
3. Clique em `Primeiro acesso`.
4. Informe nome, e-mail e senha.
5. Envie o formulário e entre com a conta criada.

O Core só aceita esse fluxo quando ainda não existe nenhuma conta no banco. Se
já existir pelo menos uma conta, a criação sem autenticação é recusada; nesse
caso, um ADMIN existente deve criar novos usuários pelo `Menu Admin`.

Alternativa via API, apenas com banco vazio:

```bash
curl -X POST http://localhost/api/core/contas \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Administrador\",\"email\":\"admin@local.dev\",\"senha\":\"troque-esta-senha\"}"
```

O backend aplica as permissões sistêmicas do primeiro ADMIN. O frontend não
envia permissões ADMIN nesse fluxo.

## Regras de acesso

- `ADMIN` pode tudo, inclusive conceder/remover `ADMIN` e `GERENTE`.
- `GERENTE` pode gerenciar contas que não são ADMIN, inclusive contas GERENTE.
- `GERENTE` não pode conceder ADMIN, remover ADMIN, alterar conta ADMIN ou
  editar permissões de conta ADMIN.
- `GERENTE` pode gerenciar permissões dos módulos de negócio de contas comuns.
- Login inválido, senha inválida ou conta inativa retornam `401 Unauthorized`
  com mensagem genérica.
- `senha_hash` não deve aparecer em nenhuma resposta JSON.

## Validação manual recomendada

- Criar primeiro ADMIN em banco vazio pelo frontend.
- Tentar criar segundo ADMIN pelo fluxo `Primeiro acesso` e confirmar bloqueio.
- Fazer login com e-mail inexistente, senha errada e conta inativa; todos devem
  retornar `401`.
- Conferir respostas de `/api/core/auth/me`, `/api/core/contas` e criação de
  contas para garantir ausência de `senha_hash`.
- Com conta GERENTE, tentar conceder `ADMIN` a outra conta e confirmar bloqueio.
- Com conta GERENTE, tentar alterar permissões/status de uma conta ADMIN e
  confirmar bloqueio.
- Com conta GERENTE, alterar permissões de uma conta comum ou GERENTE e
  confirmar sucesso.
- No menu principal, abrir módulo sem implementação com permissão e confirmar
  tela `Em desenvolvimento`.
- No menu principal, abrir módulo sem permissão e confirmar a mensagem
  `Você não tem acesso a este módulo.`
