import { AdminProvider } from './context/AdminContext.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';

import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { HeroBackground } from './components/HeroBackground.jsx';
import { Craft } from './components/Craft.jsx';
import { Showreel } from './components/Showreel.jsx';
import { Testimonials } from './components/Testimonials.jsx';
import { Packages } from './components/Packages.jsx';
import { Contact } from './components/Contact.jsx';
import { ModalRoot } from './components/modals/ModalRoot.jsx';

import { ScrollProgress } from './components/motion/ScrollProgress.jsx';
import { CursorGlow } from './components/motion/CursorGlow.jsx';
import { BigTitle } from './components/motion/BigTitle.jsx';

export default function App() {
  return (
    <AdminProvider>
      <PortfolioProvider>
        <ModalProvider>
          <ScrollProgress />
          <CursorGlow />
          <HeroBackground />
          <Header />

          <main>
            <Hero />
            <BigTitle scene={1} kicker="What I do" text="Craft" />
            <Craft />
            <BigTitle scene={2} kicker="Selected work" text="Showreel" />
            <Showreel />
            <BigTitle scene={3} kicker="What clients say" text="Reviews" />
            <Testimonials />
            <BigTitle scene={4} kicker="Work with me" text="Packages" />
            <Packages />
            <Contact />
          </main>

          <ModalRoot />
        </ModalProvider>
      </PortfolioProvider>
    </AdminProvider>
  );
}
