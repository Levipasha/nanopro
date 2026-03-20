import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import nanoProfileVideo from '../../nano profile.mp4';
import digitalIdVideo from '../../digital id scan and check my info.mp4';
import corporateVideo from '../../Blue and White Corporate Entrepreneurs\' Day Your Story (1).mp4';

export default function HomeGallery() {
    const galleryRef = useRef(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const galleryEl = galleryRef.current;
        if (!galleryEl) return;

        const spacing = 0.1;
        const snap = gsap.utils.snap(spacing);
        const cards = gsap.utils.toArray('.cards li', galleryEl);
        if (!cards.length) return;

        const buildSeamlessLoop = (items, itemSpacing) => {
            const overlap = Math.ceil(1 / itemSpacing);
            const startTime = items.length * itemSpacing + 0.5;
            const loopTime = (items.length + overlap) * itemSpacing + 1;
            const rawSequence = gsap.timeline({ paused: true });

            const loop = gsap.timeline({
                paused: true,
                repeat: -1,
                onRepeat() {
                    this._time === this._dur && (this._tTime += this._dur - 0.01);
                }
            });

            const l = items.length + overlap * 2;
            let time = 0;

            gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

            for (let i = 0; i < l; i++) {
                const index = i % items.length;
                const item = items[index];
                time = i * itemSpacing;

                rawSequence
                    .fromTo(
                        item,
                        { scale: 0, opacity: 0 },
                        {
                            scale: 1,
                            opacity: 1,
                            zIndex: 100,
                            duration: 0.5,
                            yoyo: true,
                            repeat: 1,
                            ease: 'power1.in',
                            immediateRender: false
                        },
                        time
                    )
                    .fromTo(
                        item,
                        { xPercent: 400 },
                        { xPercent: -400, duration: 1, ease: 'none', immediateRender: false },
                        time
                    );

                i <= items.length && loop.add('label' + i, time);
            }

            rawSequence.time(startTime);

            loop
                .to(rawSequence, {
                    time: loopTime,
                    duration: loopTime - startTime,
                    ease: 'none'
                })
                .fromTo(
                    rawSequence,
                    { time: overlap * itemSpacing + 1 },
                    {
                        time: startTime,
                        duration: startTime - (overlap * itemSpacing + 1),
                        immediateRender: false,
                        ease: 'none'
                    }
                );

            return loop;
        };

        const seamlessLoop = buildSeamlessLoop(cards, spacing);
        const loopDuration = seamlessLoop.duration();

        const scrub = gsap.to(seamlessLoop, {
            totalTime: 0,
            duration: 0.5,
            ease: 'power3',
            paused: true
        });

        const trigger = ScrollTrigger.create({
            trigger: galleryEl,
            start: 'top top',
            end: '+=600',
            pin: true,
            onUpdate(self) {
                scrub.vars.totalTime = snap(self.progress * loopDuration);
                scrub.invalidate().restart();
            }
        });

        const scrubTo = (totalTime) => {
            const wrapped = ((totalTime % loopDuration) + loopDuration) % loopDuration;
            const progress = wrapped / loopDuration;
            trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
        };

        const nextBtn = galleryEl.querySelector('.next');
        const prevBtn = galleryEl.querySelector('.prev');

        const onNext = () => scrubTo(scrub.vars.totalTime + spacing);
        const onPrev = () => scrubTo(scrub.vars.totalTime - spacing);

        nextBtn?.addEventListener('click', onNext);
        prevBtn?.addEventListener('click', onPrev);

        return () => {
            nextBtn?.removeEventListener('click', onNext);
            prevBtn?.removeEventListener('click', onPrev);
            trigger.kill();
            scrub.kill();
            seamlessLoop.kill();
        };
    }, []);

    return (
        <section className="gallery page-section" ref={galleryRef}>
            <ul className="cards">
                <li><video src={nanoProfileVideo} muted autoPlay loop playsInline /></li>
                <li><video src={digitalIdVideo} muted autoPlay loop playsInline /></li>
                <li><video src={corporateVideo} muted autoPlay loop playsInline /></li>
                <li><video src={nanoProfileVideo} muted autoPlay loop playsInline /></li>
                <li><video src={digitalIdVideo} muted autoPlay loop playsInline /></li>
                <li><video src={corporateVideo} muted autoPlay loop playsInline /></li>
            </ul>
        </section>
    );
}

