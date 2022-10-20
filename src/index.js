const fs = require('fs/promises');
const { join } = require('path');
const { generate, generateSidebar } = require('./utils/generate');
const { getTags, getLanguages, filterApisByTag } = require('./utils/helper');

const DIR = join(__dirname, '../generated');

async function main() {
  // TODO: Read API Spec online
  const file = await fs.readFile('openapi.json', 'utf-8');
  const spec = JSON.parse(file);
  const isAuthApi = spec.info.title === 'Authing Authentication API'
  const languages = await getLanguages();
  const tags = getTags(spec.tags);
  // Generate Sidebar
  await generateSidebar({ languages, tags, paths: spec.paths, isAuthApi });
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

main().catch((e) => console.error(e));
