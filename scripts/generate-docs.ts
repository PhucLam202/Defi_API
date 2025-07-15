import { specs } from '../src/config/swagger.config';
import fs from 'fs';
import path from 'path';

const generateStaticReDoc = () => {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
      Redoc.init(${JSON.stringify(specs)}, {
        scrollYOffset: 50,
        theme: {
          colors: {
            primary: {
              main: '#32329f'
            }
          }
        }
      }, document.getElementById('redoc-container'));
    </script>
  </body>
</html>
  `;

  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
  }

  fs.writeFileSync(path.join(docsDir, 'index.html'), html);
  console.log('Static ReDoc documentation generated at docs/index.html');
};

generateStaticReDoc();