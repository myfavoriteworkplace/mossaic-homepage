import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import ProofBar from "./components/ProofBar";
import Products from "./components/Products";
import Why from "./components/Why";
import Founder from "./components/Founder";
import Roadmap from "./components/Roadmap";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Toast from "./components/ui/Toast";

export default function App() {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProofBar />
        <Products />
        <Why />
        <Founder />
        <Roadmap />
        <Testimonials />
        <Contact onSubmitted={showToast} />
      </main>
      <Footer />

      <AnimatePresence>
        {toast && <Toast key={toast.id} message={toast.message} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}
