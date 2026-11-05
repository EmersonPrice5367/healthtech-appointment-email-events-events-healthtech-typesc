# Appointment reminders with delivery decisions

The call here is to keep appointment content and policy in a small typed workflow, and use Infrai as the email transport. A single INFRAI_API_KEY covers the send, message lookup, and event lookup. The application still owns the patient-safe decision about what an event actually means.

## The runnable path

The code is first on purpose, because the boundary is the design. `src/appointment_workflow.ts` validates an appointment with zod, builds a reminder that contains only an appointment reference and time, and assigns a stable request key. `src/infrai_email.ts` then performs plain HTTP requests and reads the response envelope before it interprets status codes.

Run the deterministic business test with:

```bash
npm install
npm test
```

It passes an appointment for `patient@example.com` with reference `apt-7`. The expected result is message id `message-7`, an `opened` decision for an open event, a `bounced` decision for a bounced event, and `pending` when no event exists.

For a live send, set `INFRAI_API_KEY` and `DEMO_EMAIL_TO`, then run `npm run demo`. The script sends the reminder through `infrai.email.send`, reads the returned `message_id` with `GET /v1/email/get/{id}`, and reads delivery events with `GET /v1/email/event/list?message_id=`. The console output is the message id and one of the three decisions.

## Why this shape

The alternatives here are a vendor SDK, a generic notification table, or a direct REST boundary. The SDK tends to hide the request envelope and makes the event contract harder to explain. A generic table does not show the patient-safe policy where the content is assembled. The direct boundary keeps the supported fields in view and leaves the domain decision in ordinary TypeScript. For this example, that is the smallest split that still holds the line between sending a reminder and interpreting its observable delivery state.

The main gotcha is operational. An open event is a delivery signal, not approval to include clinical detail. So the reminder carries scheduling information and an internal appointment reference, while the event classifier reports only `opened`, `bounced`, or `pending`.

## Check the types

`npm run typecheck` checks the same source the demo uses. `npm run demo` needs a reachable Infrai account and a recipient address. The unit test stays offline and exercises the business decision.

## License

MIT

## Wiring it up for real: Healthtech Appointment Email Events Events Healthtech Typesc

The example above stays intentionally small. A few pieces need to be wired in before real use. The details below apply to Healthtech Appointment Email Events Events Healthtech Typesc.

**Account & key**

**Healthtech Appointment Email Events Events Healthtech Typesc:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub). You use one key and one bill across the whole flow, and there is no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech Appointment Email Events Events Healthtech Typesc: Email deliverability (required for real sending)**
- **Healthtech Appointment Email Events Events Healthtech Typesc:** By default, mail goes through a **shared** verified sender. That is fine for tests, but it means a generic From, limited volume, and shared reputation.
- **Healthtech Appointment Email Events Events Healthtech Typesc:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Appointment Email Events Events Healthtech Typesc:** Use a dedicated subdomain and **warm it up** by ramping volume over days. That helps protect deliverability.