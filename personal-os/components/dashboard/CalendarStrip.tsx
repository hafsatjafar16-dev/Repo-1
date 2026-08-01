"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";

type CalendarEvent = { uid: string; summary: string; start: string; end: string };

export function CalendarStrip() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data: { events?: CalendarEvent[]; note?: string }) => {
        setEvents(data.events ?? []);
        setNote(data.note ?? null);
      });
  }, []);

  return (
    <Panel title="Calendar — next 14 days">
      {note && <p className="text-sm text-ink-2">{note}</p>}
      {!note && events.length === 0 && <p className="text-sm text-ink-2">No upcoming events.</p>}
      <ul className="space-y-2">
        {events.slice(0, 6).map((event) => (
          <li key={event.uid} className="flex justify-between text-sm">
            <span className="text-ink-0">{event.summary}</span>
            <span className="font-tabular text-xs text-ink-2">
              {new Date(event.start).toLocaleString(undefined, {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
