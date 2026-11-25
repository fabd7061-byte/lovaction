import { useId } from "react";
import { AlertCircle } from "lucide-react";

function FieldWrap({ label, htmlFor, error, hint, required, dark, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className={dark ? "label-dark" : "label"}>
          {label}
          {required && <span className="ml-0.5 text-crimson">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className={`mt-1.5 text-[11px] ${dark ? "text-white/35" : "text-ink/40"}`}>{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-crimson">
          <AlertCircle size={12} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  label,
  error,
  hint,
  required,
  dark,
  className = "",
  id,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrap
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      dark={dark}
      className={className}
    >
      <input
        id={inputId}
        className={`${dark ? "input-dark" : "input"} ${
          error ? "border-crimson/60 focus:border-crimson" : ""
        }`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldWrap>
  );
}

export function Textarea({
  label,
  error,
  hint,
  required,
  dark,
  className = "",
  rows = 4,
  id,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrap
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      dark={dark}
      className={className}
    >
      <textarea
        id={inputId}
        rows={rows}
        className={`${dark ? "input-dark" : "input"} resize-y ${
          error ? "border-crimson/60 focus:border-crimson" : ""
        }`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldWrap>
  );
}

export function Select({
  label,
  error,
  hint,
  required,
  dark,
  className = "",
  children,
  id,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrap
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      dark={dark}
      className={className}
    >
      <select
        id={inputId}
        className={`${dark ? "input-dark" : "input"} appearance-none pr-10 ${
          error ? "border-crimson/60 focus:border-crimson" : ""
        }`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </FieldWrap>
  );
}

export { FieldWrap };
