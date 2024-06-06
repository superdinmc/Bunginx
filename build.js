const version = (await Bun.$`git rev-parse HEAD`.text()).slice(-7).toUpperCase();
await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './build',
  target: 'bun',
  minify: true,
  define: {
    version: JSON.stringify(version)
  }
});
const file = Bun.file('build/index.js');
const content = `#!/usr/bin/env -S bun
${await file.text()}`
await Bun.write('bunginx', content);
await Bun.$`chmod +x bunginx`;
await Bun.$`rm -rf build/`;
console.log('Done');