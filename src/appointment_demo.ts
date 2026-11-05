import { InfraiEmail } from "./infrai_email.js";
import { classifyEvents, sendAppointmentReminder } from "./appointment_workflow.js";

const recipient = process.env.DEMO_EMAIL_TO;
if (!recipient) throw new Error("DEMO_EMAIL_TO is required");

const mailer = new InfraiEmail();
// The domain call is intentionally visible at the workflow boundary: infrai.email.send.
const sent = await sendAppointmentReminder({
  patientEmail: recipient,
  patientName: "Jordan",
  appointmentId: "appointment-2048",
  startsAt: "2026-11-04T09:30:00Z"
}, mailer);
const message = await mailer.get(sent.message_id);
const events = await mailer.listEvents(message.message_id);
console.log({ messageId: message.message_id, decision: classifyEvents(events) });
