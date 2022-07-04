# 判断用户是否有某个角色

<!--
  警告⚠️：
  不要直接修改该文档，
  https://github.com/Authing/authing-docs-factory
  使用该项目进行生成
-->

<LastUpdated />

判断用户是否有某个角色，支持同时传入多个角色进行判断

## 请求参数

| 名称 | 类型 | 必填 | 默认值 | 描述 | 示例值 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| userId | string | 是 | - | 用户 ID。  | `6229ffaxxxxxxxxcade3e3d9` |
| roles | <a href="#HasRoleRolesDto">HasRoleRolesDto[]</a> | 是 | - | 角色列表。  |  |


## 示例代码

```py
from authing import ManagementClient

management_client = ManagementClient(
    access_key_id="AUTHING_USERPOOL_ID",
    access_key_secret="AUTHING_USERPOOL_SECRET",
)

data = management_client.has_any_role(
     user_id: "6229ffaxxxxxxxxcade3e3d9",
     roles: [{
           namespace: "default",
         code: "admin",
      }],
  
)
```



## 请求响应

类型： `HasAnyRoleRespDto`

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| statusCode | number | 业务状态码，可以通过此状态码判断操作是否成功，200 表示成功。 |
| message | string | 描述信息 |
| apiCode | number | 细分错误码，可通过此错误码得到具体的错误类型。 |
| data | <a href="#HasAnyRoleDto">HasAnyRoleDto</a> | 响应数据 |



示例结果：

```json
{
  "statusCode": 200,
  "message": "操作成功",
  "apiCode": 20001,
  "data": {
    "hasAnyRole": true
  }
}
```

## 数据结构


### <a id="HasRoleRolesDto"></a> HasRoleRolesDto

| 名称 | 类型 | 必填 | 描述 |
| ---- |  ---- | ---- | ---- |
| namespace | string | 否 | 所属权限分组的 code。 示例值： `default`  |
| code | string | 是 | 角色 code。 示例值： `admin`  |


### <a id="HasAnyRoleDto"></a> HasAnyRoleDto

| 名称 | 类型 | 必填 | 描述 |
| ---- |  ---- | ---- | ---- |
| hasAnyRole | boolean | 是 | 是否拥有其中某一个角色。 示例值： `true`  |


