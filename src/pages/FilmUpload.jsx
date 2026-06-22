import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  saveFilmMetadata, uploadFilmVideo, getFilmmakers,
  startVideoMultipartUpload, completeVideoMultipartUpload,
  abortVideoMultipartUpload, getFilmStatus,
} from '../services/api';
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

  // Step 1 state
  const [step, setStep] = useState(1);          // 1 = metadata, 2 = video
  const [savedFilm, setSavedFilm] = useState(null); // film returned after step 1
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState('');

  // Step 2 state
  const [videoFile, setVideoFile] = useState(null);
  // phases: '' | 'starting' | 'uploading' | 'completing' | 'encrypting' | 'done' | 'error'
  const [uploadPhase, setUploadPhase] = useState('');
  const [uploadDone, setUploadDone] = useState(0);   // parts uploaded so far
  const [uploadTotal, setUploadTotal] = useState(0); // total parts
  const [uploadError, setUploadError] = useState('');
  const pollRef = useRef(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const [form, setForm] = useState({
    title: '', dur_mins: '', dur_secs: '0',
    language: 'Hindi', certificate: 'U',
    synopsis: '', director: '', producer: '', cast_list: '',
    music: '', genre: 'Drama', category: 'Feature Film',
    rating: '', filmmaker_id: '',
    foul_language: false, smoking_drugs: false,
    price_1_show: '', price_2_shows: '', price_4_shows: '',
  });

  const [posterFile, setPosterFile] = useState(null);
  const [thumbHFile, setThumbHFile] = useState(null);
  const [thumbVFile, setThumbVFile] = useState(null);
  const [thumbHPreview, setThumbHPreview] = useState(null);
  const [thumbVPreview, setThumbVPreview] = useState(null);

  useEffect(() => {
    if (!isFilmmaker && !isDistributor) {
      getFilmmakers().then(r => setFilmmakers(r.data)).catch(() => {});
    }
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickThumb = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // ── Step 1: save metadata ──
  const handleSaveMeta = async (e) => {
    e.preventDefault();
    setSavingMeta(true);
    setMetaError('');

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
    if (posterFile) fd.append('poster', posterFile);
    if (thumbHFile) fd.append('thumbnail_h', thumbHFile);
    if (thumbVFile) fd.append('thumbnail_v', thumbVFile);

    try {
      const res = await saveFilmMetadata(fd);
      setSavedFilm(res.data);
      setStep(2);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : typeof detail === 'string' ? detail : err.message || 'Failed to save details.';
      setMetaError(msg);
    } finally {
      setSavingMeta(false);
    }
  };

  // ── Step 2: multipart upload directly to R2, then background encryption ──
  const handleUploadVideo = async () => {
    if (!videoFile) return;
    setUploadError('');
    setUploadPhase('starting');

    let uploadState = null;

    try {
      // 1. Initiate — backend creates multipart upload and returns presigned URLs for all parts
      const startRes = await startVideoMultipartUpload(savedFilm.id, videoFile.size);
      uploadState = startRes.data;
      const { upload_id, raw_key, part_size, total_parts, presigned_urls } = uploadState;

      setUploadTotal(total_parts);
      setUploadDone(0);
      setUploadPhase('uploading');

      // 2. Upload all parts in parallel batches of 4, directly to R2
      const BATCH = 4;
      const completedParts = [];

      for (let batchStart = 1; batchStart <= total_parts; batchStart += BATCH) {
        const batchNums = [];
        for (let n = batchStart; n < batchStart + BATCH && n <= total_parts; n++) batchNums.push(n);

        await Promise.all(
          batchNums.map(async (partNum) => {
            const offset = (partNum - 1) * part_size;
            const chunk = videoFile.slice(offset, offset + part_size);
            const url = presigned_urls[String(partNum)] || presigned_urls[partNum];

            const res = await fetch(url, { method: 'PUT', body: chunk });
            if (!res.ok) throw new Error(`Part ${partNum} failed (HTTP ${res.status})`);

            // R2 returns ETag — may have surrounding quotes, strip them
            const etag = (res.headers.get('ETag') || res.headers.get('etag') || '').replace(/"/g, '');
            if (!etag) throw new Error(`Part ${partNum}: missing ETag in response`);

            setUploadDone(prev => prev + 1);
            completedParts.push({ PartNumber: partNum, ETag: `"${etag}"` });
          })
        );
      }

      // 3. Complete — backend assembles parts and launches background encryption
      setUploadPhase('completing');
      completedParts.sort((a, b) => a.PartNumber - b.PartNumber);
      await completeVideoMultipartUpload(savedFilm.id, { upload_id, raw_key, parts: completedParts });

      // 4. Poll every 6 seconds until status is 'active' or back to 'draft' (failure)
      setUploadPhase('encrypting');
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await getFilmStatus(savedFilm.id);
          const status = statusRes.data.status;
          if (status === 'active') {
            clearInterval(pollRef.current);
            setUploadPhase('done');
            setTimeout(() => navigate('/films'), 2500);
          } else if (status === 'draft') {
            clearInterval(pollRef.current);
            setUploadPhase('error');
            setUploadError('Server encryption failed. The film metadata is saved — click "Upload Again" to retry the video.');
          }
        } catch (_) {}
      }, 6000);

    } catch (err) {
      if (uploadState) {
        abortVideoMultipartUpload(savedFilm.id, {
          upload_id: uploadState.upload_id,
          raw_key: uploadState.raw_key,
        }).catch(() => {});
      }

      // Decide whether to fall back to direct Railway upload:
      //   • Backend says R2 not configured (400 + 'R2' in detail)  → always fall back
      //   • CORS error (no response — browser blocked the R2 PUT)   → fall back if < 200 MB
      //     (larger files will OOM Railway's in-memory encryption)
      const detail = err.response?.data?.detail || '';
      const isCorsOrNetwork = !err.response && uploadState !== null; // failed after start, no HTTP response
      const isR2NotConfigured = err.response?.status === 400 && detail.includes('R2');
      const smallEnoughForRailway = videoFile.size < 200 * 1024 * 1024; // 200 MB

      if (isR2NotConfigured || (isCorsOrNetwork && smallEnoughForRailway)) {
        if (isCorsOrNetwork) {
          console.warn('R2 CORS not configured — falling back to direct Railway upload (file < 200 MB)');
        }
        await handleDirectUpload();
        return;
      }

      if (isCorsOrNetwork && !smallEnoughForRailway) {
        setUploadPhase('error');
        setUploadError(
          `Cloud storage CORS is not configured. Files larger than 200 MB cannot be uploaded until ` +
          `your R2 bucket allows cross-origin PUT requests. Please contact the platform admin.`
        );
        return;
      }

      setUploadPhase('error');
      setUploadError(err.message || 'Upload failed. Please try again.');
    }
  };

  // Legacy direct upload (dev mode / no R2)
  const handleDirectUpload = async () => {
    setUploadPhase('uploading');
    const fd = new FormData();
    fd.append('video', videoFile);
    try {
      await uploadFilmVideo(savedFilm.id, fd, (evt) => {
        if (evt.total) {
          setUploadDone(Math.round((evt.loaded / evt.total) * 100));
          setUploadTotal(100);
          if (evt.loaded >= evt.total) setUploadPhase('encrypting');
        }
      });
      setUploadPhase('done');
      setTimeout(() => navigate('/films'), 2500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setUploadPhase('error');
      setUploadError(typeof detail === 'string' ? detail : err.message || 'Upload failed.');
    }
  };

  const uploading = ['starting', 'uploading', 'completing', 'encrypting'].includes(uploadPhase);

  // ── Render ──
  return (
    <div style={s.page}>
      {/* Step indicator */}
      <div style={s.stepBar}>
        <StepDot n={1} active={step === 1} done={step > 1} label="Film Details" />
        <div style={{ ...s.stepLine, background: step > 1 ? '#10b981' : '#334155' }} />
        <StepDot n={2} active={step === 2} done={uploadPhase === 'done'} label="Upload Video" />
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <form onSubmit={handleSaveMeta}>
          <Section title="1. Basic Info" icon="📋">
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
              <Field label="Rating">
                <input style={s.input} value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="e.g. 8.2/10" />
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
                Depicts smoking, drugs or alcohol
              </label>
            </div>
          </Section>

          <Section title="2. Thumbnails & Poster" icon="🖼">
            <p style={s.hint}>Horizontal thumbnail is shown on the film catalogue grid. Vertical is used in mobile / detail views.</p>
            <Row>
              <Field label="Horizontal (1920 × 1080)" flex={2}>
                <ThumbPicker preview={thumbHPreview} onChange={f => pickThumb(f, setThumbHFile, setThumbHPreview)} aspect="16/9" hint="JPG / PNG · max 5 MB" />
              </Field>
              <Field label="Vertical / Portrait (1080 × 1620)" flex={2}>
                <ThumbPicker preview={thumbVPreview} onChange={f => pickThumb(f, setThumbVFile, setThumbVPreview)} aspect="2/3" hint="JPG / PNG · max 5 MB" />
              </Field>
              <Field label="Official Poster">
                <ThumbPicker preview={null} label={posterFile?.name} onChange={f => setPosterFile(f)} aspect="2/3" hint="Optional" />
              </Field>
            </Row>
          </Section>

          <Section title="3. Screening Pricing (₹)" icon="💰">
            <p style={s.hint}>Leave blank if not for sale yet.</p>
            <Row>
              {[['1 Show', 'price_1_show', '5000'], ['2 Shows', 'price_2_shows', '9000'], ['4 Shows', 'price_4_shows', '16000']].map(([label, key, ph]) => (
                <Field key={key} label={label}>
                  <div style={s.priceWrap}>
                    <span style={s.pricePrefix}>₹</span>
                    <input style={{ ...s.input, paddingLeft: 28 }} type="number" min="0" step="100" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={`e.g. ${ph}`} />
                  </div>
                </Field>
              ))}
            </Row>
          </Section>

          {metaError && <div style={s.errorBox}>❌ {metaError}</div>}

          <button type="submit" disabled={savingMeta} style={{ ...s.submitBtn, opacity: savingMeta ? 0.7 : 1 }}>
            {savingMeta ? 'Saving Details…' : 'Save Details & Continue →'}
          </button>
        </form>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div>
          <div style={s.savedBanner}>
            <span style={s.savedIcon}>✅</span>
            <div>
              <strong style={{ color: '#34d399' }}>"{savedFilm?.title}" saved!</strong>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>
                Details and thumbnails are stored. Now upload the video file to complete the film.
              </div>
            </div>
          </div>

          <Section title="Upload Film Video" icon="🎬">
            <p style={s.hint}>Allowed: mp4, avi, mov, wmv, flv, webm · Your film will be AES-256 encrypted on the server.</p>
            <DropZone
              file={videoFile}
              onChange={setVideoFile}
              accept="video/*,.mp4,.mov,.avi,.mkv,.wmv,.flv,.webm"
              label="Drag & drop your film here"
              hint="Up to 20 GB"
            />
            {videoFile && (
              <div style={s.fileChip}>
                <span style={s.fileChipIcon}>🎞</span>
                <span style={s.fileChipName}>{videoFile.name}</span>
                <span style={s.fileChipSize}>({(videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB)</span>
                <button type="button" style={s.fileChipRemove} onClick={() => { setVideoFile(null); setUploadPhase(''); setUploadError(''); }}>✕</button>
              </div>
            )}

            {uploadPhase && (
              <div style={{ ...s.progressBox, marginTop: 16 }}>
                <div style={s.progressLabel}>
                  {uploadPhase === 'starting'   && '⏳ Preparing upload…'}
                  {uploadPhase === 'uploading'  && `☁ Uploading directly to cloud… ${uploadDone} / ${uploadTotal} parts`}
                  {uploadPhase === 'completing' && '🔗 Finalising upload on cloud…'}
                  {uploadPhase === 'encrypting' && '🔐 Encrypting on server — this may take a few minutes for large films…'}
                  {uploadPhase === 'done'       && '✅ Film ready! Redirecting to films list…'}
                  {uploadPhase === 'error'      && `❌ ${uploadError}`}
                </div>
                {!['error', 'done'].includes(uploadPhase) && (
                  <div style={s.barTrack}>
                    <div style={{
                      ...s.barFill,
                      width: uploadPhase === 'uploading' && uploadTotal > 0
                        ? `${Math.round((uploadDone / uploadTotal) * 100)}%`
                        : ['encrypting', 'completing'].includes(uploadPhase) ? '100%' : '5%',
                      background: '#f59e0b',
                      animation: ['starting', 'completing', 'encrypting'].includes(uploadPhase)
                        ? 'pulse-bar 1.4s ease-in-out infinite' : 'none',
                    }} />
                  </div>
                )}
                {uploadPhase === 'uploading' && uploadTotal > 0 && (
                  <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 4 }}>
                    {Math.round((uploadDone / uploadTotal) * 100)}% — file travels directly to cloud storage, bypassing the server
                  </div>
                )}
                {uploadPhase === 'encrypting' && (
                  <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 4 }}>
                    AES-256 encryption running on server — page will auto-advance when done
                  </div>
                )}
              </div>
            )}

            {uploadPhase === 'error' && (
              <div style={s.retryHint}>
                ↩ The film details are already saved. You can retry the video upload above, or come back later and upload from the Films list.
              </div>
            )}
          </Section>

          <style>{`@keyframes pulse-bar { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              disabled={!videoFile || uploading || uploadPhase === 'done'}
              onClick={handleUploadVideo}
              style={{ ...s.submitBtn, opacity: (!videoFile || uploading || uploadPhase === 'done') ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading…' : uploadPhase === 'done' ? '✅ Done!' : uploadPhase === 'error' ? 'Upload Again →' : 'Upload & Encrypt Film →'}
            </button>
            {uploadPhase !== 'done' && (
              <button type="button" onClick={() => navigate('/films')} style={s.skipBtn}>
                Skip for now (upload later)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function StepDot({ n, active, done, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.9rem',
        background: done ? '#10b981' : active ? '#f59e0b' : '#334155',
        color: done || active ? '#0f172a' : '#64748b',
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: '0.7rem', color: active ? '#f59e0b' : done ? '#10b981' : '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

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

function DropZone({ file, onChange, accept, label, hint }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
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
      <button type="button" style={s.chooseBtn} onClick={e => { e.stopPropagation(); ref.current?.click(); }}>CHOOSE FILE</button>
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
  stepBar: { display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem', justifyContent: 'center', paddingTop: '0.5rem' },
  stepLine: { flex: '0 0 80px', height: 2, margin: '0 8px', marginBottom: 20 },
  savedBanner: { display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  savedIcon: { fontSize: '1.6rem' },
  retryHint: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '0.75rem 1rem', color: '#fbbf24', fontSize: '0.82rem', marginTop: 10, lineHeight: 1.5 },
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
  dropZone: { border: '2px dashed', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  dropIcon: { fontSize: '3rem', color: '#94bfff', lineHeight: 1 },
  dropLabel: { color: '#94bfff', fontSize: '1.1rem', fontWeight: 600 },
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
  progressBox: { background: '#0f172a', borderRadius: 10, padding: '1rem' },
  progressLabel: { color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500, marginBottom: 8 },
  barTrack: { height: 6, borderRadius: 99, background: '#334155', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, transition: 'width 0.3s ease' },
  errorBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1rem' },
  submitBtn: { padding: '0.875rem 2.5rem', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', letterSpacing: '-0.01em', marginTop: 4 },
  skipBtn: { padding: '0.875rem 1.5rem', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' },
};
