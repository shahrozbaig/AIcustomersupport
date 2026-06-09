const { useState, useEffect } = React;

const navItems = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Tickets', icon: '🎫' },
  { label: 'Analytics', icon: '📊' },
  { label: 'Settings', icon: '⚙️' },
];

const badgeClass = (type) => {
  if (type === 'technical') return 'badge badge--technical';
  if (type === 'billing') return 'badge badge--danger';
  return 'badge badge--general';
};

function Sidebar({ selected, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brand-mark">AI</div>
        <div>
          <p className="brand-name">SupportIQ</p>
          <p className="brand-subtitle">Agent Dashboard</p>
        </div>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`sidebar__nav-item ${selected === item.label ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => onSelect(item.label)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Navbar({ totalTickets, escalatedTickets }) {
  return (
    <header className="navbar">
      <div>
        <p className="navbar__title">Customer Support Operations</p>
        <p className="navbar__subtitle">A modern AI-powered helpdesk dashboard</p>
      </div>
      <div className="navbar__status">
        <span className="status-badge status-badge--success">Live</span>
        <div className="navbar__meta">
          <span>{totalTickets} tickets</span>
          <span>{escalatedTickets} escalated</span>
        </div>
      </div>
    </header>
  );
}

function StatCard({ title, value, label, variant }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <p className="stat-card__title">{title}</p>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  );
}

function TicketCard({ ticket }) {
  const category = ticket.category?.toUpperCase() || 'GENERAL';
  const date = ticket.received_at ? new Date(ticket.received_at).toLocaleString() : 'Unknown';
  return (
    <article className="ticket-card">
      <div className="ticket-card__header">
        <div>
          <p className="ticket-card__title">{ticket.query}</p>
          <div className="ticket-card__meta">
            <span className={badgeClass(ticket.category)}>{category}</span>
            <span>{date}</span>
          </div>
        </div>
        <span className={`ticket-card__status ${ticket.escalation?.escalate ? 'ticket-card__status--danger' : 'ticket-card__status--success'}`}>
          {ticket.escalation?.escalate ? 'Escalated' : 'Normal'}
        </span>
      </div>
      <p className="ticket-card__summary">{ticket.final_response}</p>
    </article>
  );
}

function ResponseCard({ output }) {
  if (!output) {
    return (
      <div className="response-card response-card--empty">
        <h3>AI Response</h3>
        <p>Submit a ticket to see the latest AI recommendation and quality metrics.</p>
      </div>
    );
  }

  return (
    <div className="response-card">
      <div className="response-card__top">
        <div>
          <p className="response-card__subtitle">Latest AI Response</p>
          <h3>Ticket analysis</h3>
        </div>
        <div className="response-card__chips">
          <span className={badgeClass(output.category)}>{output.category?.toUpperCase() || 'GENERAL'}</span>
          <span className="badge badge--success">QA {output.qa?.qa_score ?? 'N/A'}</span>
          <span className={`badge ${output.escalation?.escalate ? 'badge--danger' : 'badge--success'}`}>
            {output.escalation?.escalate ? 'Escalated' : 'No Escalation'}
          </span>
        </div>
      </div>
      <div className="response-card__body">
        <div className="response-card__metrics">
          <div>
            <p className="metric-label">Priority</p>
            <p className="metric-value">{output.resolution?.priority || 'Medium'}</p>
          </div>
          <div>
            <p className="metric-label">Confidence</p>
            <p className="metric-value">{output.resolution?.confidence ?? '0.0'}</p>
          </div>
          <div>
            <p className="metric-label">Root cause</p>
            <p className="metric-value">{output.resolution?.root_cause || 'Unknown'}</p>
          </div>
        </div>
        <div className="response-card__text">
          <h4>Recommended response</h4>
          <p>{output.final_response}</p>
        </div>
      </div>
      {output.resolution?.steps?.length ? (
        <div className="response-card__steps">
          <h4>Resolution steps</h4>
          <ol>
            {output.resolution.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function TicketList({ tickets }) {
  return (
    <div className="ticket-list">
      {tickets.length === 0 ? (
        <div className="empty-state">No tickets available yet.</div>
      ) : (
        tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
      )}
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNav, setSelectedNav] = useState('Dashboard');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const response = await fetch('/tickets');
      if (!response.ok) throw new Error('Unable to load ticket history');
      const data = await response.json();
      setHistory(data.slice(-8).reverse());
    } catch (err) {
      setError(err.message);
    }
  }

  function getEscalatedCount() {
    return history.filter((ticket) => ticket.escalation?.escalate).length;
  }

  function getAiAccuracy() {
    if (!history.length) return 'N/A';
    const total = history.reduce((sum, ticket) => sum + (ticket.qa?.qa_score ?? 0), 0);
    return `${Math.round((total / history.length) * 100)}%`;
  }

  async function submitTicket(ticketText) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ticketText }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error');
      }
      const data = await response.json();
      setOutput(data);
      setQuery('');
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!query.trim()) {
      setError('Please enter a ticket description.');
      return;
    }
    submitTicket(query.trim());
  }

  function onExample() {
    const examples = [
      'I was charged twice on my invoice, please help.',
      'My app crashes when I open the dashboard.',
      'How can I reset my password?',
      'There is a security breach and data loss.',
    ];
    const next = examples[Math.floor(Math.random() * examples.length)];
    setQuery(next);
    submitTicket(next);
  }

  const totalTickets = history.length;
  const escalatedTickets = getEscalatedCount();
  const aiAccuracy = getAiAccuracy();

  return (
    <div className="app-shell">
      <Sidebar selected={selectedNav} onSelect={setSelectedNav} />
      <div className="main-view">
        <Navbar totalTickets={totalTickets} escalatedTickets={escalatedTickets} />

        <section className="content-grid">
          <div className="panel panel--hi">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Support Overview</p>
                <h2>Live ticket analytics</h2>
              </div>
              <button className="button button--secondary" onClick={() => setSelectedNav('Analytics')}>
                View full analytics
              </button>
            </div>
            <div className="stats-grid">
              <StatCard title="Total Tickets" value={totalTickets} label="Last 30 days" variant="primary" />
              <StatCard title="Escalated Tickets" value={escalatedTickets} label="Needs review" variant="danger" />
              <StatCard title="AI Accuracy" value={aiAccuracy} label="Average QA score" variant="success" />
              <StatCard title="System Status" value="Healthy" label="Realtime uptime" variant="success" />
            </div>
          </div>

          <div className="panel panel--wide">
            <div className="panel__header panel__header--compact">
              <div>
                <p className="panel__eyebrow">Create ticket</p>
                <h2>Submit a new support request</h2>
              </div>
            </div>
            <form className="ticket-form" onSubmit={onSubmit}>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Describe the customer issue here..."
              />
              <div className="button-row">
                <button type="submit" className="button button--primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
                <button type="button" className="button button--outline" onClick={onExample} disabled={loading}>
                  Use example
                </button>
              </div>
              {error && <div className="form-error">{error}</div>}
            </form>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Recent tickets</p>
                <h2>Latest customer issues</h2>
              </div>
            </div>
            <TicketList tickets={history} />
          </div>

          <div className="panel">
            <ResponseCard output={output} />
          </div>
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
