export default (initData, contacts) =>
`<!DOCTYPE html>
<html>
  <head>
    <title>Demo</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="description" content="Demo project">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="http://localhost:5000/client/chat.css" />
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/exif-js"></script>
    <script type="text/javascript">
      window.initData = {messages:${JSON.stringify(
        Object.keys(initData)
          .slice(0, 300)
          .reduce((acc, k) => Object.assign({}, acc, {[k]: initData[k]}), {
            length: Object.keys(initData).length
          }), {})}, contacts: ${JSON.stringify(contacts)}};
    </script>
    <script type="module" src="http://localhost:5000/client/app.js"></script>
  </body>
</html>`;
