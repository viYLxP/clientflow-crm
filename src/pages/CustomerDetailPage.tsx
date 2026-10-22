import { useMemo, useState, type FormEvent } from 'react';
import { ActivityItem } from '../components/ActivityItem';
import { Icon } from '../components/Icon';
import { ConfirmDialog, EmptyState, Ltr, StatusBadge, StatusSelect } from '../components/ui';
import { navigate, paths } from '../hooks/useHashRoute';
import { useI18n, type TranslationKey } from '../i18n';
import { LIMITS, validateNote } from '../lib/validation';
import { initials } from '../lib/text';
import { useCrm } from '../store/CrmContext';
import { useToast } from '../store/ToastContext';
import type { Customer, Note } from '../types/customer';

function NoteEditor({
  id,
  label,
  initial = '',
  submitLabel,
  onSubmit,
  onCancel,
}: {
  id: string;
  label: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (body: string) => void;
  onCancel?: () => void;
}) {
  const { t, formatNumber } = useI18n();
  const [body, setBody] = useState(initial);
  const [error, setError] = useState<TranslationKey | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateNote(body);
    setError(problem);
    if (problem) return;
    onSubmit(body);
    setBody('');
  };

  return (
    <form className="note-editor" onSubmit={submit} noValidate>
      <label htmlFor={id} className="field__label">{label}</label>
      <textarea
        id={id}
        className="input textarea"
        rows={3}
        value={body}
        placeholder={t('detail.notePlaceholder')}
        onChange={(e) => {
          setBody(e.target.value);
          if (error) setError(validateNote(e.target.value));
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`}
        autoFocus={Boolean(onCancel)}
      />
      <div className="note-editor__footer">
        <span id={`${id}-count`} className={`field__hint${body.trim().length > LIMITS.note ? ' text-danger' : ''}`}>
          <bdi dir="ltr">{t('detail.charCount', { count: formatNumber(body.trim().length), max: formatNumber(LIMITS.note) })}</bdi>
        </span>
        <div className="note-editor__actions">
          {onCancel && <button type="button" className="btn btn--secondary btn--sm" onClick={onCancel}>{t('common.cancel')}</button>}
          <button type="submit" className="btn btn--primary btn--sm">{submitLabel}</button>
        </div>
      </div>
      {error && <p id={`${id}-error`} className="field__error"><Icon name="alert" size={14} /> {t(error)}</p>}
    </form>
  );
}

function NoteItem({ customer, note, onDelete }: { customer: Customer; note: Note; onDelete: (note: Note) => void }) {
  const { t, formatDate } = useI18n();
  const { updateNote } = useCrm();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="note">
        <NoteEditor
          id={`note-edit-${note.id}`}
          label={t('detail.editNote')}
          initial={note.body}
          submitLabel={t('detail.saveNote')}
          onSubmit={(body) => {
            updateNote(customer.id, note.id, body);
            notify('success', 'toast.noteUpdated');
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="note" data-testid="note">
      <p className="note__body">{note.body}</p>
      <div className="note__footer">
        <time dateTime={note.createdAt} className="muted">
          {formatDate(note.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
          {note.updatedAt && ` · ${t('detail.noteEdited')}`}
        </time>
        <div className="note__actions">
          <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label={t('detail.editNote')} title={t('detail.editNote')}>
            <Icon name="edit" size={16} />
          </button>
          <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(note)} aria-label={t('detail.deleteNote')} title={t('detail.deleteNote')}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function CustomerDetailPage({ id }: { id: string }) {
  const { t, formatCurrency, formatDate, formatNumber } = useI18n();
  const { getCustomer, activity, setStatus, deleteCustomer, addNote, deleteNote } = useCrm();
  const { notify } = useToast();
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const customer = getCustomer(id);
  const history = useMemo(() => activity.filter((a) => a.customerId === id).slice(0, 15), [activity, id]);

  if (!customer) {
    return (
      <EmptyState icon="users" title={t('detail.notFound.title')} body={t('detail.notFound.body')}>
        <a className="btn btn--secondary" href={paths.customers()}>
          <Icon name="arrowBack" /> {t('detail.backToList')}
        </a>
      </EmptyState>
    );
  }

  const notProvided = <span className="muted">{t('common.notProvided')}</span>;

  return (
    <>
      <a className="back-link" href={paths.customers()}>
        <Icon name="arrowBack" size={16} /> {t('detail.backToList')}
      </a>

      <header className="profile card">
        <span className="avatar avatar--lg" aria-hidden="true">{initials(customer.name)}</span>
        <div className="profile__main">
          <h1 id="page-title" tabIndex={-1}>{customer.name}</h1>
          <p className="profile__meta">
            {customer.company && <span><Icon name="building" size={14} /> {customer.company}</span>}
            <StatusBadge status={customer.status} />
          </p>
          <p className="muted small">
            {t('detail.created', { date: formatDate(customer.createdAt) })} · {t('detail.updated', { date: formatDate(customer.updatedAt) })}
          </p>
        </div>
        <div className="profile__actions">
          <StatusSelect
            id="detail-status"
            value={customer.status}
            label={t('status.changeFor', { name: customer.name })}
            onChange={(status) => {
              setStatus(customer.id, status);
              notify('success', 'toast.statusChanged', { name: customer.name, status: { key: `status.${status}` } });
            }}
          />
          <a className="btn btn--secondary" href={paths.customerEdit(customer.id)}>
            <Icon name="edit" /> {t('common.edit')}
          </a>
          <button type="button" className="btn btn--danger-outline" onClick={() => setConfirmDeleteCustomer(true)}>
            <Icon name="trash" /> {t('common.delete')}
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <section className="card" aria-labelledby="contact-title">
          <h2 id="contact-title" className="card__title">{t('detail.contactInfo')}</h2>
          <dl className="details">
            <div><dt><Icon name="mail" size={16} /> {t('field.email')}</dt>
              <dd>{customer.email ? <a href={`mailto:${customer.email}`}><Ltr>{customer.email}</Ltr></a> : notProvided}</dd></div>
            <div><dt><Icon name="phone" size={16} /> {t('field.phone')}</dt>
              <dd>{customer.phone ? <a href={`tel:${customer.phone}`}><Ltr>{customer.phone}</Ltr></a> : notProvided}</dd></div>
            <div><dt><Icon name="pin" size={16} /> {t('field.city')}</dt><dd>{customer.city || notProvided}</dd></div>
            <div><dt><Icon name="building" size={16} /> {t('field.company')}</dt><dd>{customer.company || notProvided}</dd></div>
            <div><dt><Icon name="wallet" size={16} /> {t('field.value')}</dt><dd>{formatCurrency(customer.value)}</dd></div>
          </dl>
        </section>

        <section className="card detail-grid__notes" aria-labelledby="notes-title">
          <div className="card__header">
            <h2 id="notes-title" className="card__title">{t('detail.notes')}</h2>
            <span className="muted small">{t('detail.notesCount', { count: formatNumber(customer.notes.length) })}</span>
          </div>
          <NoteEditor
            id="new-note"
            label={t('detail.addNoteLabel')}
            submitLabel={t('detail.addNote')}
            onSubmit={(body) => {
              addNote(customer.id, body);
              notify('success', 'toast.noteAdded');
            }}
          />
          {customer.notes.length === 0 ? (
            <p className="muted notes-empty">{t('detail.noNotes')}</p>
          ) : (
            <ul className="notes">
              {customer.notes.map((note) => (
                <NoteItem key={note.id} customer={customer} note={note} onDelete={setNoteToDelete} />
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="history-title">
          <h2 id="history-title" className="card__title">{t('detail.activity')}</h2>
          {history.length === 0 ? (
            <p className="muted">{t('dashboard.noActivity')}</p>
          ) : (
            <ul className="timeline">{history.map((a) => <ActivityItem key={a.id} activity={a} />)}</ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDeleteCustomer}
        title={t('confirm.deleteCustomer.title')}
        body={t('confirm.deleteCustomer.body', { name: customer.name })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          deleteCustomer(customer.id);
          notify('success', 'toast.customerDeleted', { name: customer.name });
          setConfirmDeleteCustomer(false);
          navigate(paths.customers());
        }}
        onCancel={() => setConfirmDeleteCustomer(false)}
      />
      <ConfirmDialog
        open={noteToDelete !== null}
        title={t('confirm.deleteNote.title')}
        body={t('confirm.deleteNote.body')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (noteToDelete) deleteNote(customer.id, noteToDelete.id);
          notify('success', 'toast.noteDeleted');
          setNoteToDelete(null);
        }}
        onCancel={() => setNoteToDelete(null)}
      />
    </>
  );
}
