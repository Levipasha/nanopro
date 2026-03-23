import React from "react";
import { getINDisplayDigits, toINFullPhone } from "../utils/indianPhone";
import "./PhoneINInput.css";

/**
 * Contact / mobile: fixed +91, user enters at most 10 digits.
 * `value` / `onChange` use full form e.g. +919876543210 (or partial +919876… while typing).
 */
export default function PhoneINInput({
  value,
  onChange,
  className = "",
  inputClassName = "",
  wrapClassName = "",
  disabled,
  autoFocus,
  id,
  name,
  "aria-label": ariaLabel,
  placeholder = "10-digit mobile",
  style
}) {
  const digits = getINDisplayDigits(value);

  function commitDigits(raw) {
    const next = String(raw ?? "")
      .replace(/\D/g, "")
      .slice(0, 10);
    const full = toINFullPhone(next);
    if (typeof onChange === "function") {
      onChange(full);
    }
  }

  return (
    <div className={`phone-in-input-wrap ${wrapClassName}`.trim()} style={style}>
      <span className="phone-in-prefix" aria-hidden="true">
        +91
      </span>
      <input
        id={id}
        name={name || "phone"}
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="tel"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`phone-in-field ${inputClassName}`.trim()}
        placeholder={placeholder}
        value={digits}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel || "Mobile number (10 digits after +91)"}
        onChange={(e) => commitDigits(e.currentTarget.value)}
      />
    </div>
  );
}
