const { spawn } = require('child_process');
const path = require('path');

function analyze(samples) {
  return new Promise((resolve, reject) => {
    const py = process.env.PYTHON || 'python3';
    const root = path.resolve(__dirname, '../../..'); // .../albe
    const script = path.join(root, 'analytics', 'analyze.py');

    console.log(`[py] using: ${py}`);
    console.log(`[py] script: ${script}`);
    const child = spawn(py, ['-u', script], { cwd: root });

    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); process.stdout.write('[py-out] ' + d.toString()); });
    child.stderr.on('data', d => { err += d.toString(); process.stdout.write('[py-err] ' + d.toString()); });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`analyze.py exited ${code}: ${err || out}`));
      }
      try {
        const parsed = JSON.parse(out);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Failed to parse analysis JSON: ${e.message}\nstdout: ${out}\nstderr: ${err}`));
      }
    });

    const payload = JSON.stringify({ samples });
    child.stdin.write(payload);
    child.stdin.end();
  });
}

module.exports = { analyze };

