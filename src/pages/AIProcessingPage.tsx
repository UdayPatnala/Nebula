import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../providers';
import { api } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Loader } from '../components/Loader';

const PIPELINE_STEPS = [
  { name: 'File Integrity Validation', desc: 'Checking codecs, resolutions and corrupt headers.' },
  { name: 'Metadata Extraction', desc: 'Parsing EXIF details, timestamps and GPS headers.' },
  { name: 'Visual Ingestion & Quality Analysis', desc: 'Evaluating brightness, contrast, blur, and noise levels.' },
  { name: 'Object & Location Classification', desc: 'Running vision transformers to index tags and scenes.' },
  { name: 'Facial Grouping & Recognition', desc: 'Extracting landmarks and grouping matching faces.' },
  { name: 'Semantic Knowledge Indexing', desc: 'Generating text stories and contextual relationships.' }
];

const MOCK_FILES = [
  'beach_sunset.jpg',
  'family_dinner.jpg',
  'mountain_hike.mov',
  'camp_fire.jpg',
  'city_skyline.jpg',
  'group_selfie.png',
  'delicious_dessert.jpg',
  'waterfall_slowmo.mp4'
];

export default function AIProcessingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [projectName, setProjectName] = useState('Loading...');

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load project context
  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      const res = await api.projects.getById(projectId);
      if (res.success && res.data) {
        setProjectName(res.data.name);
      }
    }
    loadProject();
  }, [projectId]);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Run Simulated AI Pipeline
  useEffect(() => {
    let logIndex = 0;
    const interval = setInterval(() => {
      if (progress >= 100) {
        clearInterval(interval);
        setCompleted(true);
        // Complete project status transitions
        if (projectId) {
          api.projects.update(projectId, { status: 'ready' });
        }
        showToast('AI pipeline completed successfully! Project is ready.', 'success');
        return;
      }

      // Increment progress
      const nextProgress = progress + 2;
      setProgress(nextProgress);

      // Transition pipeline steps
      const stepIndex = Math.min(
        PIPELINE_STEPS.length - 1,
        Math.floor((nextProgress / 100) * PIPELINE_STEPS.length)
      );
      setActiveStep(stepIndex);

      // Rotate active processing files
      const fileIndex = Math.floor((nextProgress / 100) * MOCK_FILES.length);
      const activeFile = MOCK_FILES[fileIndex];
      setCurrentFile(activeFile);

      // Generate realistic logs
      const logSeed = Math.random();
      if (logSeed > 0.4) {
        const fileLogs = [
          `[Validation] Verified integrity checksum for ${activeFile}`,
          `[EXIF] Extracted timestamp: ${new Date(Date.now() - Math.random() * 10000000).toLocaleDateString()}`,
          `[Quality] Analysis: sharpness=${(0.7 + Math.random() * 0.3).toFixed(2)}, brightness=${(0.5 + Math.random() * 0.4).toFixed(2)}`,
          `[Object] Detected labels: ${['outdoor', 'nature', 'people', 'travel', 'food'][fileIndex % 5]}, probability=98.7%`,
          `[Facial] Face group created: person_${Math.floor(Math.random() * 3) + 1} matching landmark weights`,
          `[Semantic] Ingested item into timeline context database`
        ];
        const randomLog = fileLogs[logIndex % fileLogs.length];
        setLogs((prev) => [...prev, randomLog]);
        logIndex++;
      }
    }, 200);

    return () => clearInterval(interval);
  }, [progress, projectId, showToast]);

  const handleNext = () => {
    navigate(`/projects/${projectId}`); // Navigate to review page
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
            AI Media Processing
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Analyzing files for project: <strong style={{ color: 'var(--color-text-primary)' }}>{projectName}</strong>
          </p>
        </div>
        <Badge type={completed ? 'success' : 'info'}>
          {completed ? 'Complete' : 'Processing'}
        </Badge>
      </header>

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: 'var(--spacing-lg)',
        alignItems: 'start'
      }}>
        {/* Left Column: Progress Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>Pipeline Status</h3>
            
            {/* Steps Vertical List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {PIPELINE_STEPS.map((step, idx) => {
                const isCurrent = idx === activeStep && !completed;
                const isPassed = idx < activeStep || completed;
                
                return (
                  <div key={step.name} style={{
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    opacity: isPassed || isCurrent ? 1 : 0.4,
                    transition: 'opacity var(--transition-normal)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      background: isPassed ? 'var(--color-success)' : isCurrent ? 'var(--gradient-primary)' : 'var(--color-bg-base)',
                      border: isPassed ? 'none' : '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isPassed || isCurrent ? '#fff' : 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-label)',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 var(--spacing-xxs) 0', fontSize: 'var(--font-size-label)' }}>
                        {step.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Progress Monitor & Console Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>Analysis Feed</h3>

            {/* Ingestion status bar */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-label)' }}>
                <span>Overall Ingestion Progress</span>
                <span style={{ fontWeight: 'bold' }}>{progress}%</span>
              </div>
              <div style={{
                height: '10px',
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--gradient-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.2s ease-out'
                }} />
              </div>
            </div>

            {/* Current Item Indicator */}
            {!completed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'var(--color-bg-surface-hover)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <Loader size="sm" />
                <div>
                  <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                    Ingesting active file...
                  </span>
                  <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                    {currentFile || 'Waiting...'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-success)',
                fontWeight: 'var(--weight-medium)',
                textAlign: 'center'
              }}>
                🎉 All assets indexed and prepared for review!
              </div>
            )}

            {/* Console Log Feed */}
            <div style={{
              background: '#090a0f',
              border: '1px solid #1a1c23',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-md)',
              height: '240px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xxs)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#4ade80',
              textAlign: 'left'
            }}>
              {logs.length === 0 && (
                <div style={{ color: '#4b5563' }}>Initializing console log feed...</div>
              )}
              {logs.map((log, idx) => (
                <div key={idx} style={{ lineBreak: 'anywhere' }}>
                  <span style={{ color: '#6b7280' }}>[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Next Step Action */}
            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!completed}
              >
                Review Results
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
