import React from "react";
import "../components/Landing/Landing.css";
import Hero from "../components/Landing/Hero/Hero";
import About from "../components/Landing/About/About";
import Projects from "../components/Landing/Projects/Projects";
import Join from "../components/Landing/Join/Join";
import Footer from "../components/Landing/Footer/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { HomeApp } from "./HomeApp";

export default function Home(): React.JSX.Element {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // No celular, quem está logado vê a home do app; os demais veem a landing.
  if (isMobile && user) return <HomeApp />;

  return (
    <div className="home-page">
      <Hero />
      <About />
      <Projects />
      <Join />
      <Footer />
    </div>
  );
}
