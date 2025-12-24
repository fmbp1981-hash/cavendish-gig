const { spawn } = require('child_process');

const isWin = process.platform === 'win32';

function spawnNextBuild() {
  // Using a shell on Windows avoids spawn EINVAL issues with .cmd shims in some Node versions.
  // We also prefer invoking `npx next build` so the locally installed Next is used.
  if (isWin) {
    return spawn('cmd.exe', ['/d', '/s', '/c', 'npx next build'], {
      shell: false,
      env: process.env,
    });
  }

  return spawn('npx', ['next', 'build'], {
    shell: false,
    env: process.env,
  });
}

const child = spawnNextBuild();

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
