import { z } from "zod";
import type { EmailEvent, EmailResult, InfraiEmail } from "./infrai_email.js";

export const appointmentRequest = z.object({
  patientEmail: z.string().email(),
  patientName: z.string().min(1),
  appointmentId: z.string().min(1),
  startsAt: z.string().datetime()
});

export type AppointmentRequest = z.infer<typeof appointmentRequest>;
export type AppointmentDecision = "opened" | "bounced" | "sent" | "pending";

export function classifyEvents(events: EmailEvent[]): AppointmentDecision {
  if (events.some((event) => event.type === "bounce" || event.status === "bounced")) return "bounced";
  if (events.some((event) => event.type === "open" || event.status === "opened")) return "opened";
  return "pending";
}

export async function sendAppointmentReminder(input: unknown, mailer: Pick<InfraiEmail, "send">): Promise<EmailResult> {
  const appointment = appointmentRequest.parse(input);
  return mailer.send({
    to: appointment.patientEmail,
    subject: `Appointment reminder: ${appointment.startsAt}`,
    html: `<p>Hello ${appointment.patientName},</p><p>This is a reminder for your appointment on ${appointment.startsAt}.</p><p>Appointment reference: ${appointment.appointmentId}</p>`
  }, `appointment-reminder:${appointment.appointmentId}`);
}
