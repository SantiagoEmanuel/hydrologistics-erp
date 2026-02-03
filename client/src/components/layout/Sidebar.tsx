import { navigationLinks } from "@/constants/navigation";
import NavMenu from "./navigation/NavMenu";

export default function Sidebar() {
  return (
    <header className="flex flex-col gap-4 rounded-md border-r border-r-gray-200 bg-white p-4">
      <h1 className="text-2xl font-bold text-gray-500">HydroLogistics</h1>
      <hr className="my-5 border-gray-300" />
      <NavMenu items={navigationLinks} />
    </header>
  );
}
