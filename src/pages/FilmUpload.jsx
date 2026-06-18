import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFilm, getFilmmakers } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function FilmUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFilmmaker = user?.role === 'filmmaker';
  const isDistributor = user?.role === 'aggregator_admin';
  const [filmmakers, setFilmmakers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [uploadPct, setUploadPct] = useState(0);   // 0-100 during HTTP upload
  const [phase, setPhase] = useState('');           // 'uploading' | 'encrypting' | 'done' | 'error'
  const [form, setForm] = useState({
    title: '', dur_mins: '', dur_secs: '0', language: 'Hindi', certificate: 'U',
    synopsis: '', filmmaker_id: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);

  useEffect(() => {
    // Only platform admin needs the filmmaker dropdown
    if (!isFilmmaker && !isDistributor) {
      getFilmmakers().then(r => setFilmmakers(r.data)).catch(() => {});
    }
  }, [isFilmmaker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) return alert('Please select a video file');
    setUploading(true);
    setUploadPct(0);
    setPhase('uploading');
    setProgress('');

    const fd = new FormData();
    fd.append('title', form.title);
    const totalMinutes = (parseInt(form.dur_mins) || 0) + (parseInt(form.dur_secs) || 0) / 60;
    fd.append('duration_minutes', totalMinutes.toFixed(6));
    fd.append('language', form.language);
    fd.append('certificate', form.certificate);
    fd.append('synopsis', form.synopsis);
    if (form.filmmaker_id) fd.append('filmmaker_id', form.filmmaker_id);
    fd.append('video', videoFile);
    if (posterFile) fd.append('poster', posterFile);

    try {
      await uploadFilm(fd, (evt) => {
        if (evt.total) {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadPct(pct);
          if (pct >= 100) setPhase('encrypting');
        }
      });
      setPhase('done');
      setUploadPct(100);
      setTimeout(() => navigate('/films'), 1800);
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg;
      if (Array.isArray(detail)) {
        msg = detail.map(d => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        msg = detail;
      } else {
        msg = err.message || 'Unknown error';
      }
      setPhase('error');
      setProgress(msg);
    }
    setUploading(false);
  };

  return (
    <div>
      <h2 style={{ color: '#f1f5f9' }}>
        {isFilmmaker ? 'Upload Your Film' : isDistributor ? 'Upload Film to Your Catalog' : 'Upload New Film'}
      </h2>
      {(isFilmmaker || isDistributor) && (
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Your film will be encrypted with AES-256 and only unlocked when a screening key is generated. No one else can access it.
        </p>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input style={styles.input} required value={form.title}
              onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div style={styles.fieldSm}>
            <label style={styles.label}>Duration *</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input style={{ ...styles.input, width: '64px', textAlign: 'center' }}
                type="number" required min="0" max="999" placeholder="0"
                value={form.dur_mins}
                onChange={e => setForm({ ...form, dur_mins: e.target.value })} />
              <span style={{ color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>min</span>
              <input style={{ ...styles.input, width: '56px', textAlign: 'center' }}
                type="number" required min="0" max="59" placeholder="0"
                value={form.dur_secs}
                onChange={e => setForm({ ...form, dur_secs: Math.min(59, parseInt(e.target.value) || 0) })} />
              <span style={{ color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>sec</span>
            </div>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Language *</label>
            <select style={styles.input} value={form.language}
              onChange={e => setForm({...form, language: e.target.value})}>
              {['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'].map(l =>
                <option key={l} value={l}>{l}</option>
              )}
            </select>
          </div>
          <div style={styles.fieldSm}>
            <label style={styles.label}>Certificate</label>
            <select style={styles.input} value={form.certificate}
              onChange={e => setForm({...form, certificate: e.target.value})}>
              {['U', 'UA', 'A', 'S'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {!isFilmmaker && !isDistributor && (
            <div style={styles.field}>
              <label style={styles.label}>Filmmaker</label>
              <select style={styles.input} value={form.filmmaker_id}
                onChange={e => setForm({...form, filmmaker_id: e.target.value})}>
                <option value="">— None —</option>
                {filmmakers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.email})</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{...styles.field, marginBottom: '1rem'}}>
          <label style={styles.label}>Synopsis</label>
          <textarea style={{...styles.input, minHeight: '80px'}} value={form.synopsis}
            onChange={e => setForm({...form, synopsis: e.target.value})} />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Video File (MP4) *</label>
            <input type="file" accept="video/*" style={styles.fileInput}
              onChange={e => setVideoFile(e.target.files[0])} />
            {videoFile && <span style={styles.fileName}>{videoFile.name} ({(videoFile.size/1024/1024).toFixed(1)} MB)</span>}
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Poster Image</label>
            <input type="file" accept="image/*" style={styles.fileInput}
              onChange={e => setPosterFile(e.target.files[0])} />
            {posterFile && <span style={styles.fileName}>{posterFile.name}</span>}
          </div>
        </div>

        {phase && (
          <div style={styles.progressBox}>
            {/* Label row */}
            <div style={styles.progressLabel}>
              {phase === 'uploading' && `⬆ Uploading… ${uploadPct}%`}
              {phase === 'encrypting' && '🔐 Encrypting on server…'}
              {phase === 'done' && '✅ Uploaded & encrypted successfully!'}
              {phase === 'error' && `❌ Upload failed: ${progress}`}
            </div>

            {/* Bar */}
            {phase !== 'error' && (
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: phase === 'done' ? '100%' : phase === 'encrypting' ? '100%' : `${uploadPct}%`,
                  background: phase === 'done' ? '#10b981' : '#f59e0b',
                  animation: phase === 'encrypting' ? 'pulse-bar 1.4s ease-in-out infinite' : 'none',
                  opacity: phase === 'encrypting' ? undefined : 1,
                }} />
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes pulse-bar {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>

        <button type="submit" disabled={uploading} style={styles.submitBtn}>
          {uploading ? 'Uploading & Encrypting…' : 'Upload & Encrypt Film'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  form: { background: '#1e293b', borderRadius: '12px', padding: '2rem', marginTop: '1rem' },
  row: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  field: { flex: '1 1 250px', display: 'flex', flexDirection: 'column' },
  fieldSm: { flex: '0 0 150px', display: 'flex', flexDirection: 'column' },
  label: { color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: '0.95rem',
  },
  fileInput: { color: '#94a3b8', marginTop: '0.25rem' },
  fileName: { color: '#10b981', fontSize: '0.8rem', marginTop: '0.25rem' },
  submitBtn: {
    padding: '0.75rem 2rem', borderRadius: '8px', border: 'none',
    background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', fontSize: '1rem',
    cursor: 'pointer', marginTop: '1rem',
  },
  status: { padding: '0.75rem', borderRadius: '8px', color: '#e2e8f0', marginTop: '0.5rem' },
  progressBox: { marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' },
  progressLabel: { color: '#e2e8f0', fontSize: '0.88rem', fontWeight: '500' },
  barTrack: { height: '6px', borderRadius: '99px', background: '#334155', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '99px', transition: 'width 0.3s ease' },
};
