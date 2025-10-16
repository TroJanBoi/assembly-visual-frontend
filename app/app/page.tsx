/* app/page.tsx */
import Image from "next/image";
import LandingNav from "@/components/layout/TopNav";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium
                     bg-white/70 dark:bg-slate-800/70 backdrop-blur">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="w-full">
        <LandingNav />
      {/* HERO */}
      <section className="relative bg-grid">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
                Learn Assembly easier <br className="hidden sm:block" />
                <span className="text-[var(--color-primary)]">with Nodes building games</span>
              </h1>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-prose">
                Build habits by solving tiny node-based puzzles that teach
                instruction flow and registers. Practice real Assembly in a playful way.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Chip>MOV</Chip>
                <Chip>ADD</Chip>
                <Chip>SUB</Chip>
                <Chip>JMP</Chip>
                <Chip>CMP</Chip>
              </div>
              <div className="mt-8 flex gap-3">
                <a href="/class" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white shadow hover:opacity-90">
                  Start learning
                </a>
                <a href="/bookmark" className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800">
                  Browse examples
                </a>
              </div>
            </div>

            {/* playful nodes mock */}
            <div className="relative">
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm backdrop-blur">
                <div className="text-sm font-mono text-gray-500 mb-2">; graph</div>
                <div className="flex flex-wrap gap-2">
                  <Chip>MOV AX, 1</Chip>
                  <Chip>ADD AX, BX</Chip>
                  <Chip>CMP AX, 10</Chip>
                  <Chip>JMP LT</Chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT ASSEMBLY */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm">
              <div className="font-mono text-xs text-gray-500 mb-3">code.asm</div>
              <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-sm overflow-auto">
{`section .text
global _start
_start:
  mov eax, 1
  add eax, 2
  cmp eax, 3
  je  done
  jmp _start
done:
  ; exit`}
              </pre>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">Title About the Assembly Language</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Learn registers, flags, flow control and memory addressing from the ground up.
                Our bite-sized lessons map 1:1 to the opcodes you’ll use in real code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT PLATFORM */}
      <section className="relative bg-grid">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold">Title about platform</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Drag nodes, wire data, and watch instructions execute step-by-step with
              register visualizers. Save, share, and remix puzzles with your class.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Chip>MOV</Chip>
              <Chip>ADD</Chip>
              <Chip>JNZ</Chip>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="grid grid-cols-3 gap-3">
              {/* ใช้รูปจริงของคุณแทน /images/... */}
              <Image src="/images/p1.jpg" width={400} height={400} alt="student" className="rounded-xl object-cover h-40 w-full" />
              <Image src="/images/p2.jpg" width={400} height={400} alt="teacher" className="rounded-xl object-cover h-40 w-full" />
              <Image src="/images/p3.jpg" width={400} height={400} alt="class" className="rounded-xl object-cover h-40 w-full" />
              <Image src="/images/p4.jpg" width={400} height={400} alt="lab" className="rounded-xl object-cover h-40 w-full col-span-2" />
              <Image src="/images/p5.jpg" width={400} height={400} alt="workshop" className="rounded-xl object-cover h-40 w-full" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">Who is this for?</h2>
              <ul className="mt-4 space-y-3 text-gray-600 dark:text-gray-400">
                <li>• New learners who want a gentle intro to low-level thinking</li>
                <li>• CS classrooms that need interactive labs and auto-graded tasks</li>
                <li>• Hobbyists who enjoy puzzle-based learning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GAMEPLAY / TIMELINE */}
      <section className="relative bg-gradient-to-b from-emerald-50/70 to-transparent dark:from-emerald-900/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center">Title show the game play</h2>

          <ol className="mt-10 relative grid gap-10 lg:gap-16">
            {/* Step 1 */}
            <li className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-5">
                <div className="mb-2 text-sm text-gray-500">interface</div>
                <div className="flex gap-2 flex-wrap">
                  <Chip>Drag Node</Chip>
                  <Chip>Connect</Chip>
                  <Chip>Run</Chip>
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <h3 className="font-medium text-lg">01</h3>
                Build your first graph by connecting instructions.
                See live register values while the program steps.
              </div>
            </li>

            {/* Step 2 */}
            <li className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1 text-gray-600 dark:text-gray-400">
                <h3 className="font-medium text-lg">02</h3>
                Solve puzzle goals (output values, cycles, or memory states). Earn stars for efficient solutions.
              </div>
              <div className="order-1 lg:order-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-5">
                <div className="mb-2 text-sm text-gray-500">goals</div>
                <div className="flex gap-2 flex-wrap">
                  <Chip>AX = 10</Chip>
                  <Chip>Steps &lt; 12</Chip>
                  <Chip>No branching</Chip>
                </div>
              </div>
            </li>

            {/* Step 3 */}
            <li className="grid gap-6 lg:grid-cols-2 lg:items-center">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-black text-white p-5">
                    <div className="mb-2 text-sm text-gray-400">terminal</div>
                    <pre className="text-sm">{`> run
                        AX: 10  BX: 0  ZF: 1
                        ✔ goal reached`}
                    </pre>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                    <h3 className="font-medium text-lg">03</h3>
                    Share your solution, compare approaches, and unlock tougher instruction sets.
                </div>
              
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
