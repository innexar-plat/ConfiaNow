import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricsBarChart } from "./metrics-bar-chart";

test("MetricsBarChart renders labels and values", () => {
  const html = renderToStaticMarkup(
    <MetricsBarChart
      title="Lead trend"
      series={[
        { label: "Mon", value: 3 },
        { label: "Tue", value: 5 }
      ]}
    />
  );

  assert.match(html, /Lead trend/);
  assert.match(html, /Mon/);
  assert.match(html, /Tue/);
  assert.match(html, /5/);
});

test("MetricsBarChart renders empty state", () => {
  const html = renderToStaticMarkup(
    <MetricsBarChart title="Empty chart" series={[]} emptyLabel="Nada para mostrar" />
  );

  assert.match(html, /Nada para mostrar/);
});

test("MetricsBarChart renders empty state when all values are zero", () => {
  const html = renderToStaticMarkup(
    <MetricsBarChart
      title="Zero chart"
      series={[
        { label: "Mon", value: 0 },
        { label: "Tue", value: 0 }
      ]}
    />
  );

  assert.match(html, /No data available for this period/i);
});
