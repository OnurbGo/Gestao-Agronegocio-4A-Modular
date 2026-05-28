# Contexto técnico do sistema — Gestão Agronegócio 4A

Estou desenvolvendo um sistema interno de gestão para um agronegócio. O sistema deve ser construído como um **monólito modular**, ou seja, um único backend e um único frontend, mas com separação clara por módulos, responsabilidades e regras de negócio.

O projeto atual usa como base:

```txt
Backend:
- Node.js
- Express
- TypeScript
- Sequelize
- MySQL
- Zod para validações
- JWT para autenticação
- Multer para uploads

Frontend:
- React
- Vite
- JavaScript/JSX ou TypeScript se for necessário evoluir
- Zod também para validações de formulário
```

O estilo de código deve seguir um padrão parecido com o repositório `TechAcademy8`, usando models Sequelize com:

```ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class NomeModel extends Model {
  // atributos tipados
}

NomeModel.init(
  {
    // definição dos campos
  },
  {
    sequelize,
    tableName: 'NOME_TABELA',
    timestamps: true ou false,
  }
);

export default NomeModel;
```

O repositório de referência usa backend com Node.js, Express, Sequelize e MySQL, e organiza a API em uma pasta `backEnd/`. ([GitHub][1])

---

# Direção arquitetural

O sistema deve ser organizado em três partes principais no momento:

```txt
1. Core
2. Escritório
3. Folha de Pagamento
```

Os outros módulos devem existir apenas como planejamento futuro, sem implementação completa agora:

```txt
- Balança
- Silo
- Barracão
- Lavoura
- Almoxarifado
- Financeiro
```

O foco atual é implementar bem:

```txt
Core + Escritório + Folha de Pagamento
```

Não implementar microsserviços. Não criar módulos futuros antes da hora. O sistema deve ser um **monólito modular bem organizado**.

---

# Boas práticas obrigatórias

Ao implementar qualquer coisa, seguir estas regras:

```txt
- Código limpo, simples e fácil de entender.
- Separar controller, service, routes, model e schema.
- Não colocar regra de negócio pesada dentro do controller.
- Controller deve receber request, chamar service e devolver response.
- Service deve conter a lógica principal.
- Model deve representar o banco.
- Schemas Zod devem validar dados de entrada.
- Evitar duplicação de código.
- Usar nomes claros e coerentes com o domínio.
- Não criar abstrações desnecessárias.
- Não misturar regra de frontend com regra de backend.
- Validar dados no frontend para UX.
- Validar dados no backend por segurança.
```

O Zod deve ser usado porque ele é uma biblioteca de validação “TypeScript-first” com inferência de tipos, permitindo definir schemas e validar dados antes de usar a informação no sistema. ([Zod][2])

A validação precisa existir no backend obrigatoriamente, porque validação só no frontend pode ser burlada. A OWASP recomenda validar dados no servidor antes do processamento e usar validação no frontend apenas como apoio para experiência do usuário. ([OWASP Cheat Sheet Series][3])

Sempre que houver campos com valores fixos, como tipo de entidade ou módulos do sistema, validar por lista permitida. A OWASP recomenda abordagem de allowlist, ou seja, definir exatamente o que é permitido e rejeitar o restante. ([OWASP Cheat Sheet Series][3])

---

# Estrutura de pastas desejada

## Backend

```txt
backend/src/
│
├── app.ts
├── server.ts
│
├── config/
│   ├── database.ts
│   ├── env.ts
│   ├── upload.ts
│   └── swagger.ts
│
├── core/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.middleware.ts
│   │   └── token.service.ts
│   │
│   ├── usuarios/
│   │   ├── usuario.model.ts
│   │   ├── usuario_modulo.model.ts
│   │   ├── usuario.controller.ts
│   │   ├── usuario.service.ts
│   │   ├── usuario.routes.ts
│   │   └── usuario.schema.ts
│   │
│   ├── permissoes/
│   │   ├── modulo.enum.ts
│   │   ├── permissao.service.ts
│   │   ├── permissao.middleware.ts
│   │   └── permissao.schema.ts
│   │
│   ├── auditoria/
│   │   ├── auditoria.model.ts
│   │   ├── auditoria.service.ts
│   │   ├── auditoria.controller.ts
│   │   └── auditoria.routes.ts
│   │
│   ├── soft-delete/
│   │   └── soft-delete.service.ts
│   │
│   └── core.routes.ts
│
├── modules/
│   ├── escritorio/
│   │   ├── entidades/
│   │   │   ├── entidade.model.ts
│   │   │   ├── entidade_tipo.model.ts
│   │   │   ├── entidade_arquivo.model.ts
│   │   │   ├── tipo_documento.model.ts
│   │   │   ├── entidade.controller.ts
│   │   │   ├── entidade.service.ts
│   │   │   ├── entidade.routes.ts
│   │   │   └── entidade.schema.ts
│   │   │
│   │   ├── imoveis/
│   │   │   ├── imovel.model.ts
│   │   │   ├── imovel_proprietario.model.ts
│   │   │   ├── imovel_arquivo.model.ts
│   │   │   ├── imovel.controller.ts
│   │   │   ├── imovel.service.ts
│   │   │   ├── imovel.routes.ts
│   │   │   └── imovel.schema.ts
│   │   │

│   │   └── escritorio.routes.ts
│   │
│   ├── folha/
│   │   ├── participantes/
│   │   │   ├── folha_participante.model.ts
│   │   │   ├── folha_participante.controller.ts
│   │   │   ├── folha_participante.service.ts
│   │   │   ├── folha_participante.routes.ts
│   │   │   └── folha_participante.schema.ts
│   │   │
│   │   ├── registros-salariais/
│   │   │   ├── registro_salarial.model.ts
│   │   │   ├── registro_salarial.controller.ts
│   │   │   ├── registro_salarial.service.ts
│   │   │   ├── registro_salarial.routes.ts
│   │   │   └── registro_salarial.schema.ts
│   │   │
│   │   ├── ferias/
│   │   │   ├── ferias.model.ts
│   │   │   ├── ferias.controller.ts
│   │   │   ├── ferias.service.ts
│   │   │   ├── ferias.routes.ts
│   │   │   └── ferias.schema.ts
│   │   │
│   │   ├── lancamentos-mensais/
│   │   │   ├── folha_mensal.model.ts
│   │   │   ├── folha_mensal.controller.ts
│   │   │   ├── folha_mensal.service.ts
│   │   │   ├── folha_mensal.routes.ts
│   │   │   └── folha_mensal.schema.ts
│   │   │
│   │   ├── relatorios/
│   │   │   ├── relatorio_mensal.controller.ts
│   │   │   ├── relatorio_mensal.service.ts
│   │   │   └── relatorio_mensal.routes.ts
│   │   │
│   │   └── folha.routes.ts
│   │
│   ├── balanca/
│   │   └── .gitkeep
│   ├── silo/
│   │   └── .gitkeep
│   ├── barracao/
│   │   └── .gitkeep
│   ├── lavoura/
│   │   └── .gitkeep
│   ├── almoxarifado/
│   │   └── .gitkeep
│   └── financeiro/
│       └── .gitkeep
│
└── shared/
    ├── schemas/
    │   ├── common.schema.ts
    │   ├── pagination.schema.ts
    │   ├── cpf-cnpj.schema.ts
    │   └── upload.schema.ts
    │
    ├── middlewares/
    │   ├── validate.middleware.ts
    │   ├── error.middleware.ts
    │   └── async-handler.ts
    │
    ├── database/
    │   ├── associations.ts
    │   └── models.ts
    │
    ├── utils/
    │   ├── masks.ts
    │   ├── dates.ts
    │   ├── strings.ts
    │   └── numbers.ts
    │
    └── types/
        └── express.d.ts
```

---

## Frontend

```txt
frontend/src/
│
├── App.jsx
├── main.jsx
│
├── core/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── auth.service.js
│   │   ├── auth.context.jsx
│   │   ├── useAuth.js
│   │   └── ProtectedRoute.jsx
│   │
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── PageContainer.jsx
│   │
│   ├── menu/
│   │   ├── menu.config.js
│   │   └── menu.utils.js
│   │
│   ├── permissions/
│   │   ├── CanAccess.jsx
│   │   ├── usePermissions.js
│   │   └── permissions.service.js
│   │
│   ├── usuarios/
│   │   ├── UsuariosPage.jsx
│   │   ├── UsuarioForm.jsx
│   │   ├── PermissoesUsuarioPage.jsx
│   │   └── usuario.service.js
│   │
│   └── auditoria/
│       ├── AuditoriaPage.jsx
│       └── auditoria.service.js
│
├── modules/
│   ├── escritorio/
│   │   ├── entidades/
│   │   │   ├── EntidadesPage.jsx
│   │   │   ├── EntidadeForm.jsx
│   │   │   ├── EntidadeDetails.jsx
│   │   │   ├── EntidadeDocumentos.jsx
│   │   │   ├── ParticipaFolhaCheckbox.jsx
│   │   │   └── entidade.service.js
│   │   │
│   │   ├── imoveis/
│   │   │   ├── ImoveisPage.jsx
│   │   │   ├── ImovelForm.jsx
│   │   │   ├── ImovelDetails.jsx
│   │   │   └── imovel.service.js
│   │   │

│   │
│   └── folha/
│       ├── participantes/
│       ├── registros-salariais/
│       ├── ferias/
│       ├── lancamentos-mensais/
│       └── relatorios/
│
├── shared/
│   ├── schemas/
│   │   ├── entidade.schema.js
│   │   ├── usuario.schema.js
│   │   ├── folha.schema.js
│   │   └── common.schema.js
│   │
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Checkbox.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Loading.jsx
│   │   └── EmptyState.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   └── upload.service.js
│   │
│   ├── hooks/
│   │   ├── useForm.js
│   │   ├── useFetch.js
│   │   └── usePagination.js
│   │
│   └── utils/
│       ├── masks.js
│       ├── formatDate.js
│       ├── formatCurrency.js
│       └── validators.js
```

---

# Regras gerais do sistema

## 1. Core

O `Core` é a base do sistema. Ele não é um módulo de negócio, mas sustenta todos os módulos.

O Core deve conter:

```txt
- autenticação
- usuários
- permissões por módulo
- módulos sistêmicos
- auditoria
- soft delete / restauração
```

Não usar mais o modelo antigo:

```txt
ADMIN | GERENTE | USUARIO
```

Em vez disso, usar permissões por módulo.

Os módulos existentes são:

```txt
ADMIN
GERENTE
ESCRITORIO
FOLHA
BALANCA
SILO
BARRACAO
LAVOURA
ALMOXARIFADO
FINANCEIRO
```

`ADMIN` e `GERENTE` são módulos sistêmicos, não módulos comuns.

Regras:

```txt
ADMIN:
- acesso total ao sistema
- pode gerenciar permissões
- pode conceder/remover ADMIN
- pode conceder/remover GERENTE
- pode restaurar dados
- pode acessar ações técnicas/sistêmicas

GERENTE:
- acessa todos os módulos de negócio
- pode gerenciar permissões de módulos de negócio
- não pode conceder/remover ADMIN
- não pode conceder/remover GERENTE
- não pode executar ações exclusivas do ADMIN

Usuário comum:
- acessa apenas módulos explicitamente liberados
```

---

## 2. Escritório

O módulo `Escritório` é o centro administrativo do sistema.

Ele deve conter:

```txt
- Entidades
- Imóveis
- Documentos vinculados a entidades e imóveis
```

O conceito antigo de `Pessoa` foi substituído por `Entidade`.

`Entidade` representa pessoa física ou jurídica.

A entidade pode ter múltiplos tipos:

```txt
FUNCIONARIO
PROPRIETARIO
CLIENTE
ARRENDATARIO
```

Uma mesma entidade pode ser mais de um tipo. Exemplo:

```txt
João da Silva:
- FUNCIONARIO
- PROPRIETARIO
```

Por isso, não usar apenas um campo `tipo` direto na entidade. Criar tabela separada:

```txt
ENTIDADE
ENTIDADE_TIPO
```

---

## 3. Documentos da Entidade

Como Entidade pode ser pessoa física ou jurídica, não criar campos fixos como:

```txt
rg_arquivo
cpf_arquivo
certidao_casamento_arquivo
titulo_eleitor_arquivo
comprovante_residencia_arquivo
```

Em vez disso, criar anexos flexíveis:

```txt
TIPO_DOCUMENTO
ENTIDADE_ARQUIVO
```

A entidade pode ter quantos documentos forem necessários.

Tipos iniciais sugeridos:

```txt
Pessoa física:
- RG
- CPF
- CNH
- Título de Eleitor
- Certidão de Casamento
- Comprovante de Residência
- Procuração
- Contrato
- Outros

Pessoa jurídica:
- Cartão CNPJ
- Contrato Social
- Inscrição Estadual
- Comprovante de Endereço
- Documento do Representante Legal
- Procuração
- Contrato
- Outros

Rural/agro:
- CAR
- CCIR
- ITR
- Matrícula do Imóvel
- Contrato de Arrendamento
- Comprovante de Posse
- Outros
```

A tela deve permitir:

```txt
Selecionar tipo do documento
Selecionar arquivo
Informar descrição opcional
Enviar
Listar documentos anexados
Baixar documento
Remover logicamente documento
```

Uploads devem aceitar apenas tipos seguros e controlados, por exemplo:

```txt
PDF
JPG
JPEG
PNG
```

A OWASP recomenda usar allowlist para tipos de arquivos, validar uploads e tomar cuidado com extensões perigosas. ([OWASP Cheat Sheet Series][3])

---

## 4. Folha de Pagamento

A Folha de Pagamento deve ser um módulo próprio, separado do Escritório e separado do Financeiro.

Ela depende de `Entidade`.

A regra é:

```txt
Se entidade.participa_folha = true:
- aparece na Folha de Pagamento

Se entidade.participa_folha = false:
- não aparece na Folha de Pagamento
```

Não obrigar a entidade a ser apenas `FUNCIONARIO` ou `PROPRIETARIO` para participar da folha. O campo `participa_folha` define isso.

O módulo Folha deve conter:

```txt
- participantes da folha
- registros salariais
- férias
- lançamentos mensais
- relatório mensal
```

Não usar “capa anual da folha”. O correto no sistema é **relatório mensal**.

---

# Models principais esperados

## Usuario

```txt
USUARIO
- id_usuario
- nome
- email
- senha_hash
- ativo
- ultimo_login
- observacao
- deletedAt
```

Observações:

```txt
- Não salvar senha pura.
- Salvar apenas senha_hash.
- ativo=false bloqueia login sem apagar histórico.
- ultimo_login é opcional, mas útil para auditoria.
- deletedAt é usado para soft delete.
```

## UsuarioModulo

```txt
USUARIO_MODULO
- id_usuario_modulo
- usuario_id
- modulo
- pode_visualizar
- pode_criar
- pode_editar
- pode_excluir
- pode_restaurar
```

Não criar `perfilGlobal`.

---

## Entidade

```txt
ENTIDADE
- id_entidade
- nome
- cpf_cnpj
- tipo_pessoa: FISICA | JURIDICA
- email
- telefone
- celular
- cep
- logradouro
- numero
- bairro
- cidade
- estado
- complemento
- data_nascimento
- nacionalidade
- filiacao
- estado_civil
- genero
- participa_folha
- observacao
- ativo
- deletedAt
```

## EntidadeTipo

```txt
ENTIDADE_TIPO
- id_entidade_tipo
- entidade_id
- tipo: FUNCIONARIO | PROPRIETARIO | CLIENTE | ARRENDATARIO
```

## TipoDocumento

```txt
TIPO_DOCUMENTO
- id_tipo_documento
- nome
- categoria: PESSOAL | EMPRESARIAL | RURAL | CONTRATUAL | OUTROS
- tipo_pessoa_aplicavel: FISICA | JURIDICA | AMBAS
- obrigatorio
- ativo
```

## EntidadeArquivo

```txt
ENTIDADE_ARQUIVO
- id_entidade_arquivo
- entidade_id
- tipo_documento_id
- nome_original
- nome_arquivo
- caminho
- tipo_mime
- tamanho
- observacao
- enviado_por_usuario_id
- ativo
- deletedAt
```

---

# Padrão de validações com Zod

Criar pasta `schemas`.

No backend:

```txt
backend/src/shared/schemas/
backend/src/core/usuarios/usuario.schema.ts
backend/src/modules/escritorio/entidades/entidade.schema.ts
```

No frontend:

```txt
frontend/src/shared/schemas/
```

Sempre que possível, reaproveitar a mesma lógica de validação entre frontend e backend, mas nunca depender apenas do frontend.

Exemplo de schema esperado:

```ts
import { z } from "zod";

export const entidadeSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido"),
  tipo_pessoa: z.enum(["FISICA", "JURIDICA"]),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  participa_folha: z.boolean().default(false),
  tipos: z
    .array(z.enum(["FUNCIONARIO", "PROPRIETARIO", "CLIENTE", "ARRENDATARIO"]))
    .min(1, "Informe pelo menos um tipo de entidade"),
});
```

Criar middleware de validação:

```ts
validate(schema);
```

Esse middleware deve:

```txt
- receber um schema Zod
- validar req.body, req.params ou req.query
- retornar 400 em caso de erro
- seguir um padrão de resposta legível
```

---

# Padrão esperado dos arquivos

Para cada recurso novo, criar:

```txt
model
schema
service
controller
routes
```

Exemplo para Entidade:

```txt
entidade.model.ts
entidade_tipo.model.ts
entidade_arquivo.model.ts
tipo_documento.model.ts
entidade.schema.ts
entidade.service.ts
entidade.controller.ts
entidade.routes.ts
```

O controller não deve ter regra pesada. Exemplo:

```ts
class EntidadeController {
  async criar(req, res) {
    const entidade = await EntidadeService.criar(req.body, req.user);
    return res.status(201).json(entidade);
  }
}
```

A lógica deve ficar no service:

```ts
class EntidadeService {
  async criar(data, usuarioLogado) {
    // validar regra de negócio
    // criar entidade
    // criar tipos
    // registrar auditoria
    // retornar entidade criada
  }
}
```

---

# Soft delete

Não excluir registros fisicamente, principalmente:

```txt
- usuários
- entidades
- documentos
- imóveis
- lançamentos de folha
```

Usar:

```txt
ativo
deletedAt
paranoid: true
```

Diferença:

```txt
ativo = false:
- registro ainda aparece como inativo
- não pode ser usado em novos lançamentos

deletedAt preenchido:
- registro foi removido logicamente
- não aparece em consultas normais
- pode ser restaurado por ADMIN
```

---

# Auditoria

Registrar ações sensíveis:

```txt
- login
- criação de usuário
- alteração de permissões
- criação de entidade
- alteração de entidade
- alteração de participa_folha
- upload de documento
- remoção lógica
- restauração
- criação/edição de folha
```

A auditoria deve guardar:

```txt
- usuário que executou
- ação
- recurso
- id do recurso
- valor anterior
- valor novo
- data/hora
- IP se possível
```

---

# Permissões

Todas as rotas protegidas devem passar por autenticação e autorização.

Exemplo:

```ts
router.post(
  "/entidades",
  authMiddleware,
  requireModulo("ESCRITORIO", "criar"),
  EntidadeController.criar,
);
```

Regra:

```txt
Frontend pode esconder menu e botão.
Backend deve bloquear de verdade.
```

Nunca confiar só no frontend.

---

# Padrão de resposta da API

Usar respostas consistentes.

Sucesso:

```json
{
  "message": "Entidade cadastrada com sucesso.",
  "data": {}
}
```

Erro de validação:

```json
{
  "message": "Erro de validação.",
  "errors": [
    {
      "field": "nome",
      "message": "Nome é obrigatório."
    }
  ]
}
```

Erro de permissão:

```json
{
  "message": "Você não tem permissão para executar esta ação."
}
```

---

# Estilo de código desejado

Manter o código “bonito”, simples e compreensível:

```txt
- nomes claros
- funções pequenas
- arquivos com responsabilidade única
- evitar ifs gigantes
- evitar código duplicado
- separar validação, regra de negócio e persistência
- usar early return quando melhorar a leitura
- usar constantes/enums para valores fixos
- não criar funções genéricas demais sem necessidade
```

Comentários devem ser usados apenas quando ajudam a explicar uma regra de negócio. Não comentar o óbvio.

---

# Ordem de implementação recomendada

Implementar nesta ordem:

```txt
1. Core
   - Usuario
   - UsuarioModulo
   - Auth
   - Permissões
   - Middleware de validação com Zod
   - Auditoria básica
   - Soft delete

2. Escritório
  - Entidade
  - EntidadeTipo
  - TipoDocumento
  - EntidadeArquivo
  - Upload de documentos
  - Imóveis

3. Folha de Pagamento
   - Participantes
   - Registros salariais
   - Férias
   - Lançamentos mensais
   - Relatório mensal

4. Módulos futuros
   - não implementar ainda
```

---

# Instrução final para a IA que irá programar

Ao gerar código para este sistema, siga estas regras:

```txt
- Não inventar módulos fora do escopo.
- Não usar perfilGlobal ADMIN/GERENTE/USUARIO.
- Usar UsuarioModulo para permissões.
- Tratar ADMIN e GERENTE como módulos sistêmicos.
- Tratar Escritório e Folha como módulos iniciais.
- Usar Entidade no lugar de Pessoa.
- Permitir múltiplos tipos por entidade.
- Usar participa_folha para definir quem aparece na folha.
- Criar documentos como anexos flexíveis, não campos fixos.
- Validar dados com Zod no frontend e no backend.
- Criar schemas em pasta própria.
- Manter controllers simples e services com regra de negócio.
- Usar Sequelize no padrão class extends Model.
- Preservar legibilidade, clean code e separação de responsabilidades.
```

O objetivo principal é criar um sistema fácil de manter, com base sólida para crescer nos próximos anos sem virar um conjunto de funções soltas.

[1]: https://github.com/LeonardoDecaris/TechAcademy8 "GitHub - LeonardoDecaris/TechAcademy8 · GitHub"
[2]: https://zod.dev/ "Intro | Zod"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html "Input Validation - OWASP Cheat Sheet Series"
