import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  buttonType?:
    | "primary"
    | "secondary"
    | "action"
    | "danger"
    | "warning"
    | "submit";
  textAlign?: "center" | "left" | "right";
}

export default function Button({
  children,
  buttonType,
  className,
  onClick,
  onChange,
  onSubmit,
  onToggle,
  textAlign,
}: ButtonProps) {
  const handleButtonType = () => {
    switch (buttonType) {
      case "primary":
        return "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100";
      case "secondary":
        return "bg-transparent text-gray-600 hover:bg-gray-50 font-medium";
      case "action":
        return "bg-green-500 text-white hover:bg-green-700";
      case "danger":
        return "bg-red-500 text-white hover:bg-red-700";
      case "warning":
        return "bg-orange-500 text-white hover:bg-orange-700";
      case "submit":
        return "bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-70 shadow-lg shadow-blue-200 text-center active:scale-95";
    }
  };

  return (
    <button
      className={`w-full rounded-lg px-4 py-3 text-${textAlign} transition-all ${handleButtonType()} ${className}`}
      onClick={onClick}
      onChange={onChange}
      onSubmit={onSubmit}
      onToggle={onToggle}
    >
      {children}
    </button>
  );
}
