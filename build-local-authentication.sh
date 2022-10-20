curl https://console.test2.authing-inc.co/auth-openapi-json > openapi.json
yarn build 

# 清除历史内容
# rm -rf ../docs/docs/reference-new/sdk-v5/node/_generated
# rm -rf ../docs/docs/reference-new/sdk-v5/java/_generated
# rm -rf ../docs/docs/reference-new/sdk-v5/php/_generated
# rm -rf ../docs/docs/reference-new/sdk-v5/go/_generated
# rm -rf ../docs/docs/reference-new/sdk-v5/csharp/_generated
# rm -rf ../docs/docs/reference-new/sdk-v5/python/_generated

# 生成新内容
cp -R generated/node/* ../docs/docs/reference-new/sdk-v5/node/
cp -R generated/java/* ../docs/docs/reference-new/sdk-v5/java/
cp -R generated/php/* ../docs/docs/reference-new/sdk-v5/php/
cp -R generated/go/* ../docs/docs/reference-new/sdk-v5/go/
cp -R generated/csharp/* ../docs/docs/reference-new/sdk-v5/csharp/
cp -R generated/python/* ../docs/docs/reference-new/sdk-v5/python/

echo "别忘了 copy sidebar.json 文件！！！"