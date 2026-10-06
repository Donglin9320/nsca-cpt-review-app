const fs = require('node:fs');
const path = require('node:path');

for (const kind of ['daily', 'weekly']) {
  const api = action => ({
    method: 'POST', url: 'https://nsca-cpt-review-app.vercel.app/api/study-notifications',
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    sendBody: true, specifyBody: 'json',
    jsonBody: action === 'prepare' ? JSON.stringify({ action, kind })
      : `={{ JSON.stringify({ action: 'delivered', kind: '${kind}', deliveryId: $('Prepare message').first().json.deliveryId }) }}`,
    options: { timeout: 55000 },
  });
  const workflow = {
    name: `NSCA ${kind === 'daily' ? 'Daily 150-question reminder' : 'Weekly mistakes summary'}`,
    active: false,
    nodes: [
      { id: 'schedule', name: 'Schedule', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 0],
        parameters: { rule: { interval: [{ field: 'cronExpression', expression: kind === 'daily' ? '0 20 * * *' : '0 18 * * 0' }] } } },
      { id: 'prepare', name: 'Prepare message', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [220, 0], parameters: api('prepare') },
      { id: 'eligible', name: 'Only eligible messages', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [440, 0],
        parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
          conditions: [{ id: 'eligible-boolean', leftValue: '={{ $json.shouldSend }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } },
      { id: 'email', name: 'Send email', type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: [660, 0],
        parameters: { fromEmail: 'CONFIGURE_VERIFIED_SENDER', toEmail: '={{ $json.to }}', subject: '={{ $json.subject }}', emailFormat: 'text', text: '={{ $json.text }}', options: { appendAttribution: false } } },
      { id: 'ack', name: 'Record sent', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [880, 0], parameters: api('delivered') },
    ],
    connections: {
      Schedule: { main: [[{ node: 'Prepare message', type: 'main', index: 0 }]] },
      'Prepare message': { main: [[{ node: 'Only eligible messages', type: 'main', index: 0 }]] },
      'Only eligible messages': { main: [[{ node: 'Send email', type: 'main', index: 0 }], []] },
      'Send email': { main: [[{ node: 'Record sent', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1', timezone: 'America/Vancouver', saveDataSuccessExecution: 'none', saveDataErrorExecution: 'all' },
    pinData: {},
  };
  fs.writeFileSync(path.join(__dirname, `${kind}.json`), JSON.stringify(workflow, null, 2) + '\n');
}
