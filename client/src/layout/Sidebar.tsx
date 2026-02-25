import NavMenu from "./navigation/NavMenu";

export default function Sidebar() {
  return (
    <header className="flex h-full flex-col bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">HydroLogistics</h1>
        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Servicio ERP
        </p>
      </div>

      <hr className="mb-4 border-gray-200" />

      <div className="flex-1 px-4">
        <NavMenu />
      </div>

      <div className="border-t p-4 text-center text-xs text-gray-400">
        v3.3.2
      </div>
    </header>
  );
}
