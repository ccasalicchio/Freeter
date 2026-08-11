import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import * as styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useState } from 'react';
import { CalendarEvent } from '@/widgets/calendar/state';
import clsx from 'clsx';

const dataKey = 'events';
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function WidgetComp(props: WidgetReactComponentProps<Settings>) {
  const {dataStorage} = props.widgetApi;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [nextEventId, setNextEventId] = useState(1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const persistEvents = useCallback(async (evts: CalendarEvent[], nextId: number) => {
    setEvents(evts);
    setNextEventId(nextId);
    await dataStorage.setJson(dataKey, { events: evts, nextEventId: nextId });
  }, [dataStorage]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getJson(dataKey) as { events: CalendarEvent[]; nextEventId: number } | undefined;
      if (loaded && Array.isArray(loaded.events)) {
        setEvents(loaded.events);
        setNextEventId(loaded.nextEventId);
      }
    })();
  }, [dataStorage]);

  const prevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
  }, []);

  const handleAddEvent = useCallback(() => {
    if (!selectedDate) {
      return;
    }
    const title = prompt('Event title:');
    if (!title) {
      return;
    }
    const desc = prompt('Description (optional):') || '';
    const newEvent: CalendarEvent = {
      id: nextEventId,
      title,
      date: selectedDate,
      description: desc,
    };
    persistEvents([...events, newEvent], nextEventId + 1);
  }, [selectedDate, events, nextEventId, persistEvents]);

  const handleDeleteEvent = useCallback((eventId: number) => {
    persistEvents(events.filter(e => e.id !== eventId), nextEventId);
  }, [events, nextEventId, persistEvents]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const days: { date: string; day: number; isOtherMonth: boolean }[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, day: d, isOtherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, day: d, isOtherMonth: false });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isOtherMonth: true });
    }
  }

  const selectedDateEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <div className={styles['viewport']}>
      <div className={styles['month-header']}>
        <div className={styles['month-nav']}>
          <Button onClick={prevMonth} caption="◀" size="S" />
        </div>
        <div className={styles['month-title']}>{monthNames[currentMonth]} {currentYear}</div>
        <div className={styles['month-nav']}>
          <Button onClick={nextMonth} caption="▶" size="S" />
        </div>
      </div>
      <div className={styles['weekday-row']}>
        {weekdays.map(wd => <div key={wd} className={styles['weekday']}>{wd}</div>)}
      </div>
      <div className={styles['days-grid']}>
        {days.map((d, i) => {
          const dayEvents = events.filter(e => e.date === d.date);
          return (
            <div
              key={i}
              className={clsx(styles['day-cell'], d.isOtherMonth && styles['other-month'], d.date === todayStr && !d.isOtherMonth && styles['today'])}
              onClick={() => handleDayClick(d.date)}
            >
              <div className={styles['day-number']}>{d.day}</div>
              {dayEvents.slice(0, 3).map(e => (
                <div key={e.id} className={styles['day-event']} title={e.title}>{e.title}</div>
              ))}
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <div className={styles['event-detail']}>
          <div className={styles['event-detail-title']}>{selectedDate}</div>
          {selectedDateEvents.length === 0 && (
            <div className={styles['event-detail-desc']}>No events</div>
          )}
          {selectedDateEvents.map(e => (
            <div key={e.id}>
              <div className={styles['event-detail-title']}>{e.title}</div>
              {e.description && <div className={styles['event-detail-desc']}>{e.description}</div>}
              <div className={styles['event-detail-actions']}>
                <Button onClick={() => handleDeleteEvent(e.id)} caption="Delete" size="S" />
              </div>
            </div>
          ))}
          <div className={styles['event-detail-actions']} style={{marginTop: 4}}>
            <Button onClick={handleAddEvent} caption="Add Event" size="S" />
          </div>
        </div>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
