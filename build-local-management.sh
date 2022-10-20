curl http://8.142.39.176:3000/openapi-json > openapi.json
yarn build 
cp -R generated/* ../docs/docs/reference-new/sdk-v5/
echo "别忘了 copy sidebar.json 文件！！！"