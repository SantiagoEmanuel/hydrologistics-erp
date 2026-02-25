import { Edit2, MoreVertical, Trash2 } from "lucide-react";

export function MenuContainer({
  open,
  children,
  handleOpen,
}: {
  children: React.ReactNode;
  open: string | boolean;
  handleOpen: () => void;
}) {
  return (
    <>
      <div className="relative">{children}</div>
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => handleOpen()} />
      )}
    </>
  );
}

export function Menu({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="rounded-full p-1 transition-colors hover:bg-gray-200"
      onClick={onClick}
    >
      <MoreVertical size={20} className="text-gray-400" />
    </button>
  );
}

export function MenuItem({ menuItem }: { menuItem: [] }) {
  return (
    <div className="animate-in fade-in zoom-in-95 absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
      <button
        onClick={() => {}}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
      >
        <Edit2 size={16} /> Editar Datos
      </button>
      <button
        onClick={() => {}}
        className="flex w-full items-center gap-2 border-t border-gray-50 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} /> Eliminar
      </button>
    </div>
  );
}
