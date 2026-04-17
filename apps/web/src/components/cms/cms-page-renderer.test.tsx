import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CmsPageRenderer } from "./cms-page-renderer";

function makeSection(overrides: Partial<Parameters<typeof CmsPageRenderer>[0]["sections"][0]> = {}) {
  return {
    id: "sec-1",
    type: "text",
    order: 0,
    title: "Titulo da secao",
    body: "Conteudo da secao",
    metadata: null,
    ...overrides
  };
}

test("CmsPageRenderer renders sections with title and body", () => {
  const html = renderToStaticMarkup(
    <CmsPageRenderer
      sections={[
        makeSection({ id: "s1", title: "Secao A", body: "Corpo A" }),
        makeSection({ id: "s2", title: "Secao B", body: "Corpo B" })
      ]}
    />
  );

  assert.match(html, /Secao A/);
  assert.match(html, /Corpo A/);
  assert.match(html, /Secao B/);
  assert.match(html, /Corpo B/);
  assert.match(html, /cms-renderer/);
});

test("CmsPageRenderer renders empty state when no sections", () => {
  const html = renderToStaticMarkup(<CmsPageRenderer sections={[]} />);

  assert.match(html, /cms-empty/);
  assert.match(html, /nao possui conteudo/i);
});

test("CmsPageRenderer renders section without title when title is null", () => {
  const html = renderToStaticMarkup(
    <CmsPageRenderer
      sections={[makeSection({ id: "s3", title: null, body: "Apenas corpo" })]}
    />
  );

  assert.match(html, /Apenas corpo/);
  assert.doesNotMatch(html, /<h2/);
});

test("CmsPageRenderer omits paragraph when body is null", () => {
  const html = renderToStaticMarkup(
    <CmsPageRenderer
      sections={[makeSection({ id: "s4", title: "So titulo", body: null })]}
    />
  );

  assert.match(html, /So titulo/);
  assert.doesNotMatch(html, /<p style=/);
});
