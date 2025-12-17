const { spawn } = require('child_process');

const child = spawn('npx.cmd', ['next', 'build'], {
  shell: false,
  env: process.env,
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (d) => {
  const s = d.toString('utf8');
  stdout += s;
  process.stdout.write(s);
});

child.stderr.on('data', (d) => {
  const s = d.toString('utf8');
  stderr += s;
  process.stderr.write(s);
});

child.on('error', (err) => {
  console.error('Failed to start next build:', err);
  process.exit(1);
});

child.on('close', (code) => {
  const tail = (str) => str.slice(Math.max(0, str.length - 6000));
  console.log('\n\n=== EXIT CODE ===', code);
  console.log('\n=== STDERR TAIL ===\n', tail(stderr));
  console.log('\n=== STDOUT TAIL ===\n', tail(stdout));
  process.exit(code ?? 1);
});
