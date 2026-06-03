# Front Login Home

Frontend principal do Gestão Agronegócio 4A. Ele concentra autenticação, primeiro acesso, solicitação de acesso, seleção de módulos, perfil do usuário e administração de contas/permissões.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui com componentes em `src/shared/components/ui`
- Radix UI para primitivas acessíveis
- Lucide React para ícones

## Responsabilidades

- Autenticar usuários pelo Core em `/api/core/auth/login`.
- Hidratar a sessão atual com `/api/core/auth/me`.
- Criar o primeiro ADMIN pelo fluxo `Primeiro acesso`, somente quando o banco está vazio.
- Enviar solicitações de acesso para `/api/core/contas/solicitacoes`.
- Exibir módulos conforme permissões do usuário.
- Abrir o módulo Escritório quando houver acesso a `ESCRITORIO`.
- Permitir edição de perfil.
- Liberar o Menu Admin para usuários `ADMIN` ou `GERENTE`.

## Estrutura do Código

```text
src/
├── app/                  # Entrada React e composição principal
├── modules/
│   ├── admin/            # Gestão de contas e permissões
│   ├── auth/             # Login, primeiro acesso e serviços de autenticação
│   ├── home/             # Home de módulos
│   └── profile/          # Perfil do usuário
└── shared/
    ├── components/       # UI, layout e feedback reutilizáveis
    ├── services/         # Cliente HTTP, sessão e armazenamento local
    └── utils/            # Utilitários compartilhados
```

A base visual reutilizável fica em `src/shared/components/ui`. Novos componentes devem seguir o padrão shadcn/ui e usar `cn` de `src/shared/utils/cn.ts` para composição de classes.

## Variáveis de Ambiente

Arquivo de exemplo: `.env.example`.

| Variável | Descrição | Valor comum em dev |
| --- | --- | --- |
| `VITE_API_URL` | Base da API. Vazio usa o mesmo host/gateway. | vazio |
| `VITE_ESCRITORIO_URL` | URL usada para abrir o módulo Escritório. | `http://localhost:5174` |
| `VITE_BASE_PATH` | Base pública do Vite. | `/` |

No Docker base, o Escritório é publicado em `/escritorio/`. No desenvolvimento local, o Vite roda o Escritório em `http://localhost:5174`.

## Desenvolvimento Local

Suba primeiro o ambiente Docker de desenvolvimento na raiz do projeto:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Depois rode este frontend:

```bash
npm install
npm run dev
```

O Vite usa a porta `5173` e encaminha chamadas `/api/*` para `http://localhost`, onde o Nginx distribui para os serviços.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia o Vite em `http://localhost:5173`. |
| `npm run lint` | Executa ESLint com suporte a TypeScript/React. |
| `npm run build` | Gera o build de produção. |
| `npm run preview` | Pré-visualiza o build localmente. |

## Fluxo de Sessão

- O login salva token e usuário no armazenamento local via `shared/services/api`.
- Ao abrir o app com sessão salva, `getCurrentUser` valida o token no Core.
- Se a sessão estiver inválida, `clearAuthSession` limpa os dados locais e volta para o login.
- `logout` limpa a sessão e retorna para a tela inicial.
- O Menu Admin só aparece para `ADMIN` ou `GERENTE`.

## Permissões e Módulos

Usuários `ADMIN` e `GERENTE` acessam todos os módulos. Contas comuns dependem de permissão de visualização no módulo correspondente.

Módulos exibidos atualmente:

- `ESCRITORIO`: disponível.
- `BALANCA`, `SILO`, `BARRACAO`, `LAVOURA`, `ALMOXARIFADO`: em planejamento.

Quando o usuário tem permissão para um módulo ainda não implementado, a interface mostra a tela `Em desenvolvimento`. Quando não tem permissão, mostra a mensagem `Você não tem acesso a este módulo.`.

## Validação Manual

- Login com credenciais válidas.
- Login com senha incorreta, e-mail inexistente e conta inativa.
- Criação do primeiro ADMIN em banco vazio.
- Bloqueio do segundo `Primeiro acesso` após existir conta.
- Abertura do Menu Admin com ADMIN/GERENTE.
- Bloqueio do Menu Admin para usuário comum.
- Redirecionamento para Escritório com usuário autorizado.
- Mensagem de acesso negado para módulo sem permissão.
