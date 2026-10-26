import { SubmitButton } from "./submit-button";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base";

export function SlaughterhouseFields({
  regions,
  record,
}: {
  regions: Array<{ id: string; name: string }>;
  record?: { name: string; regionId: string; isActive: boolean };
}) {
  return (
    <>
      <div>
        <label htmlFor="company-name" className="block text-sm font-semibold">
          Nome do frigorífico
        </label>
        <input
          id="company-name"
          name="name"
          required
          maxLength={160}
          defaultValue={record?.name}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="region" className="block text-sm font-semibold">
          Região
        </label>
        <select
          id="region"
          name="regionId"
          required
          defaultValue={record?.regionId ?? ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione uma região
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>
      {record && (
        <div>
          <label
            htmlFor="company-status"
            className="block text-sm font-semibold"
          >
            Situação do frigorífico
          </label>
          <select
            id="company-status"
            name="isActive"
            defaultValue={String(record.isActive)}
            className={fieldClass}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
          <p className="mt-2 text-sm text-muted">
            Desativar impede o login de todos os acessos vinculados e preserva
            os cadastros e o histórico.
          </p>
        </div>
      )}
    </>
  );
}

export function AccessForm({
  action,
  access,
  prefix,
}: {
  action: (form: FormData) => Promise<void>;
  access?: { name: string; email: string; isActive: boolean };
  prefix: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div>
        <label
          htmlFor={`${prefix}-name`}
          className="block text-sm font-semibold"
        >
          Nome do responsável
        </label>
        <input
          id={`${prefix}-name`}
          name="name"
          required
          maxLength={160}
          defaultValue={access?.name}
          autoComplete="name"
          className={fieldClass}
        />
      </div>
      <div>
        <label
          htmlFor={`${prefix}-email`}
          className="block text-sm font-semibold"
        >
          E-mail de acesso
        </label>
        <input
          id={`${prefix}-email`}
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={access?.email}
          autoComplete="off"
          className={fieldClass}
        />
      </div>
      {access ? (
        <div>
          <label
            htmlFor={`${prefix}-status`}
            className="block text-sm font-semibold"
          >
            Situação do acesso
          </label>
          <select
            id={`${prefix}-status`}
            name="isActive"
            defaultValue={String(access.isActive)}
            className={fieldClass}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      ) : (
        <PasswordField id={`${prefix}-password`} initial />
      )}
      <SubmitButton>{access ? "Salvar acesso" : "Criar acesso"}</SubmitButton>
    </form>
  );
}

export function PasswordField({
  id,
  initial = false,
}: {
  id: string;
  initial?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {initial ? "Senha inicial" : "Nova senha"}
      </label>
      <input
        id={id}
        name="password"
        type="password"
        required
        minLength={12}
        maxLength={128}
        autoComplete="new-password"
        aria-describedby={`${id}-hint`}
        className={fieldClass}
      />
      <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
        Use de 12 a 128 caracteres. A senha não será exibida depois de salvar.
      </p>
    </div>
  );
}
