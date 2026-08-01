import { NextResponse } from "next/server";
import ICAL from "ical.js";

type CalendarEvent = {
  uid: string;
  summary: string;
  start: string;
  end: string;
};

let cache: { events: CalendarEvent[]; fetchedAt: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

function expandEvents(icsText: string, windowDays: number): CalendarEvent[] {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const now = new Date();
  const windowStart = ICAL.Time.fromJSDate(now, false);
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
  const windowEndIcal = ICAL.Time.fromJSDate(windowEnd, false);

  const events: CalendarEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next: ICAL.Time | null;
      while ((next = iterator.next())) {
        if (next.compare(windowEndIcal) > 0) break;
        if (next.compare(windowStart) >= 0) {
          const duration = event.duration;
          const end = next.clone();
          end.addDuration(duration);
          events.push({
            uid: `${event.uid}-${next.toString()}`,
            summary: event.summary,
            start: next.toJSDate().toISOString(),
            end: end.toJSDate().toISOString(),
          });
        }
      }
    } else {
      const start = event.startDate.toJSDate();
      if (start >= now && start <= windowEnd) {
        events.push({
          uid: event.uid,
          summary: event.summary,
          start: start.toISOString(),
          end: event.endDate.toJSDate().toISOString(),
        });
      }
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}

export async function GET() {
  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!icalUrl) {
    return NextResponse.json(
      { events: [], note: "GOOGLE_CALENDAR_ICAL_URL not configured" },
      { headers: { "cache-control": "no-store" } }
    );
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json({ events: cache.events }, { headers: { "cache-control": "no-store" } });
  }

  const res = await fetch(icalUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "failed to fetch calendar" }, { status: 502 });
  }
  const icsText = await res.text();
  const events = expandEvents(icsText, 14);

  cache = { events, fetchedAt: Date.now() };
  return NextResponse.json({ events }, { headers: { "cache-control": "no-store" } });
}
