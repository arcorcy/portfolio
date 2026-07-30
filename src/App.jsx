import Cursor from './components/Cursor.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Work from './components/Work.jsx'
import Process from './components/Process.jsx'
import Testimonials from './components/Testimonials.jsx'
import Career from './components/Career.jsx'
import Story from './components/Story.jsx'
import OneMoreThing from './components/OneMoreThing.jsx'
import Contact from './components/Contact.jsx'

export default function App() {
  return (
    <div className="grain relative">
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Work />
        <Process />
        <Testimonials />
        <Career />
        <Story />
        <OneMoreThing />
      </main>
      <Contact />
    </div>
  )
}
