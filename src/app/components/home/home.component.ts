import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponen implements AfterViewInit, OnDestroy {
  private ctx!: gsap.Context;

  features = [
    { title: '12 Locations', desc: 'Classes across Dublin wide coverage.', icon: 'bi-geo-alt-fill', color: '#FD6585' },
    { title: 'Pro Instructors', desc: 'Garda vetted, professionally trained.', icon: 'bi-person-check-fill', color: '#8EC5FC' },
    { title: 'Huge Variety', desc: 'Bollywood, Kathak, Hip‑Hop & more.', icon: 'bi-music-note-list', color: '#f7e8ad' },
    { title: 'Great Value', desc: 'Affordable lessons with special offers.', icon: 'bi-cash-coin', color: '#10b981' },
    { title: 'Dance Styles', desc: 'From Classical Foundations to Commercial.', icon: 'bi-vinyl', color: '#FFD3A5' },
    { title: 'Join Our Crew', desc: 'Follow us for community updates.', icon: 'bi-instagram', color: '#f09433' }
  ];

  social = {
    instagram: 'https://www.instagram.com/dbdsireland/?hl=en',
    facebook: 'https://www.facebook.com/BharatanatyamDanceClassIreland'
  };

  danceStyles = ['Bollywood', 'Kathak', 'Bharatanatyam', 'Hip Hop', 'Western', 'Free Style', 'Kuthu', 'Semi Classical'];

  ngAfterViewInit() {
    // Add brief timeout to guarantee DOM is settled and variables are ready
    setTimeout(() => {
      this.initScrollAnimations();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }

  private initScrollAnimations() {
  this.ctx = gsap.context(() => {
    const cards = gsap.utils.toArray('.card') as HTMLElement[];
    const spanX = this.getSpan();

    const configs = [
      { x: -spanX, y: -60,  rotate: -12, scale: 0.8 },
      { x: spanX,  y: -120, rotate: 14,  scale: 0.9 },
      { x: -spanX, y: -40,  rotate: 8,   scale: 0.85 },
      { x: spanX,  y: -90,  rotate: -6,  scale: 1 },
      { x: -spanX, y: -150, rotate: -15, scale: 0.75 },
      { x: spanX,  y: 30,   rotate: 10,  scale: 0.9 }
    ];

    cards.forEach((card, i) => {
      const cfg = configs[i] || { x: spanX, y: 0, rotate: 0, scale: 1 };

      gsap.from(card, {
        x: cfg.x,
        y: cfg.y,
        rotation: cfg.rotate,
        scale: cfg.scale,
        opacity: 0,
        scrollTrigger: {
          trigger: '.sticker-section',
          start: 'top bottom',        // ← start earlier
          end: 'bottom center',
          scrub: 0.8,
          // markers: true,           // uncomment to debug
        }
      });
    });

    // Refined micro-interactions with softer stagger
    gsap.from('.card__avatar', {
      scale: 0.3,
      stagger: 0.06,
      scrollTrigger: {
        trigger: '.sticker-section',
        start: 'top bottom',
        end: 'center center',
        scrub: 0.5
      }
    });

    gsap.from('.card__company span', {
      opacity: 0,
      x: -10,
      stagger: 0.06,
      scrollTrigger: {
        trigger: '.sticker-section',
        start: 'top bottom',
        end: 'center center',
        scrub: 0.5
      }
    });

    // Add a gentle fade-in for the hero when page loads (no scroll needed)
    gsap.from('.hero-content', {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.3
    });
  });
}
  getCardModifier(index: number): string {
    const modifiers = ['one', 'three', 'two', 'six', 'five', 'four'];
    return modifiers[index % modifiers.length];
  }

  private getSpan(): number {
    return Math.max(350, window.innerWidth * 0.6);
  }
}