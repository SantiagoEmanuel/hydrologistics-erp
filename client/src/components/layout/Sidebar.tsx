import { navigationLinks } from "@/constants/navigation";
import { useState } from "react";
import CloseShiftModal from "../CloseShiftModal";
import NavMenu from "./navigation/NavMenu";

export default function Sidebar() {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  return (
    <header className="flex flex-col gap-4 rounded-md border-r border-r-gray-200 bg-white p-4">
      <h1 className="text-2xl font-bold text-gray-500">HydroLogistics</h1>
      <hr className="my-5 border-gray-300" />
      {isCloseModalOpen && (
        <CloseShiftModal onClose={() => setIsCloseModalOpen(false)} />
      )}
      <button
        className="rounded-md border border-orange-300 bg-orange-500 px-2 py-2 text-left text-white transition-colors hover:bg-orange-300"
        onClick={() => setIsCloseModalOpen(true)}
      >
        Cerrar Caja
      </button>
      <NavMenu items={navigationLinks} />
    </header>
  );
}
