const fs = require('fs/promises');
const { join } = require('path');
const { generate, generateSidebar } = require('./utils/generate');
const { getTags, getLanguages, filterApisByTag } = require('./utils/helper');

const DIR = join(__dirname, '../generated');

async function generateMarkdown(spec, languages) {
  const isAuthApi = spec.info.title === 'Authing Authentication API'
  const tags = getTags(spec.tags);

  // Generate Docs
  for (const language of languages) {
    for (let tag of tags) {

      // 只生成有 API 的目录
      const apis = filterApisByTag(spec.paths, tag)
      if (Object.keys(apis).length === 0) {
        continue
      }

      // Create directory
      // such as: generated/node/access-control-management/
      const dir = isAuthApi ? join(DIR, language, 'authentication', tag.path.split('/')[0]) : join(DIR, language, 'management', tag.path.split('/')[0])
      await fs.mkdir(dir, { recursive: true });
      for (let path in apis) {
        const options = apis[path];
        await generate({
          language,
          path,
          options: Object.values(options)?.[0],
          tag,
          components: spec.components,
          isAuthApi
        });
      }
    }
  }
}

async function main() {

  await fs.rm(DIR, {
    recursive: true,
    force: true
  });

  // 需要生成的语言
  const languages = await getLanguages();

  // 解析 openapi spec 文件
  const authenticationSpecfile = await fs.readFile('authentication-openapi.json', 'utf-8');
  const authenticationSpec = JSON.parse(authenticationSpecfile);
  const managementSpecfile = await fs.readFile('management-openapi.json', 'utf-8');
  const managementSpec = JSON.parse(managementSpecfile);

  // 生成 markdown 文档
  await generateMarkdown(authenticationSpec, languages);
  await generateMarkdown(managementSpec, languages);

  // 生成 Sidebar.json
  await generateSidebar({ 
    languages, 
    authenticaionTags: getTags(authenticationSpec.tags), 
    authenticationPaths: authenticationSpec.paths,
    managementTags: getTags(managementSpec.tags),
    managementPaths: managementSpec.paths
  });
}

main().catch((e) => console.error(e));
