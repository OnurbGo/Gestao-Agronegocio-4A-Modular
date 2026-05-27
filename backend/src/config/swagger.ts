const modulos = [
  "ADMIN",
  "GERENTE",
  "ESCRITORIO",
  "FOLHA",
  "BALANCA",
  "SILO",
  "BARRACAO",
  "LAVOURA",
  "ALMOXARIFADO",
  "FINANCEIRO",
];

const successResponse = (description: string, dataSchema?: object) => ({
  description,
  content: {
    "application/json": {
      schema: dataSchema
        ? {
            allOf: [
              { $ref: "#/components/schemas/ApiSuccess" },
              {
                type: "object",
                properties: {
                  data: dataSchema,
                },
              },
            ],
          }
        : { $ref: "#/components/schemas/ApiSuccess" },
    },
  },
});

const protectedResponses = {
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
};

const idParameter = (name = "id") => ({
  in: "path",
  name,
  required: true,
  schema: {
    type: "integer",
    minimum: 1,
  },
  example: 1,
});

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Gestao Agronegocio 4A - API",
    version: "1.0.0",
    description:
      "Documentacao inicial da API do core para testar autenticacao, usuarios, permissoes e auditoria.",
  },
  servers: [
    {
      url: "/",
      description: "Servidor atual",
    },
    {
      url: "http://localhost:3000",
      description: "Backend local",
    },
    {
      url: "http://localhost",
      description: "Nginx local",
    },
  ],
  tags: [
    { name: "Auth", description: "Login e usuario autenticado." },
    {
      name: "Usuarios",
      description: "Cadastro, solicitacoes e gestao de usuarios.",
    },
    { name: "Permissoes", description: "Permissoes por modulo." },
    { name: "Auditoria", description: "Consulta de eventos sensiveis." },
    { name: "Entidades", description: "Gestao de entidades do escritorio." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Informe o token no formato: Bearer <token>",
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Operacao realizada com sucesso.",
          },
          data: {
            nullable: true,
          },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Voce nao tem permissao para executar esta acao.",
          },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          message: { type: "string", example: "Erro de validacao." },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "E-mail invalido." },
              },
            },
          },
        },
      },
      PermissaoModulo: {
        type: "object",
        required: ["modulo"],
        properties: {
          modulo: {
            type: "string",
            enum: modulos,
            example: "ESCRITORIO",
          },
          pode_visualizar: { type: "boolean", default: true },
          pode_criar: { type: "boolean", default: false },
          pode_editar: { type: "boolean", default: false },
          pode_excluir: { type: "boolean", default: false },
          pode_restaurar: { type: "boolean", default: false },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "senha"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@fazenda.com",
          },
          senha: { type: "string", example: "123456" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Login realizado com sucesso.",
          },
          data: {
            type: "object",
            properties: {
              token: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
              usuario: { $ref: "#/components/schemas/Usuario" },
            },
          },
        },
      },
      CriarUsuarioRequest: {
        type: "object",
        required: ["nome", "email", "senha"],
        properties: {
          nome: { type: "string", minLength: 2, example: "Administrador" },
          email: {
            type: "string",
            format: "email",
            example: "admin@fazenda.com",
          },
          senha: { type: "string", minLength: 6, example: "123456" },
          observacao: {
            type: "string",
            example: "Primeiro usuario do sistema.",
          },
          modulos: {
            type: "array",
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          },
        },
      },
      AtualizarUsuarioRequest: {
        type: "object",
        properties: {
          nome: {
            type: "string",
            minLength: 2,
            example: "Usuario Atualizado",
          },
          email: {
            type: "string",
            format: "email",
            example: "usuario@fazenda.com",
          },
          senha: { type: "string", minLength: 6, example: "novaSenha123" },
          ativo: { type: "boolean", example: true },
          observacao: { type: "string", example: "Observacao do usuario." },
        },
      },
      Usuario: {
        type: "object",
        properties: {
          id_usuario: { type: "integer", example: 1 },
          nome: { type: "string", example: "Administrador" },
          email: {
            type: "string",
            format: "email",
            example: "admin@fazenda.com",
          },
          ativo: { type: "boolean", example: true },
          ultimo_login: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          observacao: { type: "string", nullable: true },
          modulos: {
            type: "array",
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          },
        },
      },
      UsuarioSolicitacao: {
        type: "object",
        properties: {
          id_usuario_solicitacao: { type: "integer", example: 1 },
          nome: { type: "string", example: "Novo Usuario" },
          email: {
            type: "string",
            format: "email",
            example: "novo@fazenda.com",
          },
          observacao: { type: "string", nullable: true },
          modulos_solicitados: {
            type: "array",
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          },
          status: {
            type: "string",
            enum: ["PENDENTE", "APROVADA", "RECUSADA"],
            example: "PENDENTE",
          },
          motivo_recusa: { type: "string", nullable: true },
        },
      },
      EntidadeRequest: {
        type: "object",
        required: ["nome", "cpf_cnpj", "tipo_pessoa", "tipos"],
        properties: {
          nome: { type: "string", minLength: 2, example: "Joao da Silva" },
          cpf_cnpj: { type: "string", example: "12345678901" },
          tipo_pessoa: {
            type: "string",
            enum: ["FISICA", "JURIDICA"],
            example: "FISICA",
          },
          email: {
            type: "string",
            format: "email",
            nullable: true,
            example: "joao@fazenda.com",
          },
          telefone: { type: "string", nullable: true, example: "4433334444" },
          celular: { type: "string", nullable: true, example: "44999998888" },
          cep: { type: "string", nullable: true, example: "87000000" },
          logradouro: {
            type: "string",
            nullable: true,
            example: "Estrada Rural",
          },
          numero: { type: "string", nullable: true, example: "S/N" },
          bairro: { type: "string", nullable: true, example: "Zona Rural" },
          cidade: { type: "string", nullable: true, example: "Maringa" },
          estado: { type: "string", nullable: true, example: "PR" },
          complemento: { type: "string", nullable: true },
          data_nascimento: {
            type: "string",
            format: "date",
            nullable: true,
            example: "1985-04-10",
          },
          nacionalidade: {
            type: "string",
            nullable: true,
            example: "Brasileira",
          },
          filiacao: { type: "string", nullable: true },
          estado_civil: {
            type: "string",
            enum: ["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"],
            nullable: true,
          },
          genero: {
            type: "string",
            enum: ["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"],
            nullable: true,
          },
          participa_folha: { type: "boolean", default: false },
          observacao: { type: "string", nullable: true },
          ativo: { type: "boolean", default: true },
          tipos: {
            type: "array",
            minItems: 1,
            items: {
              type: "string",
              enum: ["FUNCIONARIO", "PROPRIETARIO", "CLIENTE", "ARRENDATARIO"],
            },
            example: ["FUNCIONARIO", "PROPRIETARIO"],
          },
        },
      },
      AtualizarEntidadeRequest: {
        type: "object",
        properties: {
          nome: { type: "string", minLength: 2, example: "Joao da Silva" },
          cpf_cnpj: { type: "string", example: "12345678901" },
          tipo_pessoa: {
            type: "string",
            enum: ["FISICA", "JURIDICA"],
            example: "FISICA",
          },
          email: {
            type: "string",
            format: "email",
            nullable: true,
            example: "joao@fazenda.com",
          },
          telefone: { type: "string", nullable: true, example: "4433334444" },
          celular: { type: "string", nullable: true, example: "44999998888" },
          cep: { type: "string", nullable: true, example: "87000000" },
          logradouro: {
            type: "string",
            nullable: true,
            example: "Estrada Rural",
          },
          numero: { type: "string", nullable: true, example: "S/N" },
          bairro: { type: "string", nullable: true, example: "Zona Rural" },
          cidade: { type: "string", nullable: true, example: "Maringa" },
          estado: { type: "string", nullable: true, example: "PR" },
          complemento: { type: "string", nullable: true },
          data_nascimento: {
            type: "string",
            format: "date",
            nullable: true,
            example: "1985-04-10",
          },
          nacionalidade: {
            type: "string",
            nullable: true,
            example: "Brasileira",
          },
          filiacao: { type: "string", nullable: true },
          estado_civil: {
            type: "string",
            enum: ["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"],
            nullable: true,
          },
          genero: {
            type: "string",
            enum: ["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"],
            nullable: true,
          },
          participa_folha: { type: "boolean" },
          observacao: { type: "string", nullable: true },
          ativo: { type: "boolean" },
          tipos: {
            type: "array",
            minItems: 1,
            items: {
              type: "string",
              enum: ["FUNCIONARIO", "PROPRIETARIO", "CLIENTE", "ARRENDATARIO"],
            },
            example: ["FUNCIONARIO", "PROPRIETARIO"],
          },
        },
      },
      Entidade: {
        allOf: [
          { $ref: "#/components/schemas/EntidadeRequest" },
          {
            type: "object",
            properties: {
              id_entidade: { type: "integer", example: 1 },
              deletedAt: {
                type: "string",
                format: "date-time",
                nullable: true,
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      AprovarSolicitacaoRequest: {
        type: "object",
        properties: {
          modulos: {
            type: "array",
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          },
        },
      },
      RecusarSolicitacaoRequest: {
        type: "object",
        properties: {
          motivo_recusa: { type: "string", example: "Dados incompletos." },
        },
      },
      SalvarPermissoesRequest: {
        type: "object",
        required: ["modulos"],
        properties: {
          modulos: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          },
        },
      },
      Auditoria: {
        type: "object",
        properties: {
          id_auditoria: { type: "integer", example: 1 },
          usuario_id: { type: "integer", nullable: true },
          acao: { type: "string", example: "LOGIN" },
          recurso: { type: "string", example: "USUARIO" },
          recurso_id: { type: "integer", nullable: true },
          valor_anterior: { type: "object", nullable: true },
          valor_novo: { type: "object", nullable: true },
          ip: { type: "string", nullable: true },
          data_hora: { type: "string", format: "date-time" },
        },
      },
    },
    parameters: {
      UsuarioId: idParameter(),
      SolicitacaoId: idParameter(),
      EntidadeId: idParameter(),
    },
    responses: {
      Unauthorized: {
        description: "Token ausente, invalido ou expirado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
      Forbidden: {
        description: "Usuario sem permissao para executar a acao.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
      NotFound: {
        description: "Recurso nao encontrado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
      ValidationError: {
        description: "Erro de validacao.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationError" },
          },
        },
      },
    },
  },
  paths: {
    "/core/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Realiza login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/core/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retorna o usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": successResponse("Usuario autenticado retornado com sucesso.", {
            $ref: "#/components/schemas/Usuario",
          }),
          ...protectedResponses,
        },
      },
    },
    "/core/usuarios": {
      post: {
        tags: ["Usuarios"],
        summary: "Cria o primeiro ADMIN ou abre solicitacao de usuario",
        description:
          "Se o banco nao tiver usuarios, cria o primeiro ADMIN. Caso contrario, cria uma solicitacao pendente para aprovacao.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CriarUsuarioRequest" },
            },
          },
        },
        responses: {
          "201": successResponse("Primeiro usuario ADMIN criado."),
          "202": successResponse("Solicitacao enviada para aprovacao."),
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      get: {
        tags: ["Usuarios"],
        summary: "Lista usuarios",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": successResponse("Usuarios listados com sucesso.", {
            type: "array",
            items: { $ref: "#/components/schemas/Usuario" },
          }),
          ...protectedResponses,
        },
      },
    },
    "/core/usuarios/{id}": {
      get: {
        tags: ["Usuarios"],
        summary: "Busca usuario por ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UsuarioId" }],
        responses: {
          "200": successResponse("Usuario encontrado com sucesso.", {
            $ref: "#/components/schemas/Usuario",
          }),
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Usuarios"],
        summary: "Atualiza usuario",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UsuarioId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AtualizarUsuarioRequest" },
            },
          },
        },
        responses: {
          "200": successResponse("Usuario atualizado com sucesso.", {
            $ref: "#/components/schemas/Usuario",
          }),
          "400": { $ref: "#/components/responses/ValidationError" },
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Remove usuario logicamente",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UsuarioId" }],
        responses: {
          "200": successResponse("Usuario removido com sucesso."),
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/core/usuarios/solicitacoes": {
      get: {
        tags: ["Usuarios"],
        summary: "Lista solicitacoes de usuarios",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            required: false,
            schema: {
              type: "string",
              enum: ["PENDENTE", "APROVADA", "RECUSADA"],
            },
          },
        ],
        responses: {
          "200": successResponse("Solicitacoes listadas com sucesso.", {
            type: "array",
            items: { $ref: "#/components/schemas/UsuarioSolicitacao" },
          }),
          ...protectedResponses,
        },
      },
    },
    "/core/usuarios/solicitacoes/{id}/aprovar": {
      patch: {
        tags: ["Usuarios"],
        summary: "Aprova solicitacao de usuario",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SolicitacaoId" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AprovarSolicitacaoRequest",
              },
            },
          },
        },
        responses: {
          "200": successResponse("Solicitacao aprovada com sucesso.", {
            $ref: "#/components/schemas/Usuario",
          }),
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/core/usuarios/solicitacoes/{id}/recusar": {
      patch: {
        tags: ["Usuarios"],
        summary: "Recusa solicitacao de usuario",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/SolicitacaoId" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RecusarSolicitacaoRequest",
              },
            },
          },
        },
        responses: {
          "200": successResponse("Solicitacao recusada com sucesso.", {
            $ref: "#/components/schemas/UsuarioSolicitacao",
          }),
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/core/permissoes/usuarios/{id}": {
      get: {
        tags: ["Permissoes"],
        summary: "Lista permissoes de um usuario",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UsuarioId" }],
        responses: {
          "200": successResponse("Permissoes listadas com sucesso.", {
            type: "array",
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          }),
          ...protectedResponses,
        },
      },
      put: {
        tags: ["Permissoes"],
        summary: "Atualiza permissoes de um usuario",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UsuarioId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SalvarPermissoesRequest" },
            },
          },
        },
        responses: {
          "200": successResponse("Permissoes atualizadas com sucesso.", {
            type: "array",
            items: { $ref: "#/components/schemas/PermissaoModulo" },
          }),
          "400": { $ref: "#/components/responses/ValidationError" },
          ...protectedResponses,
        },
      },
    },
    "/core/auditoria": {
      get: {
        tags: ["Auditoria"],
        summary: "Lista registros de auditoria",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": successResponse("Auditoria listada com sucesso.", {
            type: "array",
            items: { $ref: "#/components/schemas/Auditoria" },
          }),
          ...protectedResponses,
        },
      },
    },
    "/escritorio/entidades": {
      get: {
        tags: ["Entidades"],
        summary: "Lista entidades",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "termo",
            required: false,
            schema: { type: "string" },
            description: "Busca por nome ou CPF/CNPJ.",
          },
          {
            in: "query",
            name: "tipo",
            required: false,
            schema: {
              type: "string",
              enum: ["FUNCIONARIO", "PROPRIETARIO", "CLIENTE", "ARRENDATARIO"],
            },
          },
          {
            in: "query",
            name: "ativo",
            required: false,
            schema: { type: "string", enum: ["true", "false"] },
          },
        ],
        responses: {
          "200": successResponse("Entidades listadas com sucesso.", {
            type: "array",
            items: { $ref: "#/components/schemas/Entidade" },
          }),
          ...protectedResponses,
        },
      },
      post: {
        tags: ["Entidades"],
        summary: "Cadastra entidade",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EntidadeRequest" },
            },
          },
        },
        responses: {
          "201": successResponse("Entidade cadastrada com sucesso.", {
            $ref: "#/components/schemas/Entidade",
          }),
          "400": { $ref: "#/components/responses/ValidationError" },
          ...protectedResponses,
        },
      },
    },
    "/escritorio/entidades/{id}": {
      get: {
        tags: ["Entidades"],
        summary: "Busca entidade por ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/EntidadeId" }],
        responses: {
          "200": successResponse("Entidade encontrada com sucesso.", {
            $ref: "#/components/schemas/Entidade",
          }),
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Entidades"],
        summary: "Atualiza entidade",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/EntidadeId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AtualizarEntidadeRequest" },
            },
          },
        },
        responses: {
          "200": successResponse("Entidade atualizada com sucesso.", {
            $ref: "#/components/schemas/Entidade",
          }),
          "400": { $ref: "#/components/responses/ValidationError" },
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Entidades"],
        summary: "Remove entidade logicamente",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/EntidadeId" }],
        responses: {
          "200": successResponse("Entidade removida com sucesso."),
          ...protectedResponses,
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};

export default swaggerDocument;
