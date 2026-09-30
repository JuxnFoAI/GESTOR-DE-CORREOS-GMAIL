import process from "node:process";
import { readConfig } from "./config.ts";
import { GmailClient } from "./gmail/GmailClient.ts";
import { requestAccessToken } from "./gmail/requestAccessToken.ts";
import { classifyMessages } from "./inbox/classifyMessages.ts";
import { readSenderListsFile } from "./inbox/readSenderListsFile.ts";
import { toInboxMessage } from "./inbox/toInboxMessage.ts";
import { trashMessages } from "./inbox/trashMessages.ts";
import type { InboxMessage } from "./inbox/types.ts";
import { buildSummaryEmail, type SummaryInput } from "./report/buildSummaryEmail.ts";

const SENDER_LISTS_FILE = new URL("../senders.json", import.meta.url);
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

async function cleanInbox(): Promise<void> {
  const config = readConfig(process.env);
  const senderLists = await readSenderListsFile(SENDER_LISTS_FILE);
  const gmail = new GmailClient(await requestAccessToken(config.credentials));

  const since = new Date(Date.now() - config.lookbackHours * MILLISECONDS_PER_HOUR);
  const messages = await gmail.listInboxMessagesSince(since);
  const classification = classifyMessages(messages.map(toInboxMessage), senderLists);
  console.info(`Revisados ${messages.length} correos recibidos desde ${since.toISOString()}.`);

  const outcome = config.isDryRun
    ? { trashed: classification.unwanted, failed: [] }
    : await trashMessages(gmail, classification.unwanted, reportTrashFailure);

  await sendSummary(gmail, {
    ...outcome,
    important: classification.important,
    runAt: new Date(),
    isDryRun: config.isDryRun,
  });
}

async function sendSummary(gmail: GmailClient, summary: SummaryInput): Promise<void> {
  const newsCount = summary.trashed.length + summary.failed.length + summary.important.length;
  if (newsCount === 0) {
    console.info("Nada que reportar, no se envía resumen.");
    return;
  }

  const content = buildSummaryEmail(summary);
  await gmail.sendEmail({ to: await gmail.readOwnAddress(), ...content });
  console.info(`Resumen enviado: ${content.subject}`);
}

function reportTrashFailure(message: InboxMessage, error: unknown): void {
  const reason = error instanceof Error ? error.message : "causa desconocida";
  console.error(`No se pudo mover a la papelera el correo ${message.id}: ${reason}`);
}

try {
  await cleanInbox();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Fallo inesperado en la limpieza de Gmail.",
  );
  process.exitCode = 1;
}
