const version = (await Bun.$`git rev-parse HEAD`.text()).slice(-7).toUpperCase();
const result = await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './build',
  target: 'bun',
  minify: true,
  define: {
    version: JSON.stringify(version)
  }
});
if (!result.success) process.exit(console.error('Build failed!\n', result.logs));
const file = Bun.file('build/index.js');
const runner = `let B=Bun,c=await B.file(B.argv[1]).text();eval(require('zlib').gunzipSync(Buffer.from(c.slice(c.indexOf('/*@@CODESTART',LEN)+13,-3),'base64url')).toString())`
const content = `#!/usr/bin/env -S bun
${runner.replace('LEN', runner.length)}
/*@@CODESTART${require('zlib').gzipSync(await file.arrayBuffer()).toString('base64url')}*/`
//Buffer.from(new TextDecoder('utf8').decode(Bun.deflateSync(await file.arrayBuffer(),{level: 9})).toString('base64url')
await Bun.write('bunginx', content);
await Bun.$`chmod +x bunginx`;
await Bun.$`rm -rf build/`.quiet().text();
console.log('Done, version', version);