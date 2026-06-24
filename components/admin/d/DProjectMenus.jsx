'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { D_PROJECTS_PATH, dProjectMediaPath, dProjectMenusPath, dProjectPagesPath } from '@/lib/admin/dProjectRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-menus.css';

const LOCATIONS = ['HEADER', 'FOOTER'];

const EMPTY_ITEM_FORM = {
  label: '',
  url: '',
  pageId: '',
  target: '_self',
  sortOrder: '0',
  parentId: '',
};

function flattenItems(items, depth = 0, out = []) {
  for (const item of items || []) {
    out.push({ ...item, depth });
    if (item.children?.length) flattenItems(item.children, depth + 1, out);
  }
  return out;
}

function MenuLocationPanel({
  location,
  menu,
  pages,
  busy,
  onCreateMenu,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [form, setForm] = useState(EMPTY_ITEM_FORM);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_ITEM_FORM);

  const flatItems = useMemo(() => flattenItems(menu?.items || []), [menu]);
  const parentOptions = useMemo(
    () => flatItems.filter((item) => item.depth < 2),
    [flatItems]
  );

  const resetForm = () => {
    setForm(EMPTY_ITEM_FORM);
    setFormError('');
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!menu) return;
    setFormError('');
    try {
      await onAddItem(menu.id, {
        label: form.label,
        url: form.pageId ? '' : form.url,
        pageId: form.pageId || null,
        target: form.target,
        sortOrder: form.sortOrder,
        parentId: form.parentId || null,
      });
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      label: item.label,
      url: item.url || '',
      pageId: item.pageId ? String(item.pageId) : '',
      target: item.target || '_self',
      sortOrder: String(item.sortOrder ?? 0),
      parentId: item.parentId ? String(item.parentId) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_ITEM_FORM);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await onUpdateItem(editingId, {
        label: editForm.label,
        url: editForm.pageId ? '' : editForm.url,
        pageId: editForm.pageId || null,
        target: editForm.target,
        sortOrder: editForm.sortOrder,
        parentId: editForm.parentId || null,
      });
      cancelEdit();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const title = location === 'HEADER' ? 'Header menu' : 'Footer menu';

  return (
    <section className="proj-menus__panel" aria-labelledby={`menu-${location}`}>
      <div className="proj-menus__panel-head">
        <div>
          <h2 id={`menu-${location}`} className="proj-menus__panel-title">
            {title}
          </h2>
          <p className="proj-menus__panel-note">
            Injected into existing header/footer menu widgets on the live site.
          </p>
        </div>
        {!menu ? (
          <button
            type="button"
            className="proj-menus__btn proj-menus__btn--primary"
            disabled={busy}
            onClick={() => onCreateMenu(location)}
          >
            Create menu
          </button>
        ) : null}
      </div>

      {menu ? (
        <>
          <p className="proj-menus__item-meta">
            <strong>{menu.name}</strong> · {menu.items?.length || 0} top-level items
          </p>

          {formError ? (
            <p className="platform-alert platform-alert--error" role="alert">
              {formError}
            </p>
          ) : null}

          <form className="proj-menus__form" onSubmit={handleAdd}>
            <div className="proj-menus__form-row">
              <label className="proj-menus__field">
                <span className="proj-menus__field-label">Label</span>
                <input
                  className="proj-menus__input"
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  required
                  disabled={busy}
                />
              </label>
              <label className="proj-menus__field">
                <span className="proj-menus__field-label">Link to page</span>
                <select
                  className="proj-menus__select"
                  value={form.pageId}
                  onChange={(e) => setForm((prev) => ({ ...prev, pageId: e.target.value }))}
                  disabled={busy}
                >
                  <option value="">Custom URL</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title} ({page.slug})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!form.pageId ? (
              <label className="proj-menus__field">
                <span className="proj-menus__field-label">URL</span>
                <input
                  className="proj-menus__input"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="/about or https://…"
                  disabled={busy}
                />
              </label>
            ) : null}
            <div className="proj-menus__form-row">
              <label className="proj-menus__field">
                <span className="proj-menus__field-label">Parent</span>
                <select
                  className="proj-menus__select"
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                  disabled={busy}
                >
                  <option value="">Top level</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {'—'.repeat(item.depth)}
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="proj-menus__field">
                <span className="proj-menus__field-label">Target</span>
                <select
                  className="proj-menus__select"
                  value={form.target}
                  onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
                  disabled={busy}
                >
                  <option value="_self">Same tab</option>
                  <option value="_blank">New tab</option>
                </select>
              </label>
            </div>
            <button type="submit" className="proj-menus__btn proj-menus__btn--primary" disabled={busy}>
              Add item
            </button>
          </form>

          {!flatItems.length ? (
            <div className="proj-menus__empty">No menu items yet.</div>
          ) : (
            <ul className="proj-menus__items">
              {flatItems.map((item) => (
                <li
                  key={item.id}
                  className={`proj-menus__item${item.depth ? ' proj-menus__item--child' : ''}`}
                >
                  {editingId === item.id ? (
                    <div className="proj-menus__form">
                      <label className="proj-menus__field">
                        <span className="proj-menus__field-label">Label</span>
                        <input
                          className="proj-menus__input"
                          value={editForm.label}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, label: e.target.value }))}
                        />
                      </label>
                      <label className="proj-menus__field">
                        <span className="proj-menus__field-label">Page</span>
                        <select
                          className="proj-menus__select"
                          value={editForm.pageId}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, pageId: e.target.value }))}
                        >
                          <option value="">Custom URL</option>
                          {pages.map((page) => (
                            <option key={page.id} value={page.id}>
                              {page.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!editForm.pageId ? (
                        <label className="proj-menus__field">
                          <span className="proj-menus__field-label">URL</span>
                          <input
                            className="proj-menus__input"
                            value={editForm.url}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
                          />
                        </label>
                      ) : null}
                      <div className="proj-menus__item-actions">
                        <button type="button" className="proj-menus__btn proj-menus__btn--primary" onClick={saveEdit}>
                          Save
                        </button>
                        <button type="button" className="proj-menus__btn" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="proj-menus__item-main">
                      <span className="proj-menus__item-label">{item.label}</span>
                      <span className="proj-menus__item-meta">
                        {item.pageSlug ? `/${item.pageSlug}` : item.url || '#'}
                        {item.target === '_blank' ? ' · new tab' : ''}
                      </span>
                      <div className="proj-menus__item-actions">
                        <button type="button" className="proj-menus__btn" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="proj-menus__btn proj-menus__btn--danger"
                          disabled={busy}
                          onClick={() => onDeleteItem(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="proj-menus__empty">No {location.toLowerCase()} menu yet.</div>
      )}
    </section>
  );
}

export default function DProjectMenus({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const pid = String(projectId);
    setLoading(true);
    setError('');
    try {
      const [projectsRes, pagesRes, menusRes] = await Promise.all([
        fetch('/api/admin/projects', { cache: 'no-store' }),
        fetch(`/api/admin/projects/${pid}/pages`, { cache: 'no-store' }),
        fetch(`/api/admin/projects/${pid}/menus`, { cache: 'no-store' }),
      ]);
      const projectsData = await projectsRes.json().catch(() => ({}));
      const pagesData = await pagesRes.json().catch(() => ({}));
      const menusData = await menusRes.json().catch(() => ({}));
      if (!projectsRes.ok) throw new Error(projectsData?.error || 'Failed to load project');
      if (!pagesRes.ok) throw new Error(pagesData?.error || 'Failed to load pages');
      if (!menusRes.ok) throw new Error(menusData?.error || 'Failed to load menus');

      const found = (projectsData.projects || []).find((p) => String(p.id) === pid);
      if (!found) throw new Error('Project not found');
      setProject(found);
      setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
      setMenus(Array.isArray(menusData.menus) ? menusData.menus : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const menuByLocation = useMemo(() => {
    const map = { HEADER: null, FOOTER: null };
    for (const menu of menus) {
      if (!map[menu.location]) map[menu.location] = menu;
    }
    return map;
  }, [menus]);

  const reloadMenus = async () => {
    const res = await fetch(`/api/admin/projects/${projectId}/menus`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setMenus(Array.isArray(data.menus) ? data.menus : []);
  };

  const withBusy = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await reloadMenus();
    } finally {
      setBusy(false);
    }
  };

  const createMenu = async (location) => {
    await withBusy(async () => {
      const res = await fetch(`/api/admin/projects/${projectId}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: location === 'HEADER' ? 'Header Menu' : 'Footer Menu',
          location,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create menu');
    });
  };

  const addItem = async (menuId, payload) => {
    await withBusy(async () => {
      const res = await fetch(`/api/admin/menus/${menuId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to add menu item');
    });
  };

  const updateItem = async (itemId, payload) => {
    await withBusy(async () => {
      const res = await fetch(`/api/admin/menu-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update menu item');
    });
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    await withBusy(async () => {
      const res = await fetch(`/api/admin/menu-items/${itemId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete menu item');
    });
  };

  return (
    <div className="proj-menus">
      <div className="proj-menus__top">
        <Link className="project-new__back" href={D_PROJECTS_PATH}>
          ← All projects
        </Link>
      </div>

      {loading ? <p>Loading menus…</p> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && project ? (
        <>
          <header className="proj-menus__hero">
            <div>
              <p className="proj-menus__badge">Project · Menus</p>
              <h1 className="proj-menus__title">{project.name}</h1>
              <p className="proj-menus__sub">
                <code>{project.slug}</code>
              </p>
            </div>
            <nav className="proj-menus__nav" aria-label="Project sections">
              <Link className="proj-menus__nav-link" href={dProjectPagesPath(project.id)}>
                Pages
              </Link>
              <Link
                className="proj-menus__nav-link proj-menus__nav-link--active"
                href={dProjectMenusPath(project.id)}
                aria-current="page"
              >
                Menus
              </Link>
              <Link className="proj-menus__nav-link" href={dProjectMediaPath(project.id)}>
                Media
              </Link>
            </nav>
          </header>

          <div className="proj-menus__grid">
            {LOCATIONS.map((location) => (
              <MenuLocationPanel
                key={location}
                location={location}
                menu={menuByLocation[location]}
                pages={pages}
                busy={busy}
                onCreateMenu={createMenu}
                onAddItem={addItem}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
