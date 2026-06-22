import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getFilm, updateFilmMetadata, deleteFilm, uploadFilmTrailer,
  startVideoMultipartUpload, completeVideoMultipartUpload,
  abortVideoMultipartUpload, getFilmStatus, retryFilmEncryption,
  uploadFilmVideo,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) {
    try {
      const key = new URL(url).pathname.replace(/^\/+/, '');
      if (key) return `${API_BASE}/films/image/${key}`;
    } catch {}
    return url;
  }
  if (url.startsWith('/')) return `${API_BASE}/films/image/${url.replace(/^\/+/, '')}`;
  return `${API_BASE}/films/poster/${url}`;
};

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Other'];
const CERTIFICATES = ['U', 'UA', 'A', 'S', 'N/A'];
const GENRES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Romance', 'Documentary', 'Animation', 'Sci-Fi', 'Biography', 'Musical', 'Other'];
const CATEGORIES = ['Feature Film', 'Short Film', 'Documentary', 'Web Film', 'Animation', 'Experimental'];

const STATUS_COLORS = {
  active: '#10b981',
  processing: '#f59e0b',
  draft: '#64748b',
  paused: '#f97316',
};

export default function FilmManage() {
  const { filmId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Edit details form
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Image replacement
  const [newPoster, setNewPoster] = useState(null);
  const [newThumbH, setNewThumbH] = useState(null);
  const [imgSaving, setImgSaving] = useState(false);
  const [imgMsg, setImgMsg] = useState('');
  const [imgError, setImgError] = useState('');

  // Trailer
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerPhase, setTrailerPhase] = useState('');
  const [trailerError, setTrailerError] = useState('');

  // Video upload (draft state)
  const [videoFile, setVideoFile] = useState(null);
  const [uploadPhase, setUploadPhase] = useState('');
  const [uploadDone, setUploadDone] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [encryptionFailed, setEncryptionFailed] = useState(false);

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false);

  const pollRef = useRef(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const loadFilm = async () => {
    try {
      const res = await getFilm(filmId);
      const f = res.data;
      setFilm(f);
      const durMins = Math.floor(f.duration_minutes || 0);
      const durSecs = Math.round(((f.duration_minutes || 0) % 1) * 60);
      setForm({
        title: f.title || '',
        dur_mins: String(durMins),
        dur_secs: String(durSecs),
        language: f.language || 'Hindi',
        certificate: f.certificate || 'U',
        synopsis: f.synopsis || '',
        director: f.director || '',
        producer: f.producer || '',
        cast_list: f.cast_list || '',
        music: f.music || '',
        genre: f.genre || 'Drama',
        category: f.category || 'Feature Film',
        rating: f.rating || '',
        foul_language: !!f.foul_language,
        smoking_drugs: !!f.smoking_drugs,
        price_1_show: f.price_1_show != null ? String(f.price_1_show) : '',
        price_2_shows: f.price_2_shows != null ? String(f.price_2_shows) : '',
        price_4_shows: f.price_4_shows != null ? String(f.price_4_shows) : '',
      });
    } catch (err) {
      setLoadError(err.response?.data?.detail || 'Failed to load film');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFilm(); }, [filmId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Edit details ──
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
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
    try {
      const res = await updateFilmMetadata(filmId, fd);
      setFilm(res.data);
      setSaveMsg('Details saved successfully.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSaveError(Array.isArray(detail)
        ? detail.map(d => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : typeof detail === 'string' ? detail : err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // ── Update images ──
  const handleUpdateImages = async () => {
    if (!newPoster && !newThumbH) return;
    setImgSaving(true);
    setImgMsg('');
    setImgError('');
    const fd = new FormData();
    if (newPoster) fd.append('poster', newPoster);
    if (newThumbH) fd.append('thumbnail_h', newThumbH);
    try {
      const res = await updateFilmMetadata(filmId, fd);
      setFilm(res.data);
      setNewPoster(null);
      setNewThumbH(null);
      setNewThumbV(null);
      setImgMsg('Images updated.');
    } catch (err) {
      setImgError(err.response?.data?.detail || 'Image update failed.');
    } finally {
      setImgSaving(false);
    }
  };

  // ── Trailer ──
  const handleUploadTrailer = async () => {
    if (!trailerFile) return;
    setTrailerPhase('uploading');
    setTrailerError('');
    const fd = new FormData();
    fd.append('trailer', trailerFile);
    try {
      await uploadFilmTrailer(filmId, fd);
      setTrailerPhase('done');
      await loadFilm();
    } catch (_) {
      setTrailerPhase('error');
      setTrailerError('Trailer upload failed. Try again.');
    }
  };

  // ── Status change ──
  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const { default: api } = await import('../services/api');
      await api.patch(`/films/${filmId}/status?status=${newStatus}`);
      await loadFilm();
    } catch (_) {}
    setStatusUpdating(false);
  };

  // ── Video upload (for draft films) ──
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await getFilmStatus(filmId);
        const status = statusRes.data.status;
        if (status === 'active') {
          clearInterval(pollRef.current);
          setUploadPhase('done');
          await loadFilm();
        } else if (status === 'draft') {
          clearInterval(pollRef.current);
          setEncryptionFailed(true);
          setUploadPhase('error');
          setUploadError('Encryption failed on server. Click "Retry Encryption" to try again without re-uploading.');
        }
      } catch (_) {}
    }, 6000);
  };

  const handleRetryEncryption = async () => {
    setUploadError('');
    setEncryptionFailed(false);
    setUploadPhase('encrypting');
    try {
      await retryFilmEncryption(filmId);
      startPolling();
    } catch (err) {
      setEncryptionFailed(true);
      setUploadPhase('error');
      setUploadError(err.response?.data?.detail || 'Could not start encryption retry.');
    }
  };

  const handleDirectUpload = async () => {
    setUploadPhase('uploading');
    const fd = new FormData();
    fd.append('video', videoFile);
    try {
      await uploadFilmVideo(filmId, fd, (evt) => {
        if (evt.total) {
          setUploadDone(Math.round((evt.loaded / evt.total) * 100));
          setUploadTotal(100);
          if (evt.loaded >= evt.total) setUploadPhase('encrypting');
        }
      });
      setUploadPhase('done');
      await loadFilm();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setUploadPhase('error');
      setUploadError(typeof detail === 'string' ? detail : err.message || 'Upload failed.');
    }
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;
    setUploadError('');
    setUploadPhase('starting');
    let uploadState = null;
    try {
      const startRes = await startVideoMultipartUpload(filmId, videoFile.size);
      uploadState = startRes.data;
      const { upload_id, raw_key, part_size, total_parts, presigned_urls } = uploadState;
      setUploadTotal(total_parts);
      setUploadDone(0);
      setUploadPhase('uploading');
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
            const etag = (res.headers.get('ETag') || res.headers.get('etag') || '').replace(/"/g, '');
            if (!etag) throw new Error(`Part ${partNum}: missing ETag`);
            setUploadDone(prev => prev + 1);
            completedParts.push({ PartNumber: partNum, ETag: `"${etag}"` });
          })
        );
      }
      setUploadPhase('completing');
      completedParts.sort((a, b) => a.PartNumber - b.PartNumber);
      await completeVideoMultipartUpload(filmId, { upload_id, raw_key, parts: completedParts });
      setUploadPhase('encrypting');
      startPolling();
    } catch (err) {
      if (uploadState) {
        abortVideoMultipartUpload(filmId, { upload_id: uploadState.upload_id, raw_key: uploadState.raw_key }).catch(() => {});
      }
      const detail = err.response?.data?.detail || '';
      const isCorsOrNetwork = !err.response && uploadState !== null;
      const isR2NotConfigured = err.response?.status === 400 && detail.includes('R2');
      const smallEnoughForRailway = videoFile.size < 200 * 1024 * 1024;
      if (isR2NotConfigured || (isCorsOrNetwork && smallEnoughForRailway)) {
        await handleDirectUpload();
        return;
      }
      setUploadPhase('error');
      setUploadError(err.message || 'Upload failed.');
    }
  };

  const uploading = ['starting', 'uploading', 'completing', 'encrypting'].includes(uploadPhase);

  // ── Delete ──
  const handleDelete = async () => {
    if (!confirm(`Delete "${film?.title}"?\n\nThis will permanently remove the film and all associated data. This cannot be undone.`)) return;
    try {
      await deleteFilm(filmId);
      navigate('/films');
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  if (loading) return <div style={s.page}><div style={{ color: '#94a3b8', padding: '2rem' }}>Loading...</div></div>;
  if (loadError) return <div style={s.page}><div style={{ color: '#ef4444', padding: '2rem' }}>{loadError}</div></div>;
  if (!film || !form) return null;

  const statusColor = STATUS_COLORS[film.status] || '#64748b';

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <Link to="/films" style={s.backLink}>← Films</Link>
        <div style={s.titleRow}>
          <h2 style={s.filmTitle}>{film.title}</h2>
          <span style={{ ...s.statusBadge, background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}55` }}>
            {film.status}
          </span>
        </div>
        <button onClick={handleDelete} style={s.deleteBtn}>Delete Film</button>
      </div>

      {/* Video & Status */}
      <div style={s.card}>
        <div style={s.cardTitle}>Video & Status</div>
        {film.status === 'draft' && (
          <div>
            {!uploadPhase || uploadPhase === '' ? (
              <p style={s.hint}>No video uploaded yet. Upload and encrypt the film file below.</p>
            ) : null}
            <DropZone
              file={videoFile}
              onChange={setVideoFile}
              accept="video/*,.mp4,.mov,.avi,.mkv,.wmv,.flv,.webm"
              label="Drag & drop your film here"
              hint="Up to 20 GB · AES-256 encrypted on upload"
            />
            {videoFile && (
              <div style={s.fileChip}>
                <span style={{ fontSize: '1.1rem' }}>🎞</span>
                <span style={{ color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{videoFile.name}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>({(videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB)</span>
                <button type="button" style={s.chipRemove} onClick={() => { setVideoFile(null); setUploadPhase(''); setUploadError(''); }}>✕</button>
              </div>
            )}
            {uploadPhase && (
              <div style={s.progressBox}>
                <div style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500, marginBottom: 8 }}>
                  {uploadPhase === 'starting'   && 'Preparing upload...'}
                  {uploadPhase === 'uploading'  && uploadTotal > 0 && `Uploading... ${Math.round((uploadDone / uploadTotal) * 100)}%`}
                  {uploadPhase === 'completing' && 'Finalising upload...'}
                  {uploadPhase === 'encrypting' && 'Encrypting on server...'}
                  {uploadPhase === 'done'       && 'Film encrypted and active!'}
                  {uploadPhase === 'error'      && uploadError}
                </div>
                {!['error', 'done'].includes(uploadPhase) && (
                  <div style={{ height: 6, borderRadius: 99, background: '#334155', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, background: '#f59e0b',
                      width: uploadPhase === 'uploading' && uploadTotal > 0
                        ? `${Math.round((uploadDone / uploadTotal) * 100)}%`
                        : ['encrypting', 'completing'].includes(uploadPhase) ? '100%' : '5%',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={(!videoFile && !encryptionFailed) || uploading || uploadPhase === 'done'}
                onClick={encryptionFailed ? handleRetryEncryption : handleUploadVideo}
                style={{ ...s.primaryBtn, opacity: ((!videoFile && !encryptionFailed) || uploading || uploadPhase === 'done') ? 0.6 : 1 }}
              >
                {uploading ? 'Uploading...' : uploadPhase === 'done' ? 'Done!' : encryptionFailed ? 'Retry Encryption' : 'Upload & Encrypt Film'}
              </button>
              <button
                type="button"
                onClick={handleRetryEncryption}
                disabled={uploading}
                style={s.secondaryBtn}
              >
                Retry Encryption (if already uploaded)
              </button>
            </div>
          </div>
        )}
        {film.status === 'processing' && (
          <div>
            <p style={{ color: '#f59e0b', margin: '0 0 12px' }}>Encryption in progress — check back in a few minutes.</p>
            <button type="button" style={s.secondaryBtn} onClick={loadFilm}>Refresh Status</button>
          </div>
        )}
        {film.status === 'active' && (
          <div>
            <p style={{ color: '#10b981', margin: '0 0 12px' }}>Active — visible on public homepage.</p>
            <button
              type="button"
              style={{ ...s.secondaryBtn, borderColor: '#f97316', color: '#f97316' }}
              disabled={statusUpdating}
              onClick={() => handleStatusChange('paused')}
            >
              {statusUpdating ? 'Updating...' : 'Pause Film'}
            </button>
          </div>
        )}
        {film.status === 'paused' && (
          <div>
            <p style={{ color: '#f97316', margin: '0 0 12px' }}>Paused — hidden from public homepage.</p>
            <button
              type="button"
              style={{ ...s.secondaryBtn, borderColor: '#10b981', color: '#10b981' }}
              disabled={statusUpdating}
              onClick={() => handleStatusChange('active')}
            >
              {statusUpdating ? 'Updating...' : 'Resume Film'}
            </button>
          </div>
        )}
      </div>

      {/* Edit Details */}
      <div style={s.card}>
        <div style={s.cardTitle}>Edit Details</div>
        <form onSubmit={handleSaveDetails}>
          <div style={s.row}>
            <Field label="Title *" flex={3}>
              <input style={s.input} required value={form.title} onChange={e => set('title', e.target.value)} />
            </Field>
            <Field label="Duration" flex={1}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input style={{ ...s.input, width: 64, textAlign: 'center' }} type="number" min="0" max="999" value={form.dur_mins} onChange={e => set('dur_mins', e.target.value)} placeholder="120" />
                <span style={s.unit}>min</span>
                <input style={{ ...s.input, width: 52, textAlign: 'center' }} type="number" min="0" max="59" value={form.dur_secs} onChange={e => set('dur_secs', Math.min(59, parseInt(e.target.value) || 0))} placeholder="0" />
                <span style={s.unit}>sec</span>
              </div>
            </Field>
          </div>
          <div style={s.row}>
            <Field label="Language">
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
          </div>
          <div style={s.row}>
            <Field label="Director">
              <input style={s.input} value={form.director} onChange={e => set('director', e.target.value)} />
            </Field>
            <Field label="Producer">
              <input style={s.input} value={form.producer} onChange={e => set('producer', e.target.value)} />
            </Field>
            <Field label="Music">
              <input style={s.input} value={form.music} onChange={e => set('music', e.target.value)} />
            </Field>
          </div>
          <div style={s.row}>
            <Field label="Cast (comma-separated)" flex={2}>
              <input style={s.input} value={form.cast_list} onChange={e => set('cast_list', e.target.value)} />
            </Field>
            <Field label="Rating">
              <input style={s.input} value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="e.g. 8.2/10" />
            </Field>
          </div>
          <Field label="Synopsis">
            <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical' }} value={form.synopsis} onChange={e => set('synopsis', e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={form.foul_language} onChange={e => set('foul_language', e.target.checked)} style={s.checkbox} />
              Contains foul / abusive language
            </label>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={form.smoking_drugs} onChange={e => set('smoking_drugs', e.target.checked)} style={s.checkbox} />
              Depicts smoking, drugs or alcohol
            </label>
          </div>
          <div style={s.row}>
            {[['1 Show', 'price_1_show'], ['2 Shows', 'price_2_shows'], ['4 Shows', 'price_4_shows']].map(([label, key]) => (
              <Field key={key} label={`Price — ${label} (Rs.)`}>
                <input style={s.input} type="number" min="0" step="100" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="e.g. 5000" />
              </Field>
            ))}
          </div>
          {saveError && <div style={s.errorBox}>{saveError}</div>}
          {saveMsg && <div style={s.successBox}>{saveMsg}</div>}
          <button type="submit" disabled={saving} style={{ ...s.primaryBtn, opacity: saving ? 0.7 : 1, marginTop: 4 }}>
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </form>
      </div>

      {/* Images */}
      <div style={s.card}>
        <div style={s.cardTitle}>Images</div>
        <p style={s.hint}>Click a preview to replace it with a new file.</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: 16 }}>
          <ImagePicker
            label="Horizontal Thumbnail (16:9)"
            currentUrl={resolveUrl(film.thumbnail_h_url)}
            newFile={newThumbH}
            onPick={setNewThumbH}
            aspect="16/9"
          />
          <ImagePicker
            label="Poster (2:3)"
            currentUrl={resolveUrl(film.poster_url)}
            newFile={newPoster}
            onPick={setNewPoster}
            aspect="2/3"
          />
        </div>
        {imgError && <div style={s.errorBox}>{imgError}</div>}
        {imgMsg && <div style={s.successBox}>{imgMsg}</div>}
        <button
          type="button"
          disabled={(!newPoster && !newThumbH) || imgSaving}
          onClick={handleUpdateImages}
          style={{ ...s.primaryBtn, opacity: (!newPoster && !newThumbH) || imgSaving ? 0.6 : 1 }}
        >
          {imgSaving ? 'Uploading...' : 'Update Images'}
        </button>
      </div>

      {/* Trailer */}
      <div style={s.card}>
        <div style={s.cardTitle}>Trailer</div>
        {film.trailer_url ? (
          <p style={{ color: '#10b981', margin: '0 0 12px' }}>Trailer uploaded.</p>
        ) : (
          <p style={s.hint}>No trailer yet. Upload an MP4 trailer (unencrypted, up to 200 MB).</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f172a', border: '1px dashed #334155', borderRadius: 8, padding: '0.75rem 1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.4rem' }}>🎞</span>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ color: trailerFile ? '#10b981' : '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
              {trailerPhase === 'done' ? 'Trailer uploaded!'
                : trailerFile ? trailerFile.name
                : film.trailer_url ? 'Replace trailer' : 'No trailer selected'}
            </div>
            {trailerFile && trailerPhase !== 'done' && (
              <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 2 }}>{(trailerFile.size / 1024 / 1024).toFixed(1)} MB</div>
            )}
            {trailerError && <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 2 }}>{trailerError}</div>}
          </div>
          {trailerPhase !== 'done' && (
            <label style={s.secondaryBtn}>
              {trailerFile ? 'Change' : 'Choose File'}
              <input type="file" accept="video/*,.mp4,.mov,.webm" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) { setTrailerFile(e.target.files[0]); setTrailerPhase(''); setTrailerError(''); } }} />
            </label>
          )}
          {trailerFile && trailerPhase !== 'done' && (
            <button
              type="button"
              disabled={trailerPhase === 'uploading'}
              onClick={handleUploadTrailer}
              style={{ ...s.primaryBtn, padding: '0.45rem 1rem' }}
            >
              {trailerPhase === 'uploading' ? 'Uploading...' : 'Upload Trailer'}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse-bar{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
    </div>
  );
}

// ── Sub-components ──

function Field({ label, children, flex = 1 }) {
  return (
    <div style={{ flex: `1 1 ${flex * 160}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

function ImagePicker({ label, currentUrl, newFile, onPick, aspect }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    onPick(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div style={{ flex: '1 1 160px', maxWidth: 220 }}>
      <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div
        style={{
          width: '100%', aspectRatio: aspect, background: '#0f172a', borderRadius: 8,
          border: `1px dashed ${newFile ? '#f59e0b' : '#334155'}`,
          cursor: 'pointer', overflow: 'hidden', position: 'relative',
          backgroundImage: displayUrl ? `url(${displayUrl})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => ref.current?.click()}
      >
        {!displayUrl && <span style={{ color: '#475569', fontSize: '0.75rem' }}>Click to upload</span>}
        {newFile && (
          <div style={{ position: 'absolute', bottom: 4, right: 4, background: '#f59e0b', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', color: '#0f172a', fontWeight: 700 }}>NEW</div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
    </div>
  );
}

function DropZone({ file, onChange, accept, label, hint }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  return (
    <div
      style={{ border: `2px dashed ${drag ? '#f59e0b' : '#334155'}`, borderRadius: 12, padding: '2.5rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: drag ? 'rgba(245,158,11,0.04)' : '#0f172a' }}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onChange(f); }}
      onClick={() => ref.current?.click()}
    >
      <div style={{ fontSize: '2.5rem', color: '#94bfff', lineHeight: 1 }}>☁</div>
      <div style={{ color: '#94bfff', fontSize: '1rem', fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#475569', fontSize: '0.85rem' }}>or</div>
      <button type="button" style={{ padding: '0.4rem 2rem', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); ref.current?.click(); }}>CHOOSE FILE</button>
      <div style={{ color: '#475569', fontSize: '0.78rem' }}>{hint}</div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]); }} />
    </div>
  );
}

const s = {
  page: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", paddingBottom: '3rem' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: '1.5rem' },
  backLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem', whiteSpace: 'nowrap' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  filmTitle: { color: '#f1f5f9', margin: 0, fontSize: '1.4rem', fontWeight: 700 },
  statusBadge: { padding: '0.2rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' },
  deleteBtn: { background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' },
  card: { background: '#1e293b', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid #334155' },
  cardTitle: { color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.6rem' },
  hint: { color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.75rem', lineHeight: 1.5 },
  row: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  input: { padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  unit: { color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' },
  checkbox: { width: 16, height: 16, cursor: 'pointer', accentColor: '#f59e0b' },
  primaryBtn: { padding: '0.7rem 2rem', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
  secondaryBtn: { padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' },
  errorBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626', color: '#fca5a5', padding: '0.7rem 1rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '0.75rem' },
  successBox: { background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#34d399', padding: '0.7rem 1rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '0.75rem' },
  fileChip: { display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', borderRadius: 8, padding: '0.5rem 0.75rem', marginTop: 10 },
  chipRemove: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px' },
  progressBox: { background: '#0f172a', borderRadius: 10, padding: '1rem', marginTop: 14 },
};
