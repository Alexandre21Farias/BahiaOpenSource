import React, { InputHTMLAttributes } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  rightElement,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? "input-error" : ""}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={`input-field ${rightElement ? "has-right-element" : ""}`}
          {...props}
        />
        {rightElement && (
          <span className="input-right-element">{rightElement}</span>
        )}
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
