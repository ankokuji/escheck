# es-api-check

es语法检测，由于少部分浏览器对于api支持存在特异性问题，如oppo浏览器 `Symbol.iterator` 及 `Array.from` 、 `Array.fill` 的支持问题。babel 等编译工具不会对这些 api 调用进行处理，同时还有可能在编译后出现这些代码。工具会对这些 api 进行检测，并且排除 `"symbol" === typeof Symbol.iterator` 这类不回报错的语法。

# Installation
通过 `yarn` 安装:
```shell
yarn add es-api-check
```

# Usage
目前提供两个 api ，分别是检查错误，和打印错误。
```javascript
import {esCheck, printError} from "es-api-check";

const code = `a[Symbol.iterator]`;
const customCheck = {
  memberExpression: {
    object: "Array",
    property: "from"
  }
};
const errors = esCheck(code, customCheck);
// -> erros: {}
const print = printError(errors);
```

# Interface

**esCheck**`(code, [customCheck])`用于检查代码的api是否含有不支持代码，参数`code`为字符串类型，为需要被检测的代码。第二个参数为可选，作为自定义的检查规则。返回值是一个错误描述数组。

错误描述包含以下几个内容：

- **nodeLocation**: 描述错误节点的位置，包含`col`和`row`两个属性，分别代表错误出现的列和行。
   - `row`: 代码行数，`number`类型。
   - `col`: 代码列数。

- **errorSentence**: 为错误所在语句的代码。

**printError**`(errors)`用于打印错误，返回字符串。传入参数`errors`为`esCheck`执行所得。

# Default check list

目前的默认过滤规则有以下：
### `Array`
* `Array.fill`
* `Array.from`

### `Symbol`
* `Symbol.iterator`
