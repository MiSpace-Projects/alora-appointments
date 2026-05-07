"use client"

import Footer from "./components/footer/Footer";
import Navbar from "./components/navbar/Navbar"
import Hero from "./components/hero/Hero"
import FloatingThemeToggle from "./components/FloatingThemeToggle"

function ClientLayout({children}:{children: React.ReactNode}){
    return(
        <>
            <Navbar/>
            <Hero/>
            <main>
                <div className="app-content">{children}</div>
            </main>
            <Footer/>
            <FloatingThemeToggle/>
        </>
    )
}

export default ClientLayout;