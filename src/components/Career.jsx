import { Reveal } from '../lib/motion.jsx'
import { career, experience, education } from '../data/content.js'

function Row({ children, delay }) {
  return (
    <Reveal delay={delay} y={18}>
      <div className="grid gap-6 rounded-card border border-line bg-white p-8 sm:grid-cols-2">
        {children}
      </div>
    </Reveal>
  )
}

export default function Career() {
  return (
    <section id="experience" className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12">
      <div className="mx-auto flex w-full max-w-[50rem] flex-col gap-14">
        <div>
          <h2 className="display-md">{career.workTitle}</h2>
          <div className="mt-8 flex flex-col gap-4">
            {experience.map((item, i) => (
              <Row key={item.company} delay={i * 0.06}>
                <div className="flex flex-col gap-1">
                  <p className="text-[1.125rem] font-extrabold tracking-[-0.025em]">
                    {item.company}
                  </p>
                  <p className="text-sm font-semibold text-forest">{item.role}</p>
                  <p className="text-xs font-bold text-mute">{item.period}</p>
                </div>
                <p className="text-sm leading-[1.64] text-mute">{item.note}</p>
              </Row>
            ))}
          </div>
        </div>

        <div>
          <h2 className="display-md">{career.eduTitle}</h2>
          <div className="mt-8 flex flex-col gap-4">
            {education.map((item, i) => (
              <Row key={item.school} delay={i * 0.06}>
                <div className="flex flex-col gap-1">
                  <p className="text-[1.125rem] font-extrabold tracking-[-0.025em]">
                    {item.school}
                  </p>
                  <p className="text-sm text-mute">
                    {[item.degree, item.period].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Row>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
