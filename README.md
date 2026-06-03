# Gestão Agronegócio 4A Modular

Sistema modular para gestão operacional do agronegócio, com autenticação centralizada, controle de permissões e módulos de negócio separados. A versão atual entrega o Core, o portal Login/Home/Admin e o módulo Escritório; os demais módulos aparecem no menu como planejamento/evolução futura.

## Visão Geral

O projeto é organizado em microsserviços e frontends independentes, todos roteados por Nginx no ambiente Docker.

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| Core API | `servicos/core` | Autenticação, sessão, contas, permissões, perfil e usuários. |
| Escritório API | `servicos/escritorio` | Cadastros e rotinas do módulo Escritório: entidades, imóveis, folha, documentos e relatórios. |
| Swagger Service | `servicos/swagger-service` | Agrupa e publica a documentação OpenAPI das APIs. |
| Login/Home | `frontend/front-login-home` | Login, primeiro acesso, seleção de módulos, perfil e Menu Admin. |
| Escritório | `frontend/front-escritorio` | Interface operacional do módulo Escritório. |
| Nginx | `nginx` | Gateway HTTP para frontends, APIs e Swagger. |
| MySQL Core | `core-db` | Banco isolado do serviço Core. |
| MySQL Escritório | `escritorio-db` | Banco isolado do serviço Escritório. |
| Redis | `redis` | Cache e apoio de infraestrutura entre serviços. |

Os frontends usam React, TypeScript, Vite, Tailwind CSS e shadcn/ui como base visual. O módulo Escritório também usa Recharts para gráficos.

## Estrutura

```text
.
├── docs/                         # Fluxogramas e organogramas do projeto
├── frontend/
│   ├── front-login-home/          # Portal principal, autenticação e administração
│   └── front-escritorio/          # Frontend do módulo Escritório
├── nginx/                         # Configurações do gateway
├── servicos/
│   ├── core/                      # API Core em NestJS
│   ├── escritorio/                # API Escritório em NestJS
│   ├── swagger-service/           # Agregador de documentação OpenAPI
│   └── silo/                      # Diretório reservado para módulo futuro
├── docker-compose.yml             # Ambiente Docker completo
└── docker-compose.dev.yml         # Override para desenvolvimento local dos fronts
```

## Requisitos

- Docker Desktop ou Docker Engine com Docker Compose v2.
- Node.js e npm para rodar os frontends localmente.
- Portas livres: `80`, `5173` e `5174`.
- Git para controle de versão.

Se a porta `80` estiver ocupada, defina `NGINX_HTTP_PORT` antes de subir o Compose.

## Ambiente de Desenvolvimento

O fluxo recomendado é rodar bancos, Redis, backends, Swagger e Nginx via Docker, e rodar os frontends fora do Docker para ter hot reload.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Nesse modo, o Nginx usa `nginx/nginx.dev.conf` e encaminha:

- `/api/core/*` para o Core;
- `/api/escritorio/*` para o Escritório;
- `/api-docs/` para o Swagger Service;
- `/` para o Vite do Login/Home em `localhost:5173`;
- `/escritorio/` para o Vite do Escritório em `localhost:5174`.

Em outro terminal, rode o Login/Home:

```bash
cd frontend/front-login-home
npm install
npm run dev
```

Em mais um terminal, rode o Escritório:

```bash
cd frontend/front-escritorio
npm install
npm run dev
```

Quando alterar código de backend, Dockerfile ou Compose, recrie os serviços sem apagar volumes:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
```

Para rodar uma versão mais próxima de produção, com os frontends empacotados em containers e Nginx apontando para eles, use apenas o Compose base:

```bash
docker compose up --build
```

## URLs Principais

| Recurso | URL |
| --- | --- |
| Login/Home local com Vite | `http://localhost:5173` |
| Escritório local com Vite | `http://localhost:5174` |
| Gateway Login/Home | `http://localhost/` |
| Gateway Escritório | `http://localhost/escritorio/` |
| API Docs | `http://localhost/api-docs/` |
| Gateway Core | `http://localhost/api/core/*` |
| Gateway Escritório API | `http://localhost/api/escritorio/*` |

Se `NGINX_HTTP_PORT` for alterado, substitua `localhost` pela porta configurada, por exemplo `http://localhost:8080`.

## Variáveis de Ambiente

Não existe um `.env.example` único na raiz. Cada serviço/frontend tem seu próprio exemplo:

- `servicos/core/.env.example`
- `servicos/escritorio/.env.example`
- `frontend/front-login-home/.env.example`
- `frontend/front-escritorio/.env.example`

Variáveis mais importantes no Compose:

| Variável | Uso |
| --- | --- |
| `CORE_MYSQL_ROOT_PASSWORD`, `CORE_MYSQL_DATABASE`, `CORE_MYSQL_USER`, `CORE_MYSQL_PASSWORD` | Banco MySQL do Core. |
| `ESCRITORIO_MYSQL_ROOT_PASSWORD`, `ESCRITORIO_MYSQL_DATABASE`, `ESCRITORIO_MYSQL_USER`, `ESCRITORIO_MYSQL_PASSWORD` | Banco MySQL do Escritório. |
| `DB_SYNC_ALTER` | Permite ao Sequelize ajustar tabelas automaticamente. Use `true` em desenvolvimento e `false` em produção. |
| `DB_LOGGING` | Liga/desliga logs SQL. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Assinatura e validade dos tokens do Core. |
| `AUTH_CACHE_TTL_MS` | TTL do cache de autenticação usado pelo Escritório. |
| `NGINX_HTTP_PORT` | Porta pública do Nginx. Padrão: `80`. |

Variáveis dos frontends:

| Frontend | Variáveis |
| --- | --- |
| Login/Home | `VITE_API_URL`, `VITE_ESCRITORIO_URL`, `VITE_BASE_PATH` |
| Escritório | `VITE_API_URL`, `VITE_LOGIN_HOME_URL`, `VITE_BASE_PATH` |

Em desenvolvimento local, `VITE_API_URL` normalmente fica vazio para usar o mesmo host/gateway. O proxy do Vite envia `/api/*` para `http://localhost`.

## Primeiro Usuário ADMIN

Não existe senha padrão e o sistema não cria ADMIN duplicado automaticamente.

Para criar o primeiro ADMIN pelo frontend:

1. Suba ou recrie o ambiente de desenvolvimento com `DB_SYNC_ALTER=true`.
2. Abra `http://localhost:5173`.
3. Clique em `Primeiro acesso`.
4. Informe nome, e-mail e senha.
5. Envie o formulário e entre com a conta criada.

O Core só aceita esse fluxo quando ainda não existe nenhuma conta no banco. Se já existir pelo menos uma conta, a criação sem autenticação é recusada. Depois disso, um ADMIN existente deve criar novos usuários pelo `Menu Admin`.

Alternativa via API, apenas com banco vazio:

```bash
curl -X POST http://localhost/api/core/contas \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Administrador\",\"email\":\"admin@local.dev\",\"senha\":\"troque-esta-senha\"}"
```

O backend aplica as permissões sistêmicas do primeiro ADMIN. O frontend não envia permissões ADMIN nesse fluxo.

## Módulos e Permissões

O Login/Home lista os módulos de negócio:

- `ESCRITORIO`: disponível.
- `BALANCA`, `SILO`, `BARRACAO`, `LAVOURA`, `ALMOXARIFADO`: em planejamento.
- `FOLHA` e `FINANCEIRO`: permissões auxiliares/sistêmicas usadas nas rotinas.

Regras principais:

- `ADMIN` pode tudo, inclusive conceder/remover `ADMIN` e `GERENTE`.
- `GERENTE` pode gerenciar contas que não são ADMIN, inclusive contas GERENTE.
- `GERENTE` não pode conceder ADMIN, remover ADMIN, alterar conta ADMIN ou editar permissões de conta ADMIN.
- `GERENTE` pode gerenciar permissões dos módulos de negócio de contas comuns.
- Uma conta comum só acessa um módulo quando possui permissão de visualização nele.
- O módulo Escritório exige acesso a `ESCRITORIO`.
- A Folha de Pagamento dentro do Escritório exige acesso a `FOLHA`, exceto para ADMIN/GERENTE.
- Login inválido, senha inválida ou conta inativa retornam `401 Unauthorized` com mensagem genérica.
- `senha_hash` não deve aparecer em nenhuma resposta JSON.

## Funcionalidades Atuais

Login/Home:

- Login e hidratação de sessão.
- Primeiro acesso para criação do primeiro ADMIN.
- Solicitação de acesso.
- Home de módulos.
- Perfil do usuário.
- Menu Admin para contas, status e permissões.
- Redirecionamento para Escritório com token de acesso.

Escritório:

- Validação de sessão e acesso pelo Core.
- Home operacional do módulo.
- Cadastro e relatório de Entidades/Pessoas/Empresas.
- Cadastro e relatório de Imóveis.
- Anexos/documentos vinculados às rotinas.
- Folha de Pagamento com lançamentos, férias, gráfico mensal e relatório.
- Cabeçalhos de relatório com a marca `Gestão Agronegócio 4A`.

## Comandos Úteis

Backends:

```bash
cd servicos/core
npm install
npm run dev
npm run build
```

```bash
cd servicos/escritorio
npm install
npm run dev
npm run build
```

```bash
cd servicos/swagger-service
npm install
npm run dev
npm run build
```

Frontends:

```bash
cd frontend/front-login-home
npm install
npm run lint
npm run build
npm run dev
```

```bash
cd frontend/front-escritorio
npm install
npm run lint
npm run build
npm run dev
```

Não há scripts agregados na raiz; rode os comandos dentro de cada serviço/frontend.

## Swagger e Documentação Visual

Com o ambiente Docker ativo, acesse:

```text
http://localhost/api-docs/
```

Os diagramas do projeto ficam em `docs/`:

- `Fluxograma MVP.png`
- `Organograma MVP.png`
- `Fluxograma Balança.png`
- `Organograma Balança.png`

## Produção

Antes de publicar:

- Defina senhas fortes para os bancos.
- Defina `JWT_SECRET` seguro e específico do ambiente.
- Use `DB_SYNC_ALTER=false`.
- Garanta persistência dos volumes de bancos e uploads.
- Revise `NGINX_HTTP_PORT` e as regras de exposição da rede.
- Gere builds limpos dos frontends e serviços.

## Validação Manual Recomendada

- Criar primeiro ADMIN em banco vazio pelo frontend.
- Tentar criar segundo ADMIN pelo fluxo `Primeiro acesso` e confirmar bloqueio.
- Fazer login com e-mail inexistente, senha errada e conta inativa; todos devem retornar `401`.
- Conferir respostas de `/api/core/auth/me`, `/api/core/contas` e criação de contas para garantir ausência de `senha_hash`.
- Com conta GERENTE, tentar conceder `ADMIN` a outra conta e confirmar bloqueio.
- Com conta GERENTE, tentar alterar permissões/status de uma conta ADMIN e confirmar bloqueio.
- Com conta GERENTE, alterar permissões de uma conta comum ou GERENTE e confirmar sucesso.
- No menu principal, abrir módulo sem implementação com permissão e confirmar tela `Em desenvolvimento`.
- No menu principal, abrir módulo sem permissão e confirmar a mensagem `Você não tem acesso a este módulo.`.
- Abrir Escritório com usuário autorizado e conferir Entidades, Imóveis, Folha e Documentos.
- Abrir Escritório sem permissão `ESCRITORIO` e confirmar bloqueio.
- Abrir Folha sem permissão `FOLHA` e confirmar bloqueio.
- Gerar relatórios de Entidades, Imóveis e Folha e conferir impressão legível.

## Troubleshooting

- Se o frontend não alcançar `/api/*`, confira se o Nginx está rodando em `http://localhost`.
- Se `http://localhost` estiver ocupado, configure `NGINX_HTTP_PORT` e ajuste as URLs usadas no navegador.
- Se o Escritório bloquear acesso após login, valide as permissões do usuário no Menu Admin.
- Se uploads/anexos falharem, confirme `UPLOAD_DIR` e volumes de upload no serviço Escritório.
- Se mudanças de backend não aparecerem, recrie os containers com `--force-recreate`.
- Em desenvolvimento, mantenha `DB_SYNC_ALTER=true`; em produção, use `DB_SYNC_ALTER=false`.
