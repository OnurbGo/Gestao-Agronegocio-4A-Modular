# Gestao Agronegocio 4A

Sistema interno de gestao para o agronegocio, agora organizado como:

- um frontend React + TypeScript + Vite;
- um backend NestJS em monolito modular;
- um banco MySQL unico;
- Nginx opcional como gateway local/producao.

A separacao por dominio continua existindo dentro do codigo. A mudanca remove a complexidade operacional de microfrontends, microsservicos, Redis de integracao e bancos separados.

## Arquitetura Atual

```text
.
├── backend/
│   └── src/
│       ├── app.module.ts
│       ├── main.ts
│       ├── database/
│       ├── modules/
│       │   ├── auth/
│       │   ├── contas/
│       │   ├── usuarios/
│       │   ├── permissoes/
│       │   ├── auditoria/
│       │   ├── escritorio/
│       │   │   ├── entidades/
│       │   │   ├── imoveis/
│       │   │   ├── documentos/
│       │   │   ├── folha/
│       │   │   └── auditoria/
│       │   └── silo/
│       │       ├── controllers/
│       │       ├── dto/
│       │       ├── entities/
│       │       ├── repositories/
│       │       ├── services/
│       │       ├── auth-client/
│       │       └── auditoria/
│       └── shared/
├── frontend/
│   └── src/
│       ├── app/
│       ├── routes/
│       ├── modules/
│       │   ├── auth/
│       │   ├── admin/
│       │   ├── escritorio/
│       │   ├── folha/
│       │   ├── silo/
│       │   └── relatorios/
│       └── shared/
├── nginx/
├── docker-compose.yml
└── docker-compose.dev.yml
```

Os diretórios antigos `servicos/` e `frontend/front-*` permanecem no repositório como referência temporária de migração, mas não são usados pelo Docker/Nginx ativos.

## Rotas

Backend único:

- `GET/POST /api/core/auth/*`
- `/api/core/contas/*`
- `/api/core/usuarios/*`
- `/api/core/permissoes/*`
- `/api/escritorio/entidades/*`
- `/api/escritorio/imoveis/*`
- `/api/escritorio/folha/*`
- `/api/escritorio/*` para documentos
- `/api/silo/*`
- `/api-docs` para Swagger

Frontend único:

- `/login`
- `/`
- `/admin`
- `/profile`
- `/escritorio`
- `/silo`

## Banco Único

O Compose sobe apenas um MySQL (`db`) com schema padrão `gestao_agro`.

Nesta fase, os nomes atuais de tabelas e colunas foram preservados para reduzir risco:

- tabelas de Core, como `CONTA`, `USUARIO`, `CONTA_MODULO`;
- tabelas de Escritório, como `ENTIDADE`, `IMOVEL`, `FOLHA_MENSAL`;
- tabelas de Silo, como `PESAGEM`, `CONTA_PRODUTO`, `CONTRATO_SILO`.

Para migrar dados reais dos bancos antigos, revise dumps/imports manualmente antes de apontar produção para o schema único.

## Desenvolvimento

Subir banco, backend e Nginx, usando frontend local com hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Backend local fora do Docker:

```bash
cd backend
npm install
npm run dev
```

Frontend local:

```bash
cd frontend
npm install
npm run dev
```

Ambiente completo em containers:

```bash
docker compose up --build
```

## Variáveis Principais

Backend:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `DB_SYNC_ALTER`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `UPLOAD_ROOT`, `USER_UPLOAD_DIR`, `ESCRITORIO_UPLOAD_DIR`
- `DOCUMENT_UPLOAD_MAX_BYTES`

Compose:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `NGINX_HTTP_PORT`

Frontend:

- `VITE_API_URL`
- `VITE_BASE_PATH`

## Validação Recomendada

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run lint
npm run build
```

```bash
docker compose config
```

Valide manualmente:

- criar primeiro ADMIN em banco vazio;
- login e `/api/core/auth/me`;
- Menu Admin e regras de ADMIN/GERENTE;
- bloqueio de módulos sem permissão;
- Escritório: Entidades, Imóveis, Documentos e Folha;
- Silo: cadastros, lotes, pesagens, classificações, contratos, saldos e relatórios;
- uploads em `/uploads/usuarios` e `/uploads/escritorio`;
- Swagger em `/api-docs`.

## Pontos de Atenção

- O código legado ainda existe para comparação e pode ser removido em uma etapa posterior.
- A auditoria foi mantida por tabela/domínio para preservar comportamento; a lógica comum pode ser extraída mais profundamente depois.
- O módulo de Silo preserva endpoints auxiliares atuais, incluindo descontos, romaneios e sync.
- Textos antigos têm sinais de encoding inconsistente; corrigir gradualmente em arquivos tocados.
- O app desktop da balança não foi migrado. Ele pode continuar separado futuramente por necessidades próprias como serial, impressão, SQLite local e operação offline-first.
