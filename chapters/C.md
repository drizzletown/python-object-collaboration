# 附录 C 语言速查与标准库索引
> 根据手边任务定位章节、语法和标准库入口。

## C.1 语言速查
- 计算和格式化：整数运算、divmod、f-string。参见第 1 章。
- 按键查找：mapping[key]、mapping.get(key)、key in mapping。参见第 2 章。
- 遍历、判断与匹配：for item in items、if condition、match value。参见第 3 章。
- 复用与按需产生结果：def、return、yield。参见第 4 章。
- 定义活动职责：class、self、__init__、__len__。参见第 5 章。
- 组织模块：import、from ... import ...、python -m package。参见第 6 章。
- 应对失败：try、except、raise、finally。参见第 7 章。
- 管理资源：with resource as value。参见第 8 章。
- 替换协作能力：Protocol、装饰器、async def、await。参见第 10 章。

## C.2 常见异常
ValueError 常见于值不满足约定。TypeError 常见于类型或调用方式不合适。KeyError 表示映射中缺少指定键。IndexError 表示序列下标越界。FileNotFoundError 表示路径指向的文件或目录缺失。阅读回溯、定位最小复现，再决定修正输入还是调整程序。

## C.3 标准库索引
- [pathlib](https://docs.python.org/zh-cn/3.12/library/pathlib.html) 以对象处理路径。
- [json](https://docs.python.org/zh-cn/3.12/library/json.html) 编码、解码 JSON 数据。
- [csv](https://docs.python.org/zh-cn/3.12/library/csv.html) 读写分隔字段。
- [unittest](https://docs.python.org/zh-cn/3.12/library/unittest.html) 组织和运行测试。
- [logging](https://docs.python.org/zh-cn/3.12/library/logging.html) 记录运行事件。
- [typing](https://docs.python.org/zh-cn/3.12/library/typing.html) 描述类型和协议。
- [asyncio](https://docs.python.org/zh-cn/3.12/library/asyncio.html) 运行协程及安排异步任务。
- [Python 教程](https://docs.python.org/zh-cn/3.12/tutorial/) 提供语言实例与进一步阅读。
