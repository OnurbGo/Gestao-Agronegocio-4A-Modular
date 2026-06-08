import { emissoresApi } from '@/services/silo.service'
import type { AuthUser, Emissor } from '@/types'
import EntityLinkedCadastroPage from '@/screens/_shared/EntityLinkedCadastroPage'

type EmissoresPageProps = {
  usuario: AuthUser
}

function EmissoresPage({ usuario }: EmissoresPageProps) {
  return (
    <EntityLinkedCadastroPage<Emissor>
      api={emissoresApi}
      description="Informação documental da carga. O emissor não define saldo; o saldo é movimentado pela Conta de Produto."
      idFrom={(item) => item.id_emissor}
      linkedHelp="Emissor é usado para documentação da carga. O saldo é movimentado pela Conta de Produto."
      statusField="ativo"
      title="Emissores"
      usuario={usuario}
    />
  )
}

export default EmissoresPage
