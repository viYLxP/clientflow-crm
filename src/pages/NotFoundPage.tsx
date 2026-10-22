import { EmptyState } from '../components/ui';
import { paths } from '../hooks/useHashRoute';
import { useI18n } from '../i18n';

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <EmptyState icon="alert" title={t('notFound.title')} body={t('notFound.body')}>
      <a className="btn btn--primary" href={paths.dashboard()}>{t('notFound.home')}</a>
    </EmptyState>
  );
}
