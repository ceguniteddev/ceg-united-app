"use client";

/**
 * <AuthHero/>
 * -----------------------------------------------------------------
 * Left column of the auth page.
 * Marketing copy, value proposition, client proof, and platform guarantee.
 */
import Link from "next/link";
import { ShieldIcon } from "./Icons";

const testimonials = [
  {
    q: "CEG helped us secure $150K with zero dilution.",
    who: "Arjun P., SaaS Founder",
  },
  {
    q: "Finally, a platform that gets operators like us.",
    who: "Melissa R., E-commerce CEO",
  },
  {
    q: "From unknown to $300K in business credit.",
    who: "Daniel K., Agency Owner",
  },
];

export default function AuthHero() {
  return (
    <section className="hero reveal d1" aria-labelledby="ceg-headline">
      <Link href="/" className="brand" aria-label="CEG United home">
        <span className="brand-mark" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        CEG United
      </Link>

      <h1 id="ceg-headline">
        Get <span className="accent">funded</span>.<br />
        Not guessed.
      </h1>

      <p className="sub">
        Join operators using CEG to unlock <strong>$50K to $300K</strong> in
        business credit — with the exact bureaus, lenders, and steps that get
        you approved.
      </p>

      <div className="proof" aria-label="What clients say">
        {testimonials.map((t) => (
          <div className="card" key={t.who}>
            <div className="stars" aria-label="5 out of 5 stars">
              ★ ★ ★ ★ ★
            </div>
            <p className="quote">“{t.q}”</p>
            <div className="who">— {t.who}</div>
          </div>
        ))}
      </div>

      <div className="trust-row">
        <ShieldIcon /> 30-day platform guarantee · No hard credit pull.
      </div>
    </section>
  );
}
