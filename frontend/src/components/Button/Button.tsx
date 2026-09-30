import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

function buttonClassName(variant: ButtonVariant, extra?: string) {
  return ["button", `button--${variant}`, extra].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", type = "button", className, ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}

type ButtonLinkProps = {
  to: string;
  variant?: ButtonVariant;
  children: ReactNode;
};

/** 화면 이동용 CTA. 의미상 Link이므로 <a>로 렌더링한다. */
export function ButtonLink({ to, variant = "primary", children }: ButtonLinkProps) {
  return (
    <Link to={to} className={buttonClassName(variant)}>
      {children}
    </Link>
  );
}
