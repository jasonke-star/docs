# 图片目录结构说明

## 目录组织

```
images/
├── en-US/          # 英文版专用图片
│   └── (待上传英文版图片)
├── zh-Hans/        # 中文版专用图片
│   └── (当前所有图片已移动到此目录)
└── shared/         # 英文和中文版共享的图片
    └── (如 logo、图标等通用资源)
```

## 使用说明

### 在文档中引用图片

#### 英文版文档 (en-US/)
```mdx
<img src="/images/en-US/your-image.png" alt="Description" />
```

#### 中文版文档 (zh-Hans/)
```mdx
<img src="/images/zh-Hans/your-image.png" alt="描述" />
```

#### 共享图片
```mdx
<img src="/images/shared/your-image.png" alt="Description" />
```

## 当前状态

- ✅ **zh-Hans/** - 包含所有现有的中文版图片
- ⏳ **en-US/** - 等待上传英文版图片
- 📁 **shared/** - 可用于存放两个版本共享的图片

## 图片分类建议

### 中文版专用 (zh-Hans/)
- 中文界面截图
- 中文二维码（微信公众号、用户群）
- 中文版特有的图片

### 英文版专用 (en-US/)
- 英文界面截图
- 英文版特有的图片

### 共享图片 (shared/)
- Logo 和品牌资源
- 通用图标
- 两个版本内容相同的图片

## 注意事项

1. 上传英文版图片时，请确保文件名与中文版对应
2. 如果两个版本的图片内容相同，建议放在 `shared/` 目录
3. 图片路径需要在文档文件中相应更新

