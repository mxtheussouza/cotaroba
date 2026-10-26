const errors: Record<string, string> = {
  "nome-regiao": "Informe um nome de região com 1 a 120 caracteres.",
  dados:
    "Confira os campos: nome obrigatório, região válida, e-mail válido e senha de 12 a 128 caracteres, quando solicitada. Preencha novamente o formulário.",
  "nao-encontrado":
    "Cadastro ou acesso não encontrado. Atualize a página e tente novamente.",
  regiao: "Selecione uma região cadastrada.",
  "regiao-duplicada":
    "Já existe uma região com esse nome. Use a região cadastrada.",
  email: "Este e-mail já está em uso. Informe outro e-mail.",
  inativo: "Reative o frigorífico antes de criar um acesso.",
  indisponivel: "Não foi possível salvar. Tente novamente em instantes.",
  limite: "Muitos envios em pouco tempo. Aguarde um minuto e tente novamente.",
};

const notices: Record<string, string> = {
  "regiao-criada":
    "Região cadastrada. Ela já está disponível para os frigoríficos.",
  "frigorifico-criado":
    "Frigorífico cadastrado. Agora você pode criar seus acessos.",
  "frigorifico-atualizado":
    "Frigorífico atualizado. As sessões dos seus acessos foram encerradas.",
  "acesso-criado":
    "Acesso cadastrado. Informe o e-mail e a senha ao responsável por um canal seguro.",
  "acesso-atualizado":
    "Acesso atualizado. As sessões anteriores foram encerradas.",
  "senha-alterada":
    "Senha alterada. As sessões anteriores foram encerradas. Informe a nova senha ao responsável por um canal seguro.",
};

export type ManagementSearch = Record<string, string | string[] | undefined>;

export function Feedback({ search }: { search: ManagementSearch }) {
  const error =
    typeof search.erro === "string" && Object.hasOwn(errors, search.erro)
      ? errors[search.erro]
      : undefined;
  const notice =
    typeof search.aviso === "string" && Object.hasOwn(notices, search.aviso)
      ? notices[search.aviso]
      : undefined;
  return (
    <>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger bg-surface p-4 text-danger"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-border bg-secondary p-4"
        >
          {notice}
        </p>
      )}
    </>
  );
}
