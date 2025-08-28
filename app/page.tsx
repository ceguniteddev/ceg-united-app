"use client";
import React, { useEffect } from "react";
import { Footer } from "react-day-picker";
import Landing from "./landing-page";
const Home = () => {
  return (
    <div className="nondashboard-layout">
      <main className="nondashboard-layout__main">
        <Landing />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
