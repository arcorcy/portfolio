import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Headline, EASE } from '../lib/motion.jsx'
import { Dots, Draggable, Tip, bounds, useRefusalTip, useStack } from './Window.jsx'
import { experience } from '../data/experience.js'
import Placeholder from './Placeholder.jsx'

const { tabs, refusal } = experience

/* The three kinds split the run into three windows, each its own list, each its
   own small app: the employee years in a browser, the two schools in a Notes
   sidebar, the one freelance stint in a terminal. Nothing else reads `tabs`
   directly below this point. */
const workTabs = tabs.filter((tab) => tab.kind === 'work')
const schoolTabs = tabs.filter((tab) => tab.kind === 'school')
const freelanceTab = tabs.find((tab) => tab.kind === 'freelance')

/* Half the shot radius. A browser frame at this size wants a tighter corner than
   a card does, and it is the same halving the case study cover uses. */
const FRAME_RADIUS = 'rounded-[calc(var(--radius-shot))]'

/* ------------------------------------------------------------------
   Chrome shared by more than one kind of window
   ------------------------------------------------------------------ */

/* Every window shows the site's own icon. The page prefers the real mark once
   there is one, since a 16px favicon blown up is a soft square. Either way, no
   mark means the placeholder tile rather than a hole. */
function Mark({ tab, prefer = 'favicon', className = '' }) {
  const src = prefer === 'logo' ? (tab.logo ?? tab.favicon) : tab.favicon
  if (!src) return <Placeholder seed={tabs.indexOf(tab)} className={className} />
  return <img src={src} alt="" className={`${className} object-contain`} />
}

function Chevron({ dir }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={dir === 'prev' ? 'M10 3.5L5.5 8l4.5 4.5' : 'M6 3.5L10.5 8 6 12.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* The two arrows a browser puts left of its address bar, reused for Notes' own
   pair. length is the list being stepped, since Notes steps two and the browser
   steps four rather than the same seven every window used to share. dark is the
   terminal's palette, unused here since the terminal has nothing to step. */
function Steps({ length, active, onSelect, dark = false }) {
  const moves = [
    { dir: 'prev', to: active - 1, label: 'Previous' },
    { dir: 'next', to: active + 1, label: 'Next' },
  ]

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {moves.map((move) => {
        const dead = move.to < 0 || move.to > length - 1

        return (
          <button
            key={move.dir}
            type="button"
            onClick={() => onSelect(move.to)}
            disabled={dead}
            aria-label={move.label}
            data-cursor={dead ? 'hover' : 'link'}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300 ${
              dead
                ? dark
                  ? 'text-white/20'
                  : 'text-paper-deep'
                : dark
                  ? 'text-white/60 hover:bg-white/10 hover:text-white'
                  : 'text-mute hover:bg-paper hover:text-ink'
            }`}
          >
            <Chevron dir={move.dir} />
          </button>
        )
      })}
    </div>
  )
}

/* The reading measure inside every window: header, a period/missions row, a
   short paragraph, the testimonial where there is one. compact is what the two
   smaller windows and their smaller type ask for; line-clamp is the guarantee
   that a longer real paragraph, later, still cannot force a scrollbar the
   windows are built to never have. */
function Page({ tab, compact = false }) {
  return (
    <div className={compact ? 'px-4 py-4' : 'px-6 py-8 sm:px-10'}>
      <div className="flex items-center gap-3">
        <Mark
          tab={tab}
          prefer="logo"
          className={compact ? 'h-9 w-9 shrink-0 rounded-[8px]' : 'h-11 w-11 shrink-0 rounded-[10px]'}
        />
        <div className="min-w-0">
          <h3 className={compact ? 'truncate text-[0.95rem] font-bold' : 'display-sm truncate'}>
            {tab.place}
          </h3>
          <p className={compact ? 'truncate text-xs text-mute' : 'text-base text-mute'}>{tab.role}</p>
        </div>
      </div>

      <dl
        className={`flex flex-wrap border-y border-line ${
          compact ? 'mt-3 gap-x-6 gap-y-1 py-2 text-xs' : 'mt-6 gap-x-10 gap-y-4 py-4 text-sm'
        }`}
      >
        <div>
          <dt className="text-mute">Period</dt>
          <dd className="mt-0.5 font-bold">{tab.period}</dd>
        </div>
        <div>
          <dt className="text-mute">Missions</dt>
          <dd className="mt-0.5 font-bold">{tab.missions}</dd>
        </div>
      </dl>

      <p
        className={`text-ink/80 ${
          compact ? 'mt-3 line-clamp-3 text-sm leading-[1.5]' : 'mt-6 text-[1.0625rem] leading-[1.65]'
        }`}
      >
        {tab.description}
      </p>

      {tab.quote && (
        <figure className={`bg-paper ${FRAME_RADIUS} ${compact ? 'mt-3 p-3' : 'mt-6 p-6'}`}>
          <blockquote
            className={`text-ink/80 ${compact ? 'line-clamp-3 text-sm leading-[1.5]' : 'text-[1.0625rem] leading-[1.65]'}`}
          >
            {tab.quote.text}
          </blockquote>
          <figcaption className={`font-bold ${compact ? 'mt-2 text-xs' : 'mt-4 text-sm'}`}>
            {tab.quote.client}
            <span className="font-normal text-mute"> — {tab.place}</span>
          </figcaption>
        </figure>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
   The browser: the employee years, one tab each.
   ------------------------------------------------------------------ */
function Tabs({ active, onSelect }) {
  return (
    /* The strip does not scroll: the tabs share the width and their labels are cut
       instead, which is what a browser does. min-w-0 on the button is what lets
       flex shrink it past its text, and on the label is what lets truncate bite. */
    <div className="flex min-w-0 flex-1 gap-1">
      {workTabs.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === active ? 'page' : undefined}
          data-cursor="link"
          title={tab.place}
          className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-t-[8px] px-2.5 py-1.5 text-xs transition-colors duration-300 ${
            i === active ? 'bg-white text-ink' : 'text-mute hover:text-ink'
          }`}
        >
          <Mark tab={tab} className="h-3.5 w-3.5 shrink-0 rounded-[3px]" />
          <span className="min-w-0 truncate">{tab.place}</span>
        </button>
      ))}
    </div>
  )
}

function Bar({ tab, active, onSelect }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-white px-2.5 py-1.5">
      <Steps length={workTabs.length} active={active} onSelect={onSelect} />
      <p className="truncate text-xs text-mute">
        {tab.url ?? <span className="italic">url to fill in</span>}
      </p>
    </div>
  )
}

function BrowserFrame({ active, onSelect, tip }) {
  const tab = workTabs[active]

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-line bg-paper ${
        FRAME_RADIUS
      }`}
    >
      <div className="flex items-end gap-3 px-3 pt-2.5">
        <Dots onRefuse={tip.onRefuse} onRest={tip.onRest} />
        <Tabs active={active} onSelect={onSelect} />
      </div>

      <Bar tab={tab} active={active} onSelect={onSelect} />

      {/* No scrolling inside the window, and nothing to scroll to: a scroll
          container here swallows the wheel, and Page's line-clamp is what keeps
          the content itself from ever needing one. */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <Page tab={tab} compact />
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------
   The notes: the two schools, a note list rather than a tab strip.
   ------------------------------------------------------------------ */
function NotesFrame({ active, onSelect, tip }) {
  const tab = schoolTabs[active]

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-line bg-paper ${
        FRAME_RADIUS
      }`}
    >
      <div className="flex items-end gap-3 px-3 pt-2.5">
        <Dots onRefuse={tip.onRefuse} onRest={tip.onRest} />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 pb-1.5">
          <p className="truncate text-xs font-bold text-mute">Notes</p>
          <Steps length={schoolTabs.length} active={active} onSelect={onSelect} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ul className="w-28 shrink-0 overflow-hidden border-r border-line bg-paper-deep/25 py-1 sm:w-32">
          {schoolTabs.map((note, i) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                data-cursor="link"
                className={`block w-full px-2.5 py-2 text-left transition-colors duration-300 ${
                  i === active ? 'bg-white' : 'hover:bg-white/60'
                }`}
              >
                <p className="truncate text-xs font-bold text-ink">{note.place}</p>
                <p className="truncate text-[10px] text-mute">{note.role}</p>
              </button>
            </li>
          ))}
        </ul>
        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          <Page tab={tab} compact />
        </div>
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------
   The terminal: the one freelance run, nothing to step through.
   ------------------------------------------------------------------ */
function TerminalShell({ tab }) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden px-4 py-3 font-mono text-xs leading-[1.55] text-dim">
      <p className="text-white/40">$ whoami --role</p>
      <p className="mt-1 text-lime">
        {tab.role} <span className="text-white/40">@ {tab.place}</span>
      </p>

      <p className="mt-3 text-white/40">$ cat period.txt missions.txt</p>
      <p className="mt-1">{tab.period}</p>
      <p className="mt-1">{tab.missions}</p>

      <p className="mt-3 text-white/40">$ cat about.md</p>
      <p className="mt-1 line-clamp-4 text-white/80">{tab.description}</p>

      <p className="mt-3 text-lime">
        $ <span className="animate-pulse">▮</span>
      </p>
    </div>
  )
}

function TerminalFrame({ tip }) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-ink ${
        FRAME_RADIUS
      }`}
    >
      <div className="flex items-end gap-3 px-3 pt-2.5">
        <Dots onRefuse={tip.onRefuse} onRest={tip.onRest} />
        <p className="min-w-0 flex-1 truncate pb-1.5 text-xs font-bold text-white/60">zsh</p>
      </div>

      <TerminalShell tab={freelanceTab} />

    </div>
  )
}

/* ------------------------------------------------------------------
   Below lg, and whenever motion is turned down: seven small windows, one per
   experience, read in order.

   Three overlapping desktop windows are what a phone has no room for, and the
   whole point of the pinned version is a tab changing under a pointer that does
   not move, which a phone has neither of. So the same joke is told the way a
   phone can hear it: each experience gets its own window, and each imitates a
   different macOS app, picked in the data for what that experience actually
   holds rather than for variety.

   None of them is interactive. The three buttons are dead here, the tab strips
   and steppers are gone, and nothing drags: a window a thumb cannot do anything
   with should not invite the thumb.
   ------------------------------------------------------------------ */

/* The window: a title bar holding the three buttons and whatever the app puts
   beside them, then the app's own surface. Height comes from the content, and
   every paragraph inside is clamped, which is what keeps the tallest of them
   under the 600px a small window has to stay below. */
function Sheet({ head, dark = false, children }) {
  return (
    <div
      className={`overflow-hidden shadow-[0_18px_40px_-24px_rgba(1,1,2,0.28)] ${FRAME_RADIUS} ${
        dark ? 'border border-white/10 bg-ink' : 'border border-line bg-paper'
      }`}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Dots dark={dark} />
        {head}
      </div>
      {children}
    </div>
  )
}

/* The app's name in its own title bar, the way a Mac puts it there. */
function Label({ children, dark = false }) {
  return (
    <p
      className={`min-w-0 flex-1 truncate text-xs font-bold ${dark ? 'text-white/60' : 'text-mute'}`}
    >
      {children}
    </p>
  )
}

/* The white page under a light app's title bar. */
function Surface({ children }) {
  return <div className="bg-white px-4 py-4">{children}</div>
}

/* Mark, place and role: the one block every app needs, however it dresses it. */
function Ident({ tab, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Mark tab={tab} prefer="logo" className="h-9 w-9 shrink-0 rounded-[8px]" />
      <div className="min-w-0">
        <h3 className="truncate text-[0.95rem] font-bold">{tab.place}</h3>
        <p className="truncate text-xs text-mute">{tab.role}</p>
      </div>
    </div>
  )
}

function Facts({ tab, className = '' }) {
  return (
    <dl className={`flex flex-wrap gap-x-6 gap-y-1 border-y border-line py-2 text-xs ${className}`}>
      <div>
        <dt className="text-mute">Period</dt>
        <dd className="mt-0.5 font-bold">{tab.period}</dd>
      </div>
      <div>
        <dt className="text-mute">Missions</dt>
        <dd className="mt-0.5 font-bold">{tab.missions}</dd>
      </div>
    </dl>
  )
}

/* The clamp is the guarantee, not a nicety: the real paragraphs are still to be
   written and a long one would otherwise push a window past its height on its
   own. Each app passes the count that fits what else it is carrying. */
function Blurb({ tab, className = '' }) {
  return <p className={`text-sm leading-[1.55] text-ink/80 ${className}`}>{tab.description}</p>
}

/* Every app that carries a testimonial shows it the way that app would: a mail
   client puts a rule down the left of what it quotes, the others give it a
   panel of its own. */
function Quote({ tab, reply = false, className = '' }) {
  if (!tab.quote) return null

  return (
    <figure
      className={`${className} ${reply ? 'border-l-2 border-line pl-3' : `bg-paper p-3 ${FRAME_RADIUS}`}`}
    >
      <blockquote className="line-clamp-4 text-sm leading-[1.5] text-ink/80">
        {tab.quote.text}
      </blockquote>
      <figcaption className="mt-2 text-xs font-bold">
        {tab.quote.client}
        <span className="font-normal text-mute"> — {tab.place}</span>
      </figcaption>
    </figure>
  )
}

/* Notes, for the two schools, same as the desktop window gives them. A note is
   a date, a first line standing in for its own title, and the body: no sidebar
   here, since each school already has a window to itself. */
function NotesApp({ tab }) {
  return (
    <Sheet head={<Label>Notes</Label>}>
      <Surface>
        <p className="text-center text-[11px] text-mute">{tab.period}</p>
        <h3 className="mt-2 text-[0.95rem] font-bold">{tab.place}</h3>
        <p className="text-xs text-mute">{tab.role}</p>
        <Blurb tab={tab} className="mt-3 line-clamp-5" />
      </Surface>
    </Sheet>
  )
}

/* The terminal, for the one freelance run, again the same as on the desktop.
   TerminalShell's flex sizing is inert outside a flex column, so it simply
   takes the height of its own lines here. */
function TerminalApp({ tab }) {
  return (
    <Sheet dark head={<Label dark>zsh</Label>}>
      <TerminalShell tab={tab} />
    </Sheet>
  )
}

/* Safari, for the agency years: buttons and one URL pill on a single row, the
   way Safari does it rather than the tab strip the desktop browser has. */
function SafariApp({ tab }) {
  return (
    <Sheet
      head={
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
          <Mark tab={tab} className="h-3 w-3 shrink-0 rounded-[2px]" />
          <p className="min-w-0 truncate text-[11px] text-mute">
            {tab.url ?? <span className="italic">url to fill in</span>}
          </p>
        </div>
      }
    >
      <Surface>
        <Ident tab={tab} />
        <Facts tab={tab} className="mt-3" />
        <Blurb tab={tab} className="mt-3 line-clamp-5" />
      </Surface>
    </Sheet>
  )
}

/* Mail, for the one experience with a real testimonial. A message has a sender,
   a date and a subject, and a client's words quoted under it read as the reply
   they were: this is the app that fits its content, not a costume. */
function MailApp({ tab }) {
  return (
    <Sheet head={<Label>Inbox</Label>}>
      <Surface>
        <div className="flex items-center gap-3">
          <Mark tab={tab} prefer="logo" className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="truncate text-[0.95rem] font-bold">{tab.place}</h3>
              <p className="shrink-0 text-[11px] text-mute">{tab.period}</p>
            </div>
            <p className="truncate text-xs text-mute">{tab.role}</p>
          </div>
        </div>

        <p className="mt-3 border-t border-line pt-3 text-sm font-bold">{tab.missions}</p>
        <Blurb tab={tab} className="mt-1.5 line-clamp-4" />
        <Quote tab={tab} reply className="mt-3" />
      </Surface>
    </Sheet>
  )
}

/* Reminders, for the current job: the work as the list of what it involves,
   with the testimonial as the note under the list. */
function RemindersApp({ tab }) {
  return (
    <Sheet head={<Label>Reminders</Label>}>
      <Surface>
        <div className="flex items-center gap-3">
          <Mark tab={tab} prefer="logo" className="h-7 w-7 shrink-0 rounded-[6px]" />
          <h3 className="min-w-0 truncate text-[0.95rem] font-bold">{tab.place}</h3>
        </div>

        <ul className="mt-3 border-t border-line">
          {[tab.role, tab.period, tab.missions].map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 border-b border-line py-2 text-sm">
              <span className="h-4 w-4 shrink-0 rounded-full border border-paper-deep" />
              <span className="min-w-0 truncate">{item}</span>
            </li>
          ))}
        </ul>

        <Blurb tab={tab} className="mt-3 line-clamp-3" />
        <Quote tab={tab} className="mt-3" />
      </Surface>
    </Sheet>
  )
}

/* Contacts, for the last one: what is known about it is exactly a set of
   labelled fields, which is the card an address book already holds. */
function ContactsApp({ tab }) {
  return (
    <Sheet head={<Label>Contacts</Label>}>
      <Surface>
        <div className="flex flex-col items-center text-center">
          <Mark tab={tab} prefer="logo" className="h-14 w-14 rounded-full" />
          <h3 className="mt-2 text-[0.95rem] font-bold">{tab.place}</h3>
          <p className="text-xs text-mute">{tab.role}</p>
        </div>

        <dl className="mt-3 border-t border-line text-sm">
          {[
            ['Period', tab.period],
            ['Missions', tab.missions],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3 border-b border-line py-2">
              <dt className="w-16 shrink-0 text-right text-xs text-mute">{label}</dt>
              <dd className="min-w-0 flex-1 truncate">{value}</dd>
            </div>
          ))}
        </dl>

        <Blurb tab={tab} className="mt-3 line-clamp-3" />
        <Quote tab={tab} className="mt-3" />
      </Surface>
    </Sheet>
  )
}

const APPS = {
  notes: NotesApp,
  terminal: TerminalApp,
  safari: SafariApp,
  mail: MailApp,
  reminders: RemindersApp,
  contacts: ContactsApp,
}

/* No heading here: the section renders it once, above both layouts. It used to
   be repeated in this one, which put the title on screen twice on a phone. */
function Flat({ reduce }) {
  return (
    <div
      className={`relative z-10 mx-auto mt-12 flex w-full max-w-[30rem] flex-col gap-8 ${
        reduce ? '' : 'lg:hidden'
      }`}
    >
      {tabs.map((tab) => {
        const App = APPS[tab.app]

        return (
          <motion.article
            key={tab.id}
            initial={reduce ? undefined : { opacity: 0, y: 24 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <App tab={tab} />
          </motion.article>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function Experience() {
  const reduce = useReducedMotion()
  const field = useRef(null)
  const browserBox = useRef(null)
  const notesBox = useRef(null)
  const terminalBox = useRef(null)

  const [browserActive, setBrowserActive] = useState(0)
  const [notesActive, setNotesActive] = useState(0)
  /* The resting order: browser in front, terminal in the middle, notes at the
     back. Whichever one is picked up goes above the other two and stays there. */
  const { order, bringToFront } = useStack({ work: 30, freelance: 20, school: 10 })
  const [room, setRoom] = useState({})
  const tip = useRefusalTip()

  /* Percentages of the field for the centre of each window, pulled back by half
     its own fixed size to land there: the field's own size still decides how
     much room there is to drag in, but the arrangement itself does not depend
     on it. A little overlap between the three is deliberate, not a defect. */
  const windows = [
    {
      kind: 'work',
      ref: browserBox,
      // Front of the other two by default, and lower right: this is the one
      // the eye lands on first.
      left: '70%',
      top: '48%',
      width: '40.25rem',
      height: '34.5rem',
      render: () => <BrowserFrame active={browserActive} onSelect={setBrowserActive} tip={tip} />,
    },
    {
      kind: 'school',
      ref: notesBox,
      // Back of the stack by default, lower left.
      left: '24%',
      top: '42%',
      width: '33.5rem',
      height: '27.5rem',
      render: () => <NotesFrame active={notesActive} onSelect={setNotesActive} tip={tip} />,
    },
    {
      kind: 'freelance',
      ref: terminalBox,
      // Between the other two by default, upper centre.
      left: '46%',
      top: '25%',
      width: '34.5rem',
      height: '23rem',
      render: () => <TerminalFrame tip={tip} />,
    },
  ]

  /* Measured off the field, not the page: the field being resized by the
     viewport is what the observer catches, and the listener catches the
     frames a document that is not painting cannot deliver to it. */
  useEffect(() => {
    const f = field.current
    if (!f) return undefined

    function measure() {
      const next = {}
      windows.forEach((w) => {
        const el = w.ref.current
        if (el) next[w.kind] = bounds(f, el)
      })
      setRoom(next)
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(f)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section
      id="experience"
      /* overflow-x-clip and no justify-center, the same reasons Work's section
         has neither: a drag may overshoot the field on its elastic, and a
         flex-1 field would defeat justify-content before it ever ran, so the
         gap above the title is py-24 lg:py-16 doing the whole job on its own. */
      className="gutter relative flex min-h-svh flex-col overflow-x-clip py-24 lg:min-h-[112svh] lg:pb-16 lg:pt-32"
    >
      <Headline
        lines={experience.title}
        exit
        className="display-lg mx-auto w-full max-w-[1400px] text-center"
      />

      {/* The room the windows have. A flex item after the heading rather than a
          box pinned to the section: no window can be dragged over the title,
          with nothing measured and nothing to keep in step with a title that
          changes height. The negative margin lets it out of the gutter, landing
          its edges 1.5rem off the screen at any breakpoint. */}
      <div
        ref={field}
        className={`relative mx-[calc(1.5rem-var(--gutter))] mt-16 flex-1 ${
          reduce ? 'hidden' : 'hidden lg:block'
        }`}
      >
        {windows.map((spec) => (
          <Draggable
            key={spec.kind}
            innerRef={spec.ref}
            left={spec.left}
            top={spec.top}
            width={spec.width}
            height={spec.height}
            room={room[spec.kind]}
            zIndex={order[spec.kind]}
            onFront={() => bringToFront(spec.kind)}
          >
            {spec.render()}
          </Draggable>
        ))}

        <AnimatePresence>
          {tip.tip && <Tip tip={tip.tip}>{refusal}</Tip>}
        </AnimatePresence>
      </div>

      <Flat reduce={reduce} />

    </section>
  )
}
