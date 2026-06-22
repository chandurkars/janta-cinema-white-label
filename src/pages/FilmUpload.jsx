import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFilm, getFilmmakers } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Other'];
const CERTIFICATES = ['U', 'UA', 'A', 'S', 'N/A'];
const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Documentary', 'Animation', 'Sci-Fi', 'Biography', 'Musical', 'Other'];
const CATEGORIES = ['Feature Film', 'Short Film', 'Documentary', 'Web Film', 'Animation', 'Experimental'];

export default function FilmUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFilmmaker = user?.role === 'filmmaker';
  const isDistributor = user?.role === 'aggregator_admin';
  const [filmmakers, setFilmmakers] = useState([]);
  const [phase, setPhase] = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '', dur_mins: '', dur_secs: '0',
    language: 'Hindi', certificate: 'U',
    synopsis: '', director: '', producer: '', cast_list: '',
    music: '', genre: 'Drama', category: 'Feature Film',
    rating: '', filmmaker_id: '',
    foul_language: false, smoking_drugs: false,
    price_1_show: '', price_2_shows: '', price_4_shows: '',
  });

  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [thumbHFile, setThumbHFile] = useState(null);
  const [thumbVFile, setThumbVFile] = useState(null);
  const [thumbHPreview, setThumbHPreview] = useState(null);
  const [thumbVPreview, setThumbVPreview] = useState(null);

  const videoRef = useRef();

  useEffect(() => {
    if (!isFilmmaker && !isDistributor) {
      getFilmmakers().then(r => setFilmmakers(r.data)).catch(() => {});
    }
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pickThumb = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) { setErrorMsg('Please select a video file.'); return; }
    setErrorMsg('');
    setPhase('uploading');
    setUploadPct(0);

    const fd = new FormData();
    fd.append('title', form.title);
    const totalMinutes = (parseInt(form.dur_mins) || 0) + (parseInt(form.dur_secs) || 0) / 60;
    fd.append('duration_minutes', totalMinutes.toFixed(6));
    fd.append('language', form.language);
    fd.append('certificate', form.certificate);
    fd.append('synopsis', form.synopsis);
    fd.append('director', form.director);
    fd.append('producer', form.producer);
    fd.append('cast_list', form.cast_list);
    fd.append('music', form.music);
    fd.append('genre', form.genre);
    fd.append('category', form.category);
    fd.append('rating', form.rating);
    fd.append('foul_language', form.foul_language ? 'true' : 'false');
    fd.append('smoking_drugs', form.smoking_drugs ? 'true' : 'false');
    if (form.price_1_show) fd.append('price_1_show', form.price_1_show);
    if (form.price_2_shows) fd.append('price_2_shows', form.price_2_shows);
    if (form.price_4_shows) fd.append('price_4_shows', form.price_4_shows);
    if (form.filmmaker_id) fd.append('filmmaker_id', form.filmmaker_id);
    fd.append('video', videoFile);
    if (posterFile) fd.append('poster', posterFile);
    if (thumbHFile) fd.append('thumbnail_h', thumbHFile);
    if (thumbVFile) fd.append('thumbnail_v', thumbVFile);

    try {
      await uploadFilm(fd, (evt) => {
        if (evt.total) {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadPct(pct);
          if (pct >= 100) setPhase('encrypting');
        }
      });
      setPhase('done');
      setTimeout(() => navigate('/films'), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : typeof detail === 'string' ? detail : err.message || 'Unknown error';
      setPhase('error');
      setErrorMsg(msg);
    }
  };

  const uploading = ['uploading', 'encrypting'].includes(phase);

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>
            {isFilmmaker ? 'Upload Your Film' : isDistributor ? 'Add to Your Catalogue' : 'Upload New Film'}
          </h2>
          <p style={s.pageSubtitle}>
            Your film will be AES-256 encrypted on upload. Only authorised screening key holders can access it.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Video file ── */}
        <Section title="1. Film File" icon="🎬">
          <DropZone
            file={videoFile}
            onChange={setVideoFile}
            accept="video/*,.mp4,.mov,.avi,.mkv,.wmv,.flv,.webm,.m3u8"
            label="Drag & drop your film here"
            hint="Allowed: mp4, avi, mov, wmv, flv, webm, m3u8 · Max 20 GB"
            inputRef={videoRef}
          />
          {videoFile && (
            <div style={s.fileChip}>
              <span style={s.fileChipIcon}>🎞</span>
              <span style={s.fileChipName}>{videoFile.name}</span>
              <span style={s.fileChipSize}>({(videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB)</span>
              <button type="button" style={s.fileChipRemove} onClick={() => setVideoFile(null)}>✕</button>
            </div>
          )}
        </Section>

        {/* ── Section 2: Core details ── */}
        <Section title="2. Film Details" icon="📋">
          <Row>
            <Field label="Title *" flex={3}>
              <input style={s.input} required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Antarnaad" />
            </Field>
            <Field label="Duration *" flex={1}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input style={{ ...s.input, width: 64, textAlign: 'center' }} type="number" required min="0" max="999" placeholder="120" value={form.dur_mins} onChange={e => set('dur_mins', e.target.value)} />
                <span style={s.unit}>min</span>
                <input style={{ ...s.input, width: 52, textAlign: 'center' }} type="number" min="0" max="59" placeholder="0" value={form.dur_secs} onChange={e => set('dur_secs', Math.min(59, parseInt(e.target.value) || 0))} />
                <span style={s.unit}>sec</span>
              </div>
            </Field>
          </Row>
          <Row>
            <Field label="Language *">
              <select style={s.input} value={form.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Certificate">
              <select style={s.input} value={form.certificate} onChange={e => set('certificate', e.target.value)}>
                {CERTIFICATES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Genre">
              <select style={s.input} value={form.genre} onChange={e => set('genre', e.target.value)}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select style={s.input} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Director">
              <input style={s.input} value={form.director} onChange={e => set('director', e.target.value)} placeholder="e.g. Anurag Kashyap" />
            </Field>
            <Field label="Producer">
              <input style={s.input} value={form.producer} onChange={e => set('producer', e.target.value)} placeholder="e.g. Vikramaditya Motwane" />
            </Field>
            <Field label="Music">
              <input style={s.input} value={form.music} onChange={e => set('music', e.target.value)} placeholder="e.g. A.R. Rahman" />
            </Field>
          </Row>
          <Row>
            <Field label="Cast (comma-separated)" flex={2}>
              <input style={s.input} value={form.cast_list} onChange={e => set('cast_list', e.target.value)} placeholder="e.g. Nawazuddin Siddiqui, Radhika Apte" />
            </Field>
            <Field label="IMDb / Internal Rating">
              <input style={s.input} value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="e.g. 8.2 / 10" />
            </Field>
            {!isFilmmaker && !isDistributor && filmmakers.length > 0 && (
              <Field label="Filmmaker">
                <select style={s.input} value={form.filmmaker_id} onChange={e => set('filmmaker_id', e.target.value)}>
                  <option value="">— None —</option>
                  {filmmakers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
            )}
          </Row>
          <Field label="Synopsis / Description">
            <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical' }} value={form.synopsis} onChange={e => set('synopsis', e.target.value)} placeholder="Brief description of the film…" />
          </Field>

          <div style={s.checkRow}>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={form.foul_language} onChange={e => set('foul_language', e.target.checked)} style={s.checkbox} />
              Contains foul / abusive language
            </label>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={form.smoking_drugs} onChange={e => set('smoking_drugs', e.target.checked)} style={s.checkbox} />
              Depicts smoking, drugs or alcohol consumption
            </label>
          </div>
        </Section>

        {/* ── Section 3: Thumbnails & Poster ── */}
        <Section title="3. Thumbnails & Poster" icon="🖼">
          <p style={s.hint}>Upload two thumbnails for best coverage. Horizontal is shown on the homepage grid; Vertical is used in mobile / app views.</p>
          <Row>
            <Field label="Horizontal Thumbnail (1920 × 1080 recommended)" flex={2}>
              <ThumbPicker
                preview={thumbHPreview}
                onChange={f => pickThumb(f, setThumbHFile, setThumbHPreview)}
                aspect="16/9"
                hint="JPG / PNG · max 5 MB"
              />
            </Field>
            <Field label="Vertical / Portrait Thumbnail (1080 × 1620 recommended)" flex={2}>
              <ThumbPicker
                preview={thumbVPreview}
                onChange={f => pickThumb(f, setThumbVFile, setThumbVPreview)}
                aspect="2/3"
                hint="JPG / PNG · max 5 MB"
              />
            </Field>
            <Field label="Official Poster (any size)">
              <ThumbPicker
                preview={null}
                label={posterFile?.name}
                onChange={f => setPosterFile(f)}
                aspect="2/3"
                hint="Optional"
              />
            </Field>
          </Row>
        </Section>

        {/* ── Section 4: Pricing ── */}
        <Section title="4. Screening Pricing (₹)" icon="💰">
          <p style={s.hint}>Set the price you charge exhibitors per screening package. Leave blank if not for sale yet.</p>
          <Row>
            <Field label="1 Show">
              <div style={s.priceWrap}>
                <span style={s.pricePrefix}>₹</span>
                <input style={{ ...s.input, paddingLeft: 28 }} type="number" min="0" step="100" value={form.price_1_show} onChange={e => set('price_1_show', e.target.value)} placeholder="e.g. 5000" />
              </div>
            </Field>
            <Field label="2 Shows">
              <div style={s.priceWrap}>
                <span style={s.pricePrefix}>₹</span>
                <input style={{ ...s.input, paddingLeft: 28 }} type="number" min="0" step="100" value={form.price_2_shows} onChange={e => set('price_2_shows', e.target.value)} placeholder="e.g. 9000" />
              </div>
            </Field>
            <Field label="4 Shows">
              <div style={s.priceWrap}>
                <span style={s.pricePrefix}>₹</span>
                <input style={{ ...s.input, paddingLeft: 28 }} type="number" min="0" step="100" value={form.price_4_shows} onChange={e => set('price_4_shows', e.target.value)} placeholder="e.g. 16000" />
              </div>
            </Field>
          </Row>
        </Section>

        {/* ── Upload progress ── */}
        {phase && (
          <div style={s.progressBox}>
            <div style={s.progressLabel}>
              {phase === 'uploading' && `⬆ Uploading… ${uploadPct}%`}
              {phase === 'encrypting' && '🔐 Encrypting on server — almost done…'}
              {phase === 'done' && '✅ Uploaded & encrypted! Redirecting to films list…'}
              {phase === 'error' && `❌ ${errorMsg}`}
            </div>
            {phase !== 'error' && (
              <div style={s.barTrack}>
                <div style={{
                  ...s.barFill,
                  width: phase === 'done' ? '100%' : phase === 'encrypting' ? '100%' : `${uploadPct}%`,
                  background: phase === 'done' ? '#10b981' : '#f59e0b',
                  animation: phase === 'encrypting' ? 'pulse-bar 1.4s ease-in-out infinite' : 'none',
                }} />
              </div>
            )}
          </div>
        )}
        {errorMsg && phase !== 'error' && <div style={s.errorBox}>{errorMsg}</div>}

        <style>{`@keyframes pulse-bar { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>

        <button type="submit" disabled={uploading} style={{ ...s.submitBtn, opacity: uploading ? 0.7 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'Uploading & Encrypting…' : 'Upload & Encrypt Film →'}
        </button>
      </form>
    </div>
  );
}

// ── Sub-components ──

function Section({ title, icon, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{icon} {title}</div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={s.row}>{children}</div>;
}

function Field({ label, children, flex = 1 }) {
  return (
    <div style={{ flex: `1 1 ${flex * 160}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function DropZone({ file, onChange, accept, label, hint, inputRef }) {
  const [drag, setDrag] = useState(false);
  const ref = inputRef || useRef();

  return (
    <div
      style={{ ...s.dropZone, borderColor: drag ? '#f59e0b' : '#334155', background: drag ? 'rgba(245,158,11,0.04)' : '#0f172a' }}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onChange(f); }}
      onClick={() => ref.current?.click()}
    >
      <div style={s.dropIcon}>☁</div>
      <div style={s.dropLabel}>{label}</div>
      <div style={s.dropOr}>or</div>
      <button type="button" style={s.chooseBtn} onClick={e => { e.stopPropagation(); ref.current?.click(); }}>CHOOSE FILES</button>
      <div style={s.dropHint}>{hint}</div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]); }} />
    </div>
  );
}

function ThumbPicker({ preview, onChange, aspect, hint, label }) {
  const ref = useRef();
  return (
    <div>
      <div
        style={{ ...s.thumbBox, aspectRatio: aspect, cursor: 'pointer', backgroundImage: preview ? `url(${preview})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
        onClick={() => ref.current?.click()}
      >
        {!preview && (
          <div style={s.thumbPlaceholder}>
            <span style={{ fontSize: '1.8rem' }}>🖼</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{label || 'Click to upload'}</span>
          </div>
        )}
      </div>
      <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 4 }}>{hint}</div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]); }} />
    </div>
  );
}

const s = {
  page: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  pageHeader: { marginBottom: '1.5rem' },
  pageTitle: { color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0' },
  pageSubtitle: { color: '#64748b', fontSize: '0.875rem', margin: 0 },
  section: { background: '#1e293b', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' },
  sectionTitle: { color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.6rem' },
  row: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  label: { color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  unit: { color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  hint: { color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem', lineHeight: 1.5 },
  checkRow: { display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' },
  checkbox: { width: 16, height: 16, cursor: 'pointer', accentColor: '#f59e0b' },
  priceWrap: { position: 'relative' },
  pricePrefix: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.9rem', pointerEvents: 'none' },
  dropZone: {
    border: '2px dashed', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  dropIcon: { fontSize: '3rem', color: '#94bfff', lineHeight: 1 },
  dropLabel: { color: '#94bfff', fontSize: '1.15rem', fontWeight: 600 },
  dropOr: { color: '#475569', fontSize: '0.85rem' },
  chooseBtn: { padding: '0.5rem 2.5rem', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.06em' },
  dropHint: { color: '#475569', fontSize: '0.78rem' },
  fileChip: { display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', borderRadius: 8, padding: '0.5rem 0.75rem', marginTop: 10 },
  fileChipIcon: { fontSize: '1.1rem' },
  fileChipName: { color: '#e2e8f0', fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileChipSize: { color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  fileChipRemove: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px' },
  thumbBox: { width: '100%', background: '#0f172a', borderRadius: 8, border: '1px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80, overflow: 'hidden' },
  thumbPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '1rem' },
  progressBox: { background: '#1e293b', borderRadius: 10, padding: '1rem', marginBottom: '1rem' },
  progressLabel: { color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500, marginBottom: 8 },
  barTrack: { height: 6, borderRadius: 99, background: '#334155', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, transition: 'width 0.3s ease' },
  errorBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1rem' },
  submitBtn: { padding: '0.875rem 2.5rem', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', marginTop: 4 },
};
