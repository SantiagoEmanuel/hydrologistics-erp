import { NavLink } from "react-router";

interface NavItem {
  name: string;
  url: string;
  icon?: React.ReactNode;
}

interface NavMenuProps {
  items: NavItem[];
  className?: string;
}

export default function NavMenu({ items, className = "" }: NavMenuProps) {
  return (
    <nav className={`flex flex-col gap-2 ${className}`}>
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-all duration-200 ${
              isActive
                ? "border-r-4 border-sky-500 bg-sky-100 text-sky-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            } `
          }
        >
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}
