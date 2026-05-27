# Front Escritório

Frontend do módulo Escritório. Ele valida a sessão no Core antes de renderizar a experiência do módulo.

Rotas principais:

- `/escritorio/`: entrada do módulo em produção pelo gateway.
- `/api/core/auth/me`: validação do usuário logado.
- `/api/escritorio/*`: APIs do serviço Escritório.

Variáveis úteis em desenvolvimento:

- `VITE_API_URL`: base da API, deixe vazio quando o gateway estiver no mesmo host.
- `VITE_LOGIN_HOME_URL`: URL para voltar ao login/home.
- `VITE_BASE_PATH`: base pública do Vite.

Dev local:

- Rode `npm run dev`; o Vite usa a porta `5174`.
- Chamadas `/api/*` são encaminhadas ao Nginx local.
- Para usar anexos, o backend Escritório precisa estar rodando com `UPLOAD_DIR`.
