import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Mesh from './components/Mesh.jsx'
import Work from './components/Work.jsx'
import Process from './components/Process.jsx'
import Experience from './components/Experience.jsx'
import Contact from './components/Contact.jsx'

export default function App() {
  return (
    <div className="grain relative">
      <Nav />
      <main>
        <Hero />
        <Mesh>
          <Work />
        </Mesh>
        <Process />
        <Experience />
      </main>
      <Contact />
    </div>
  )
}

