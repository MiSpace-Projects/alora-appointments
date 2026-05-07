"use client"

import Footer from "./components/footer/Footer";
import Navbar from "./components/navbar/Navbar"

function ClientLayout({children}:{children: React.ReactNode}){
    return(
        <>
            <Navbar/>
            <main>
                <div>{children}</div>
            </main>
            <Footer/>
        </>
    )
}

export default ClientLayout;