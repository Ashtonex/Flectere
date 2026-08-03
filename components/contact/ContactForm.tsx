"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

type Status = "idle" | "submitting" | "success" | "error";

const inputClasses =
  "w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-fog-100 placeholder:text-fog-600 outline-none transition-colors focus:border-gold/50 focus:bg-white/[0.04]";

export default function ContactForm({
  contextNote,
  source,
  diagnosticScore,
  diagnosticFocus,
}: {
  contextNote?: string;
  source?: string;
  diagnosticScore?: string;
  diagnosticFocus?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      message: String(data.get("message") || ""),
      source,
      diagnosticScore,
      diagnosticFocus,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center rounded-2xl border border-gold/25 bg-gold/5 px-8 py-16 text-center"
      >
        <CheckCircle2 className="h-10 w-10 text-gold" strokeWidth={1.5} />
        <h3 className="mt-5 font-display text-2xl text-fog-100">
          Message received.
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog-400">
          We&apos;ll get back to you within one business day to schedule your
          Flectēre Diagnostic call.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {contextNote && (
        <div className="rounded-xl border border-graphite/40 bg-graphite/10 px-4 py-3 text-sm text-fog-300">
          {contextNote}
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-xs uppercase tracking-widest2 text-fog-500">
            Name
          </label>
          <input id="name" name="name" required className={inputClasses} placeholder="Jane Doe" />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-xs uppercase tracking-widest2 text-fog-500">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClasses}
            placeholder="jane@company.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="company" className="mb-2 block text-xs uppercase tracking-widest2 text-fog-500">
          Company <span className="normal-case text-fog-600">(optional)</span>
        </label>
        <input id="company" name="company" className={inputClasses} placeholder="Company name" />
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-xs uppercase tracking-widest2 text-fog-500">
          What&apos;s the constraint you&apos;re trying to solve?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={inputClasses}
          placeholder="Tell us where the business feels rigid right now..."
        />
      </div>

      <AnimatePresence>
        {status === "error" && error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" size="lg" className="w-full justify-center sm:w-auto" icon={status !== "submitting"}>
        {status === "submitting" ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
          </span>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
