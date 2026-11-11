# 附录 B 项目工具链与开发实践
> 为后续项目建立独立环境，保留可重复的运行和测试步骤。

## B.1 创建虚拟环境
在项目目录运行 python -m venv .venv。Windows PowerShell 可直接用 .venv\Scripts\python.exe，macOS 或 Linux 可用 .venv/bin/python。也可在对应终端激活环境，然后用 python 命令。使用 python -m pip --version 核对 pip 所属环境，再安装项目所需依赖。第 9 章项目只使用标准库，可以直接运行。
使用第三方依赖时，明确区分项目直接依赖和环境中已安装的全部软件包。可记录经过验证的依赖版本，并在新环境用 python -m pip install -r requirements.txt 验证安装步骤。Python 包项目通常在 pyproject.toml 中描述构建配置、名称和依赖。先做到在干净目录中能安装和运行，再考虑制作发布包。

## B.2 调试与测试
将断点放在函数调用前或状态修改处。单步进入方法，核对 self 所指实例及其字段；单步越过观察返回值。用 python -m unittest discover 运行标准库测试。若项目采用 pytest，在选定环境安装后运行 python -m pytest。
格式化工具统一布局，静态检查工具可指出潜在问题。使用项目已有配置，让团队成员用相同命令运行这些工具。用 Git 提交一次可描述的变化，先执行 git status、git diff 检查内容，运行测试后再提交。把 .venv 和包含真实报名信息的本地数据文件放进忽略规则。
