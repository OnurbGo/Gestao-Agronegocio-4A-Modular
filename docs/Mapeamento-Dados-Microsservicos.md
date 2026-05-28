# Mapeamento de Dados para Microsservicos

## Contexto Atual

O projeto ja foi separado fisicamente em `servicos/core` e `servicos/escritorio`, mas ainda existe codigo de Core duplicado dentro do servico Escritorio. Na migracao para NestJS, o Core deve ser o unico dono de autenticacao, contas, usuarios de sistema, permissoes e auditoria de acesso.

O servico Escritorio deve ser dono dos dados de negocio: Entidades, documentos, Folha de Pagamento e relatorios de folha. Ele deve guardar apenas referencias ao usuario do Core quando precisar registrar autoria.

## Fronteiras dos Servicos

### Core Service

Responsavel por identidade, acesso e seguranca.

Entidades principais:

| Tabela alvo | Origem atual | Dono | Observacao |
| --- | --- | --- | --- |
| `CONTA` | parte de `USUARIO` | Core | Credenciais de login, bloqueio de acesso e ultimo login. |
| `USUARIO` | parte de `USUARIO` | Core | Perfil do usuario dentro do sistema. Nao guarda senha. |
| `CONTA_MODULO` | `USUARIO_MODULO` | Core | Permissoes por modulo e acao vinculadas a conta. |
| `SOLICITACAO_CONTA` | `USUARIO_SOLICITACAO` | Core | Pedido de acesso antes de virar conta/usuario real. |
| `AUDITORIA_CORE` | `AUDITORIA` | Core | Login, logout, alteracao de senha, permissoes e status de conta. |

### Escritorio Service

Responsavel por dados de negocio e folha.

Entidades principais:

| Tabela alvo | Origem atual | Dono | Observacao |
| --- | --- | --- | --- |
| `ENTIDADE` | `ENTIDADE` | Escritorio | Pessoas/empresas do negocio. Nao confundir com usuario do sistema. |
| `ENTIDADE_TIPO` | `ENTIDADE_TIPO` | Escritorio | Tipos: funcionario, proprietario, cliente, arrendatario. |
| `TIPO_DOCUMENTO` | `TIPO_DOCUMENTO` | Escritorio | Catalogo de documentos. |
| `ENTIDADE_ARQUIVO` | `ENTIDADE_ARQUIVO` | Escritorio | Arquivos anexados a uma entidade. |
| `REGISTRO_SALARIAL` | `REGISTRO_SALARIAL` | Escritorio | Historico salarial de entidade participante da folha. |
| `FERIAS` | `FERIAS` | Escritorio | Periodos de ferias vinculados a entidade. |
| `FOLHA_MENSAL` | `FOLHA_MENSAL` | Escritorio | Lancamentos mensais e valores calculados. |
| `AUDITORIA_ESCRITORIO` | novo/local | Escritorio | Acoes de negocio, gravando apenas `usuario_id` vindo do Core. |

## Separacao Conta x Usuario

### `CONTA`

Representa as credenciais e o estado de acesso.

Campos sugeridos:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id_conta` | integer autoIncrement | Chave primaria da conta. |
| `usuario_id` | integer autoIncrement | FK 1:1 para `USUARIO.id_usuario`. |
| `email` | string | Login principal, unico. |
| `senha_hash` | string | Nunca salvar senha pura. |
| `ativo` | boolean | Se `false`, login e qualquer token bearer devem ser recusados. |
| `ultimo_login` | datetime/null | Atualizado no login. |
| `senha_alterada_em` | datetime/null | Ajuda a invalidar tokens antigos. |
| `deleted_at` | datetime/null | Soft delete. |
| `created_at` / `updated_at` | datetime | Auditoria tecnica. |

### `CONTA_MODULO`

Representa o nivel de acesso da conta.

Campos sugeridos:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id_conta_modulo` | integer autoIncrement | Chave primaria. |
| `conta_id` | integer | FK para `CONTA.id_conta`. |
| `modulo` | enum | ADMIN, GERENTE, ESCRITORIO, FOLHA etc. |
| `pode_visualizar` | boolean | Permissao de leitura. |
| `pode_criar` | boolean | Permissao de criacao. |
| `pode_editar` | boolean | Permissao de edicao. |
| `pode_excluir` | boolean | Permissao de exclusao. |
| `pode_restaurar` | boolean | Permissao de restauracao. |

### `USUARIO`

Representa o perfil do usuario do sistema.

Campos sugeridos:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id_usuario` | integer/uuid | Identidade publica usada por outros servicos. |
| `nome` | string | Nome/nick exibido no sistema. |
| `imagem_perfil_url` | string/null | Foto/avatar. |
| `observacao` | text/null | Observacoes administrativas. |
| `created_at` / `updated_at` | datetime | Auditoria tecnica. |
| `deleted_at` | datetime/null | Soft delete do perfil. |

Decisao importante: `ativo` deve ficar em `CONTA`, porque o bloqueio e uma regra de acesso. O `USUARIO` pode existir como perfil historico mesmo com conta desativada.

## Mapeamento do Modelo Atual

| Atual | Alvo | Acao |
| --- | --- | --- |
| `USUARIO.id_usuario` | `USUARIO.id_usuario` | Preservar como identidade do ator. |
| `USUARIO.nome` | `USUARIO.nome` | Mover para perfil. |
| `USUARIO.email` | `CONTA.email` | Mover para conta. |
| `USUARIO.senha_hash` | `CONTA.senha_hash` | Mover para conta. |
| `USUARIO.ativo` | `CONTA.ativo` | Mover para conta e usar na validacao de token. |
| `USUARIO.ultimo_login` | `CONTA.ultimo_login` | Mover para conta. |
| `USUARIO.observacao` | `USUARIO.observacao` | Manter no perfil. |
| `USUARIO_MODULO.usuario_id` | `CONTA_MODULO.conta_id` | Permissoes passam a acompanhar a conta. |
| `USUARIO_SOLICITACAO` | `SOLICITACAO_CONTA` | Separar fluxo de criacao de conta/perfil. |
| `ENTIDADE_ARQUIVO.enviado_por_usuario_id` | referencia externa | Manter apenas o ID do usuario do Core. |

## Regras de Autenticacao entre Servicos

O token bearer sozinho nao pode ser suficiente para o servico Escritorio aceitar uma requisicao, porque uma conta pode ser desativada depois do token ser emitido.

Fluxo recomendado:

1. Cliente envia `Authorization: Bearer <token>` para Core ou Escritorio.
2. Se a rota esta no Escritorio, o guard do Escritorio chama o Core por mensageria Redis.
3. Core valida assinatura, expiracao e existencia da conta.
4. Core consulta `CONTA.ativo`.
5. Se `CONTA.ativo=false`, Core responde como nao autenticado.
6. Se valido, Core retorna contexto minimo: `usuario_id`, `nome`, `email`, `modulos`, permissoes e flags administrativas.
7. Escritorio usa esse contexto na requisicao e grava somente `usuario_id` para autoria.

Padroes Redis/Nest sugeridos:

| Pattern | Origem | Destino | Uso |
| --- | --- | --- | --- |
| `core.auth.validate-token` | Escritorio | Core | Validar token e status ativo. |
| `core.permissions.get-user-context` | Escritorio | Core | Buscar permissoes atualizadas. |
| `core.account.deactivated` | Core | Escritorio | Invalidar cache local de autenticacao. |
| `core.permissions.updated` | Core | Escritorio | Invalidar cache local de permissoes. |
| `escritorio.audit.created` | Escritorio | Core ou auditoria | Opcional, consolidar trilha de auditoria. |

## Dados que Nao Devem Cruzar a Fronteira

O Escritorio nao deve ter:

- `senha_hash`
- regras de login
- tabela real de `CONTA`
- tabela real de `USUARIO_MODULO`
- permissao como fonte da verdade
- validacao local de usuario ativo sem consultar o Core

O Core nao deve ter:

- `ENTIDADE`
- documentos de entidade
- dados de folha
- lancamentos mensais
- salario, ferias ou relatorio de folha

## Impacto na Migracao para NestJS

Core Nest modules:

- `AuthModule`
- `AccountsModule`
- `UsersModule`
- `PermissionsModule`
- `AuditModule`
- `RedisMessagingModule`

Escritorio Nest modules:

- `EntidadesModule`
- `DocumentosModule`
- `FolhaModule`
- `RegistrosSalariaisModule`
- `FeriasModule`
- `RelatoriosFolhaModule`
- `CoreAuthClientModule`

## Pendencias para a Proxima Etapa

- IDs novos definidos como `integer autoIncrement`.
- API Gateway definido com Nginx roteando `/api/core/*` e `/api/escritorio/*`.
- Bancos fisicamente separados: MySQL do Core e MySQL do Escritorio.
- Cache de validacao definido como TTL curto com eventos Redis de invalidacao.
- Remover codigo duplicado de Core dentro de `servicos/escritorio`.
- Criar schemas finais em NestJS antes de migrar models e controllers.
