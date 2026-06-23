// Layout.jsx
import React from 'react'
import { Outlet, useLocation } from "react-router-dom"
import Header from '../Navbar/Navbar'
import FooterComponent from '../Footer/Footer'
import Chatbot from '../Chatbot/Chatbot'

function Layout() {
  const location = useLocation()

  // Check if current route is admin
  const isAdminRoute = location.pathname === "/admin"

  return (
    <>
      {/* Hide Navbar on Admin Route */}
      {!isAdminRoute && <Header />}

      <Outlet />

      {/* Optional: Hide Chatbot/Footer also on admin */}
      {!isAdminRoute && <Chatbot />}
      {!isAdminRoute && <FooterComponent />}
    </>
  )
}

export default Layout