const ejs = require('ejs');
const { existsSync } = require('fs');
const fs = require('fs/promises');
const { join } = require('path');
const { filterApisByTag } = require('./helper');
const {
  getSchema,
  getSchemaName,
  getSchemaModels,
  getExampleJson
} = require('./helper');
const { camelCase } = require('./camelcase');

const LANGUAGES = {
  // python: 'Python',
  // java: 'Java',
  // go: 'Go',
  php: 'PHP',
  csharp: 'C#',
  node: 'Node.js'
};

const DIR = join(__dirname, '../../generated');

const convertFirstCharToUpperCase = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);

const camelToSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const getOperationName = (operationId) =>
  camelCase(
    operationId
      .split('_')[1]
      .replace(/^[^a-zA-Z]+/g, '')
      .replace(/[^\w\\-]+/g, '-')
      .trim()
  );

const getFuncName = (lang, operationId) => {
  let opName = getOperationName(operationId);

  if (lang === 'csharp') {
    opName = convertFirstCharToUpperCase(opName);
    // eslint-disable-next-line eqeqeq
  } else if (lang == 'go') {
    opName = convertFirstCharToUpperCase(opName);
  } else if (lang === 'python') {
    opName = camelToSnakeCase(opName);
  }

  return opName;
};

exports.generate = async ({
  language,
  path,
  options,
  tag,
  components,
  isAuthApi
}) => {
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
    const ejsFile = isAuthApi
      ? join(__dirname, '../templates/authentication/main.ejs')
      : join(__dirname, '../templates/management/main.ejs');
    const codeSamples = options['x-authing-code-samples'];
    const output = await ejs.renderFile(
      ejsFile,
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
        ),
        codeSample: codeSamples && codeSamples[language],
        funcName: getFuncName(language, options.operationId)
      },
      {
        // async: true
      }
    );
    const file = isAuthApi
      ? join(
          DIR,
          language,
          'authentication',
          tag.path.split('/')[0],
          `${path.replace(/^\/api\/v3\//, '').replace('/', '-')}.md`
        )
      : join(
          DIR,
          language,
          'management',
          tag.path.split('/')[0],
          `${path.replace(/^\/api\/v3\//, '').replace('/', '-')}.md`
        );
    await fs.writeFile(file, output, {
      encoding: 'utf-8'
    });
  } catch (error) {
    console.log('build 失败：', error);
  }
};

exports.generateSidebar = async ({
  languages,
  authenticationTags,
  authenticationPaths,
  managementTags,
  managementPaths
}) => {
  // Generate Sidebar
  const PREFIX = '/reference/sdk/';
  await fs.mkdir(DIR, { recursive: true });
  const sidebar = [];
  for (const language of languages) {
    const category = `${PREFIX}${language}/`;

    const tokenDoc = {
      title: '管理 Token',
      children: [
        {
          title: '获取 Token',
          path: `/reference/sdk/${language}/authentication/管理-token/get-access-token.md`
        },
        {
          title: '校验 Token',
          path: `/reference/sdk/${language}/authentication/管理-token/introspect-token.md`
        },
        {
          title: '撤销 Token',
          path: `/reference/sdk/${language}/authentication/管理-token/revoke-token.md`
        }
      ]
    };

    const logoutDoc = {
      title: '登出',
      children: [
        {
          title: '前端登出',
          path: `/reference/sdk/${language}/authentication/登出/front-channel-logout.md`
        },
        {
          title: '后端登出',
          path: `/reference/sdk/${language}/authentication/登出/backend-channel-logout.md`
        }
      ]
    };

    const authEventDoc = {
      title: '事件',
      path: `/reference/sdk/${language}/authentication/events.md`
    };

    const managementEventDoc = {
      title: '事件',
      path: `/reference/sdk/${language}/management/events.md`
    };

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
              title: 'OIDC 模块',
              path: `${category}authentication/oidc.md`
            },
            {
              title: 'OAuth 模块',
              path: `${category}authentication/oauth.md`
            },
            {
              title: 'SAML 模块',
              path: `${category}authentication/saml.md`
            },
            {
              title: 'CAS 模块',
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

    // 固定的菜单
    const defaultCategories = [
      {
        tag: '登录',
        apis: [
          {
            title: '账号密码登录',
            path: `${category}authentication/登录/signin-by-account-password.md`
          },
          {
            title: '用户名密码登录',
            path: `${category}authentication/登录/signin-by-username-password.md`
          },
          {
            title: '手机号密码登录',
            path: `${category}authentication/登录/signin-by-phone-password.md`
          },
          {
            title: '邮箱密码登录',
            path: `${category}authentication/登录/signin-by-email-password.md`
          },
          {
            title: '邮箱验证码登录',
            path: `${category}authentication/登录/signin-by-email-passcode.md`
          },
          {
            title: '手机号验证码登录',
            path: `${category}authentication/登录/signin-by-phone-passcode.md`
          },
          {
            title: 'LDAP 账号登录',
            path: `${category}authentication/登录/signin-by-ldap.md`
          },
          {
            title: 'AD 账号登录',
            path: `${category}authentication/登录/signin-by-ad.md`
          },
          {
            title: '生成登录地址',
            path: `${category}authentication/登录/build-authorize-url.md`
          }
        ]
      },
      {
        tag: '注册',
        apis: [
          {
            title: '用户名密码注册',
            path: `${category}authentication/注册/signup-by-username-password.md`
          },
          {
            title: '邮箱密码注册',
            path: `${category}authentication/注册/signup-by-email-password.md`
          },
          {
            title: '手机号验证码注册',
            path: `${category}authentication/注册/signup-by-phone-passcode.md`
          },
          {
            title: '邮箱验证码注册',
            path: `${category}authentication/注册/signup-by-email-passcode.md`
          }
        ]
      }
    ];

    // 生成认证的 sidebar
    const authenticationSubCategories = [];
    for (const tag of authenticationTags) {
      const subCategory = {
        title: tag.name.split('/')[0],
        // path: `${category}${tag.path}/`,
        children: defaultCategories.find((x) => x.tag === tag.name)?.apis || []
      };
      const apis = filterApisByTag(authenticationPaths, tag);
      if (Object.keys(apis).length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line guard-for-in
      for (const path in apis) {
        const data = apis[path];
        let filePath;
        // eslint-disable-next-line prefer-const
        filePath = `${category}authentication/${tag.path}/${path
          .replace(/^\/api\/v3\//, '')
          .replace('/', '-')}`;

        const mdFilePath = join(
          __filename,
          '../../../generated/',
          language,
          'authentication',
          `${tag.path}/${path.replace(/^\/api\/v3\//, '').replace('/', '-')}.md`
        );

        if (existsSync(mdFilePath)) {
          subCategory.children.push({
            title: data?.get?.summary || data?.post?.summary,
            path: filePath
          });
        }
      }
      if (subCategory.children.length > 0) {
        authenticationSubCategories.push(subCategory);
      }
    }

    // 生成管理的 sidebar
    const managementSubCategories = [];
    for (const tag of managementTags) {
      const subCategory = {
        title: tag.name.split('/')[0],
        // path: `${category}${tag.path}/`,
        children: []
      };
      const apis = filterApisByTag(managementPaths, tag);
      if (Object.keys(apis).length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line guard-for-in
      for (const path in apis) {
        const data = apis[path];
        let filePath;
        // eslint-disable-next-line prefer-const
        filePath = `${category}management/${tag.path.split('/')[0]}/${path
          .replace(/^\/api\/v3\//, '')
          .replace('/', '-')}`;

        // eslint-disable-next-line max-len
        const mdFilePath = join(
          __filename,
          '../../../generated/',
          language,
          'management',
          `${tag.path.split('/')[0]}/${path
            .replace(/^\/api\/v3\//, '')
            .replace('/', '-')}.md`
        );

        if (existsSync(mdFilePath)) {
          subCategory.children.push({
            title: data?.get?.summary || data?.post?.summary,
            path: filePath
          });
        }
      }
      if (subCategory.children.length > 0) {
        managementSubCategories.push(subCategory);
      }
    }

    sidebarLang.children[1].children.unshift(...authenticationSubCategories);

    // 拼接退出登录和 token 管理的文档
    sidebarLang.children[1].children.splice(1, 0, tokenDoc);
    sidebarLang.children[1].children.splice(1, 0, logoutDoc);
    // 拼接事件文档
    sidebarLang.children[1].children.push(authEventDoc);

    sidebarLang.children[2].children.push(...managementSubCategories);
    sidebarLang.children[2].children.push(managementEventDoc);
    sidebar.push(sidebarLang);
  }

  await fs.writeFile(
    join(DIR, 'sidebar.json'),
    JSON.stringify(sidebar, null, 2),
    { encoding: 'utf-8' }
  );
};
