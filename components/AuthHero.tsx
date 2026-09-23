"use client";

/**
 * <AuthHero/>
 * -----------------------------------------------------------------
 * Left column of the auth page.
 * Marketing copy, value proposition, client proof (grid on desktop, fixed carousel on mobile), and platform guarantee.
 */
import { useEffect, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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

      {/* Desktop View: 3-column grid */}
      <div className="proof proof-desktop" aria-label="What clients say">
        {testimonials.map((t) => (
          <div className="proof-card" key={t.who}>
            <div className="stars" aria-label="5 out of 5 stars">
              ★ ★ ★ ★ ★
            </div>
            <p className="quote">“{t.q}”</p>
            <div className="who">— {t.who}</div>
          </div>
        ))}
      </div>

      {/* Mobile View: Fixed-height Carousel Stack */}
      <div className="proof-carousel" aria-label="Client testimonials carousel">
        <div className="proof-carousel-track">
          {testimonials.map((t, idx) => (
            <div
              className={`proof-card proof-slide ${idx === activeIndex ? "active" : ""}`}
              key={t.who}
              aria-hidden={idx !== activeIndex}
            >
              <div className="stars" aria-label="5 out of 5 stars">
                ★ ★ ★ ★ ★
              </div>
              <p className="quote">“{t.q}”</p>
              <div className="who">— {t.who}</div>
            </div>
          ))}
        </div>
        <div
          className="carousel-dots"
          role="tablist"
          aria-label="Testimonial slides"
        >
          {testimonials.map((t, idx) => (
            <button
              key={t.who}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Go to testimonial ${idx + 1}`}
              className={`carousel-dot ${idx === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      </div>

      <div className="trust-row">
        <ShieldIcon /> 30-day platform guarantee · No hard credit pull.
      </div>
    </section>
  );
}
