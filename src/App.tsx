import { useRef } from "react";
import { useInView } from "framer-motion";
import Nav from "./components/Nav";
import AssemblyBackdrop from "./components/AssemblyBackdrop";
import Hero from "./components/Hero";
import ProofBar from "./components/ProofBar";
import Mission from "./components/Mission";
import Products from "./components/Products";
import Why from "./components/Why";
import About from "./components/About";
import Roadmap from "./components/Roadmap";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

export default function App() {
  const pageEndRef = useRef<HTMLDivElement | null>(null);
  const showDeckBanner = useInView(pageEndRef, { amount: "some" });

  return (
    <>
      <Nav />
      <AssemblyBackdrop />
      <main>
        <Hero />
        <ProofBar />
        <Mission />
        <Products />
        <Why />
        <About />
        <Roadmap />
        <Testimonials />
        <Contact />
      </main>
      <Footer showDeckBanner={showDeckBanner} />
      <div
        ref={pageEndRef}
        aria-hidden="true"
        style={{ height: 1, pointerEvents: "none" }}
      />

      <Chatbot />
    </>
  );
}
