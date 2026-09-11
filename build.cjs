const fs = require('node:fs');
fs.mkdirSync('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'game.js', 'sim.js']) {
  fs.copyFileSync(file, 'dist/' + file);
}
// The original static URL now forwards players to the multiplayer server.
// Other static deployments retain solo play; the Node server serves source files.
const html = fs.readFileSync('dist/index.html', 'utf8');
const redirect = "<script>if(location.hostname==='turbo-trails.onrender.com'){location.replace('https://turbo-trails-3d.onrender.com/');}</script>";
fs.writeFileSync('dist/index.html', html.replace('<head>', '<head>' + redirect));
console.log('Built 3D client in dist/; multiplayer requires node server.cjs');
