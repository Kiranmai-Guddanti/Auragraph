/**
 * Notebook persistence via localStorage — used as fallback when backend is offline.
 * All functions mirror the backend API shape so DashboardPage/NotebookWorkspace
 * can swap transparently.
 */

const KEY = 'ag_notebooks';

function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(notebooks) {
    localStorage.setItem(KEY, JSON.stringify(notebooks));
}

export function ls_getNotebooks(userId) {
    return load().filter(nb => !userId || nb.user_id === userId);
}

export function ls_getNotebook(id) {
    return load().find(nb => nb.id === id) || null;
}

export function ls_createNotebook(userId, name, course) {
    const notebooks = load();
    const nb = {
        id: Math.random().toString(36).slice(2) + Date.now(),
        user_id: userId,
        name,
        course,
        note: '',
        proficiency: 'Intermediate',
        graph: { nodes: [], edges: [] },
        note_versions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    notebooks.unshift(nb);
    save(notebooks);
    return nb;
}

export function ls_saveNote(id, note, proficiency) {
    const notebooks = load();
    const nb = notebooks.find(n => n.id === id);
    if (nb) {
        nb.note = note;
        if (proficiency) nb.proficiency = proficiency;
        nb.updated_at = new Date().toISOString();
        save(notebooks);
        return nb;
    }
    return null;
}

export function ls_addNoteVersion(id, note, proficiency, reason = 'mutation', maxVersions = 10) {
    const notebooks = load();
    const nb = notebooks.find(n => n.id === id);
    if (!nb) return null;
    const versions = Array.isArray(nb.note_versions) ? nb.note_versions : [];
    const entry = {
        id: Math.random().toString(36).slice(2) + Date.now(),
        note: note || '',
        proficiency: proficiency || nb.proficiency || 'Practitioner',
        reason,
        created_at: new Date().toISOString(),
    };
    nb.note_versions = [entry, ...versions].slice(0, Math.max(5, Math.min(10, maxVersions || 10)));
    save(notebooks);
    return entry;
}

export function ls_getNoteVersions(id, limit = 10) {
    const nb = ls_getNotebook(id);
    if (!nb) return [];
    const versions = Array.isArray(nb.note_versions) ? nb.note_versions : [];
    return versions.slice(0, limit);
}

export function ls_restoreNoteVersion(id, versionId) {
    const notebooks = load();
    const nb = notebooks.find(n => n.id === id);
    if (!nb) return null;
    const versions = Array.isArray(nb.note_versions) ? nb.note_versions : [];
    const v = versions.find(x => x.id === versionId);
    if (!v) return null;
    nb.note = v.note || '';
    nb.proficiency = v.proficiency || nb.proficiency;
    nb.updated_at = new Date().toISOString();
    save(notebooks);
    return nb;
}

export function ls_deleteNotebook(id) {
    save(load().filter(nb => nb.id !== id));
}
