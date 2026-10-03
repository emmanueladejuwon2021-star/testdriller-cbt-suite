export default function QuestionGrid({ questions, answers, flags, index, onJump, filter }) {
  const visible = questions.map((q, i) => ({ q, i })).filter(({ q }) => filter === "ALL" || q.subjectCode === filter);
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {visible.map(({ q, i }) => {
        const answered = answers[q.id];
        const flagged = flags[q.id];
        const current = i === index;
        let cls = "bg-ink text-slate-300 border-line";
        if (answered) cls = "bg-emerald/80 text-ink border-emerald";
        if (flagged && !answered) cls = "bg-amberx/80 text-ink border-amberx";
        if (flagged && answered) cls = "bg-amberx text-ink border-amberx";
        if (current) cls += " ring-2 ring-white";
        return (
          <button key={q.id} onClick={() => onJump(i)} className={`h-9 rounded border text-xs font-semibold ${cls}`}>
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
