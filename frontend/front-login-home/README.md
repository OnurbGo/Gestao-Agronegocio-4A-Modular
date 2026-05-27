# Front Login Home

Frontend de autenticação, seleção de módulos, perfil e administração de acessos.

Rotas principais:

- `/`: login, home de módulos e menu de perfil.
- `/api/core/*`: chamadas ao Core via gateway.
- `/escritorio/`: destino do módulo Escritório em produção.

Variáveis úteis em desenvolvimento:

- `VITE_API_URL`: base da API, deixe vazio quando o gateway estiver no mesmo host.
- `VITE_ESCRITORIO_URL`: URL do front Escritório.
- `VITE_BASE_PATH`: base pública do Vite.

Dev local:

- Rode `npm run dev`; o Vite usa a porta `5173`.
- Chamadas `/api/*` são encaminhadas ao Nginx local.
