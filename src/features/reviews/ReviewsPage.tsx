import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { Check, Mail, Star, X } from "lucide-react";
import { useAppPreferences } from "../../context";
import { reviewApi, type ReviewStatus } from "./api";

type Filter = ReviewStatus | "";

const statusStyles: Record<ReviewStatus, string> = {
  PENDING: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-error",
};

function statusLabel(status: ReviewStatus, de: boolean) {
  const labels: Record<ReviewStatus, [string, string]> = {
    PENDING: ["Ausstehend", "Pending"],
    APPROVED: ["Freigegeben", "Approved"],
    REJECTED: ["Abgelehnt", "Rejected"],
  };
  return labels[status][de ? 0 : 1];
}

function Stars({ rating, de }: { rating: number; de: boolean }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={
        de
          ? `Bewertung: ${rating} von 5 Sternen`
          : `Rating: ${rating} out of 5 stars`
      }
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            "size-4 " + (index < rating ? "fill-current text-warning" : "opacity-30")
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function errorLabel(code: string, de: boolean) {
  if (code === "FORBIDDEN") {
    return de
      ? "Nur Administratoren können Bewertungen moderieren."
      : "Only administrators can moderate reviews.";
  }
  if (code === "REVIEW_NOT_FOUND") {
    return de
      ? "Diese Bewertung wurde nicht gefunden."
      : "This review could not be found.";
  }
  return de
    ? "Bewertungen konnten nicht geladen werden."
    : "Reviews could not be loaded.";
}

export function ReviewsPage({
  token,
}: {
  token: () => Promise<string | null>;
}) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const limit = 12;
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filter ? { status: filter } : {}),
  }).toString();
  const reviews = useQuery({
    queryKey: ["admin-reviews", query],
    queryFn: () => reviewApi.adminList(token, query),
    retry: false,
  });
  const moderate = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
    }) => reviewApi.moderate(token, id, status),
    onSuccess: async () => {
      setActionError("");
      await qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      await qc.invalidateQueries({ queryKey: ["public", "reviews"] });
    },
    onError: (error: Error) => setActionError(errorLabel(error.message, de)),
  });
  const total = reviews.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-4xl">
            {de ? "Bewertungen" : "Reviews"}
          </h1>
          <p className="mt-1 text-sm opacity-65">
            {de
              ? "Kundenbewertungen prüfen, freigeben oder ablehnen."
              : "Review customer feedback and approve or reject it."}
          </p>
        </div>
        <span className="badge badge-outline whitespace-nowrap">
          {total} {de ? "Einträge" : "entries"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={de ? "Statusfilter" : "Status filter"}>
        {(
          [
            ["PENDING", de ? "Ausstehend" : "Pending"],
            ["APPROVED", de ? "Freigegeben" : "Approved"],
            ["REJECTED", de ? "Abgelehnt" : "Rejected"],
            ["", de ? "Alle" : "All"],
          ] as Array<[Filter, string]>
        ).map(([value, label]) => (
          <button
            key={value || "all"}
            type="button"
            className={
              "btn btn-sm " + (filter === value ? "btn-primary" : "btn-outline")
            }
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      {reviews.isPending && (
        <div className="flex justify-center p-10">
          <span
            className="loading loading-spinner loading-lg"
            role="status"
            aria-label={de ? "Bewertungen werden geladen" : "Loading reviews"}
          />
        </div>
      )}

      {reviews.isError && (
        <div className="alert alert-error" role="alert">
          {errorLabel(reviews.error.message, de)}
        </div>
      )}

      {reviews.data && reviews.data.items.length === 0 && (
        <div className="alert">
          {de
            ? "Keine Bewertungen für diesen Filter."
            : "No reviews match this filter."}
        </div>
      )}

      {reviews.data && reviews.data.items.length > 0 && (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {reviews.data.items.map((review) => (
            <article
              key={review.id}
              className="card min-w-0 border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold">
                      {review.customerName}
                    </h2>
                    <Stars rating={review.rating} de={de} />
                  </div>
                  <span
                    className={
                      "badge whitespace-nowrap " + statusStyles[review.status]
                    }
                  >
                    {statusLabel(review.status, de)}
                  </span>
                </div>
                <blockquote className="break-words text-sm leading-6">
                  {review.message}
                </blockquote>
                {review.email && (
                  <p className="flex min-w-0 items-center gap-2 text-xs opacity-65">
                    <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="break-all">{review.email}</span>
                    <span className="badge badge-ghost badge-xs shrink-0">
                      {de ? "Privat" : "Private"}
                    </span>
                  </p>
                )}
                <p className="text-xs opacity-60">
                  {new Intl.DateTimeFormat(de ? "de-DE" : "en-IE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(review.createdAt))}
                </p>
                <div className="card-actions flex-wrap gap-2">
                  {review.status !== "APPROVED" && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={moderate.isPending}
                      onClick={() =>
                        moderate.mutate({ id: review.id, status: "APPROVED" })
                      }
                    >
                      <Check className="size-4" aria-hidden="true" />
                      {de ? "Freigeben" : "Approve"}
                    </button>
                  )}
                  {review.status !== "REJECTED" && (
                    <button
                      type="button"
                      className="btn btn-error btn-sm"
                      disabled={moderate.isPending}
                      onClick={() =>
                        moderate.mutate({ id: review.id, status: "REJECTED" })
                      }
                    >
                      <X className="size-4" aria-hidden="true" />
                      {de ? "Ablehnen" : "Reject"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-sm"
          disabled={page === 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          {de ? "Zurück" : "Previous"}
        </button>
        <span className="text-sm">
          {page} / {pages}
        </span>
        <button
          type="button"
          className="btn btn-sm"
          disabled={page >= pages}
          onClick={() => setPage((value) => value + 1)}
        >
          {de ? "Weiter" : "Next"}
        </button>
      </div>
    </section>
  );
}

export default function ReviewsRoutePage() {
  const { auth } = useRouteContext({ from: "/admin" });
  return <ReviewsPage token={auth.getAccessToken} />;
}
