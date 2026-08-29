import { useEffect, useRef } from 'react';

// Desktop-only (hidden under 1024px via CSS) trailing dot + ring, the one
// polish detail pulled directly from the VerdexAI reference. Uses refs +
// requestAnimationFrame instead of React state so it never re-renders
// the component tree on every mouse move.
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    let targetX = 0;
    let targetY = 0;
    let ringX = 0;
    let ringY = 0;

    const handleMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
    };

    let frame;
    const animateRing = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      frame = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', handleMove);
    frame = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="l-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="l-cursor-ring" aria-hidden="true" />
    </>
  );
}