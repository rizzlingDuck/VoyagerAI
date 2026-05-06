import { useState, useEffect } from "react";

export default function TypewriterHeading({ text1, text2 }) {
  const [rendered1, setRendered1] = useState("");
  const [rendered2, setRendered2] = useState("");
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setRendered1(text1.slice(0, index + 1));
      index++;
      if (index === text1.length) { clearInterval(interval); setPhase(2); }
    }, 55);
    return () => clearInterval(interval);
  }, [text1]);

  useEffect(() => {
    if (phase === 2) {
      let index = 0;
      const interval = setInterval(() => {
        setRendered2(text2.slice(0, index + 1));
        index++;
        if (index === text2.length) { clearInterval(interval); setPhase(3); }
      }, 55);
      return () => clearInterval(interval);
    }
  }, [phase, text2]);

  return (
    <>
      <span className="gradient-text">{rendered1}</span>
      {phase === 1 && <span className="inline-block w-[3px] h-[0.85em] bg-[var(--primary)] animate-pulse ml-0.5 align-bottom rounded-full" />}
      <br className="hidden md:block"/>
      {rendered2}
      {phase === 2 && <span className="inline-block w-[3px] h-[0.85em] bg-[var(--primary)] animate-pulse ml-0.5 align-bottom rounded-full" />}
    </>
  );
}
