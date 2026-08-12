import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { useAppPreferences } from "../../context";
import { salesApi, type PaymentMethod, type Sale, type SaleBody } from "./api";
import { formatEurMinor } from "../../utils/currency";
const formSchema = z.object({
  customerId: z.string(),
  bookingId: z.string(),
  discountEuros: z.string().refine((v) => Number(v) >= 0),
});
type Row = {
  type: "PRODUCT" | "SERVICE";
  refId: string;
  quantity: string;
  overrideEuros: string;
};
export const toMinor = (v: string) => Math.round(Number(v) * 100);
function errorLabel(code: string, de: boolean) {
  const labels: Record<string, [string, string]> = {
    INSUFFICIENT_STOCK: ["Nicht genügend Bestand.", "Insufficient stock."],
    PRODUCT_INACTIVE: ["Produkt ist inaktiv.", "Product is inactive."],
    INVALID_SALE_STATE: ["Ungültiger Verkaufsstatus.", "Invalid sale state."],
    PRODUCT_PRICE_REQUIRED: [
      "Produkt ist noch nicht bepreist.",
      "Product is not priced yet.",
    ],
    PAYMENT_EXCEEDS_REMAINING: [
      "Zahlung übersteigt den offenen Betrag.",
      "Payment exceeds the remaining amount.",
    ],
    PAID_SALE_CANNOT_BE_CANCELLED: [
      "Bezahlte Verkäufe benötigen zuerst eine manuelle Erstattung.",
      "Paid sales require a manual refund first.",
    ],
  };
  return labels[code]?.[de ? 0 : 1] ?? code;
}
function statusLabel(value: string, de: boolean) {
  const labels: Record<string, [string, string]> = {
    DRAFT: ["Entwurf", "Draft"],
    COMPLETED: ["Abgeschlossen", "Completed"],
    CANCELLED: ["Storniert", "Cancelled"],
    UNPAID: ["Unbezahlt", "Unpaid"],
    PARTIALLY_PAID: ["Teilbezahlt", "Partially paid"],
    PAID: ["Bezahlt", "Paid"],
  };
  return labels[value]?.[de ? 0 : 1] ?? value;
}
function SaleForm({
  sale,
  onClose,
  token,
}: {
  sale: Sale | null;
  onClose: () => void;
  token: () => Promise<string | null>;
}) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>(
    sale?.items.map((i) => ({
      type: i.type,
      refId: (i.productId ?? i.serviceId)!,
      quantity: String(i.quantity),
      overrideEuros: i.type === "SERVICE" ? String(i.unitPriceMinor / 100) : "",
    })) ?? [{ type: "PRODUCT", refId: "", quantity: "1", overrideEuros: "" }],
  );
  const [error, setError] = useState("");
  const products = useQuery({
    queryKey: ["sale-options-products"],
    queryFn: () => salesApi.products(token),
  });
  const services = useQuery({
    queryKey: ["sale-options-services"],
    queryFn: () => salesApi.services(token),
  });
  const customers = useQuery({
    queryKey: ["sale-options-customers"],
    queryFn: () => salesApi.customers(token),
  });
  const bookings = useQuery({
    queryKey: ["sale-options-bookings"],
    queryFn: () => salesApi.bookings(token),
  });
  const form = useForm({
    defaultValues: {
      customerId: sale?.customerId ?? "",
      bookingId: sale?.bookingId ?? "",
      discountEuros: String((sale?.discountMinor ?? 0) / 100),
    },
    onSubmit: async ({ value }) => {
      const parsed = formSchema.safeParse(value);
      if (
        !parsed.success ||
        rows.some(
          (r) =>
            !r.refId ||
            !Number.isInteger(Number(r.quantity)) ||
            Number(r.quantity) <= 0,
        )
      ) {
        setError(
          de
            ? "Bitte prüfen Sie alle Felder und Positionen."
            : "Please check all fields and items.",
        );
        return;
      }
      const body: SaleBody = {
        customerId: value.customerId || null,
        bookingId: value.bookingId || null,
        discountMinor: toMinor(value.discountEuros),
        items: rows.map((r) =>
          r.type === "PRODUCT"
            ? {
                type: "PRODUCT",
                productId: r.refId,
                quantity: Number(r.quantity),
              }
            : {
                type: "SERVICE",
                serviceId: r.refId,
                quantity: Number(r.quantity),
                ...(r.overrideEuros
                  ? { unitPriceOverrideMinor: toMinor(r.overrideEuros) }
                  : {}),
              },
        ),
      };
      try {
        if (sale) await salesApi.update(token, sale.id, body);
        else await salesApi.create(token, body);
        await qc.invalidateQueries({ queryKey: ["sales-db"] });
        onClose();
      } catch (e) {
        setError(
          errorLabel(e instanceof Error ? e.message : "SALE_SAVE_FAILED", de),
        );
      }
    },
  });
  const estimate = rows.reduce((sum, r) => {
    const price =
      r.type === "PRODUCT"
        ? products.data?.items.find((p) => p.id === r.refId)?.salePriceMinor
        : r.overrideEuros
          ? toMinor(r.overrideEuros)
          : services.data?.find((s) => s.id === r.refId)?.priceFrom;
    return sum + (price ?? 0) * (Number(r.quantity) || 0);
  }, 0);
  const update = (i: number, p: Partial<Row>) =>
    setRows((v) => v.map((r, n) => (n === i ? { ...r, ...p } : r)));
  return (
    <div className="modal modal-open">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="modal-box max-w-5xl"
      >
        <h2 className="text-2xl font-bold">
          {sale
            ? de
              ? "Entwurf bearbeiten"
              : "Edit draft"
            : de
              ? "Verkauf erstellen"
              : "Create sale"}
        </h2>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <form.Field name="customerId">
              {(f) => (
                <label>
                  {de ? "Kunde (optional)" : "Customer (optional)"}
                  <select
                    aria-label={de ? "Kunde (optional)" : "Customer (optional)"}
                    className="select select-bordered w-full"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                  >
                    <option value="">
                      {de ? "Laufkundschaft" : "Walk-in"}
                    </option>
                    {customers.data?.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </form.Field>
            <form.Field name="bookingId">
              {(f) => (
                <label>
                  {de ? "Buchung (optional)" : "Booking (optional)"}
                  <select
                    aria-label={
                      de ? "Buchung (optional)" : "Booking (optional)"
                    }
                    className="select select-bordered w-full"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                  >
                    <option value="">—</option>
                    {bookings.data?.items.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNumber}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </form.Field>
            <form.Field name="discountEuros">
              {(f) => (
                <label>
                  {de ? "Rabatt (EUR)" : "Discount (EUR)"}
                  <input
                    aria-label={de ? "Rabatt (EUR)" : "Discount (EUR)"}
                    className="input input-bordered w-full"
                    type="number"
                    min="0"
                    step=".01"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                  />
                </label>
              )}
            </form.Field>
          </div>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div
                layout
                key={i}
                className="grid gap-2 rounded-xl bg-base-200 p-3 md:grid-cols-5"
              >
                <select
                  aria-label={(de ? "Typ " : "Type ") + (i + 1)}
                  className="select select-bordered"
                  value={r.type}
                  onChange={(e) =>
                    update(i, {
                      type: e.target.value as Row["type"],
                      refId: "",
                      overrideEuros: "",
                    })
                  }
                >
                  <option value="PRODUCT">{de ? "Produkt" : "Product"}</option>
                  <option value="SERVICE">
                    {de ? "Dienstleistung" : "Service"}
                  </option>
                </select>
                <div className="md:col-span-2">
                  <select
                    aria-label={(de ? "Position " : "Item ") + (i + 1)}
                    className="select select-bordered w-full"
                    value={r.refId}
                    onChange={(e) => update(i, { refId: e.target.value })}
                  >
                    <option value="">{de ? "Auswählen" : "Select"}</option>
                    {r.type === "PRODUCT"
                      ? products.data?.items.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={p.salePriceMinor === 0}
                          >
                            {p.name} · {p.sku} ·{" "}
                            {p.salePriceMinor === 0
                              ? de
                                ? "Preis nicht festgelegt"
                                : "Unpriced"
                              : formatEurMinor(p.salePriceMinor, language)}{" "}
                            · {de ? "Bestand" : "Stock"} {p.stockQuantity}
                            {p.stockQuantity <= p.minimumStock ? " ⚠" : ""}
                          </option>
                        ))
                      : services.data
                          ?.filter((s) => s.isActive)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {de ? s.nameDe : s.nameEn} ·{" "}
                              {formatEurMinor(s.priceFrom, language)}
                            </option>
                          ))}
                  </select>
                  {r.type === "PRODUCT" &&
                    r.refId &&
                    (() => {
                      const selected = products.data?.items.find(
                        (product) => product.id === r.refId,
                      );
                      return selected ? (
                        <div className="mt-2 flex items-center gap-3 rounded-lg bg-base-100 p-2">
                          {selected.imageUrl ? (
                            <img
                              src={selected.imageUrl}
                              alt={selected.name}
                              className="h-12 w-12 rounded bg-white object-contain p-1"
                            />
                          ) : (
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded bg-base-200"
                              aria-label={
                                de ? "Kein Produktbild" : "No product image"
                              }
                            >
                              📦
                            </div>
                          )}
                          <div className="min-w-0 text-sm">
                            <div className="truncate font-semibold">
                              {selected.name}
                            </div>
                            <div className="font-mono text-xs">
                              {selected.sku}
                            </div>
                            <div>
                              {formatEurMinor(
                                selected.salePriceMinor,
                                language,
                              )}{" "}
                              · {de ? "Bestand" : "Stock"}{" "}
                              {selected.stockQuantity}
                              {selected.stockQuantity <= selected.minimumStock
                                ? " · Low stock"
                                : ""}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                </div>
                <input
                  aria-label={(de ? "Menge " : "Quantity ") + (i + 1)}
                  className="input input-bordered"
                  type="number"
                  min="1"
                  step="1"
                  value={r.quantity}
                  onChange={(e) => update(i, { quantity: e.target.value })}
                />
                {r.type === "SERVICE" ? (
                  <input
                    aria-label={
                      (de ? "Servicepreis " : "Service price ") + (i + 1)
                    }
                    className="input input-bordered"
                    type="number"
                    min="0"
                    step=".01"
                    placeholder={de ? "Preisüberschreibung" : "Price override"}
                    value={r.overrideEuros}
                    onChange={(e) =>
                      update(i, { overrideEuros: e.target.value })
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className="btn btn-error"
                    disabled={rows.length === 1}
                    onClick={() => setRows((v) => v.filter((_, n) => n !== i))}
                  >
                    {de ? "Entfernen" : "Remove"}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() =>
              setRows((v) => [
                ...v,
                {
                  type: "PRODUCT",
                  refId: "",
                  quantity: "1",
                  overrideEuros: "",
                },
              ])
            }
          >
            {de ? "Position hinzufügen" : "Add item"}
          </button>
          <div className="alert">
            {de ? "Geschätzte Zwischensumme" : "Estimated subtotal"}:{" "}
            {formatEurMinor(estimate, language)} ·{" "}
            {de
              ? "Endgültige Beträge berechnet der Server."
              : "Final totals are calculated by the server."}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              {de ? "Abbrechen" : "Cancel"}
            </button>
            <button className="btn btn-primary">
              {de ? "Entwurf speichern" : "Save draft"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
function Details({
  sale,
  onClose,
  token,
}: {
  sale: Sale;
  onClose: () => void;
  token: () => Promise<string | null>;
}) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const qc = useQueryClient();
  const [payment, setPayment] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const act = useMutation({
    mutationFn: (kind: "complete" | "cancel") =>
      kind === "complete"
        ? salesApi.complete(token, sale.id)
        : salesApi.cancel(token, sale.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sales-db"] });
      await qc.invalidateQueries({ queryKey: ["sale-summary"] });
      onClose();
    },
    onError: (e) => setError(errorLabel(e.message, de)),
  });
  const pay = useMutation({
    mutationFn: () =>
      salesApi.payment(token, sale.id, {
        method,
        amountMinor: toMinor(amount),
        reference: reference || null,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sales-db"] });
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h2 className="text-2xl font-bold">{sale.saleNumber}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div>
            {de ? "Status" : "Status"}: {statusLabel(sale.status, de)}
          </div>
          <div>
            {de ? "Gesamt" : "Total"}:{" "}
            {formatEurMinor(sale.totalMinor, language)}
          </div>
          <div>
            {de ? "Bezahlt / Offen" : "Paid / Remaining"}:{" "}
            {formatEurMinor(sale.paidMinor, language)} /{" "}
            {formatEurMinor(sale.remainingMinor, language)}
          </div>
        </div>
        <table className="table mt-4">
          <thead>
            <tr>
              <th>{de ? "Position" : "Item"}</th>
              <th>{de ? "Menge" : "Quantity"}</th>
              <th>{de ? "Preis" : "Price"}</th>
              <th>{de ? "Summe" : "Total"}</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((i) => (
              <tr key={i.id}>
                <td>{i.description}</td>
                <td>{i.quantity}</td>
                <td>{formatEurMinor(i.unitPriceMinor, language)}</td>
                <td>{formatEurMinor(i.lineTotalMinor, language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payment && (
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <select
              aria-label={de ? "Zahlungsart" : "Payment method"}
              className="select select-bordered"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="CASH">{de ? "Bar" : "Cash"}</option>
              <option value="CARD">
                {de ? "Karte (manuell)" : "Card (manual)"}
              </option>
              <option value="BANK_TRANSFER">
                {de ? "Überweisung" : "Bank transfer"}
              </option>
              <option value="OTHER">{de ? "Andere" : "Other"}</option>
            </select>
            <input
              aria-label={de ? "Betrag" : "Amount"}
              className="input input-bordered"
              type="number"
              min=".01"
              step=".01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              aria-label={de ? "Referenz" : "Reference"}
              className="input input-bordered"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <button
              className="btn btn-primary"
              disabled={!amount || toMinor(amount) <= 0}
              onClick={() => pay.mutate()}
            >
              {de ? "Zahlung erfassen" : "Record payment"}
            </button>
          </div>
        )}
        {confirmComplete && (
          <div className="alert alert-info mt-4">
            <span>
              {de
                ? "Der Verkauf wird abgeschlossen und Produktbestand wird abgezogen."
                : "The sale will be completed and product stock will be deducted."}
            </span>
            <button
              className="btn btn-success btn-sm"
              onClick={() => act.mutate("complete")}
            >
              {de ? "Abschluss bestätigen" : "Confirm completion"}
            </button>
          </div>
        )}
        {confirmCancel && (
          <div className="alert alert-warning mt-4">
            <span>
              {de
                ? "Produkte werden zurückgebucht; Zahlungen werden nicht automatisch erstattet."
                : "Products will be restored; payments are not refunded automatically."}
            </span>
            <button
              className="btn btn-error btn-sm"
              onClick={() => act.mutate("cancel")}
            >
              {de ? "Stornierung bestätigen" : "Confirm cancellation"}
            </button>
          </div>
        )}
        {error && <div className="alert alert-error mt-4">{error}</div>}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            {de ? "Schließen" : "Close"}
          </button>
          {sale.status === "DRAFT" && (
            <button
              className="btn btn-success"
              onClick={() => setConfirmComplete(true)}
            >
              {de ? "Verkauf abschließen" : "Complete sale"}
            </button>
          )}
          {sale.status === "COMPLETED" && sale.remainingMinor > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => setPayment(true)}
            >
              {de ? "Zahlung erfassen" : "Record payment"}
            </button>
          )}
          {sale.status !== "CANCELLED" && sale.paidMinor === 0 && (
            <button
              className="btn btn-error"
              onClick={() => setConfirmCancel(true)}
            >
              {de ? "Stornieren" : "Cancel sale"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export function SalesPageView({
  token,
}: {
  token: () => Promise<string | null>;
}) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const reduced = useReducedMotion();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Sale | null | undefined>(undefined);
  const [detail, setDetail] = useState<Sale | null>(null);
  const q = new URLSearchParams({
    page: String(page),
    limit: "10",
    sort: "createdAt",
    order: "desc",
    ...(search && { search }),
    ...(status && { status }),
  }).toString();
  const sales = useQuery({
    queryKey: ["sales-db", q],
    queryFn: () => salesApi.list(token, q),
  });
  const total = sales.data?.total ?? 0;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-4xl font-bold">{de ? "Verkäufe" : "Sales"}</h1>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>
          {de ? "Verkauf erstellen" : "Create sale"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="input input-bordered"
          placeholder={
            de
              ? "Verkaufsnummer oder Kunde suchen"
              : "Search sale number or customer"
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select select-bordered"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{de ? "Alle Status" : "All statuses"}</option>
          <option value="DRAFT">{de ? "Entwurf" : "Draft"}</option>
          <option value="COMPLETED">
            {de ? "Abgeschlossen" : "Completed"}
          </option>
          <option value="CANCELLED">{de ? "Storniert" : "Cancelled"}</option>
        </select>
      </div>
      {sales.isPending && (
        <span role="status" className="loading loading-spinner" />
      )}
      {sales.isError && (
        <div className="alert alert-error">
          {de
            ? "Verkäufe konnten nicht geladen werden."
            : "Sales could not be loaded."}
        </div>
      )}
      {sales.data?.items.length === 0 && (
        <div className="alert">
          {de ? "Keine Verkäufe gefunden." : "No sales found."}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>{de ? "Nummer" : "Number"}</th>
              <th>{de ? "Kunde" : "Customer"}</th>
              <th>Status</th>
              <th>{de ? "Gesamt" : "Total"}</th>
              <th>{de ? "Zahlung" : "Payment"}</th>
              <th>{de ? "Aktionen" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {sales.data?.items.map((s) => (
              <motion.tr
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                key={s.id}
              >
                <td>{s.saleNumber}</td>
                <td>
                  {s.customer
                    ? s.customer.firstName + " " + s.customer.lastName
                    : de
                      ? "Laufkundschaft"
                      : "Walk-in"}
                </td>
                <td>
                  <span className="badge">{statusLabel(s.status, de)}</span>
                </td>
                <td>{formatEurMinor(s.totalMinor, language)}</td>
                <td>{statusLabel(s.paymentStatus, de)}</td>
                <td className="space-x-1">
                  <button className="btn btn-xs" onClick={() => setDetail(s)}>
                    {de ? "Details" : "Details"}
                  </button>
                  {s.status === "DRAFT" && (
                    <button
                      className="btn btn-xs"
                      onClick={() => setEditing(s)}
                    >
                      {de ? "Bearbeiten" : "Edit"}
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <button
          className="btn btn-sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {de ? "Zurück" : "Previous"}
        </button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / 10))}
        </span>
        <button
          className="btn btn-sm"
          disabled={page * 10 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          {de ? "Weiter" : "Next"}
        </button>
      </div>
      {editing !== undefined && (
        <SaleForm
          sale={editing}
          onClose={() => setEditing(undefined)}
          token={token}
        />
      )}{" "}
      {detail && (
        <Details sale={detail} onClose={() => setDetail(null)} token={token} />
      )}
    </section>
  );
}
export default function SalesPage() {
  const { auth } = useRouteContext({ from: "/admin" });
  return <SalesPageView token={auth.getAccessToken} />;
}
