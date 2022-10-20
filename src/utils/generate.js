const ejs = require('ejs');
const fs = require('fs/promises');
const { join } = require('path');
const { filterApisByTag } = require('./helper');
const {
  getSchema,
  getSchemaName,
  getSchemaModels,
  getExampleJson
} = require('./helper');

const LANGUAGES = {
  // python: 'Python',
  // java: 'Java',
  // go: 'Go',
  php: 'PHP',
  csharp: 'C#',
  node: 'Node.js'
};

const DIR = join(__dirname, '../../generated');

exports.generate = async ({ language, path, options, tag, components, isAuthApi }) => {

  try {
    const { requestBody, responses } = options;
    const schemaNameReq = getSchemaName(
      requestBody?.content['application/json'].schema
    );
    const schemaNameRes = getSchemaName(
      responses['200'].content['application/json'].schema
    );
    const models = [
      ...getSchemaModels(schemaNameReq, components.schemas),
      ...getSchemaModels(schemaNameRes, components.schemas)
    ].map((name) => getSchema(name, components.schemas));
    const output = await ejs.renderFile(
      join(__dirname, '../templates/main.ejs'),
      {
        language,
        path,
        options,
        tag,
        components,
        models,
        fnNameCamel: path
          .replace('/api/v3/', '')
          .replace(/-(.)/g, ($1) => $1.toUpperCase())
          .replace(/-/g, ''),
        fnNameSnake: path.replace('/api/v3/', '').replace(/-/g, '_'),
        request: getSchema(schemaNameReq, components.schemas),
        response: getSchema(schemaNameRes, components.schemas),
        responseJson: JSON.stringify(
          getExampleJson(schemaNameRes, components.schemas),
          null,
          2
        )
      },
      {
        // async: true
      }
    );
    const file = isAuthApi ? join(
      DIR,
      language,
      'authentication',
      tag.path.split('/')[0],
      `${path.replace(/^\/api\/v3\//, '')}.md`
    ) : join(
      DIR,
      language,
      'management',
      tag.path.split('/')[0],
      `${path.replace(/^\/api\/v3\//, '')}.md`
    )
    await fs.writeFile(file, output, {
      encoding: 'utf-8'
    });
  } catch (error) {
    console.log('build 失败：', error)
  }
};

exports.generateSidebar = async ({ languages, tags, paths, isAuthApi }) => {
  await fs.rm(DIR, {
    recursive: true,
    force: true
  });
  // Generate Sidebar
  const PREFIX = '/reference-new/sdk-v5/';
  await fs.mkdir(DIR, { recursive: true });
  const sidebar = [];
  for (const language of languages) {
    const category = `${PREFIX}${language}/`;
    const sidebarLang = {
      title:
        LANGUAGES[language] ||
        language.replace(/^(.)/, (_, $1) => $1.toUpperCase()),
      path: category,
      redirect: `${category}install.html`,
      children: [
        {
          title: '安装使用',
          path: `${category}install.md`
        },
        {
          title: '用户认证模块',
          children: [
            {
              title: "OIDC 模块",
              path: `${category}authentication/oidc.md`
            },
            {
              title: "OAuth 模块",
              path: `${category}authentication/oauth.md`
            },
            {
              title: "SAML 模块",
              path: `${category}authentication/saml.md`
            },
            {
              title: "CAS 模块",
              path: `${category}authentication/cas.md`
            }
          ]
        },
        {
          title: '管理模块',
          children: []
        }
      ]
    };

    let subCategories = []

    for (const tag of tags) {
      const subCategory = {
        title: tag.name.split('/')[0],
        // path: `${category}${tag.path}/`,
        children: []
      };
      const apis = filterApisByTag(paths, tag);
      if (Object.keys(apis).length === 0) {
        continue;
      }
      for (const path in apis) {
        const data = apis[path]
        let filePath;
        if (isAuthApi) {
          filePath = `${category}authentication/${tag.path}/${path.replace(/^\/api\/v3\//, '')}`
        } else {
          filePath = `${category}management/${tag.path.split('/')[0]}/${path.replace(/^\/api\/v3\//, '')}`
        }
        subCategory.children.push({
          title: data?.get?.summary || data?.post?.summary,
          path: filePath
        });
      }
      if (subCategory.children.length > 0) {
        subCategories.push(subCategory);
      }
    }

    if (isAuthApi) {
      sidebarLang.children[1].children.push(...subCategories);
    } else {
      sidebarLang.children[2].children.push(...subCategories);
    }

    sidebar.push(sidebarLang);
  }
  await fs.writeFile(
    join(DIR, 'sidebar.json'),
    JSON.stringify(sidebar, null, 2),
    { encoding: 'utf-8' }
  );
};
