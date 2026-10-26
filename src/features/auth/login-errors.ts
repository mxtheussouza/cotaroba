const messages = {
  dados: "Informe um e-mail válido e sua senha.",
  credenciais: "E-mail ou senha inválidos.",
  limite: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  origem:
    "O endereço de acesso não foi reconhecido. Reabra a página de entrada.",
  indisponivel: "Não foi possível entrar. Tente novamente.",
  reenvio: "Envie o formulário novamente para entrar.",
} as const;

export type LoginErrorCode = keyof typeof messages;

export function getLoginErrorMessage(code: unknown): string {
  return typeof code === "string" && Object.hasOwn(messages, code)
    ? messages[code as LoginErrorCode]
    : "";
}

export function loginErrorCodeForStatus(status: number): LoginErrorCode {
  if (status === 400) return "dados";
  if (status === 401) return "credenciais";
  if (status === 403) return "origem";
  if (status === 429) return "limite";
  return "indisponivel";
}
