"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type Platform = { id: string; name: string };
type Series = { id: string; name: string; platform_id: string };
type Rating = {
  id: string;
  platform_id: string;
  series_id: string;
  score: number;
  observation: string;
  created_at: string;
};
type Section = "series" | "platforms" | "ratings";

const sections: { id: Section; label: string }[] = [
  { id: "series", label: "Series" },
  { id: "platforms", label: "Plataformas" },
  { id: "ratings", label: "Valoraciones" },
];

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "Ya existe un registro con ese nombre.";
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23503"
  ) {
    return "No se puede eliminar porque hay registros relacionados.";
  }
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function Home() {
  const [section, setSection] = useState<Section>("series");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [seriesPlatformId, setSeriesPlatformId] = useState("");
  const [ratingPlatformId, setRatingPlatformId] = useState("");
  const [ratingSeriesId, setRatingSeriesId] = useState("");
  const [ratingScore, setRatingScore] = useState("5");
  const [ratingObservation, setRatingObservation] = useState("");
  const configured = useMemo(() => isSupabaseConfigured(), []);

  const loadData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }

    setError("");
    try {
      const supabase = getSupabaseClient();
      const [platformResult, seriesResult, ratingResult] = await Promise.all([
        supabase.from("platforms").select("id, name").order("name"),
        supabase
          .from("series")
          .select("id, name, platform_id")
          .order("name"),
        supabase
          .from("ratings")
          .select("id, platform_id, series_id, score, observation, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const failed = [platformResult, seriesResult, ratingResult].find(
        (result) => result.error,
      );
      if (failed?.error) throw failed.error;

      setPlatforms(platformResult.data ?? []);
      setSeries(seriesResult.data ?? []);
      setRatings(ratingResult.data ?? []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar los datos.",
      );
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setEditingId(null);
    setPlatformName("");
    setSeriesName("");
    setSeriesPlatformId("");
    setRatingPlatformId("");
    setRatingSeriesId("");
    setRatingScore("5");
    setRatingObservation("");
    setError("");
  }

  function changeSection(next: Section) {
    resetForm();
    setNotice("");
    setSection(next);
  }

  async function savePlatform(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = platformName.trim();
    if (!name) {
      setError("Ingresa el nombre de la plataforma.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = getSupabaseClient();
      const result = editingId
        ? await supabase.from("platforms").update({ name }).eq("id", editingId)
        : await supabase.from("platforms").insert({ name });
      if (result.error) throw result.error;
      setNotice(editingId ? "Plataforma actualizada." : "Plataforma creada.");
      resetForm();
      await loadData();
    } catch (caught) {
      setError(
        `No se pudo guardar la plataforma. ${getErrorMessage(caught)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = seriesName.trim();
    if (!name || !seriesPlatformId) {
      setError("Ingresa el nombre de la serie y selecciona una plataforma.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = getSupabaseClient();
      const values = { name, platform_id: seriesPlatformId };
      const result = editingId
        ? await supabase.from("series").update(values).eq("id", editingId)
        : await supabase.from("series").insert(values);
      if (result.error) throw result.error;
      setNotice(editingId ? "Serie actualizada." : "Serie creada.");
      resetForm();
      await loadData();
    } catch (caught) {
      setError(
        `No se pudo guardar la serie. ${getErrorMessage(caught)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const score = Number(ratingScore);
    if (
      !ratingPlatformId ||
      !ratingSeriesId ||
      !Number.isInteger(score) ||
      score < 1 ||
      score > 10
    ) {
      setError("Selecciona una plataforma y una serie, y usa un puntaje de 1 a 10.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = getSupabaseClient();
      const values = {
        platform_id: ratingPlatformId,
        series_id: ratingSeriesId,
        score,
        observation: ratingObservation.trim(),
      };
      const result = editingId
        ? await supabase.from("ratings").update(values).eq("id", editingId)
        : await supabase.from("ratings").insert(values);
      if (result.error) throw result.error;
      setNotice(editingId ? "Valoración actualizada." : "Valoración creada.");
      resetForm();
      await loadData();
    } catch (caught) {
      setError(
        `No se pudo guardar la valoración. ${getErrorMessage(caught)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(table: Section, id: string, label: string) {
    if (!window.confirm(`¿Seguro que quieres eliminar ${label}?`)) return;

    setError("");
    setNotice("");
    try {
      const result = await getSupabaseClient().from(table).delete().eq("id", id);
      if (result.error) throw result.error;
      setNotice("Registro eliminado.");
      await loadData();
    } catch (caught) {
      setError(
        `No se pudo eliminar el registro. ${getErrorMessage(caught)}`,
      );
    }
  }

  function editPlatform(platform: Platform) {
    setEditingId(platform.id);
    setPlatformName(platform.name);
    setSection("platforms");
  }

  function editSeries(item: Series) {
    setEditingId(item.id);
    setSeriesName(item.name);
    setSeriesPlatformId(item.platform_id);
    setSection("series");
  }

  function editRating(item: Rating) {
    setEditingId(item.id);
    setRatingPlatformId(item.platform_id);
    setRatingSeriesId(item.series_id);
    setRatingScore(String(item.score));
    setRatingObservation(item.observation);
    setSection("ratings");
  }

  const platformNames = new Map(platforms.map((item) => [item.id, item.name]));
  const seriesNames = new Map(series.map((item) => [item.id, item.name]));
  const filteredRatingSeries = series.filter(
    (item) => item.platform_id === ratingPlatformId,
  );

  if (!configured) {
    return (
      <main className="setup-page">
        <section className="setup-card">
          <div className="brand-mark">S</div>
          <p className="eyebrow">SERIES · CATÁLOGO</p>
          <h1>Conecta tu base de datos</h1>
          <p>
            Para empezar, agrega las credenciales de Supabase a un archivo{" "}
            <code>.env.local</code>. Encontrarás los pasos en el README.
          </p>
          <div className="env-preview">
            <span>NEXT_PUBLIC_SUPABASE_URL=...</span>
            <span>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Series, inicio">
          <span className="brand-mark">S</span>
          <span>series<span className="brand-dot">.</span></span>
        </Link>
        <div className="topbar-right">
          <span className="live-indicator" />
          <span>Catálogo personal</span>
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">TU ESPACIO DE ENTRETENIMIENTO</p>
        <h1>Todo lo que ves,<br /><span>en un solo lugar.</span></h1>
        <p className="intro-copy">
          Organiza tus series, plataformas y opiniones.
        </p>
      </section>

      <section className="stats" aria-label="Resumen del catálogo">
        <div className="stat-card">
          <span className="stat-icon violet">▤</span>
          <div><strong>{series.length}</strong><span>Series</span></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon orange">◉</span>
          <div><strong>{platforms.length}</strong><span>Plataformas</span></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">★</span>
          <div><strong>{ratings.length}</strong><span>Valoraciones</span></div>
        </div>
      </section>

      <section className="workspace">
        <div className="section-tabs" role="tablist" aria-label="Administrar">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={section === item.id}
              className={`tab-button ${section === item.id ? "active" : ""}`}
              onClick={() => changeSection(item.id)}
            >
              {item.label}
              <span className="tab-count">
                {item.id === "series"
                  ? series.length
                  : item.id === "platforms"
                    ? platforms.length
                    : ratings.length}
              </span>
            </button>
          ))}
        </div>

        <div className="content-grid">
          <section className="form-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">{editingId ? "EDITAR REGISTRO" : "NUEVO REGISTRO"}</p>
                <h2>{editingId ? "Actualiza los datos" : `Añadir ${section === "ratings" ? "valoración" : section === "platforms" ? "plataforma" : "serie"}`}</h2>
              </div>
              <span className="heading-plus">{editingId ? "✎" : "+"}</span>
            </div>

            {section === "platforms" && (
              <form onSubmit={savePlatform}>
                <label htmlFor="platform-name">Nombre de la plataforma</label>
                <input
                  id="platform-name"
                  value={platformName}
                  onChange={(event) => setPlatformName(event.target.value)}
                  placeholder="Ej. Netflix"
                  maxLength={100}
                  required
                />
                <div className="form-actions">
                  <button className="primary-button" disabled={saving} type="submit">
                    {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear plataforma"}
                  </button>
                  {editingId && <button className="text-button" type="button" onClick={resetForm}>Cancelar</button>}
                </div>
              </form>
            )}

            {section === "series" && (
              <form onSubmit={saveSeries}>
                <label htmlFor="series-name">Nombre de la serie</label>
                <input
                  id="series-name"
                  value={seriesName}
                  onChange={(event) => setSeriesName(event.target.value)}
                  placeholder="Ej. Stranger Things"
                  maxLength={150}
                  required
                />
                <label htmlFor="series-platform">Plataforma</label>
                <select
                  id="series-platform"
                  value={seriesPlatformId}
                  onChange={(event) => setSeriesPlatformId(event.target.value)}
                  required
                  disabled={platforms.length === 0}
                >
                  <option value="">Selecciona una plataforma</option>
                  {platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {platforms.length === 0 && <p className="field-hint">Primero crea una plataforma.</p>}
                <div className="form-actions">
                  <button className="primary-button" disabled={saving || platforms.length === 0} type="submit">
                    {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear serie"}
                  </button>
                  {editingId && <button className="text-button" type="button" onClick={resetForm}>Cancelar</button>}
                </div>
              </form>
            )}

            {section === "ratings" && (
              <form onSubmit={saveRating}>
                <label htmlFor="rating-platform">Plataforma</label>
                <select
                  id="rating-platform"
                  value={ratingPlatformId}
                  onChange={(event) => {
                    setRatingPlatformId(event.target.value);
                    setRatingSeriesId("");
                  }}
                  required
                  disabled={platforms.length === 0}
                >
                  <option value="">Selecciona una plataforma</option>
                  {platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <label htmlFor="rating-series">Serie</label>
                <select
                  id="rating-series"
                  value={ratingSeriesId}
                  onChange={(event) => setRatingSeriesId(event.target.value)}
                  required
                  disabled={!ratingPlatformId || filteredRatingSeries.length === 0}
                >
                  <option value="">Selecciona una serie</option>
                  {filteredRatingSeries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {platforms.length === 0 && <p className="field-hint">Primero crea una plataforma y una serie.</p>}
                {ratingPlatformId && filteredRatingSeries.length === 0 && <p className="field-hint">No hay series para esta plataforma.</p>}
                <label htmlFor="rating-score">Puntaje <span className="label-hint">1 a 10</span></label>
                <input
                  id="rating-score"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={ratingScore}
                  onChange={(event) => setRatingScore(event.target.value)}
                  required
                />
                <label htmlFor="rating-observation">Observación</label>
                <textarea
                  id="rating-observation"
                  value={ratingObservation}
                  onChange={(event) => setRatingObservation(event.target.value)}
                  placeholder="¿Qué te pareció?"
                  rows={3}
                />
                <div className="form-actions">
                  <button className="primary-button" disabled={saving || platforms.length === 0 || series.length === 0} type="submit">
                    {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear valoración"}
                  </button>
                  {editingId && <button className="text-button" type="button" onClick={resetForm}>Cancelar</button>}
                </div>
              </form>
            )}
          </section>

          <section className="list-card">
            <div className="list-heading">
              <div>
                <p className="eyebrow">TU COLECCIÓN</p>
                <h2>{section === "ratings" ? "Valoraciones" : section === "platforms" ? "Plataformas" : "Series"} <span className="heading-count">({section === "ratings" ? ratings.length : section === "platforms" ? platforms.length : series.length})</span></h2>
              </div>
              <span className="list-spark">✦</span>
            </div>

            {error && <div className="alert error" role="alert">{error}</div>}
            {notice && <div className="alert success" role="status">{notice}</div>}
            {loading ? (
              <div className="empty-state"><span className="loader" />Cargando catálogo...</div>
            ) : section === "platforms" ? (
              platforms.length ? (
                <div className="record-list">
                  {platforms.map((item) => (
                    <article className="record-row" key={item.id}>
                      <span className="row-icon orange">◉</span>
                      <div className="record-main"><strong>{item.name}</strong><span>{series.filter((s) => s.platform_id === item.id).length} series</span></div>
                      <div className="row-actions">
                        <button type="button" aria-label={`Editar ${item.name}`} onClick={() => editPlatform(item)}>Editar</button>
                        <button type="button" className="delete-action" aria-label={`Eliminar ${item.name}`} onClick={() => deleteRecord("platforms", item.id, `la plataforma ${item.name}`)}>Eliminar</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="empty-state">Aún no tienes plataformas. Añade la primera.</div>
            ) : section === "series" ? (
              series.length ? (
                <div className="record-list">
                  {series.map((item) => (
                    <article className="record-row" key={item.id}>
                      <span className="row-icon violet">▤</span>
                      <div className="record-main"><strong>{item.name}</strong><span>{platformNames.get(item.platform_id) ?? "Sin plataforma"}</span></div>
                      <div className="row-actions">
                        <button type="button" aria-label={`Editar ${item.name}`} onClick={() => editSeries(item)}>Editar</button>
                        <button type="button" className="delete-action" aria-label={`Eliminar ${item.name}`} onClick={() => deleteRecord("series", item.id, `la serie ${item.name}`)}>Eliminar</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="empty-state">Aún no tienes series. Añade la primera.</div>
            ) : ratings.length ? (
              <div className="record-list">
                {ratings.map((item) => (
                  <article className="record-row rating-row" key={item.id}>
                    <span className="row-icon green">★</span>
                    <div className="record-main">
                      <strong>{seriesNames.get(item.series_id) ?? "Serie eliminada"}</strong>
                      <span>{platformNames.get(item.platform_id) ?? "Plataforma eliminada"} · {item.observation || "Sin observación"}</span>
                    </div>
                    <span className="score-pill">{item.score}/10</span>
                    <div className="row-actions">
                      <button type="button" aria-label={`Editar valoración de ${seriesNames.get(item.series_id) ?? "serie"}`} onClick={() => editRating(item)}>Editar</button>
                      <button type="button" className="delete-action" aria-label="Eliminar valoración" onClick={() => deleteRecord("ratings", item.id, "la valoración")}>Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state">Aún no tienes valoraciones. Añade la primera.</div>}
          </section>
        </div>
      </section>
      <footer className="footer-note">Hecho para llevar el control de tus próximas historias favoritas.</footer>
    </main>
  );
}
