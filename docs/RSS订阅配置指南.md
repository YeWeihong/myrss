# RSS订阅配置指南

本文档介绍如何配置RSS订阅源以获取全文内容，以及如何控制摘要显示的长度。

## 目录

- [获取全文内容](#获取全文内容)
- [摘要长度说明](#摘要长度说明)
- [常见问题](#常见问题)

## 获取全文内容

许多RSS订阅源只提供文章摘要而不是全文。为了获取完整的文章内容，你可以使用以下方法：

### 方法一：使用 morss.it 服务

[morss.it](https://morss.it/) 是一个免费的RSS全文抓取服务，可以自动提取文章的完整内容。

#### 基本用法

在原始RSS源的URL前添加 `https://morss.it/` 前缀：

```yaml
sources:
  # 原始订阅源（仅摘要）
  # - href: https://example.com/feed

  # 使用 morss.it 获取全文
  - href: https://morss.it/https://example.com/feed
```

#### 使用代理模式

如果你需要更稳定的抓取，可以使用 `:proxy` 参数：

```yaml
sources:
  # 使用代理模式获取全文
  - href: https://morss.it/:proxy/https://example.com/feed
```

#### 自定义抓取规则

morss.it 支持使用CSS选择器来指定要抓取的内容：

```yaml
sources:
  # 使用 :items 参数指定文章列表的CSS选择器
  - href: https://morss.it/:items=%7C%7C*[class=title]/https://example.com
  
  # 解码后的实际参数是：:items=||*[class=title]
  # 其中 ||*[class=title] 表示选择所有 class="title" 的元素
```

#### morss.it 参数说明

常用参数：
- `:proxy` - 使用代理服务器抓取（推荐用于访问受限的网站）
- `:items=SELECTOR` - 指定文章列表的CSS选择器
- `:item=SELECTOR` - 指定单个文章的CSS选择器
- `:title=SELECTOR` - 指定文章标题的CSS选择器
- `:content=SELECTOR` - 指定文章内容的CSS选择器

### 方法二：使用 RSSHub

[RSSHub](https://docs.rsshub.app/) 是另一个强大的RSS生成服务，它可以为许多网站生成RSS源，通常包含全文内容。

```yaml
sources:
  # 使用 RSSHub 生成的RSS源（通常包含全文）
  - href: https://rsshub.app/zhihu/daily
  - href: https://rsshub.rssforever.com/tencent/news/author/AUTHOR_ID
```

**注意**：RSSHub 有多个公共实例，如：
- `rsshub.app`（官方实例）
- `rsshub.rssforever.com`
- 其他第三方实例

### 方法三：使用 FeedX

[FeedX](https://feedx.net/) 提供了许多预配置的全文RSS源。

```yaml
sources:
  # 使用 FeedX 提供的全文RSS源
  - href: https://feedx.site/rss/infzm.xml
  - href: https://feedx.site/rss/shanghaishuping.xml
```

### 现有配置示例

在 `osmosfeed.yaml` 文件中已有一些使用全文抓取的例子：

```yaml
sources:
  # 使用 morss.it 抓取全文的例子
  - href: https://morss.it/:proxy/https://chinadigitaltimes.net/chinese/feed  # 中国数字时代 全文
  - href: https://morss.it/:proxy/rsshub.rssforever.com/500px/tribe/set/caa6dc8271c24a9fa0af2f24f94c9ac9  # 尘世烟火
  - href: https://morss.it/https://gijn.org/feed/  # 全球深度报道 全文
  
  # 使用 RSSHub 的例子
  - href: https://rsshub.rssforever.com/tencent/news/author/8QMf33ZY5YwduT%2FQ  # 人物-介绍人物
  - href: https://rsshub.rssforever.com/zhihu/daily  # 知乎日报
  
  # 使用 FeedX 的例子
  - href: https://feedx.site/rss/infzm.xml  # 南方周末
```

## 摘要长度说明

### 默认行为

osmosfeed 会自动处理文章摘要的显示：

1. **全文显示**：如果文章内容少于 2048 个字符，则完整显示
2. **自动截断**：如果文章内容超过 2048 个字符，则截断到约 800 个字符，并添加省略号

### 摘要内容优先级

系统按以下优先级选择要显示的内容：

1. RSS源中的 `summary` 字段（如果存在）
2. RSS源中的 `content` 字段（如果存在且会自动截断）
3. 从文章页面抓取的描述信息（通过 meta 标签）
4. 如果以上都不可用，显示 "No content preview"

### 如何显示更多内容

#### 选项1：使用全文抓取服务

如上一节所述，使用 morss.it、RSSHub 或 FeedX 等服务可以获取完整的文章内容。

#### 选项2：自定义模板（高级）

如果你需要更精细的控制，可以自定义 Handlebars 模板：

1. 创建 `includes/index.hbs` 文件
2. 修改模板以显示更长的摘要或完整内容

参考：[osmosfeed 自定义指南](https://github.com/osmoscraft/osmosfeed/blob/master/docs/customization-guide.md)

#### 选项3：自定义 CSS（简单）

你可以通过 CSS 控制摘要的视觉呈现：

1. 创建 `includes/before-head-end.html` 文件
2. 添加自定义样式：

```html
<style>
/* 调整文章摘要的最大高度 */
.article-content {
  max-height: none; /* 移除高度限制 */
}

/* 或设置更大的高度 */
.article-content {
  max-height: 600px; /* 默认可能更小 */
}
</style>
```

**注意**：这只影响视觉呈现，不会改变实际抓取的内容长度。

### 技术说明

在 osmosfeed 的源代码中，摘要处理的逻辑如下：

```typescript
// 截断阈值：2048 字符
const SUMMARY_TRIM_ACTIVATION_THRESHOLD = 2048;

// 截断后的长度：800 字符
const SUMMARY_TRIM_TO_LENGTH = 800;
```

这些值是硬编码的，如果你需要修改它们，需要：

1. Fork osmosfeed 项目
2. 修改 `packages/cli/src/lib/enrich.ts` 文件中的常量
3. 重新编译并使用你自己的版本

**不推荐普通用户这样做**，建议使用全文抓取服务。

## 常见问题

### Q: 为什么有些订阅源使用了 morss.it 后仍然只显示摘要？

A: 可能的原因：
1. 目标网站使用了反爬虫机制
2. CSS选择器配置不正确
3. 网站的内容是动态加载的（JavaScript渲染）

解决方案：
- 尝试使用 `:proxy` 参数
- 调整 CSS 选择器
- 寻找该网站的 RSSHub 路由

### Q: 如何知道某个网站是否支持全文RSS？

A: 你可以：
1. 查看 [RSSHub 文档](https://docs.rsshub.app/) 是否有该网站的路由
2. 查看 [FeedX](https://feedx.net/) 是否提供了该网站的全文源
3. 尝试使用 morss.it 并测试效果

### Q: 使用这些服务会影响更新速度吗？

A: 会有一定影响：
- morss.it 需要实时抓取网页，会增加延迟
- RSSHub 和 FeedX 通常有缓存，速度较快
- 建议根据实际需求在速度和完整性之间权衡

### Q: 这些服务稳定吗？

A: 稳定性因服务而异：
- morss.it：公共服务，可能有时不稳定
- RSSHub：有多个镜像实例，可以在不同实例间切换
- FeedX：付费服务通常更稳定

建议定期检查订阅源是否正常工作。

### Q: 可以同时使用多个全文抓取服务吗？

A: 可以。对于不同的订阅源，你可以选择最合适的服务：

```yaml
sources:
  # 使用 morss.it 的源
  - href: https://morss.it/:proxy/https://example1.com/feed
  
  # 使用 RSSHub 的源
  - href: https://rsshub.app/example2
  
  # 使用 FeedX 的源
  - href: https://feedx.site/rss/example3.xml
  
  # 原始RSS源（如果已经是全文）
  - href: https://example4.com/feed
```

### Q: 如何测试配置是否有效？

A: 步骤：
1. 修改 `osmosfeed.yaml` 文件
2. 提交更改到 GitHub
3. 等待 GitHub Actions 自动构建（1-3分钟）
4. 访问你的 RSS 阅读器页面查看效果
5. 检查文章内容是否完整

你也可以在提交前使用浏览器直接访问配置的RSS URL，查看返回的内容。

## 推荐配置

根据你的需求选择合适的配置策略：

### 策略1：优先速度

```yaml
sources:
  # 使用原始RSS源和预生成的全文源
  - href: https://example.com/feed  # 原始源
  - href: https://feedx.site/rss/example.xml  # FeedX 预生成的全文源
```

### 策略2：优先完整性

```yaml
sources:
  # 使用 morss.it 强制抓取全文
  - href: https://morss.it/:proxy/https://example.com/feed
```

### 策略3：平衡方案（推荐）

```yaml
sources:
  # 对于稳定的大型网站，使用 RSSHub
  - href: https://rsshub.app/zhihu/daily
  
  # 对于有预生成源的，使用 FeedX
  - href: https://feedx.site/rss/infzm.xml
  
  # 对于其他需要全文的，使用 morss.it
  - href: https://morss.it/:proxy/https://example.com/feed
  
  # 对于已经提供全文的源，直接使用原始链接
  - href: https://example.com/full-content-feed
```

## 相关资源

- [osmosfeed 官方文档](https://github.com/osmoscraft/osmosfeed)
- [morss.it 文档](https://morss.it/)
- [RSSHub 文档](https://docs.rsshub.app/)
- [FeedX 网站](https://feedx.net/)
- [osmosfeed 配置参考](https://github.com/osmoscraft/osmosfeed/blob/master/docs/osmosfeed-yaml-reference.md)
- [osmosfeed 自定义指南](https://github.com/osmoscraft/osmosfeed/blob/master/docs/customization-guide.md)

## 贡献

如果你发现本文档有任何问题或需要补充，欢迎提交 Issue 或 Pull Request。
