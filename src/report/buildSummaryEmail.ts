import type { EmailContent } from "../gmail/types.ts";
import type { InboxMessage } from "../inbox/types.ts";
import { formatReportTimestamp } from "./formatReportTimestamp.ts";
import { toDisplayLine } from "./toDisplayLine.ts";

const TRASH_RETENTION_DAYS = 30;
const DRY_RUN_PREFIX = "[simulación] ";
const NOTHING_TO_REPORT = "nada que reportar";

const listFormatter = new Intl.ListFormat("es", { style: "long", type: "conjunction" });

export type SummaryInput = {
  readonly trashed: readonly InboxMessage[];
  readonly failed: readonly InboxMessage[];
  readonly important: readonly InboxMessage[];
  readonly runAt: Date;
  readonly isDryRun: boolean;
};

/** Redacta el correo de resumen. Es la única salida que ve la persona, así que dice qué pasó y qué no. */
export function buildSummaryEmail(summary: SummaryInput): EmailContent {
  return { subject: buildSubject(summary), body: buildBody(summary) };
}

function buildSubject(summary: SummaryInput): string {
  const counts = [
    describeCount(summary.trashed.length, "a la papelera"),
    describeCount(summary.failed.length, "sin borrar"),
    describeCount(summary.important.length, "por revisar"),
  ].filter((count) => count !== null);

  const prefix = summary.isDryRun ? DRY_RUN_PREFIX : "";
  const detail = counts.length === 0 ? NOTHING_TO_REPORT : listFormatter.format(counts);
  return `${prefix}Limpieza de Gmail: ${detail}`;
}

function describeCount(count: number, label: string): string | null {
  return count === 0 ? null : `${count} ${label}`;
}

function buildBody(summary: SummaryInput): string {
  const trashTitle = summary.isDryRun
    ? "Se habrían enviado a la papelera"
    : `A la papelera, recuperables unos ${TRASH_RETENTION_DAYS} días`;

  const sections = [
    `Resumen del ${formatReportTimestamp(summary.runAt)}.`,
    summary.isDryRun ? "Simulación: no se movió ningún correo." : null,
    buildSection(trashTitle, summary.trashed),
    buildSection("No se pudieron borrar, siguen en la bandeja", summary.failed),
    buildSection("Por revisar", summary.important),
  ].filter((section) => section !== null);

  return `${sections.join("\n\n")}\n`;
}

function buildSection(title: string, messages: readonly InboxMessage[]): string | null {
  if (messages.length === 0) {
    return null;
  }
  const lines = sortByReceivedAt(messages).map(formatMessageLine);
  return `${title} (${messages.length}):\n${lines.join("\n")}`;
}

function formatMessageLine(message: InboxMessage): string {
  return `- ${toDisplayLine(message.senderLabel)} — ${toDisplayLine(message.subject)}`;
}

/** Orden cronológico. Los mensajes sin fecha van al final, para no inventar un orden. */
function sortByReceivedAt(messages: readonly InboxMessage[]): InboxMessage[] {
  return [...messages].sort((left, right) => {
    const leftTime = left.receivedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightTime = right.receivedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
}
