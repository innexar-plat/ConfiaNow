import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@platform/cms";
import { Eyebrow, Surface } from "../../../../../../packages/ui/src";
import { CmsPageRenderer } from "../../../components/cms/cms-page-renderer";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPageBySlug(slug);
    return {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.description ?? undefined,
      openGraph: page.ogImage ? { images: [page.ogImage] } : undefined,
      ...(page.canonicalUrl ? { alternates: { canonical: page.canonicalUrl } } : {})
    };
  } catch {
    return { title: slug };
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;

  let page: Awaited<ReturnType<typeof getPageBySlug>>;
  try {
    page = await getPageBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 20 }}>
        <Surface>
          <Eyebrow>Pagina</Eyebrow>
          <h1 style={{ margin: "12px 0" }}>{page!.title}</h1>
          {page!.description ? (
            <p style={{ color: "var(--muted)", maxWidth: 680 }}>{page!.description}</p>
          ) : null}
          <div style={{ marginTop: 16 }}>
            <Link href="/">← Voltar para inicio</Link>
          </div>
        </Surface>

        <Surface>
          <CmsPageRenderer sections={page!.sections} />
        </Surface>
      </div>
    </main>
  );
}
