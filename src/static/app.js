const queryElement = document.getElementById('query');
const submitButton = document.getElementById('submit');
const exampleButton = document.getElementById('example-button');
const output = document.getElementById('output');
const historyElement = document.getElementById('history');

const exampleQueries = [
  'I was charged twice on my invoice, please help.',
  'My app crashes when I open the dashboard.',
  'How do I reset my password?',
  'There is a security breach and data loss.',
];

function createBadge(type, text) {
  const badge = document.createElement('span');
  badge.className = `badge ${type}`;
  badge.textContent = text;
  return badge;
}

function renderTicketOutput(data) {
  const escalationText = data.escalation.escalate ? 'Yes' : 'No';
  const ticketType = data.category || 'general';
  const escalationBadge = data.escalation.escalate ? createBadge('escalate', 'Escalated') : createBadge('ok', 'Handled');
  const categoryBadge = createBadge(ticketType, ticketType.toUpperCase());

  return `
    <div class="output-card">
      <h3>AI Support Response</h3>
      <div class="output-row">
        <div>
          <dt>Category</dt>
          <dd>${data.category} ${categoryBadge.outerHTML}</dd>
          <dt>Escalation</dt>
          <dd>${escalationText} ${escalationBadge.outerHTML}</dd>
          <dt>QA Score</dt>
          <dd>${data.qa.qa_score}</dd>
        </div>
        <div>
          <dt>Ticket ID</dt>
          <dd>${data.id}</dd>
          <dt>Submitted</dt>
          <dd>${new Date(data.received_at).toLocaleString()}</dd>
        </div>
      </div>
      <div class="output-panel">
        <h3>Final Response</h3>
        <p>${data.final_response}</p>
      </div>
    </div>
  `;
}

function renderHistory(tickets) {
  historyElement.innerHTML = '';
  if (!tickets || tickets.length === 0) {
    historyElement.innerHTML = '<p>No tickets yet.</p>';
    return;
  }

  const latest = tickets.slice(-5).reverse();
  latest.forEach(ticket => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div>
        <strong>${ticket.category?.toUpperCase() || 'GENERAL'}</strong> — ${new Date(ticket.received_at).toLocaleString()}
      </div>
      <p>${ticket.query}</p>
      <small>Response: ${ticket.final_response}</small>
    `;
    historyElement.appendChild(item);
  });
}

async function loadHistory() {
  try {
    const response = await fetch('/tickets');
    if (!response.ok) throw new Error('Unable to load history');
    const tickets = await response.json();
    renderHistory(tickets);
  } catch (err) {
    historyElement.innerHTML = `<div class="error">${err.message}</div>`;
  }
}

async function submitTicket(query) {
  output.innerHTML = '';
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    const response = await fetch('/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Server error');
    }

    const data = await response.json();
    output.innerHTML = renderTicketOutput(data);
    await loadHistory();
  } catch (err) {
    output.innerHTML = `<div class="error">${err.message}</div>`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Ticket';
  }
}

submitButton.addEventListener('click', () => {
  const text = queryElement.value.trim();
  if (!text) {
    output.innerHTML = '<div class="error">Please enter a ticket query.</div>';
    return;
  }
  submitTicket(text);
});

exampleButton.addEventListener('click', () => {
  const example = exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
  queryElement.value = example;
  submitTicket(example);
});

loadHistory();
