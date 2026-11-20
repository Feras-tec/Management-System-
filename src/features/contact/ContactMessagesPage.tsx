import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { AccessTokenProvider } from "../../auth/auth";
import { useAppPreferences } from "../../context";
import { adminContactApi } from "./adminContactApi";

export function ContactMessagesPage({ token, sessionId }: { token: AccessTokenProvider; sessionId: string }) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["admin-contact", sessionId, "list", cursors.at(-1)],
    queryFn: ({ signal }) => adminContactApi.list(token, cursors.at(-1) ?? null, signal),
    retry: false,
    gcTime: 0,
  });
  const detail = useQuery({
    queryKey: ["admin-contact", sessionId, "detail", selected],
    queryFn: ({ signal }) => adminContactApi.detail(token, selected!, signal),
    enabled: selected !== null,
    retry: false,
    gcTime: 0,
  });
  const date = (value: string) => new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
  const errorText = (error: Error) => ["401", "403", "AUTH_REQUIRED"].includes(error.message)
    ? (de ? "Nur Administratoren haben Zugriff." : "Only administrators have access.")
    : (de ? "Nachrichten konnten nicht geladen werden." : "Could not load messages.");
  const next = list.data?.nextCursor;

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <h1 className="break-words text-2xl font-bold sm:text-4xl">{de ? "Kontaktanfragen" : "Contact messages"}</h1>
        <p className="mt-1 text-sm text-base-content/75">{de ? "Eingegangene Nachrichten aus dem Kontaktformular." : "Messages received through the contact form."}</p>
      </header>
      {list.isPending && <p role="status">{de ? "Nachrichten werden geladen…" : "Loading messages…"}</p>}
      {list.isError && <div role="alert" className="alert alert-error">{errorText(list.error)}</div>}
      {list.isError && <button type="button" className="btn btn-sm" onClick={() => { setSelected(null); setCursors([null]); if (cursors.length === 1) void list.refetch(); }}>{de ? "Erneut versuchen" : "Try again"}</button>}
      {list.isSuccess && list.data.items.length === 0 && <p className="alert">{de ? "Keine Kontaktanfragen vorhanden." : "No contact messages."}</p>}
      {list.isSuccess && list.data.items.length > 0 && (
        <ul className="space-y-3">
          {list.data.items.map(item => (
            <li key={item.id} className="min-w-0 rounded-xl border border-base-300 bg-base-100">
              <button
                type="button"
                className="flex w-full min-w-0 flex-col gap-1 rounded-xl p-4 text-left hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-row sm:items-center sm:justify-between"
                aria-expanded={selected === item.id}
                onClick={() => setSelected(current => current === item.id ? null : item.id)}
              >
                <span className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">{item.subject}</span>
                <time className="shrink-0 text-sm text-base-content/75" dateTime={item.createdAt}>{date(item.createdAt)}</time>
              </button>
              {selected === item.id && (
                <div className="space-y-4 border-t border-base-300 p-4 [overflow-wrap:anywhere]">
                  {detail.isPending && <p role="status">{de ? "Details werden geladen…" : "Loading details…"}</p>}
                  {detail.isError && <>
                    <p role="alert" className="alert alert-error">{errorText(detail.error)}</p>
                    <button type="button" className="btn btn-sm" onClick={() => void detail.refetch()}>{de ? "Erneut versuchen" : "Try again"}</button>
                  </>}
                  {detail.isSuccess && <>
                    <dl className="grid gap-3 text-sm sm:grid-cols-3">
                      <div><dt className="font-semibold">{de ? "Absender" : "Sender"}</dt><dd>{detail.data.name}</dd></div>
                      <div><dt className="font-semibold">{de ? "E-Mail" : "Email"}</dt><dd>{detail.data.email}</dd></div>
                      <div><dt className="font-semibold">{de ? "Telefon" : "Phone"}</dt><dd>{detail.data.phone ?? "—"}</dd></div>
                    </dl>
                    <p className="whitespace-pre-wrap">{detail.data.message}</p>
                  </>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {(cursors.length > 1 || next) && (
        <nav aria-label={de ? "Nachrichtenseiten" : "Message pages"} className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-sm" disabled={cursors.length === 1} onClick={() => { setSelected(null); setCursors(previous => previous.slice(0, -1)); }}>{de ? "Zurück" : "Previous"}</button>
          <span aria-live="polite">{de ? "Seite" : "Page"} {cursors.length}</span>
          <button type="button" className="btn btn-sm" disabled={!next || !list.isSuccess} onClick={() => { if (next) { setSelected(null); setCursors(previous => [...previous, next]); } }}>{de ? "Weiter" : "Next"}</button>
        </nav>
      )}
    </section>
  );
}

export default function ContactMessagesRoutePage() {
  const { auth } = useRouteContext({ from: "/admin" });
  const { sessionId } = useAuth();
  return auth.isSignedIn && sessionId
    ? <ContactMessagesPage key={sessionId} token={auth.getAccessToken} sessionId={sessionId} />
    : null;
}
