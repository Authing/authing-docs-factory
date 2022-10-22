curl http://localhost:3000/auth-openapi-json > authentication-openapi.json
curl http://localhost:3000/openapi-json > management-openapi.json
yarn build 

# 生成新内容
cp -R generated/node/* ../docs-v3/docs/reference/sdk/node/
cp -R generated/java/* ../docs-v3/docs/reference/sdk/java/
cp -R generated/php/* ../docs-v3/docs/reference/sdk/php/
cp -R generated/go/* ../docs-v3/docs/reference/sdk/go/
cp -R generated/csharp/* ../docs-v3/docs/reference/sdk/csharp/
cp -R generated/python/* ../docs-v3/docs/reference/sdk/python/

echo "别忘了 copy sidebar.json 文件！！！"