import Cursor from './components/Cursor.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Mesh from './components/Mesh.jsx'
import Work from './components/Work.jsx'
import Process from './components/Process.jsx'
import Journey from './components/Journey.jsx'
import Contact from './components/Contact.jsx'

export default function App() {
  return (
    <div className="grain relative">
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Mesh>
          <Work />
        </Mesh>
        <Process />
        <Journey />
      </main>
      <Contact />
    </div>
  )
}
