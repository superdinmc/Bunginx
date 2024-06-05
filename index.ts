declare var self: Worker;
import fs from 'fs';
import { availableParallelism } from 'os';
import { join } from 'path';
import { parseArgs } from 'util';
import { Worker, workerData } from 'worker_threads';
if (Bun.isMainThread) {
  const args = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      port: {
        type: 'string',
        default: process.env.PORT || '8000',
        short: 'p'
      },
      cluster: {
        type: 'string',
        default: availableParallelism().toString(),
        short: 'c'
      },
      help: {
        type: 'boolean',
        short: 'h'
      },
      debug: {
        type: 'boolean',
        short: 'd'
      }
    },
    allowPositionals: true
  })
  const threadCount = parseInt(`${args?.values?.cluster}`);
  const port = parseInt(`${args?.values?.port}`);
  if (!threadCount || Number.isNaN(threadCount)) {
    console.error('Cluster thread count must be number [--cluster | -c]')
    process.exit(1);
  }
  if (!port || Number.isNaN(port)) {
    console.error('Port must be number [--port | -p]')
    process.exit(1);
  }
  if (args.values.help) {
    console.log('Bunginx: Fast, lightweight, simple HTTP file server\n',
      'bunginx [-pdhc] [--port <port>] [--cluster <count>] [--debug] [cwd]\n',
      '--port <port: number>      Set the port for Bunginx [-p]\n',
      '                           - defaults to $PORT or 8000.\n',
      '--cluster <count: number>  Set the threads that Bunginx will spawn [-c]\n',
      '                           - defaults to the CPU core count.\n',
      '--debug                    Display debug messages during run [-d]\n',
      '--help                     Display this message [-h]\n',
      '[cwd: string]              Directory that Bunginx will run on,\n',
      '                           - defaults to current directory.'
    )
    process.exit();
  }
  const cwd = args?.positionals.join(' ');
  const debug = !!args?.values.debug;
  console.log("Serving" + (cwd ? ' ' + cwd : ''), "with", threadCount, "threads at port", port)
  for (let i = 0; i < threadCount; i++) {
    const worker = new Worker(process.argv[1] || __filename, { workerData: { port, id: i, cwd: cwd || process.cwd(), debug } })
  }
} else {
  const cwd = workerData?.cwd;
  const debug = workerData?.debug;
  var lastpath = 'Unknown Origin';
  Bun.serve({
    async fetch(req) {
      const url = new URL(req.url);
      lastpath = url?.pathname;
      const response = await resolve(decodeURIComponent(url.pathname));
      if (debug) console.debug(`[w${workerData.id}|${response.status}] ${url?.pathname}`)
      return response;
    },
    error(error) {
      return new Response(`${lastpath}: ${error}`, {
        status: 500
      });
    },
    reusePort: true,
    port: workerData?.port,
  });


  const notFoundPage = Bun.file(cwd + '404.html');
  async function resolve(path: string) {
    const pathCwd = join(cwd, path);
    if (!pathCwd.startsWith(cwd) || pathCwd.includes('..'))
      return new Response(path + ': 404 Not Found', {
        status: 404
      });
    if (!fs.existsSync(pathCwd)) {
      if (await notFoundPage.exists()) return new Response(notFoundPage, {
        status: 404, headers: new Headers({ 'Content-Type': 'text/html' })
      });
      return new Response(path + ': 404 Not Found', {
        status: 404
      });
    }
    const stat = fs.lstatSync(pathCwd);
    const indexFile = Bun.file(join(pathCwd, 'index.html'));
    if (await indexFile.exists()) {
      if (!path.endsWith('/')) return new Response('', {
        status: 307,
        headers: new Headers({
          'Location': join(path, '/')
        })
      })
      return await resolve(join(path, 'index.html'));
    }
    if (stat.isDirectory()) {
      // Dir
      const list = fs.readdirSync(pathCwd, { withFileTypes: true }).map(f => {
        let type = 'Unknown', priority = 0;
        if (f.isDirectory()) {
          type = 'Directory';
          priority = 3;
          if (fs.existsSync(join(f.name, 'index.html'))) {
            type = 'Website'
            priority = 4;
          }
        }
        if (f.isFile()) {
          const ext = f.name.split('.').slice(1);
          if (!ext.length) type = 'File';
          else type = ext.join('.').toUpperCase() + ' file';
          priority = 2;
        }
        if (f.isSymbolicLink()) {
          type = 'Symlink';
          priority = 1;
        }
        return { name: f.name, type, priority };
      });
      return new Response(constructDirView(list, path), {
        status: 200, headers: new Headers({ 'Content-Type': 'text/html' })
      });
    } else {
      if (stat.mode & (fs.constants.S_IRUSR | fs.constants.S_IRGRP | fs.constants.S_IROTH))
        return new Response(Bun.file(pathCwd));
      return new Response(path + ': 403 Forbidden', {
        status: 403
      })
    }
  }
  const footer = `<hr><a id="footer">Bunginx | Fast, lightweight, simple HTTP file server<br>Dreamnity inc. 2024</a><style>#footer{font-size:smaller;}#header{font-weight:bold;}#a{white-space:break-spaces;font-family:monospace}*{text-decoration:none}</style>`
  function constructDirView(list: { name: string, type: string, priority: number }[], url: string) {
    const maxLength = Math.max(...list.map(e => e.name.length)) + 5;
    const htmlList = list
      .sort((i, r) => (r.priority - i.priority) || i.name.localeCompare(r.name))
      .map(e => `<a id="a" href="${join(url, e.name)}">${e.name.padEnd(maxLength, ' ')} | ${e.type}</a><br>`)
    return `${url === '/' ? '' : `<a href="${join(url, '..')}"><=</a>`} <a id="header">${url}:</a><br>${htmlList.join('')}${footer}`
  }
}