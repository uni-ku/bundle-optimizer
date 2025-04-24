## commitlint - schema

- [commitlint 主配置](./commitlint.json) - 更新地址 [conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-validator/src/commitlint.schema.json)
- [cz-git 配置](./cz-git.json) - 更新地址 [cz-git](https://github.com/Zhengqbbb/cz-git/blob/main/docs/public/schema/cz-git.json)

> [commitlint-patch.json](./commitlint-patch.json) 是在 [commitlint.json](./commitlint.json) 基础上的修改。
>
>因为 [`"oneOf"`](./commitlint.json#L6) 配置有点问题，详见 https://github.com/redhat-developer/vscode-yaml/issues/247 ，故去除。
>
> [commitlint-with-cz.json](./commitlint-with-cz.json) 是调整合并之后的完整配置，在 [settings.json - yaml.schemas](../settings.json) 中有映射配置。
