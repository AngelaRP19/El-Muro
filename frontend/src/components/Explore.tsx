import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Explore({ onTopicSelect }: { onTopicSelect: (topicId: number | string, topicName: string) => void }) {
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [careersData, subjectsData, topicsData] = await Promise.all([
          api.getCareers(),
          api.getSubjects(),
          api.getTopics()
        ]);
        setCareers(Array.isArray(careersData) ? careersData : []);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setTopics(Array.isArray(topicsData) ? topicsData : (topicsData.data || topicsData.items || []));
      } catch (err: any) {
        setError(err.message || 'Error cargando datos de exploración');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><div className="oauth-spinner" /></div>;
  if (error) return <div className="auth-error">{error}</div>;

  // Build the hierarchical tree
  // Career -> Subjects -> Topics
  const query = searchQuery.toLowerCase().trim();

  const filteredHierarchy = careers.map(career => {
    const careerName = (career.nombre || career.name || '').toLowerCase();
    const careerFaculty = (career.faculty || career.facultad || '').toLowerCase();
    const careerMatches = query === '' || careerName.includes(query) || careerFaculty.includes(query);

    // Get subjects for this career
    const careerSubjects = subjects.filter(s => Number(s.careerId) === Number(career.id));

    const matchedSubjects = careerSubjects.map(subject => {
      const subjectName = (subject.name || '').toLowerCase();
      const subjectDesc = (subject.description || '').toLowerCase();
      const subjectMatches = query === '' || subjectName.includes(query) || subjectDesc.includes(query);

      // Get topics for this subject
      // In python, materia_id is an integer. In subjects-service, id is a string ("1", "2", etc.)
      const subjectTopics = topics.filter(t => String(t.materia_id) === String(subject.id));

      const matchedTopics = subjectTopics.filter(topic => {
        const topicName = (topic.name || topic.nombre || '').toLowerCase();
        const topicDesc = (topic.description || '').toLowerCase();
        return query === '' || topicName.includes(query) || topicDesc.includes(query) || careerMatches || subjectMatches;
      });

      // We include this subject if the career matches, the subject matches, or it has matched topics
      if (careerMatches || subjectMatches || matchedTopics.length > 0) {
        return {
          ...subject,
          topics: matchedTopics
        };
      }
      return null;
    }).filter(Boolean) as any[];

    // Include this career if the career itself matches or it has matched subjects
    if (careerMatches || matchedSubjects.length > 0) {
      return {
        ...career,
        subjects: matchedSubjects
      };
    }
    return null;
  }).filter(Boolean) as any[];

  return (
    <div className="explore-container">
      <div className="feed-header animate-slide-up stagger-1">
        <h2 className="feed-title">Explorar</h2>
        <p style={{ color: 'var(--text-muted)' }}>Descubre temas y trabajos de diferentes carreras universitarias.</p>
      </div>

      {/* Premium Search Bar */}
      <div className="search-container animate-slide-up stagger-2" style={{ marginBottom: '32px' }}>
        <div style={{ position: 'relative' }}>
          <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.2rem' }}></i>
          <input
            type="text"
            className="input-glass"
            placeholder="Buscar por carrera, materia o tema (ej. matemáticas)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '14px 14px 14px 48px', boxSizing: 'border-box', borderRadius: '12px', fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* Hierarchical Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="explore-grid-area animate-slide-up stagger-3">
        {filteredHierarchy.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No se encontraron carreras o temas con la búsqueda "{searchQuery}".
          </div>
        ) : (
          filteredHierarchy.map(career => (
            <div key={career.id} className="glass-card" style={{ padding: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(57, 73, 171, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <i className="ph-fill ph-graduation-cap" style={{ fontSize: '1.8rem' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{career.nombre || career.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Facultad: {career.faculty || career.facultad || 'N/A'} • {career.descripcion || career.description || ''}
                  </span>
                </div>
              </div>

              {career.subjects.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No hay asignaturas asociadas a esta búsqueda.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                  {career.subjects.map((subject: any) => (
                    <div key={subject.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                          Semestre {subject.semester}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text)' }}>
                        {subject.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {subject.description || 'Sin descripción'}
                      </p>

                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                          Temas disponibles:
                        </span>
                        {subject.topics.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Ninguno disponible</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {subject.topics.map((topic: any) => (
                              <button
                                key={topic.id}
                                className="btn btn-secondary"
                                onClick={() => onTopicSelect(topic.id, topic.name || topic.nombre)}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                              >
                                {topic.name || topic.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
