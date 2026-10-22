import { paths } from '../hooks/useHashRoute';
import { useI18n } from '../i18n';
import type { Activity } from '../types/customer';
import { Icon, type IconName } from './Icon';

const ICONS: Record<Activity['type'], IconName> = {
  created: 'plus',
  updated: 'edit',
  status: 'activity',
  note: 'note',
  deleted: 'trash',
};

export function ActivityItem({ activity, link = false }: { activity: Activity; link?: boolean }) {
  const { t, formatRelative, formatDate } = useI18n();
  const text = t(`activity.${activity.type}`, {
    name: activity.customerName,
    from: activity.from ? t(`status.${activity.from}`) : '',
    to: activity.to ? t(`status.${activity.to}`) : '',
  });

  return (
    <li className={`timeline__item timeline__item--${activity.type}`}>
      <span className="timeline__icon"><Icon name={ICONS[activity.type]} size={14} /></span>
      <div className="timeline__body">
        {link && activity.type !== 'deleted' ? (
          <a href={paths.customer(activity.customerId)} className="timeline__text">{text}</a>
        ) : (
          <span className="timeline__text">{text}</span>
        )}
        <time className="timeline__time" dateTime={activity.at} title={formatDate(activity.at, { dateStyle: 'medium', timeStyle: 'short' })}>
          {formatRelative(activity.at)}
        </time>
      </div>
    </li>
  );
}
