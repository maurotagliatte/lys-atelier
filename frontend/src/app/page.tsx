import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-light tracking-widest text-foreground">
            LYS ATELIER
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Area de Noivos
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Listas de Casamento
          </p>
          <h1 className="mt-4 text-4xl font-light leading-tight text-foreground sm:text-5xl md:text-6xl">
            Presentes que contam
            <br />
            <span className="italic" style={{ color: 'var(--primary)' }}>
              historias de amor
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Crie uma lista de casamento unica e personalizada. Partilhe com os
            seus convidados e receba presentes que realmente importam.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/admin"
              className="inline-flex h-12 items-center rounded-lg px-8 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Criar a minha lista
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex h-12 items-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Como funciona
            </Link>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section id="como-funciona" className="border-t border-border py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-light text-foreground sm:text-3xl">
            Como funciona
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Crie a sua lista',
                description:
                  'Registe-se e personalize a sua lista de casamento com o vosso estilo.',
              },
              {
                step: '02',
                title: 'Escolha os presentes',
                description:
                  'Adicione produtos e experiencias que deseja receber dos convidados.',
              },
              {
                step: '03',
                title: 'Partilhe o link',
                description:
                  'Envie o link personalizado e os convidados escolhem o presente perfeito.',
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <span
                  className="text-3xl font-light"
                  style={{ color: 'var(--primary)' }}
                >
                  {step}
                </span>
                <h3 className="mt-3 text-base font-medium text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Lys Atelier. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  )
}
