# 附录 A Python 运行环境与学习工具
> 完成安装检查，从交互解释器和终端分别运行一段 Python。

## A.1 检查解释器
安装 Python 3.12 或兼容的更新版本。可以从 [Python 官方下载](https://www.python.org/downloads/) 获取安装入口。Windows 打开 PowerShell，运行 py -3 --version；如果安装方式提供 python 命令，也可以运行 python --version。macOS 和 Linux 常用 python3 --version。记录输出的主版本与次版本。若命令找不到，检查解释器是否安装、终端是否需要重新打开以及命令是否在 PATH 上。
在终端运行 python 或 python3，看到 >>> 时进入交互模式。键入 print(2 + 3) 并回车，预期显示 5。用 exit() 退出。终端运行命令，交互解释器接收 Python 语句，遇到错误时先确认当前所在的界面。

## A.2 运行脚本
创建练习目录，把下面的内容保存为 hello.py，使用 UTF-8 编码。终端切换到文件所在目录，运行 python hello.py。使用 py -3 或 python3 的读者可替换命令开头。文件名 hello.py 要完整，包括扩展名。找不到文件时先检查当前目录及文件名。

```python
message = "我的第一段 Python"
print(message)
```

使用 VS Code 时先打开练习目录，再选择刚验证过的 Python 解释器。在编辑器的终端重跑版本命令，确认它和运行脚本所用的是同一套环境。若网页运行器在加载阶段超时，可将示例复制到本机脚本继续练习。
