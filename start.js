const { exec, spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');

function run(cmd, opts) {
  return new Promise((resolve, reject) => {
    exec(cmd, opts, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

async function main() {
  console.log('\n🍽️  Canteen Management System\n');

  // 1. Start PostgreSQL container
  console.log('🐘 Starting PostgreSQL...');
  try {
    await run('docker start canteen_postgres');
    console.log('   ✅ PostgreSQL running');
  } catch {
    console.log('   ⚠️  Could not start container (may already be running)');
  }

  // Wait for DB to be ready
  await new Promise(r => setTimeout(r, 2000));

  // 2. Start backend
  console.log('🚀 Starting backend (port 5000)...');
  const backend = spawn('node', ['src/index.js'], {
    cwd: BACKEND,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  backend.stdout.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.log('   [backend] ' + msg);
  });
  backend.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.error('   [backend] ' + msg);
  });

  // Wait for backend to start
  await new Promise(r => setTimeout(r, 2000));

  // 3. Start frontend
  console.log('🎨 Starting frontend (port 3000)...');
  const frontend = spawn('npx', ['vite', '--port', '3000'], {
    cwd: FRONTEND,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  frontend.stdout.on('data', d => {
    const msg = d.toString().trim();
    if (msg) {
      console.log('   [frontend] ' + msg);
      // Open browser once Vite is ready
      if (msg.includes('Local:') || msg.includes('localhost')) {
        openBrowser();
      }
    }
  });
  frontend.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.error('   [frontend] ' + msg);
  });

  let opened = false;
  function openBrowser() {
    if (opened) return;
    opened = true;
    console.log('\n🌐 Opening Chrome...\n');
    exec('start chrome http://localhost:3000');
  }

  // Fallback: open browser after 6s if Vite didn't trigger it
  setTimeout(() => openBrowser(), 6000);

  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  console.log('\n✅ System starting! Press Ctrl+C to stop.\n');
}

main().catch(err => {
  console.error('❌ Failed to start:', err.message);
  process.exit(1);
});
