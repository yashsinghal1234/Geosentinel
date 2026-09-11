// test-api.js - Complete verification suite for Node.js Express Backend
async function runTests() {
  console.log('🧪 Starting GeoSentinel Node.js Backend API Test Suite...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health Check
  await test('GET /api/health', async () => {
    const res = await fetch('http://localhost:8000/api/health');
    const data = await res.json();
    if (!res.ok || data.status !== 'ok' || data.backend !== 'node-express') {
      throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
  });

  // 2. Strict Auth Check - Reject Fake/Unknown Account
  await test('POST /api/auth/login (Reject unknown account fake_user@random.com)', async () => {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake_user@random.com', password: 'randompassword' })
    });
    const data = await res.json();
    if (res.status !== 401 || data.status !== 'error') {
      throw new Error(`Expected 401 Unauthorized, but got: ${res.status} - ${JSON.stringify(data)}`);
    }
    console.log(`   -> Correctly rejected unknown account: "${data.message}"`);
  });

  // 3. Strict Auth Check - Reject Wrong Password for admin@geo.com
  await test('POST /api/auth/login (Reject wrong password for admin@geo.com)', async () => {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@geo.com', password: 'wrongpassword999' })
    });
    const data = await res.json();
    if (res.status !== 401 || data.status !== 'error') {
      throw new Error(`Expected 401 Unauthorized, but got: ${res.status} - ${JSON.stringify(data)}`);
    }
    console.log(`   -> Correctly rejected wrong password: "${data.message}"`);
  });

  // 4. Valid Admin Login
  let adminToken = '';
  await test('POST /api/auth/login (admin@geo.com / password123)', async () => {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@geo.com', password: 'password123' })
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success' || data.role !== 'admin' || !data.access_token) {
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
    adminToken = data.access_token;
    console.log(`   -> Logged in as: ${data.name} (${data.role}) - Token: ${adminToken.substring(0, 20)}...`);
  });

  // 5. Valid Operator Login
  await test('POST /api/auth/login (operator@geosentinel.gov.in / password123)', async () => {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'operator@geosentinel.gov.in', password: 'password123' })
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success' || data.role !== 'operator') {
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
    console.log(`   -> Logged in as: ${data.name} (${data.role})`);
  });

  // 6. Credentials Hint
  await test('GET /api/auth/credentials-hint', async () => {
    const res = await fetch('http://localhost:8000/api/auth/credentials-hint');
    const data = await res.json();
    if (!res.ok || !data.admin || !data.operator) {
      throw new Error(`Invalid hints: ${JSON.stringify(data)}`);
    }
  });

  // 7. Get Nodes List
  await test('GET /api/nodes', async () => {
    const res = await fetch('http://localhost:8000/api/nodes');
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length < 6) {
      throw new Error(`Expected at least 6 nodes, got: ${data ? data.length : 0}`);
    }
    console.log(`   -> Retrieved ${data.length} IoT mesh nodes (Nodes: ${data.map(n => n.id).join(', ')})`);
  });

  // 8. Dynamic Topology Graph
  await test('GET /api/topology', async () => {
    const res = await fetch('http://localhost:8000/api/topology');
    const data = await res.json();
    if (!res.ok || !data.nodes || !data.links || data.metrics.packetDeliveryRate !== 99.8) {
      throw new Error(`Invalid topology response: ${JSON.stringify(data.metrics)}`);
    }
    console.log(`   -> Canvas nodes: ${data.nodes.length}, Topology links: ${data.links.length}`);
  });

  // 9. Citizen Crack Reports
  await test('GET /api/reports', async () => {
    const res = await fetch('http://localhost:8000/api/reports');
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected reports array, got: ${JSON.stringify(data)}`);
    }
    console.log(`   -> Retrieved ${data.length} citizen crack reports`);
  });

  // 10. Submit New Crack Report
  let newReportId = '';
  await test('POST /api/reports (Submit Crack Observation)', async () => {
    const res = await fetch('http://localhost:8000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_name: 'Amitabh Sen',
        phone: '+91 94311 77221',
        zone: 'Sector 2 (East Highwall & Village Buffer)',
        latitude: 23.7470,
        longitude: 86.4180,
        crack_width_estimate_mm: 12.5,
        description: 'New deep shear fracture running along main evacuation path.'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.id || !data.nearest_sensor_id) {
      throw new Error(`Submit failed: ${JSON.stringify(data)}`);
    }
    newReportId = data.id;
    console.log(`   -> Created report: ${data.id}, Nearest node: ${data.nearest_sensor_id} (${data.nearest_sensor_distance_m}m)`);
  });

  // 11. Operator Review of Crack Report
  await test(`POST /api/reports/${newReportId}/review (Approve & Corroborate)`, async () => {
    const res = await fetch(`http://localhost:8000/api/reports/${newReportId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        reviewed_by: 'DGMS Mining Inspector S. K. Verma',
        review_notes: 'Verified against Node Y tilt escalation. Approved for emergency perimeter reinforcement.'
      })
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success' || !data.new_status.includes('Approved')) {
      throw new Error(`Review failed: ${JSON.stringify(data)}`);
    }
  });

  // 12. Dashboard Summary Metrics
  await test('GET /api/dashboard/summary', async () => {
    const res = await fetch('http://localhost:8000/api/dashboard/summary');
    const data = await res.json();
    if (!res.ok || !data.current_alert_level || !Array.isArray(data.high_risk_zones)) {
      throw new Error(`Summary error: ${JSON.stringify(data)}`);
    }
    console.log(`   -> Alert level: ${data.current_alert_level}, Highest risk score: ${data.highest_risk_score}`);
  });

  // 13. Edge Gateway Status
  await test('GET /api/gateway/status', async () => {
    const res = await fetch('http://localhost:8000/api/gateway/status');
    const data = await res.json();
    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      throw new Error(`Gateway status error: ${JSON.stringify(data)}`);
    }
    console.log(`   -> Gateway status: ${data[0].gateway_id} (${data[0].status})`);
  });

  // 14. Alerts List
  await test('GET /api/alerts', async () => {
    const res = await fetch('http://localhost:8000/api/alerts');
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) {
      throw new Error(`Alerts error: ${JSON.stringify(data)}`);
    }
    console.log(`   -> Retrieved ${data.length} active/historical alerts`);
  });

  console.log(`\n==================================================`);
  console.log(`  TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
