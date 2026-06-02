# Front Escritório

Frontend do módulo Escritório do Gestão Agronegócio 4A. Ele valida a sessão no Core antes de renderizar as rotinas operacionais de entidades, imóveis, folha de pagamento, documentos e relatórios.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui com componentes em `src/shared/components/ui`
- Radix UI para primitivas acessíveis, incluindo `AlertDialog`
- Recharts para gráficos
- Lucide React para ícones

## Responsabilidades

- Consumir o token de acesso recebido pela URL ao abrir o módulo.
- Validar o usuário atual em `/api/core/auth/me`.
- Bloquear acesso quando o usuário não possui permissão `ESCRITORIO`.
- Bloquear a rotina de Folha quando o usuário não possui permissão `FOLHA`, exceto ADMIN/GERENTE.
- Consultar e persistir dados do serviço Escritório em `/api/escritorio/*`.
- Gerenciar anexos/documentos vinculados às rotinas.
- Gerar relatórios imprimíveis com a marca `Gestão Agronegócio 4A`.

## Estrutura do Código

```text
src/
├── app/                  # Entrada React, validação de acesso e shell do módulo
├── modules/
│   ├── auth/             # Serviços de sessão e permissão
│   ├── documentos/       # Serviços de anexos/documentos
│   ├── entidades/        # Pessoas, empresas, funcionários e relatórios
│   ├── folha/            # Lançamentos, férias, gráfico e relatório mensal
│   ├── home/             # Home operacional do Escritório
│   └── imoveis/          # Propriedades, matrículas, anexos e relatórios
└── shared/
    ├── components/       # UI, layout, feedback e data-display reutilizáveis
    ├── services/         # Cliente HTTP
    └── utils/            # Impressão, cn e utilitários compartilhados
```

A base visual reutilizável fica em `src/shared/components/ui`. Componentes de exibição compartilhados, como cabeçalhos de relatório e painel de documentos, ficam em `src/shared/components/data-display`.

## Variáveis de Ambiente

Arquivo de exemplo: `.env.example`.

| Variável | Descrição | Valor comum em dev |
| --- | --- | --- |
| `VITE_API_URL` | Base da API. Vazio usa o mesmo host/gateway. | vazio |
| `VITE_LOGIN_HOME_URL` | URL para voltar ao Login/Home. | `http://localhost:5173` |
| `VITE_BASE_PATH` | Base pública do Vite. | `/` |

No Docker base, este frontend é publicado em `/escritorio/`. No desenvolvimento local, ele roda em `http://localhost:5174`.

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

O Vite usa a porta `5174` e encaminha chamadas `/api/*` para `http://localhost`, onde o Nginx distribui para Core e Escritório.

Para usar anexos/documentos, o backend Escritório precisa estar ativo com `UPLOAD_DIR` configurado. No Docker, os uploads são persistidos pelo volume `escritorio_uploads`.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia o Vite em `http://localhost:5174`. |
| `npm run lint` | Executa ESLint com suporte a TypeScript/React. |
| `npm run build` | Gera o build de produção. |
| `npm run preview` | Pré-visualiza o build localmente. |

## Fluxo de Acesso

- Ao abrir o módulo, `consumeAccessTokenFromUrl` captura o token recebido do Login/Home.
- `getCurrentUser` chama `/api/core/auth/me` para validar a sessão.
- Se o token for inválido, `clearToken` remove o token local e a tela mostra acesso bloqueado.
- `hasEscritorioAccess` exige acesso ao módulo `ESCRITORIO`.
- `hasModuleAccess(usuario, "FOLHA")` controla a rotina de Folha de Pagamento.
- O botão `Home` usa `VITE_LOGIN_HOME_URL` para voltar ao portal principal.

## Rotinas

Home:

- Mostra os cards operacionais do Escritório.
- Oculta Folha de Pagamento quando o usuário não tem acesso a `FOLHA`.

Entidades:

- Cadastro e manutenção de pessoas, empresas e funcionários.
- Remoção protegida por diálogo shadcn `AlertDialog`.
- Relatório imprimível com filtros, data/hora de emissão e marca do sistema.

Imóveis:

- Cadastro e manutenção de propriedades, matrículas e dados rurais.
- Painel de documentos/anexos.
- Remoção protegida por diálogo shadcn `AlertDialog`.
- Relatório imprimível com filtros, data/hora de emissão e marca do sistema.

Folha de Pagamento:

- Lançamentos por período.
- Férias, valores brutos, líquidos e final + férias.
- Gráfico mensal com shadcn `Card`, `ChartContainer`, tooltip e legenda.
- Estado vazio para períodos sem lançamento.
- Relatório imprimível com totais e marca do sistema.

Documentos:

- Painel compartilhado para listar, enviar, baixar e remover anexos quando a rotina permite.
- As chamadas continuam usando `/api/escritorio/*`.

## Relatórios e Impressão

Os relatórios usam um cabeçalho compartilhado com `/favicon.svg` e o texto `Gestão Agronegócio 4A`. As regras globais de impressão ficam em `src/index.css`, e a utilidade `printReport` centraliza o disparo de impressão.

Ao mexer em relatórios, preserve:

- título e subtítulo do relatório;
- filtros aplicados;
- data/hora de emissão;
- tabelas e totais;
- legibilidade em impressão;
- elementos marcados como `no-print` fora do resultado impresso.

## Validação Manual

- Abrir o módulo com usuário que possui `ESCRITORIO`.
- Abrir o módulo sem `ESCRITORIO` e confirmar bloqueio.
- Confirmar que a Folha aparece apenas para quem possui `FOLHA`, ADMIN ou GERENTE.
- Criar, editar e remover Entidade confirmando o diálogo.
- Criar, editar e remover Imóvel confirmando o diálogo.
- Enviar, baixar e remover anexos quando o backend estiver ativo.
- Conferir gráfico da Folha com dados e com período vazio.
- Gerar relatórios de Entidades, Imóveis e Folha.
- Conferir cabeçalho com ícone e `Gestão Agronegócio 4A`.
- Imprimir ou salvar PDF e validar leitura do conteúdo.
