import Link from "next/link";
import Image from "next/image";

/**
 * Home hero banner. Presentational, server-rendered.
 *
 * Full-bleed image (edge to edge); the copy is constrained to the site's
 * `max-w-6xl` grid so it lines up with the sections below instead of hugging
 * the viewport edge on wide screens. The cover keeps the model and product on
 * the right, so the copy sits over the light left third — a cream scrim fades
 * out before ~60% to hold text contrast without washing out the subject.
 * The image uses `priority` (it is the LCP element) and is not faded in.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[440px] overflow-hidden md:min-h-[560px]">
      <Image
        src="/cover3.png"
        alt="Modelo con pulsera de plata 925"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Cream scrim: opaque on the left for contrast, transparent before the
          centered subject so the bracelet stays crisp. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/80 via-30% to-transparent to-[55%]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-4">
        <div className="flex max-w-md flex-col items-start gap-5">
          <h1
            style={{ fontFamily: "var(--font-serif)" }}
            className="text-5xl font-light tracking-[0.12em] text-[var(--color-text)] md:text-6xl"
          >
            Luna Valen
          </h1>
          <p className="max-w-xs text-base tracking-wide text-[var(--color-muted)] md:text-lg">
            Joyas de plata 925, diseño minimalista
          </p>
          <Link
            href="/productos"
            className="press focus-ring mt-2 inline-block bg-[var(--color-primary)] px-8 py-3 text-sm tracking-widest text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
