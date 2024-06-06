let B=Bun,c=await B.file(B.argv[1]).text();console.log(require('zlib').gunzipSync(Buffer.from(c.slice(c.indexOf('/*@@CODESTART',LEN)+13,-3),'base64url')).toString())
/*@@CODESTARTHello*/