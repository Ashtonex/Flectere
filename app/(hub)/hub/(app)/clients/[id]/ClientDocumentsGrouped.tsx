"use client";

import { useState } from "react";
import { labelize } from "@/lib/hub/crm";
import { documentTypes } from "@/lib/hub/invoices";
import type { Client, ClientDocument } from "@/lib/hub/types";
import { deleteDocumentAction, uploadDocumentAction } from "../actions";

interface DocumentWithUrl extends ClientDocument {
  url: string | null;
}

interface ClientDocumentsGroupedProps {
  client: Client;
  documents: DocumentWithUrl[];
}

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright cursor-pointer";

export function ClientDocumentsGrouped({ client, documents }: ClientDocumentsGroupedProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);

  const categories = ["all", ...documentTypes];

  const filteredDocs =
    activeCategory === "all"
      ? documents
      : documents.filter((d) => d.document_type === activeCategory);

  // Group count map
  const countMap = documents.reduce((acc, doc) => {
    const t = doc.document_type || "general";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-lg text-fog-100">Client Document Vault</h2>
          <p className="text-xs text-fog-500">Categorized repository of client contracts, statements, invoices, and KYC identity files</p>
        </div>
        <button
          onClick={() => setIsUploading(!isUploading)}
          className="rounded-lg border border-gold/50 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold hover:text-ink-950 transition cursor-pointer"
        >
          {isUploading ? "Close Upload Panel" : "+ Upload New Document"}
        </button>
      </div>

      {/* Category Folders / Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const count = cat === "all" ? documents.length : (countMap[cat] || 0);
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-gold text-ink-950 font-bold shadow"
                  : "bg-white/[0.03] text-fog-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
              }`}
            >
              <span>{cat === "all" ? "📁 All Files" : `📂 ${labelize(cat)}`}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive ? "bg-black/20 text-ink-950" : "bg-white/10 text-fog-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Upload Form (Collapsible) */}
      {isUploading && (
        <form
          action={async (formData) => {
            await uploadDocumentAction(formData);
            setIsUploading(false);
          }}
          className="rounded-xl border border-gold/30 bg-black/40 p-4 space-y-4 animate-in fade-in duration-150"
        >
          <input type="hidden" name="client_id" value={client.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>Document Title / Label *</label>
              <input name="label" required className={inputClasses} placeholder="e.g. Master Retainer Agreement 2026" />
            </div>

            <div>
              <label className={labelClasses}>Category / Folder Group *</label>
              <select name="document_type" className={inputClasses}>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {labelize(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>Attach File (PDF, DOCX, PNG) *</label>
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                className="block w-full text-xs text-fog-300 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.05] file:px-3 file:py-1.5 file:text-xs file:text-fog-200"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Document Notes / Terms</label>
            <input name="notes" className={inputClasses} placeholder="e.g. Signed by Managing Director on Sept 6" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploading(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" className={submitClasses}>
              Upload to Vault
            </button>
          </div>
        </form>
      )}

      {/* Grouped Document List */}
      <div className="divide-y divide-white/5">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-4 py-3.5 group">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">
                {doc.document_type === "contract"
                  ? "📜"
                  : doc.document_type === "invoice"
                  ? "💵"
                  : doc.document_type === "statement"
                  ? "📊"
                  : doc.document_type === "identity"
                  ? "🪪"
                  : "📄"}
              </span>

              <div>
                <div className="flex items-center gap-2">
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-fog-100 underline decoration-white/20 underline-offset-4 hover:text-gold transition"
                    >
                      {doc.label}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-fog-300">{doc.label}</span>
                  )}
                  <span className="rounded bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fog-400">
                    {labelize(doc.document_type)}
                  </span>
                </div>

                <p className="text-xs text-fog-500 mt-0.5">
                  Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                  {doc.notes && <span className="text-fog-400"> — {doc.notes}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-white/10 px-2.5 py-1 text-xs text-fog-300 hover:border-gold/40 hover:text-gold transition"
                >
                  Download / View ➔
                </a>
              )}

              <form action={deleteDocumentAction}>
                <input type="hidden" name="id" value={doc.id} />
                <input type="hidden" name="storage_path" value={doc.storage_path} />
                <input type="hidden" name="client_id" value={client.id} />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm("Are you sure you want to permanently delete this document?")) {
                      e.preventDefault();
                    }
                  }}
                  className="text-xs text-fog-500 hover:text-rose-400 transition cursor-pointer"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="py-8 text-center text-fog-600 text-sm">
            No documents in &quot;{labelize(activeCategory)}&quot;. Click &quot;+ Upload New Document&quot; to add files.
          </div>
        )}
      </div>
    </div>
  );
}
