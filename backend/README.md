# Backend - Testes

Este backend usa Jest para testes unitarios e Supertest para testes de integracao/API.

## Comandos

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:integration
npm run test:e2e
```

## Estrutura

```text
src/**/*.spec.ts
test/
  setup.ts
  test-app.ts
  factories/
  helpers/
  integration/
```

## Testes unitarios

Os testes unitarios ficam junto dos services/utilitarios em `src/**/*.spec.ts`.
Eles usam `TestingModule` do NestJS e mocks de repositories, services externos e
auditoria. A ideia e testar regra de negocio sem acessar banco real.

Cobertura inicial:

- Auth: login valido, senha invalida, conta inativa, validacao de token e auditoria de login.
- Permissoes: bloqueio de usuario comum, restricoes de GERENTE, protecao do ultimo ADMIN ativo e salvamento valido.
- Entidades: criacao, substituicao de tipos, soft delete e auditoria.
- Imoveis: validacao de proprietarios, deduplicacao de IDs e auditoria.
- Folha: registro salarial valido, periodo invalido, sobreposicao salarial e ferias sem salario vigente.
- Calculos da folha: salario vigente por data, valor de ferias, salario proporcional e descontos.

## Testes de integracao/API

Os testes de integracao ficam em `test/integration`.
Nesta primeira base, eles sobem uma aplicacao Nest de teste com:

- controllers reais;
- `ValidationPipe` real;
- guards reais de autenticacao/permissao;
- services mockados;
- prefixos publicos reais: `/api/core` e `/api/escritorio`.

Essa escolha evita qualquer risco de rodar a suite contra banco de desenvolvimento
ou producao enquanto ainda nao existe um container/banco de teste padronizado no
projeto.

## Banco de teste

A suite atual de integracao nao acessa banco real. Para uma futura suite com MySQL
isolado, use `NODE_ENV=test` e configure um banco exclusivo em `DB_TEST_NAME`, por
exemplo `gestao_agro_test`.

O helper `test/helpers/database.helper.ts` valida que o banco tem nome de teste e
recusa nomes conhecidos de desenvolvimento/producao. Use esse helper antes de
abrir conexao real em testes futuros.

Nunca rode testes de integracao com `DB_NAME=gestao_agro` ou banco de producao.

## Pontos para expansao

- Criar compose/servico MySQL dedicado para testes DB-backed.
- Adicionar seeds isoladas para entidades, imoveis, contas e folha.
- Cobrir restore quando a funcionalidade estiver exposta por endpoint.
- Ampliar testes de relatorios, documentos/uploads e Silo.
