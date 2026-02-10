import NavMenu from "./navigation/NavMenu";

export default function Sidebar() {
  return (
    <header className="flex flex-col gap-4 rounded-md border-r border-r-gray-200 bg-white p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-500">HydroLogistics</h1>
        <p className="text-xs font-semibold text-gray-500">Servicio ERP</p>
      </div>

      <hr className="my-5 border-gray-300" />
      <NavMenu />
    </header>
  );
}
