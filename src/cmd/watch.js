const watch = require('node-watch');
const { spawn } = require('child_process');

let isBuilding = false;
let onBuildComplete = undefined;

function rebuild() {
  if (isBuilding) {
    onBuildComplete = rebuild;
    return;
  }

  isBuilding = true;

  console.log('Rebuilding ...');
  const now = Date.now();
  const build = spawn('npm', ['run', 'build']);

  build.stdout.on('data', (data) => console.log(data.toString()));
  build.stderr.on('data', (data) => console.log(`Error: ${data.toString()}`));

  build.on('exit', () => {
    console.log(`Done in ${Date.now() - now}ms.`);
    isBuilding = false;

    if (onBuildComplete) {
      onBuildComplete();
      onBuildComplete = undefined;
    }
  });
}

watch('./src', { recursive: true }, rebuild);

rebuild();
