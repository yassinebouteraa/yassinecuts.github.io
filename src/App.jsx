import { AdminProvider } from './context/AdminContext.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';

import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { Showreel } from './components/Showreel.jsx';
import { Testimonials } from './components/Testimonials.jsx';
import { Packages } from './components/Packages.jsx';
import { Contact } from './components/Contact.jsx';
import { ModalRoot } from './components/modals/ModalRoot.jsx';

import { ScrollProgress } from './components/motion/ScrollProgress.jsx';
import { CursorGlow } from './components/motion/CursorGlow.jsx';

export default function App() {
  return (
    <AdminProvider>
      <PortfolioProvider>
        <ModalProvider>
          <ScrollProgress />
          <CursorGlow />
          <Header />

          <main>
            <Hero />
            <Showreel />
            <Testimonials />
            <Packages />
            <Contact />
          </main>

          <ModalRoot />
        </ModalProvider>
      </PortfolioProvider>
    </AdminProvider>
  );
}
