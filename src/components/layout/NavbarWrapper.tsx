"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import GlobalTimer from "./GlobalTimer";

export default function NavbarWrapper() {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (isAuthPage) return null;

    return (
        <>
            <Navbar />
            <GlobalTimer />
        </>
    );
}
