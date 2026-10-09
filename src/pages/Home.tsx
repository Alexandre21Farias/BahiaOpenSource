import React from "react";
import "../components/Landing/Landing.css";
import Hero from "../components/Landing/Hero/Hero";
import About from "../components/Landing/About/About";
import Projects from "../components/Landing/Projects/Projects";
import Join from "../components/Landing/Join/Join";
import Footer from "../components/Landing/Footer/Footer";

export default function Home(): React.JSX.Element {
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
