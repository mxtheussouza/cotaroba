import { getLoginErrorMessage } from "./login-errors";

type LoginSearchParams = Record<string, string | string[] | undefined>;

// Redirect only to configured infrastructure; never echo legacy credential query fields.
export function getLoginRedirect(
  host: string | null,
  baseURL: string,
  search: LoginSearchParams,
) {
  const target = new URL("/login", baseURL);
  const hasLegacyCredentials = "password" in search || "email" in search;
  if (hasLegacyCredentials) target.searchParams.set("erro", "reenvio");
  else if (getLoginErrorMessage(search.erro))
    target.searchParams.set("erro", search.erro as string);

  if (
    hasLegacyCredentials ||
    (host && host.toLowerCase() !== target.host.toLowerCase())
  ) {
    return target.toString();
  }
  return null;
}
