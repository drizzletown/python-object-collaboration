# Python 编程教材

以校园活动报名为贯穿案例，学习对象协作与“建立、使用、兑现”假设三部曲。包含导论、十章正文、三个附录和命令行综合项目。

## 本地学习

在本目录运行以下命令，然后打开 [http://127.0.0.1:8000](http://127.0.0.1:8000/)。

```console
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

教材页面、目录搜索、自测、模拟器和学习进度在浏览器中工作。在线运行代码时，浏览器会从 jsDelivr 加载固定版本的 Pyodide 0.27.7，并在独立 Worker 中执行。每次运行都有新的临时文件环境。若无法加载，可复制代码用本机 Python 3.12 或兼容版本运行。学习进度按站点保存在当前浏览器。

## 运行综合项目

```console
python projects/campus.py
python projects/campus.py --self-test
python projects/campus.py enroll S01
python projects/campus.py list
```

后两个命令默认使用当前目录的 roster.json。可在子命令前使用 --file 参数指定同一文件。

## 编辑与构建

- [chapters](chapters) 保存各章源稿，文件名 00 为导论，01–10 为正文，A–C 为附录。
- [projects/campus.py](projects/campus.py) 是第 9 章的可下载源文件。网页的代码示例直接使用这个文件。
- [assets](assets) 保存网页样式和交互。修改后运行 python build.py 更新 [docs](docs)。构建只使用标准库。
- 源稿第一行使用一级标题，第二行用引用标记简介。正文支持二级标题、列表、行内代码和 HTTPS 链接。Python 围栏在页面上显示为运行器。:::answer 后写练习解析，:::quiz 后依次写题目、选项、正确选项序号和反馈，两者均以 ::: 结束。

## 发布到 GitHub Pages

将本目录的内容提交到目标 GitHub 仓库的 main 分支。进入 Settings → Pages，在 Source 选择 Deploy from a branch，再选择 main 与 /docs，保存并等待部署完成。首页和各章节使用相对路径，可以在项目仓库的子路径下访问。发布设置需要目标仓库的管理权限。[GitHub Pages 发布文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

