export default function Card() {
  return (
    <div className="bg-card text-card border border-card rounded-lg p-4 shadow-md max-w-sm">
      <h2 className="text-lg font-bold mb-2 text-primary">Example Card</h2>
      <p className="text-sub">
        This card uses Tailwind + CSS variable. Dark mode changes colors automatically.
      </p>
      <button className="mt-4 px-3 py-1 rounded bg-primary text-white">
        Action
      </button>
    </div>
  )
}
