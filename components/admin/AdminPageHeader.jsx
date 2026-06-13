export default function AdminPageHeader({ badge, title, description, actions }) {
  return (
    <header className="admin-page__header">
      <div className="admin-page__header-main">
        {badge ? <p className="admin-page__badge">{badge}</p> : null}
        {title ? <h2 className="admin-page__title">{title}</h2> : null}
        {description ? <p className="admin-page__description">{description}</p> : null}
      </div>
      {actions ? <div className="admin-page__header-actions">{actions}</div> : null}
    </header>
  );
}
