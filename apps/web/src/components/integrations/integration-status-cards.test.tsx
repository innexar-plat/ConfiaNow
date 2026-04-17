import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntegrationStatusCards } from "./integration-status-cards";

test("IntegrationStatusCards renders provider status cards", () => {
  const html = renderToStaticMarkup(
    <IntegrationStatusCards
      items={[
        {
          provider: "VERIFICATION_PROVIDER",
          events: { total: 5, processing: 2, failed: 1, deadLetter: 0 },
          jobs: { pending: 3, running: 1, failed: 0 },
          lastEventAt: new Date("2026-04-17T12:00:00Z")
        }
      ]}
    />
  );

  assert.match(html, /VERIFICATION_PROVIDER/);
  assert.match(html, /5 eventos/);
  assert.match(html, /integration-status-cards/);
});

test("IntegrationStatusCards renders empty state", () => {
  const html = renderToStaticMarkup(<IntegrationStatusCards items={[]} />);

  assert.match(html, /integration-status-empty/);
  assert.match(html, /Nenhuma integracao registrada/i);
});

test("IntegrationStatusCards renders never label when provider has no last event", () => {
  const html = renderToStaticMarkup(
    <IntegrationStatusCards
      items={[
        {
          provider: "EMAIL_PROVIDER",
          events: { total: 0, processing: 0, failed: 0, deadLetter: 0 },
          jobs: { pending: 0, running: 0, failed: 0 },
          lastEventAt: null
        }
      ]}
    />
  );

  assert.match(html, /EMAIL_PROVIDER/);
  assert.match(html, /Ultimo evento: nunca/);
});
