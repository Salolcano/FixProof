import type { CSSProperties } from "react";

// Hand-drawn strip: issue, fix, validators, ruling, payout. Each stroke draws itself in turn.
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function Pipeline() {
  return (
    <div className="pipe" role="img" aria-label="An issue becomes a fix, validators read both, a ruling is made, and the payout follows.">
      <svg viewBox="0 0 1000 250">
        <path className="stroke draw" pathLength={1} style={step(0)} d="M30 120c14-52 36 34 52-8s28-46 44-2 22 30 38-6" />
        <path className="stroke draw" pathLength={1} style={step(0)} d="M36 156h112M36 178h74" />
        <text className="hand-label" x="30" y="226">the issue</text>

        <path className="stroke draw" pathLength={1} style={step(1)} d="M178 128c26-12 36 8 58-4m-12-12 14 12-16 8" />

        <path className="stroke draw" pathLength={1} style={step(2)} d="M258 82l92 4-3 90-90-3z" />
        <path className="stroke draw" pathLength={1} style={step(2)} d="M278 112h52M278 132h36M278 152h48" />
        <text className="hand-label" x="262" y="226">the fix</text>

        <path className="stroke draw" pathLength={1} style={step(3)} d="M372 128c26-12 36 8 58-4m-12-12 14 12-16 8" />

        <path className="stroke draw" pathLength={1} style={step(4)} d="M470 120c-8-46 40-62 88-44s70 58 40 92-86 30-112 4-14-34-16-52z" />
        <g className="pop" style={step(4)}>
          <circle cx="520" cy="112" r="9" fill="#1c1b18" />
          <circle cx="556" cy="132" r="9" fill="#1c1b18" />
          <circle cx="526" cy="152" r="9" fill="#1c1b18" />
          <circle cx="498" cy="132" r="9" fill="#1c1b18" />
          <circle cx="570" cy="104" r="9" fill="#1c1b18" />
        </g>
        <text className="hand-label" x="476" y="226">validators read both</text>

        <path className="stroke draw" pathLength={1} style={step(5)} d="M634 128c26-12 36 8 58-4m-12-12 14 12-16 8" />

        <path className="stroke draw" pathLength={1} style={step(6)} d="M730 178l52-98 56 96z" />
        <path className="stroke draw" pathLength={1} style={step(6)} d="M768 138l14 14 26-30" />
        <text className="hand-label" x="738" y="226">one ruling</text>

        <path className="stroke draw red" pathLength={1} style={step(7)} d="M856 128c18-10 28 6 42-2m-10-10 12 10-14 7" />
        <g className="pop" style={step(7)}>
          <g className="spin">
            <path d="M944 88l8 28 28 8-28 8-8 28-8-28-28-8 28-8z" fill="#e8452c" />
          </g>
        </g>
        <text className="hand-label" x="912" y="226" style={{ fill: "#e8452c" }}>paid</text>
      </svg>
    </div>
  );
}
