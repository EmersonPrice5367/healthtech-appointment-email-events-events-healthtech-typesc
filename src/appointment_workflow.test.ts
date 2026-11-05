import assert from "node:assert/strict";
import { classifyEvents, sendAppointmentReminder } from "./appointment_workflow.js";

const calls: unknown[] = [];
const result = await sendAppointmentReminder({
  patientEmail: "patient@example.com",
  patientName: "Ari",
  appointmentId: "apt-7",
  startsAt: "2026-11-04T09:30:00Z"
}, {
  async send(body, requestId) {
    calls.push({ body, requestId });
    return { message_id: "message-7" };
  }
});

assert.equal(result.message_id, "message-7");
assert.deepEqual(calls[0], {
  body: {
    to: "patient@example.com",
    subject: "Appointment reminder: 2026-11-04T09:30:00Z",
    html: "<p>Hello Ari,</p><p>This is a reminder for your appointment on 2026-11-04T09:30:00Z.</p><p>Appointment reference: apt-7</p>"
  },
  requestId: "appointment-reminder:apt-7"
});
assert.equal(classifyEvents([{ type: "open" }]), "opened");
assert.equal(classifyEvents([{ status: "bounced" }]), "bounced");
assert.equal(classifyEvents([]), "pending");
console.log("appointment decision test passed");
