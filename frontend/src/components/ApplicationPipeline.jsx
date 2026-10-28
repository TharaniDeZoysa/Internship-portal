const STEPS = ["Applied", "Under Review", "Shortlisted", "Interview", "Offered"];

// Visual progress bar for an application. Rejected/Withdrawn stop the pipeline.
export default function ApplicationPipeline({ status }) {
  const ended = status === "Rejected" || status === "Withdrawn";
  const current = ended ? -1 : STEPS.indexOf(status);

  return (
    <ol className={`pipeline ${ended ? "ended" : ""}`} aria-label={`Status: ${status}`}>
      {STEPS.map((step, index) => (
        <li
          key={step}
          className={index <= current ? "done" : ""}
          aria-current={index === current ? "step" : undefined}
        >
          <span className="pipeline-dot" />
          <span className="pipeline-label">{step}</span>
        </li>
      ))}
    </ol>
  );
}
