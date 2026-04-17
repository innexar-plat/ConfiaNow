import Link from "next/link";
import { getTopRatedDiscovery, getTrendingDiscovery, listCategories, listCities, searchBusinesses } from "@platform/discovery";
import { Avatar, EmptyState, Eyebrow, InfoCard, Pill, SectionLabel, StatCard, Surface } from "../../../../packages/ui/src";
import { NavBar } from "../components/nav-bar";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ query?: string; category?: string; city?: string; sortBy?: "relevance" | "name" | "city" }>;
}) {
  const params = await searchParams;
  const [results, trending, topRated, categories, cities] = await Promise.all([
    searchBusinesses(params),
    getTrendingDiscovery(),
    getTopRatedDiscovery(),
    listCategories(),
    listCities()
  ]);

  const hasFilters = !!(params.query || params.category || params.city);

  return (
    <>
      <NavBar activePath="/" />
      <main style={{ minHeight: "100vh", paddingBottom: 80 }}>
        {/* HERO */}
        <section style={{
          background: "linear-gradient(160deg, #eef7f2 0%, var(--bg) 60%)",
          borderBottom: "0.5px solid var(--line)",
          padding: "48px 20px 36px",
        }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div className="anim-fade-up anim-s1" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <span className="tag tag-green">Servicos verificados</span>
              <span className="tag tag-green">Lancamento: Praia Grande - SP</span>
              <span className="tag tag-gray">Expansao para novas cidades habilitada</span>
            </div>
            <h1 className="anim-fade-up anim-s2" style={{ fontSize: "clamp(1.9rem, 5vw, 3.2rem)", fontWeight: 500, lineHeight: 1.2, color: "var(--ink)", maxWidth: 680, marginBottom: 14 }}>
              Encontre quem faz bem feito{" "}
              <span style={{ color: "var(--green-primary)" }}>perto de voce.</span>
            </h1>
            <p className="anim-fade-up anim-s3" style={{ fontSize: 16, color: "var(--muted)", maxWidth: 560, lineHeight: 1.65, marginBottom: 28 }}>
              Todo profissional aqui passou por verificacao de documentos, biometria facial e checagem de antecedentes. Sem chute. Sem risco.
            </p>
            <form method="get" className="anim-fade-up anim-s4" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, maxWidth: 860, marginBottom: 20 }}>
              <input name="query" defaultValue={params.query ?? ""} placeholder="O que voce precisa? Ex: eletricista" className="form-input" style={{ borderRadius: "var(--radius-lg)" }} />
              <select name="category" defaultValue={params.category ?? ""} className="form-input" style={{ borderRadius: "var(--radius-lg)" }}>
                <option value="">Categoria</option>
                {categories.map((cat) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
              </select>
              <select name="city" defaultValue={params.city ?? ""} className="form-input" style={{ borderRadius: "var(--radius-lg)" }}>
                <option value="">Cidade</option>
                {cities.map((city) => <option key={city.id} value={city.slug}>{city.name} - {city.stateCode}</option>)}
              </select>
              <button type="submit" className="btn btn-primary btn-md" style={{ borderRadius: "var(--radius-lg)", paddingLeft: 24, paddingRight: 24 }}>Buscar</button>
            </form>
            <div className="anim-fade-up anim-s5" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Eletricista", "Encanador", "Pintor", "Diarista", "Marceneiro"].map((cat) => (
                <a key={cat} href={`/?query=${cat}`} className="tag tag-green" style={{ fontSize: 13, padding: "6px 14px", fontWeight: 500, cursor: "pointer" }}>{cat}</a>
              ))}
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 20px 0", display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(280px,0.9fr)", gap: 24, alignItems: "start" }}>

          {/* Results */}
          <div style={{ display: "grid", gap: 16 }}>
            {hasFilters && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Filtros ativos:</span>
                {params.query    && <Pill variant="green">{params.query}</Pill>}
                {params.category && <Pill variant="green">Cat: {params.category}</Pill>}
                {params.city     && <Pill variant="green">Cidade: {params.city}</Pill>}
                <Pill variant="gray">{results.length} resultado{results.length !== 1 ? "s" : ""}</Pill>
                <a href="/" style={{ fontSize: 13, color: "var(--subtle)" }}>Limpar</a>
              </div>
            )}

            <Surface style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "0.5px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Eyebrow>{hasFilters ? "Resultados da busca" : "Prestadores em destaque"}</Eyebrow>
                <span style={{ fontSize: 12, color: "var(--subtle)" }}>{results.length} encontrado{results.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ padding: "14px 20px", display: "grid", gap: 12 }}>
                {results.length > 0 ? results.map((business) => (
                  <article key={business.id} className="card-lift" style={{ padding: 16, background: "var(--surface)", border: "0.5px solid var(--line)", borderRadius: "var(--radius-lg)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <Avatar initials={business.businessName.slice(0, 2).toUpperCase()} size={44} color="green" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "var(--ink)" }}>{business.businessName}</p>
                          {business.headline && <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0" }}>{business.headline}</p>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {business.trustBadge !== "none" && <span className="tag tag-green">Verificado</span>}
                          <Pill variant="gray">Trust {business.trustScore}</Pill>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {business.city && <Pill variant="gray">{business.city}{business.stateCode ? ` - ${business.stateCode}` : ""}</Pill>}
                        {business.categories.slice(0, 3).map((cat) => <Pill key={`${business.id}-${cat}`} variant="gray">{cat}</Pill>)}
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
                        <Link href={`/businesses/${business.slug}`} className="btn btn-sm btn-primary">Ver perfil</Link>
                        <span style={{ fontSize: 12, color: "var(--subtle)" }}>Score {Math.round(business.rankingScore)}</span>
                      </div>
                    </div>
                  </article>
                )) : <EmptyState message="Nenhum prestador encontrado com esses filtros. Tente remover um filtro ou buscar outra categoria." />}
              </div>
            </Surface>

            <Surface>
              <Eyebrow>Por que a ConfiaNow e diferente</Eyebrow>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  { icon: "🪪", title: "Documentos verificados", desc: "CPF, RG/CNH conferidos em base federal antes de aparecer na busca." },
                  { icon: "🤳", title: "Biometria facial", desc: "Selfie com documento confirma a identidade em tempo real." },
                  { icon: "🛡️", title: "Antecedentes checados", desc: "Analise criminal renovada anualmente para manter o selo ativo." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ padding: 16, background: "var(--surface-secondary)", borderRadius: "var(--radius-lg)" }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: "8px 0 4px", color: "var(--ink)" }}>{title}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </Surface>

            <div style={{ padding: "20px 24px", background: "var(--green-surface)", border: "0.5px solid var(--green-border)", borderRadius: "var(--radius-xl)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--green-anchor)", margin: "0 0 4px" }}>E prestador de servicos?</p>
                <p style={{ fontSize: 13, color: "var(--green-primary)", margin: 0 }}>Junte-se a quem ja e verificado e recebe leads qualificados.</p>
              </div>
              <Link href="/register/business" className="btn btn-primary btn-md">Quero ser parceiro</Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: "grid", gap: 16 }}>
            <Surface style={{ padding: 18 }}>
              <SectionLabel>Plataforma ao vivo</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <StatCard value={results.length || "—"} label="Prestadores" />
                <StatCard value={cities.length || "—"} label="Cidades" />
                <StatCard value={categories.length || "—"} label="Categorias" accent />
                <StatCard value="4.8" label="Nota media" accent />
              </div>
            </Surface>

            <Surface style={{ padding: 18 }}>
              <SectionLabel>Categorias em alta</SectionLabel>
              <div style={{ display: "grid", gap: 4 }}>
                {trending.categories.slice(0, 6).map((cat) => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="nav-link" style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span>{cat.name}</span>
                    <span className="tag tag-gray">{cat.businessCount}</span>
                  </Link>
                ))}
              </div>
            </Surface>

            {trending.cities.length > 0 && (
              <Surface style={{ padding: 18 }}>
                <SectionLabel>Cidades ativas</SectionLabel>
                <div style={{ display: "grid", gap: 4 }}>
                  {trending.cities.slice(0, 4).map((city) => (
                    <a key={city.id} href={`/?city=${city.slug}`} className="nav-link" style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                      <span>📍 {city.name} - {city.stateCode}</span>
                      <span className="tag tag-gray">{city.businessCount}</span>
                    </a>
                  ))}
                </div>
              </Surface>
            )}

            {topRated.length > 0 && (
              <Surface style={{ padding: 18 }}>
                <SectionLabel>Mais confiaveis</SectionLabel>
                <div style={{ display: "grid", gap: 10 }}>
                  {topRated.slice(0, 3).map((business) => (
                    <InfoCard key={`top-${business.id}`} lift style={{ padding: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Avatar initials={business.businessName.slice(0, 2).toUpperCase()} size={32} color="green" />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{business.businessName}</p>
                          <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                            {business.trustBadge !== "none" && <span className="tag tag-green" style={{ fontSize: 10 }}>Verificado</span>}
                            <span className="tag tag-gray" style={{ fontSize: 10 }}>Trust {business.trustScore}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/businesses/${business.slug}`} style={{ display: "block", marginTop: 8, fontSize: 12, color: "var(--green-primary)", fontWeight: 500 }}>Ver perfil</Link>
                    </InfoCard>
                  ))}
                </div>
              </Surface>
            )}

            <Surface style={{ padding: 18 }}>
              <SectionLabel>Como acessar</SectionLabel>
              <div style={{ display: "grid", gap: 8 }}>
                <InfoCard style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>👤</span>
                    <strong style={{ fontSize: 13, color: "var(--ink)" }}>Sou cliente</strong>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5 }}>Busque, compare e contrate prestadores verificados.</p>
                  <Link href="/register/client" className="btn btn-sm btn-primary btn-block" style={{ textAlign: "center" }}>Criar conta gratis</Link>
                </InfoCard>
                <InfoCard style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>🏢</span>
                    <strong style={{ fontSize: 13, color: "var(--ink)" }}>Sou prestador</strong>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5 }}>Publique seu perfil, passe pela verificacao e receba leads.</p>
                  <Link href="/register/business" className="btn btn-sm btn-green-soft btn-block" style={{ textAlign: "center" }}>Cadastrar negocio</Link>
                </InfoCard>
                <Link href="/signin" style={{ fontSize: 12, color: "var(--subtle)", paddingTop: 4, display: "block" }}>Ja tenho conta — entrar</Link>
              </div>
            </Surface>
          </aside>
        </div>
      </main>
    </>
  );
}
