'use client';

export default function BuilderOnboardingOverlay({ onDismiss }) {
  return (
    <div className="bld-onboarding" role="dialog" aria-modal="true" aria-labelledby="bld-onboarding-title">
      <button type="button" className="bld-onboarding__backdrop" aria-label="Dismiss tour" onClick={onDismiss} />
      <div className="bld-onboarding__card">
        <h2 id="bld-onboarding-title" className="bld-onboarding__title">
          Canvas quick tour
        </h2>
        <p className="bld-onboarding__lead">
          Hover sections, columns, and stacks to see layer labels. Drag blocks to reorder; drop zones highlight when
          valid.
        </p>
        <ul className="bld-onboarding__list">
          <li>Select a layer to edit content and styles in the right panel.</li>
          <li>Use the floating toolbar on each block for move, duplicate, and delete.</li>
          <li>Add sections from the canvas or the library on the left.</li>
        </ul>
        <div className="bld-onboarding__actions">
          <button type="button" className="bld-onboarding__btn bld-onboarding__btn--primary" onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
