import { describe, expect, it } from "vitest";
import type { InboxMessage } from "../inbox/types.ts";
import { buildSummaryEmail, type SummaryInput } from "./buildSummaryEmail.ts";

const RUN_AT = new Date("2026-09-29T20:00:00Z");

function inboxMessage(
  senderLabel: string,
  subject: string,
  receivedAt: Date | null = null,
): InboxMessage {
  return { id: senderLabel, senderAddress: senderLabel, senderLabel, subject, receivedAt };
}

function summaryInput(overrides: Partial<SummaryInput> = {}): SummaryInput {
  return {
    trashed: [],
    failed: [],
    important: [],
    runAt: RUN_AT,
    isDryRun: false,
    ...overrides,
  };
}

describe("buildSummaryEmail", () => {
  it("counts the trashed messages in the subject", () => {
    const email = buildSummaryEmail(
      summaryInput({ trashed: [inboxMessage("a@b.com", "Oferta")] }),
    );

    expect(email.subject).toBe("Limpieza de Gmail: 1 a la papelera");
  });

  it("joins the three counts in the subject", () => {
    const email = buildSummaryEmail(
      summaryInput({
        trashed: [inboxMessage("a@b.com", "Oferta"), inboxMessage("c@d.com", "Promo")],
        failed: [inboxMessage("e@f.com", "Error")],
        important: [inboxMessage("g@h.com", "Curso")],
      }),
    );

    expect(email.subject).toBe(
      "Limpieza de Gmail: 2 a la papelera, 1 sin borrar y 1 por revisar",
    );
  });

  it("says there is nothing to report when every list is empty", () => {
    expect(buildSummaryEmail(summaryInput()).subject).toBe(
      "Limpieza de Gmail: nada que reportar",
    );
  });

  it("marks a dry run in the subject", () => {
    const email = buildSummaryEmail(
      summaryInput({ isDryRun: true, trashed: [inboxMessage("a@b.com", "Oferta")] }),
    );

    expect(email.subject).toBe("[simulación] Limpieza de Gmail: 1 a la papelera");
  });

  it("opens the body with the local time of the run", () => {
    expect(buildSummaryEmail(summaryInput()).body).toContain("Resumen del 29/09/2026 15:00.");
  });

  it("lists each trashed message with sender and subject", () => {
    const email = buildSummaryEmail(
      summaryInput({ trashed: [inboxMessage("no-reply@spotify.com", "Tu resumen")] }),
    );

    expect(email.body).toContain("- no-reply@spotify.com — Tu resumen");
  });

  it("explains that trashed mail is recoverable", () => {
    const email = buildSummaryEmail(
      summaryInput({ trashed: [inboxMessage("a@b.com", "Oferta")] }),
    );

    expect(email.body).toContain("recuperables unos 30 días");
  });

  it("warns that a dry run moved nothing", () => {
    const email = buildSummaryEmail(
      summaryInput({ isDryRun: true, trashed: [inboxMessage("a@b.com", "Oferta")] }),
    );

    expect(email.body).toContain("Simulación: no se movió ningún correo.");
  });

  it("reports the messages it could not trash", () => {
    const email = buildSummaryEmail(
      summaryInput({ failed: [inboxMessage("a@b.com", "Oferta")] }),
    );

    expect(email.body).toContain("No se pudieron borrar, siguen en la bandeja (1):");
  });

  it("omits the sections that have no messages", () => {
    const email = buildSummaryEmail(
      summaryInput({ important: [inboxMessage("a@b.com", "Curso")] }),
    );

    expect(email.body).not.toContain("papelera");
  });

  it("sorts each section from oldest to newest", () => {
    const email = buildSummaryEmail(
      summaryInput({
        trashed: [
          inboxMessage("nuevo@b.com", "Nuevo", new Date("2026-09-29T19:00:00Z")),
          inboxMessage("viejo@b.com", "Viejo", new Date("2026-09-29T10:00:00Z")),
        ],
      }),
    );

    expect(email.body.indexOf("viejo@b.com")).toBeLessThan(email.body.indexOf("nuevo@b.com"));
  });

  it("puts messages without a date at the end", () => {
    const email = buildSummaryEmail(
      summaryInput({
        trashed: [
          inboxMessage("sinfecha@b.com", "Sin fecha"),
          inboxMessage("confecha@b.com", "Con fecha", new Date("2026-09-29T10:00:00Z")),
        ],
      }),
    );

    expect(email.body.indexOf("confecha@b.com")).toBeLessThan(
      email.body.indexOf("sinfecha@b.com"),
    );
  });

  it("flattens a subject that tries to add its own lines", () => {
    const email = buildSummaryEmail(
      summaryInput({ trashed: [inboxMessage("a@b.com", "Oferta\n- otro@b.com — Falso")] }),
    );

    expect(email.body).toContain("- a@b.com — Oferta - otro@b.com — Falso");
  });
});
