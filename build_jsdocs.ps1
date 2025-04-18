clear; Remove-Item -Recurse -Force "Documentation" -ErrorAction SilentlyContinue

# npx will fetch jsdoc remotely instead of downloading it, preventing cluttering the project with node_modules files
npx jsdoc -c jsdocs.json

echo Finished, opening...

start .\Documentation\index.html