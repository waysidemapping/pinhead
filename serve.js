import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';

const baseDirectory = path.dirname(url.fileURLToPath(import.meta.url));
const port = 3366;

http.createServer(function (request, response) {
    try {
     
        let requestUrl = url.parse(request.url)

        // need to use path.normalize so people can't access directories underneath baseDirectory
        let fsPath = baseDirectory + '/docs' + path.normalize(requestUrl.pathname)

        if (fs.statSync(fsPath).isDirectory()) {
          if (!fsPath.endsWith("/")) fsPath += "/";
          fsPath += "index.html";
        }
        
        let options = {};
        if (request.headers.range && request.headers.range.startsWith('bytes=')) {
          let matches = /bytes=(\d*)-(\d*)/g.exec(request.headers.range);
          options.start = parseInt(matches[1]);
          options.end = parseInt(matches[2])+1;
          response.setHeader('Content-Length', options.end - options.start);
        }
        // set MIME types
        if (fsPath.endsWith(".svg")) {
          response.setHeader('Content-Type', "image/svg+xml");
        } else if (fsPath.endsWith(".js")) {
          response.setHeader('Content-Type', "text/javascript");
        }

        let fileStream = fs.createReadStream(fsPath, options)
        fileStream.pipe(response)
        fileStream.on('open', function() {
          response.writeHead(200)
        })
        fileStream.on('error',function(e) {
          response.writeHead(404)     // assume the file doesn't exist
          response.end()
        })
   } catch(e) {
        response.writeHead(500)
        response.end()     // end the response so browsers don't hang
        console.log(e.stack)
   }
}).listen(port)

console.log("listening on port " + port)