import { useState } from 'react';
import { useNotification } from '../providers';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'getting-started' | 'billing' | 'ai';
}

export default function HelpPage() {
  const { showToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Support Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqData: FAQItem[] = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create a new media project?',
      answer: 'Navigate to the "Projects" section in the left sidebar, click the "+ New Project" button at the top right, enter a name for your project, and click "Create". You will automatically be redirected to upload your files.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'What types of media files does Nebula support?',
      answer: 'Nebula supports all standard image and video formats, including JPEG, PNG, WebP, MP4, QuickTime (MOV), and WebM. File size limits depend on your account tier.'
    },
    {
      id: 3,
      category: 'ai',
      question: 'How does the AI metadata pipeline work?',
      answer: 'Once you upload media and trigger analysis, our pipeline extracts tags, identifies key objects and locations, counts faces to help cluster people, and suggests context-rich captions. Each analysis consumes 10 credits per project run.'
    },
    {
      id: 4,
      category: 'billing',
      question: 'How can I get more credits?',
      answer: 'Registered users receive 150 start-up credits. You can get 10 free credits daily by clicking the Daily Check-in button in the "Credits" section. For additional credits, you can purchase packages directly under the Credits page.'
    },
    {
      id: 5,
      category: 'getting-started',
      question: 'How do I publish my project as an interactive gallery?',
      answer: 'Go to your project workspace, complete media uploads and AI analysis. Under the "Review" phase, select the "Gallery Builder" tab, configure your theme (minimalist, bold, editorial) and music, then click "Publish Gallery".'
    },
    {
      id: 6,
      category: 'billing',
      question: 'What are the limits for free versus premium tiers?',
      answer: 'Free users have a 10 GB total storage limit and a 50 MB single-file upload limit. Premium users enjoy up to 500 GB storage, 2 GB file limits, custom domains, and batch processing.'
    }
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      showToast('Please fill out all fields in the support form.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      showToast('Support ticket submitted successfully! We will get back to you shortly.', 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1200);
  };

  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-lg)',
      textAlign: 'left'
    }}>
      {/* Header */}
      <header>
        <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
          Help Center
        </h2>
        <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Find answers, browse documentation, or get in touch with our team.
        </p>
      </header>

      {/* Search Section */}
      <Card style={{
        background: 'var(--gradient-glow)',
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-sm)'
      }}>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: 'var(--font-size-h3)' }}>How can we help you today?</h3>
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <input
            type="text"
            placeholder="Search FAQs, features, settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'border-color var(--transition-fast)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </Card>

      {/* Two Column Layout: FAQ vs Contact Support */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--spacing-lg)'
      }}>
        {/* Collapsible FAQ Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', margin: 0 }}>
            Frequently Asked Questions
          </h3>

          {filteredFaqs.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>🔍</div>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No results match your search query.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-surface)',
                    overflow: 'hidden',
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {activeFaq === faq.id ? '▼' : '▶'}
                    </span>
                  </button>
                  {activeFaq === faq.id && (
                    <div style={{
                      padding: '0 16px 16px 16px',
                      fontSize: 'var(--font-size-body)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.5',
                      borderTop: '1px solid var(--color-border-subtle)',
                      marginTop: '-4px',
                      paddingTop: '12px'
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support Form */}
        <Card style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
              Contact Support
            </h3>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Can't find what you need? Send a message to our support desk.
            </p>
          </div>

          <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Input
              label="Your Name"
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Subject"
              type="text"
              placeholder="How can we help?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>
                Message
              </label>
              <textarea
                placeholder="Describe your issue or request in detail..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-base)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-body)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
            <Button type="submit" variant="primary" loading={isSubmitting} style={{ marginTop: 'var(--spacing-xs)' }}>
              Send Ticket
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
