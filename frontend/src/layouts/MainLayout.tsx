import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function MainLayout() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0B0A09]">
      <Sidebar />

      <div
        style={{
          marginLeft: "280px",
          width: "calc(100% - 280px)",
          minWidth: 0,
        }}
        className="min-h-screen overflow-x-hidden"
      >
        <Navbar />

        <main
          style={{
            width: "100%",
            minWidth: 0,
          }}
          className="px-6 py-6 lg:px-7 lg:py-7"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;