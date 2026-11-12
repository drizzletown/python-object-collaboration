# 附录 C 语言速查与标准库索引
> 根据手边的任务找到语言机制、对应章节和标准库入口，并用常见错误定位下一步检查。

## C.1 按求解任务查找语言能力

| 要做的事 | 先看哪些写法 | 学习位置 |
| --- | --- | --- |
| 查对象的类型和标识 | `type(value)`、`id(value)`、`is` | [第 1 章](01.md) |
| 计算数量、取商和余数 | `+`、`-`、`*`、`/`、`//`、`%`、`divmod()` | [第 1 章](01.md) |
| 清理输入并生成文字 | `strip()`、`int()`、`str()`、格式化字符串 | [第 1 章](01.md) |
| 按位置或按键取值 | `seq[i]`、`seq[start:stop]`、`mapping[key]`、`get()` | [第 2 章](02.md) |
| 核对成员与复制范围 | `in`、`set()`、`&`、`-`、`copy()`、`deepcopy()` | [第 2 章](02.md) |
| 在不同条件下执行 | `if / elif / else`、`match / case` | [第 3 章](03.md) |
| 重复、配对和编号 | `for`、`while`、`range()`、`zip()`、`enumerate()` | [第 3 章](03.md) |
| 把工作交给独立能力 | `def`、参数、`return`、`yield` | [第 4 章](04.md) |
| 维护一个对象自己的状态 | `class`、`self`、`__init__`、`@property` | [第 5 章](05.md) |
| 传递记录并组织模块 | `dataclass`、类型标注、`import`、`__name__` | [第 6 章](06.md) |
| 报告、处理并检验失败 | `raise`、`try / except`、断言和测试 | [第 7 章](07.md) |
| 管理文件并交换数据 | `Path`、`with`、JSON、CSV | [第 8 章](08.md) |
| 连接规则和存储 | 存储契约、快照、读改存、自测 | [第 9 章](09.md) |
| 更换实现并复用协作 | `Protocol`、继承、装饰器、`async def` 和 `await` | [第 10 章](10.md) |

## C.2 一些常用写法的区别

| 容易混淆的写法 | 用哪一个问题区分 |
| --- | --- |
| `a == b` 和 `a is b` | 值是否相等，或两处是否引用同一个对象 |
| `x is None` 和 `not x` | 是否缺失，或真值是否为假 |
| `append()` 和 `extend()` | 添加一个对象，或逐项加入多个对象 |
| `sorted(values)` 和 `values.sort()` | 取得新的排序结果，或在原列表上排序 |
| `d[key]`、`d.get(key)`、`d.setdefault(key, value)` | 读取必需的键、读取可缺失的键，或缺失时写入 |
| `a = b` 和 `b.copy()` | 建立共享引用，或创建一个浅副本 |
| `break` 和 `continue` | 退出所在循环，或跳过当前这一轮 |
| `print(result)` 和 `return result` | 显示结果，或交给调用者继续使用 |
| `json.load()` 和 `json.loads()` | 从打开的文件读取，或从文字中解析 |
| `write()` 和 `Path.replace()` | 写入打开的流，或用一个完整文件替换目标 |

## C.3 根据异常查找输入与调用

| 异常 | 典型例子 | 先检查什么 |
| --- | --- | --- |
| `SyntaxError` | 分支标题漏冒号 | 错误位置前后的语法 |
| `NameError` | 读取未绑定的名字 | 拼写、定义位置、作用域 |
| `TypeError` | 字符串与整数直接相加 | 运算需要的对象类型或调用方式 |
| `ValueError` | `int("四十二")` | 内容能否转换，取值是否满足约定 |
| `KeyError` | 读取字典里没有的键 | 是否允许缺键及默认行为 |
| `IndexError` | 读取超出范围的下标 | 长度、起始位置和结束条件 |
| `AttributeError` | 对象没有要调用的方法 | 当前对象类型与公开接口 |
| `FileNotFoundError` | 路径找不到文件 | 目标位置，以及是否允许首次创建 |
| `UnicodeDecodeError` | 用不合适的编码读取文本 | 实际编码与读写时的约定 |
| `JSONDecodeError` | JSON 文本没有闭合 | 是否读到了完整且合法的内容 |

遇到错误时先找出最小输入，再看异常类型和回溯。能读到数据后还要检查它的含义。例如 JSON 能解析出一份活动数据，容量、名单和学号仍要按规则验证。[第 7 章](07.md) [第 8 章](08.md)

## C.4 按任务查标准库

| 模块 | 用途 | 官方文档 |
| --- | --- | --- |
| `math` | 浮点近似比较、平方根等计算 | [math](https://docs.python.org/3.12/library/math.html) |
| `collections` | 队列、计数等容器工具 | [collections](https://docs.python.org/3.12/library/collections.html) |
| `copy` | 浅复制与深复制 | [copy](https://docs.python.org/3.12/library/copy.html) |
| `dataclasses` | 从字段生成记录类的常用方法 | [dataclasses](https://docs.python.org/3.12/library/dataclasses.html) |
| `typing` | 描述类型关系、泛型和协议 | [typing](https://docs.python.org/3.12/library/typing.html) |
| `unittest` | 组织和执行测试 | [unittest](https://docs.python.org/3.12/library/unittest.html) |
| `traceback` | 读取和呈现异常的调用路径 | [traceback](https://docs.python.org/3.12/library/traceback.html) |
| `logging` | 按级别记录运行事件 | [logging](https://docs.python.org/3.12/library/logging.html) |
| `pathlib` | 用对象表达和操作路径 | [pathlib](https://docs.python.org/3.12/library/pathlib.html) |
| `io` | 操作文件流或内存文本流 | [io](https://docs.python.org/3.12/library/io.html) |
| `tempfile` | 建立临时文件和目录 | [tempfile](https://docs.python.org/3.12/library/tempfile.html) |
| `json` | 编码、解码结构化 JSON | [json](https://docs.python.org/3.12/library/json.html) |
| `csv` | 按记录和字段读写表格 | [csv](https://docs.python.org/3.12/library/csv.html) |
| `functools` | 包装函数或固定一部分参数 | [functools](https://docs.python.org/3.12/library/functools.html) |
| `asyncio` | 组织协程、并发等待与超时 | [asyncio](https://docs.python.org/3.12/library/asyncio.html) |

知道模块名后，可以先找函数或类的用法，再查输入、结果、错误和示例。需要核对语言规则时看 Python 语言参考。想从更小的例子逐步阅读时，可从官方教程开始。[Python 语言参考](https://docs.python.org/3.12/reference/) [Python 官方教程](https://docs.python.org/3.12/tutorial/)
