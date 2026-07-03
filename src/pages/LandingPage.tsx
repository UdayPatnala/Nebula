import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{
      background: 'var(--color-bg-base)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Glow effects in background */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '25%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.1) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Navigation Header */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md) var(--spacing-xl)',
        background: 'rgba(15, 23, 42, 0.2)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <img src="/favicon.svg" alt="Nebula Logo" style={{ width: '32px', height: '32px' }} />
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'var(--weight-bold)',
            background: 'var(--gradient-glow)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Nebula
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <Link to="/login" style={{
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--weight-medium)',
            transition: 'color var(--transition-fast)'
          }}>
            Sign In
          </Link>
          <Link to="/signup" style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            textDecoration: 'none',
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--weight-semibold)',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
          }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--spacing-3xl) var(--spacing-md) var(--spacing-2xl) var(--spacing-md)',
        maxWidth: '1000px',
        margin: '0 auto',
        zIndex: 1
      }}>
        <div style={{
          background: 'rgba(124, 58, 237, 0.1)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          borderRadius: 'var(--radius-pill)',
          padding: 'var(--spacing-xxs) var(--spacing-md)',
          fontSize: 'var(--font-size-caption)',
          fontWeight: 'var(--weight-medium)',
          color: 'var(--color-primary)',
          marginBottom: 'var(--spacing-md)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ✨ Discover a New Way to Tell Stories
        </div>
        
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: 'var(--weight-bold)',
          lineHeight: '1.1',
          marginBottom: 'var(--spacing-md)',
          background: 'var(--gradient-glow)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Transform Your Media Into <br />Intelligent Interactive Stories
        </h1>

        <p style={{
          fontSize: 'var(--font-size-h3)',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          maxWidth: '750px',
          marginBottom: 'var(--spacing-xl)'
        }}>
          Nebula is an AI-powered personal media intelligence platform. Upload files, extract smart context, build customized cinematic galleries, and share experiences instantly.
        </p>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/signup" style={{
            background: 'var(--gradient-glow)',
            color: '#ffffff',
            textDecoration: 'none',
            padding: 'var(--spacing-sm) var(--spacing-xl)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--weight-bold)',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
            transition: 'transform var(--transition-fast)'
          }}>
            Create Your First Story
          </Link>
          <a href="#features" style={{
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            textDecoration: 'none',
            padding: 'var(--spacing-sm) var(--spacing-xl)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--weight-semibold)',
            transition: 'background var(--transition-fast)'
          }}>
            Explore Features
          </a>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" style={{
        padding: 'var(--spacing-2xl) var(--spacing-md)',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <h2 style={{ fontSize: 'var(--font-size-h1)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xs)' }}>
            Designed for Seamless Storytelling
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-h3)' }}>
            Every step is powered by intelligent automation.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}>
          {/* Card 1 */}
          <div style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>📤</div>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xs)' }}>
              1. Secure Upload
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.5' }}>
              Drag and drop high-resolution photos and videos. Handles background processing, batch queues, and role-based quotas effortlessly.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>🧠</div>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xs)' }}>
              2. AI pipeline
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.5' }}>
              Extracts EXIF metadata, detects and clusters faces, labels objects, reads text using OCR, and groups events by visual similarity.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>🎨</div>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xs)' }}>
              3. Dynamic Builder
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.5' }}>
              Select premium cinematic, editorial, mosaic, or timeline themes. Personalize layout matrices and preview styling configurations instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Tiers Section */}
      <section style={{
        padding: 'var(--spacing-2xl) var(--spacing-md)',
        background: 'rgba(15, 23, 42, 0.15)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-h1)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xs)' }}>
              Flexible Tier Options
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-h3)' }}>
              Choose the package that matches your story size.
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-lg)',
            justifyContent: 'center'
          }}>
            {/* Free Tier */}
            <div style={{
              flex: '1 1 300px',
              maxWidth: '400px',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-xl)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xxs)' }}>
                Registered Free
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Best for personal cataloging</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-md)' }}>
                $0 <span style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--weight-normal)', color: 'var(--color-text-secondary)' }}>/ forever</span>
              </div>
              <ul style={{ paddingLeft: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                <li>100 MB max upload file size</li>
                <li>10 GB total storage limit</li>
                <li>Full AI analysis pipeline access</li>
                <li>Standard gallery templates</li>
              </ul>
              <Link to="/signup" style={{
                marginTop: 'auto',
                display: 'block',
                textAlign: 'center',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--weight-semibold)'
              }}>
                Sign Up Now
              </Link>
            </div>

            {/* Premium Tier */}
            <div style={{
              flex: '1 1 300px',
              maxWidth: '400px',
              background: 'var(--color-bg-surface)',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-xl)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                background: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--weight-bold)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                textTransform: 'uppercase'
              }}>
                Popular
              </div>
              <h3 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-xxs)' }}>
                Premium Plan
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>For creators and power storytellers</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-md)' }}>
                $9.99 <span style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--weight-normal)', color: 'var(--color-text-secondary)' }}>/ month</span>
              </div>
              <ul style={{ paddingLeft: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                <li><strong>1 GB</strong> max upload size</li>
                <li><strong>100 GB</strong> total storage limit</li>
                <li>Priority AI processing queue</li>
                <li>Unlock all Premium themes & watermarks</li>
                <li>Password protection & expiry limits</li>
              </ul>
              <Link to="/signup" style={{
                marginTop: 'auto',
                display: 'block',
                textAlign: 'center',
                background: 'var(--color-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--weight-semibold)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              }}>
                Go Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section style={{
        textAlign: 'center',
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        position: 'relative',
        zIndex: 1
      }}>
        <h2 style={{ fontSize: 'var(--font-size-h1)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--spacing-sm)' }}>
          Ready to Build Your First Gallery?
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-h3)', maxWidth: '600px', margin: '0 auto var(--spacing-xl) auto', lineHeight: '1.6' }}>
          Create an account and receive 150 free operations credits instantly.
        </p>
        <Link to="/signup" style={{
          background: 'var(--gradient-glow)',
          color: '#ffffff',
          textDecoration: 'none',
          padding: 'var(--spacing-sm) var(--spacing-xl)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-body)',
          fontWeight: 'var(--weight-bold)',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
          transition: 'transform var(--transition-fast)'
        }}>
          Register & Get Started
        </Link>
        
        <div style={{
          marginTop: 'var(--spacing-3xl)',
          fontSize: 'var(--font-size-caption)',
          color: 'var(--color-text-secondary)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--spacing-md)'
        }}>
          © 2026 Nebula. Built by Patnala Uday Kumar.
        </div>
      </section>
    </div>
  );
}
