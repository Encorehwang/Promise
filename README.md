## 介绍
本项目是一个基于PromiseA+规范编写出来的简易版Promise库，实现了Promise中比较常用的API，目前已通过Promise配套的测试工具promises-aplus-tests的测试未出现不符合规范的报错


## 核心代码
该简易库的代码都在lib/promise.js中


## 浏览器运行
在浏览器中打开demo/index.html即可


## 测试是否符合PromiseA+标准
在命令行中执行如下命令安装promises-aplus-test
> npm i -g promises-aplus-test

安装完成后，命令行定位到lib目录，执行下方命令
> promises-aplus-tests promise.js

在大约1分钟后，命令行中输出"872 passing"说明测试通过


## 相关资料
- Promise/A+规范官方网站: https://promisesaplus.com
- promises-aplus-tests: https://github.com/promises-aplus/promises-tests