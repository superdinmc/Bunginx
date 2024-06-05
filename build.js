await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './build',
  target: 'bun',
  minify: true,
});
const file = Bun.file('build/index.js');
const content = `#!/usr/bin/env -S bun
${await file.text()}
`
await Bun.write('bunginx', content);
await Bun.$`chmod +x bunginx`
console.log('Done');