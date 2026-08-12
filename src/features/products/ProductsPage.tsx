import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import { useAppPreferences } from "../../context";
import { productApi, productCategories, type Product } from "./api";
import { formatEurMinor } from "../../utils/currency";
export const productFormSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().max(2000),
  category: z.enum(productCategories),
  imageUrl: z.union([
    z.literal(""),
    z.url(),
    z.string().regex(/^\/products\/catalog\/[a-z0-9-]+\.webp$/),
  ]),
  vltPercent: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  dimensions: z.string().trim().max(120),
  packSize: z.union([z.literal(""), z.coerce.number().int().positive()]),
  material: z.string().trim().max(120),
  volumeMl: z.union([z.literal(""), z.coerce.number().int().positive()]),
  intendedUseDe: z.string().trim().max(300),
  intendedUseEn: z.string().trim().max(300),
  salePriceEuros: z.coerce.number().min(0),
  costPriceEuros: z.union([z.literal(""), z.coerce.number().min(0)]),
  initialStock: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});
export function toMinor(value: number) {
  return Math.round(value * 100);
}
function ProductModal({
  product,
  onClose,
  onSaved,
  token,
  de,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
  token: () => Promise<string | null>;
  de: boolean;
}) {
  const [error, setError] = useState("");
  const form = useForm({
    defaultValues: {
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      category: product?.category ?? "OTHER",
      imageUrl: product?.imageUrl ?? "",
      vltPercent:
        product?.specifications?.vltPercent == null
          ? ""
          : String(product.specifications.vltPercent),
      dimensions: product?.specifications?.dimensions ?? "",
      packSize:
        product?.specifications?.packSize == null
          ? ""
          : String(product.specifications.packSize),
      material: product?.specifications?.material ?? "",
      volumeMl:
        product?.specifications?.volumeMl == null
          ? ""
          : String(product.specifications.volumeMl),
      intendedUseDe: product?.specifications?.intendedUse?.de ?? "",
      intendedUseEn: product?.specifications?.intendedUse?.en ?? "",
      salePriceEuros: product ? String(product.salePriceMinor / 100) : "",
      costPriceEuros:
        product?.costPriceMinor == null
          ? ""
          : String(product.costPriceMinor / 100),
      initialStock: "0",
      minimumStock: String(product?.minimumStock ?? 0),
      isActive: product?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      const parsed = productFormSchema.safeParse(value);
      if (!parsed.success) {
        setError(
          de
            ? "Bitte prüfen Sie SKU, Name, Preise und Bestandswerte."
            : "Please check SKU, name, prices and inventory values.",
        );
        return;
      }
      const v = parsed.data;
      const body = {
        sku: v.sku,
        name: v.name,
        description: v.description || null,
        category: v.category,
        imageUrl: v.imageUrl || null,
        specifications: {
          ...(v.vltPercent !== "" ? { vltPercent: v.vltPercent } : {}),
          ...(v.dimensions ? { dimensions: v.dimensions } : {}),
          ...(v.packSize !== "" ? { packSize: v.packSize } : {}),
          ...(v.material ? { material: v.material } : {}),
          ...(v.volumeMl !== "" ? { volumeMl: v.volumeMl } : {}),
          ...(v.intendedUseDe && v.intendedUseEn
            ? { intendedUse: { de: v.intendedUseDe, en: v.intendedUseEn } }
            : {}),
        },
        salePriceMinor: toMinor(v.salePriceEuros),
        costPriceMinor:
          v.costPriceEuros === "" ? null : toMinor(v.costPriceEuros),
        minimumStock: v.minimumStock,
        isActive: v.isActive,
        ...(!product ? { initialStock: v.initialStock } : {}),
      };
      try {
        if (product) await productApi.update(token, product.id, body);
        else await productApi.create(token, body);
        onSaved();
      } catch (e) {
        setError(
          e instanceof Error && e.message === "SKU_ALREADY_EXISTS"
            ? de
              ? "Diese SKU existiert bereits."
              : "This SKU already exists."
            : de
              ? "Produkt konnte nicht gespeichert werden."
              : "Product could not be saved.",
        );
      }
    },
  });
  const values = useStore(form.store, (s) => s.values);
  const valid = productFormSchema.safeParse(values).success;
  const fields = [
    ["sku", "SKU"],
    ["name", de ? "Name" : "Name"],
    ["description", de ? "Beschreibung" : "Description"],
    ["category", de ? "Kategorie" : "Category"],
    ["imageUrl", de ? "Bild-URL (optional)" : "Image URL (optional)"],
    ["vltPercent", "VLT %"],
    ["dimensions", de ? "Abmessungen" : "Dimensions"],
    ["packSize", de ? "Packungsgröße" : "Pack size"],
    ["material", de ? "Material" : "Material"],
    ["volumeMl", de ? "Volumen (ml)" : "Volume (ml)"],
    ["intendedUseDe", "Verwendung (DE)"],
    ["intendedUseEn", "Intended use (EN)"],
    ["salePriceEuros", de ? "Verkaufspreis (EUR)" : "Sale price (EUR)"],
    [
      "costPriceEuros",
      de ? "Einstandspreis (EUR, optional)" : "Cost price (EUR, optional)",
    ],
    ...(!product
      ? [["initialStock", de ? "Anfangsbestand" : "Initial stock"]]
      : []),
    ["minimumStock", de ? "Mindestbestand" : "Minimum stock"],
  ] as const;
  return (
    <div className="modal modal-open">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="modal-box max-w-3xl"
      >
        <button
          className="btn btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold">
          {product
            ? de
              ? "Produkt bearbeiten"
              : "Edit product"
            : de
              ? "Produkt erstellen"
              : "Create product"}
        </h2>
        <div className="mt-4 flex items-center gap-4 rounded-xl bg-base-200 p-4">
          <ProductImage
            productName={String(values.name || product?.name || "")}
            imageUrl={String(values.imageUrl || "") || null}
            className="h-28 w-28"
            de={de}
          />
          <div>
            <div className="font-semibold">
              {de ? "Bildvorschau" : "Image preview"}
            </div>
            <p className="text-sm text-base-content/60">
              {de
                ? "Fehlende Bilder werden durch ein neutrales Symbol ersetzt."
                : "Missing images use a neutral placeholder."}
            </p>
          </div>
        </div>
        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          {fields.map(([name, label]) => (
            <form.Field
              key={name}
              name={
                name as
                  | "sku"
                  | "name"
                  | "description"
                  | "category"
                  | "imageUrl"
                  | "vltPercent"
                  | "dimensions"
                  | "packSize"
                  | "material"
                  | "volumeMl"
                  | "intendedUseDe"
                  | "intendedUseEn"
                  | "salePriceEuros"
                  | "costPriceEuros"
                  | "initialStock"
                  | "minimumStock"
              }
            >
              {(field) => (
                <label
                  className={name === "description" ? "md:col-span-2" : ""}
                >
                  <span className="mb-1 block">{label}</span>
                  {name === "category" ? (
                    <select
                      aria-label={String(label)}
                      className="select select-bordered w-full"
                      value={String(field.state.value)}
                      onChange={(e) =>
                        field.handleChange(e.target.value as never)
                      }
                    >
                      {productCategories.map((category) => (
                        <option key={category} value={category}>
                          {category.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : name === "description" ? (
                    <textarea
                      className="textarea textarea-bordered w-full"
                      value={String(field.state.value)}
                      onChange={(e) =>
                        field.handleChange(e.target.value as never)
                      }
                    />
                  ) : (
                    <input
                      className="input input-bordered w-full"
                      type={
                        name.includes("Price") ||
                        name.includes("Stock") ||
                        name === "vltPercent" ||
                        name === "packSize" ||
                        name === "volumeMl"
                          ? "number"
                          : "text"
                      }
                      step={name.includes("Price") ? "0.01" : "1"}
                      value={String(field.state.value)}
                      onChange={(e) =>
                        field.handleChange(e.target.value as never)
                      }
                    />
                  )}
                </label>
              )}
            </form.Field>
          ))}
          <form.Field name="isActive">
            {(field) => (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
                {de ? "Aktiv" : "Active"}
              </label>
            )}
          </form.Field>
          {error && (
            <div className="alert alert-error md:col-span-2">{error}</div>
          )}
          <div className="modal-action md:col-span-2">
            <button type="button" className="btn" onClick={onClose}>
              {de ? "Abbrechen" : "Cancel"}
            </button>
            <button className="btn btn-primary" aria-invalid={!valid}>
              {de ? "Speichern" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
      <button className="modal-backdrop" onClick={onClose}>
        close
      </button>
    </div>
  );
}
function AdjustmentModal({
  product,
  onClose,
  onSaved,
  token,
  de,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
  token: () => Promise<string | null>;
  de: boolean;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const numeric = Number(delta);
  const after =
    product.stockQuantity + (Number.isFinite(numeric) ? numeric : 0);
  const valid =
    Number.isInteger(numeric) &&
    numeric !== 0 &&
    after >= 0 &&
    reason.trim().length > 0;
  async function submit() {
    try {
      await productApi.adjust(token, product.id, {
        quantityDelta: numeric,
        reason: reason.trim(),
      });
      onSaved();
    } catch (e) {
      setError(
        e instanceof Error && e.message === "INSUFFICIENT_STOCK"
          ? de
            ? "Nicht genügend Bestand."
            : "Insufficient stock."
          : de
            ? "Bestand konnte nicht geändert werden."
            : "Inventory could not be adjusted.",
      );
    }
  }
  return (
    <div className="modal modal-open">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-box"
      >
        <h2 className="text-2xl font-bold">
          {de ? "Bestand anpassen" : "Adjust inventory"}
        </h2>
        <p className="mt-2">
          {product.name} · {de ? "Aktuell" : "Current"}: {product.stockQuantity}
        </p>
        <label className="mt-4 block">
          {de ? "Änderung" : "Quantity change"}
          <input
            className="input input-bordered mt-1 w-full"
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
          />
        </label>
        <label className="mt-4 block">
          {de ? "Grund" : "Reason"}
          <textarea
            className="textarea textarea-bordered mt-1 w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div
          className={
            "mt-4 rounded-xl p-4 " + (after < 0 ? "bg-error/15" : "bg-base-200")
          }
        >
          {product.stockQuantity} → {after}
        </div>
        {after < 0 && (
          <p className="mt-2 text-error">
            {de
              ? "Bestand darf nicht negativ werden."
              : "Stock cannot become negative."}
          </p>
        )}
        {error && <div className="alert alert-error mt-4">{error}</div>}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            {de ? "Abbrechen" : "Cancel"}
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => void submit()}
          >
            {de ? "Anpassen" : "Adjust"}
          </button>
        </div>
      </motion.div>
      <button className="modal-backdrop" onClick={onClose}>
        close
      </button>
    </div>
  );
}
function movementLabel(type: string, de: boolean) {
  const labels: Record<string, [string, string]> = {
    INITIAL: ["Anfangsbestand", "Initial stock"],
    PURCHASE: ["Einkauf", "Purchase"],
    SALE: ["Verkauf", "Sale"],
    ADJUSTMENT: ["Korrektur", "Adjustment"],
    RETURN: ["Rückgabe", "Return"],
    DAMAGE: ["Schaden", "Damage"],
    CANCELLATION: ["Stornierung", "Cancellation"],
  };
  return labels[type]?.[de ? 0 : 1] ?? type;
}
function HistoryModal({
  product,
  onClose,
  token,
  de,
}: {
  product: Product;
  onClose: () => void;
  token: () => Promise<string | null>;
  de: boolean;
}) {
  const history = useQuery({
    queryKey: ["inventory-history", product.id],
    queryFn: () => productApi.history(token, product.id),
  });
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <button
          className="btn btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold">
          {de ? "Bestandsverlauf" : "Inventory history"} · {product.name}
        </h2>
        {history.isPending && <span className="loading loading-spinner mt-6" />}
        {history.isError && (
          <div className="alert alert-error mt-6">
            {de
              ? "Verlauf konnte nicht geladen werden."
              : "History could not be loaded."}
          </div>
        )}
        {history.data?.items.length === 0 && (
          <p className="mt-6">{de ? "Keine Bewegungen." : "No movements."}</p>
        )}
        <div className="mt-6 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{de ? "Typ" : "Type"}</th>
                <th>{de ? "Änderung" : "Change"}</th>
                <th>{de ? "Vorher" : "Before"}</th>
                <th>{de ? "Nachher" : "After"}</th>
                <th>{de ? "Grund" : "Reason"}</th>
                <th>{de ? "Datum" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {history.data?.items.map((m) => (
                <tr key={m.id}>
                  <td>{movementLabel(m.type, de)}</td>
                  <td
                    className={
                      m.quantityDelta > 0 ? "text-success" : "text-error"
                    }
                  >
                    {m.quantityDelta > 0 ? "+" : ""}
                    {m.quantityDelta}
                  </td>
                  <td>{m.quantityBefore}</td>
                  <td>{m.quantityAfter}</td>
                  <td>{m.reason}</td>
                  <td>
                    {new Intl.DateTimeFormat(de ? "de" : "en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(m.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button className="modal-backdrop" onClick={onClose}>
        close
      </button>
    </div>
  );
}

function ProductImage({
  productName,
  imageUrl,
  className,
  de,
}: {
  productName: string;
  imageUrl: string | null;
  className: string;
  de: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-base-200 text-2xl ${className}`}
        aria-label={de ? "Kein Produktbild" : "No product image"}
      >
        📦
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={productName}
      className={`shrink-0 rounded-xl bg-white object-contain p-1 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

function specificationSummary(product: Product) {
  const specs = product.specifications;
  if (!specs) return "";
  return [
    specs.vltPercent != null ? `VLT ${specs.vltPercent}%` : null,
    specs.filmFamily,
    specs.dimensions,
    specs.material,
  ]
    .filter(Boolean)
    .join(" · ");
}
export function ProductsPage({
  token,
}: {
  token: () => Promise<string | null>;
}) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const reduced = useReducedMotion();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState("true");
  const [low, setLow] = useState(false);
  const [sort, setSort] = useState("name");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [history, setHistory] = useState<Product | null>(null);
  const query = new URLSearchParams({
    page: String(page),
    limit: "10",
    sort,
    order: "asc",
    ...(search && { search }),
    ...(category && { category }),
    ...(active && { isActive: active }),
    ...(low && { lowStock: "true" }),
  }).toString();
  const products = useQuery({
    queryKey: ["products-db", query],
    queryFn: () => productApi.list(token, query),
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => productApi.deactivate(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products-db"] }),
  });
  const refresh = () => {
    setEditing(undefined);
    setAdjusting(null);
    void qc.invalidateQueries({ queryKey: ["products-db"] });
    void qc.invalidateQueries({ queryKey: ["inventory-history"] });
  };
  const total = products.data?.total ?? 0;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-bold">
          {de ? "Produkte & Bestand" : "Products & Inventory"}
        </h1>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>
          {de ? "Produkt erstellen" : "Create product"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          className="input input-bordered"
          placeholder={
            de
              ? "Name, SKU oder Kategorie suchen"
              : "Search name, SKU or category"
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <input
          className="input input-bordered"
          placeholder={de ? "Kategorie" : "Category"}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select select-bordered"
          value={active}
          onChange={(e) => setActive(e.target.value)}
        >
          <option value="">{de ? "Alle" : "All"}</option>
          <option value="true">{de ? "Aktiv" : "Active"}</option>
          <option value="false">{de ? "Inaktiv" : "Inactive"}</option>
        </select>
        <select
          className="select select-bordered"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">{de ? "Name" : "Name"}</option>
          <option value="sku">SKU</option>
          <option value="stockQuantity">{de ? "Bestand" : "Stock"}</option>
          <option value="salePriceMinor">{de ? "Preis" : "Price"}</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={low}
            onChange={(e) => setLow(e.target.checked)}
          />
          {de ? "Niedriger Bestand" : "Low stock"}
        </label>
      </div>
      {products.isPending && (
        <span
          className="loading loading-spinner"
          role="status"
          aria-label={de ? "Produkte werden geladen" : "Loading products"}
        />
      )}
      {products.isError && (
        <div className="alert alert-error">
          {de
            ? "Produkte konnten nicht geladen werden."
            : "Products could not be loaded."}
        </div>
      )}
      {products.data?.items.length === 0 && (
        <div className="alert">
          {de ? "Keine Produkte gefunden." : "No products found."}
        </div>
      )}
      <div className="grid gap-4 md:hidden">
        {products.data?.items.map((p) => (
          <motion.article
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            key={p.id}
            className="card border border-base-300 bg-base-100 shadow-sm"
          >
            <div className="card-body p-4">
              <ProductImage
                productName={p.name}
                imageUrl={p.imageUrl}
                className="h-44 w-full"
                de={de}
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="card-title text-lg">{p.name}</h2>
                  <div className="font-mono text-xs">{p.sku}</div>
                </div>
                <span
                  className={
                    p.lowStock ? "badge badge-warning" : "badge badge-success"
                  }
                >
                  {p.stockQuantity} / {p.minimumStock}
                </span>
              </div>
              <p className="text-sm text-base-content/60">
                {p.category.replaceAll("_", " ")}
                {specificationSummary(p) ? ` · ${specificationSummary(p)}` : ""}
              </p>
              <strong>
                {p.salePriceMinor === 0
                  ? de
                    ? "Preis nicht festgelegt"
                    : "Unpriced"
                  : formatEurMinor(p.salePriceMinor, language)}
              </strong>
              <div className="card-actions mt-2">
                <button className="btn btn-xs" onClick={() => setEditing(p)}>
                  {de ? "Bearbeiten" : "Edit"}
                </button>
                <button
                  className="btn btn-xs"
                  disabled={!p.isActive}
                  onClick={() => setAdjusting(p)}
                >
                  {de ? "Bestand" : "Inventory"}
                </button>
                <button className="btn btn-xs" onClick={() => setHistory(p)}>
                  {de ? "Verlauf" : "History"}
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>SKU</th>
              <th>{de ? "Produkt" : "Product"}</th>
              <th>{de ? "Preis" : "Price"}</th>
              <th>{de ? "Bestand" : "Stock"}</th>
              <th>Status</th>
              <th>{de ? "Aktionen" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {products.data?.items.map((p) => (
              <motion.tr
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                key={p.id}
              >
                <td className="font-mono">{p.sku}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <ProductImage
                      productName={p.name}
                      imageUrl={p.imageUrl}
                      className="h-14 w-14"
                      de={de}
                    />
                    <div>
                      <strong>{p.name}</strong>
                      <br />
                      <span className="text-xs">
                        {p.category?.replaceAll("_", " ")}
                      </span>
                      {p.specifications &&
                        Object.keys(p.specifications).length > 0 && (
                          <div className="max-w-md text-xs text-base-content/60">
                            {specificationSummary(p)}
                          </div>
                        )}
                    </div>
                  </div>
                </td>
                <td>
                  {p.salePriceMinor === 0
                    ? de
                      ? "Nicht bepreist"
                      : "Unpriced"
                    : formatEurMinor(p.salePriceMinor, language)}
                </td>
                <td>
                  <span
                    className={
                      p.lowStock ? "badge badge-warning" : "badge badge-success"
                    }
                  >
                    {p.stockQuantity} / {p.minimumStock}
                  </span>
                </td>
                <td>
                  {p.isActive
                    ? de
                      ? "Aktiv"
                      : "Active"
                    : de
                      ? "Inaktiv"
                      : "Inactive"}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <button
                      className="btn btn-xs"
                      onClick={() => setEditing(p)}
                    >
                      {de ? "Bearbeiten" : "Edit"}
                    </button>
                    <button
                      className="btn btn-xs"
                      disabled={!p.isActive}
                      onClick={() => setAdjusting(p)}
                    >
                      {de ? "Bestand" : "Inventory"}
                    </button>
                    <button
                      className="btn btn-xs"
                      onClick={() => setHistory(p)}
                    >
                      {de ? "Verlauf" : "History"}
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      disabled={!p.isActive || deactivate.isPending}
                      onClick={() => deactivate.mutate(p.id)}
                    >
                      {de ? "Deaktivieren" : "Deactivate"}
                    </button>
                  </div>
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
          onClick={() => setPage(page - 1)}
        >
          {de ? "Zurück" : "Previous"}
        </button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / 10))}
        </span>
        <button
          className="btn btn-sm"
          disabled={page * 10 >= total}
          onClick={() => setPage(page + 1)}
        >
          {de ? "Weiter" : "Next"}
        </button>
      </div>
      {editing !== undefined && (
        <ProductModal
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={refresh}
          token={token}
          de={de}
        />
      )}{" "}
      {adjusting && (
        <AdjustmentModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={refresh}
          token={token}
          de={de}
        />
      )}{" "}
      {history && (
        <HistoryModal
          product={history}
          onClose={() => setHistory(null)}
          token={token}
          de={de}
        />
      )}
    </section>
  );
}

export default function ProductsRoutePage() {
  const { auth } = useRouteContext({ from: "/admin" });
  return <ProductsPage token={auth.getAccessToken} />;
}
