import { transportadorasApi } from '@/shared/services/silo.service'
import type { AuthUser, Transportadora } from '@/shared/types'
import EntityLinkedCadastroPage from '@/modules/silo/screens/_shared/EntityLinkedCadastroPage'

type TransportadorasPageProps = {
  usuario: AuthUser
}

function TransportadorasPage({ usuario }: TransportadorasPageProps) {
  return (
    <EntityLinkedCadastroPage<Transportadora>
      api={transportadorasApi}
      description="Empresas ou cadastros avulsos usados no transporte das cargas."
      hasTelefone
      idFrom={(item) => item.id_transportadora}
      linkedHelp="A transportadora pode ser vinculada a uma Entidade do Escritório ou criada como cadastro avulso."
      statusField="ativa"
      title="Transportadoras"
      usuario={usuario}
    />
  )
}

export default TransportadorasPage
