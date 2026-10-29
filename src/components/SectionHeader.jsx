export default function SectionHeader({
  label,
  titleLead,
  titleAccent,
  theme = 'dark',
  rightNote = null,
  align = 'left',
}) {
  return (
    <div className={`section-header is-${theme} align-${align}`}>
      <div className="section-header-top">
        <div className="eyebrow-label">
          <span className="eyebrow-line" aria-hidden="true" />
          <span>{label}</span>
        </div>
        {rightNote && <div className="section-header-note">{rightNote}</div>}
      </div>
      {titleLead || titleAccent ? (
        <h2 className="big-heading">
          {titleLead && <span>{titleLead} </span>}
          {titleAccent && <em className="heading-accent">{titleAccent}</em>}
        </h2>
      ) : null}
    </div>
  );
}

