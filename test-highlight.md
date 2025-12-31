---
title: 代码高亮测试
date: 2025-01-01
tags: [test, highlight]
author: Dev
---

# 代码高亮测试文档

## Bash 示例

```bash
#!/bin/bash
# 这是一个 bash 脚本示例
echo "Hello, World!"

for i in {1..5}; do
  echo "Count: $i"
done

if [ -f "/etc/passwd" ]; then
  echo "passwd file exists"
fi
```

## JavaScript 示例

```js
// JavaScript 代码示例
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(`Result: ${result}`);

// 使用 async/await
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## C 语言示例

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("Hello, World!\n");

    int arr[] = {1, 2, 3, 4, 5};
    int sum = 0;

    for (int i = 0; i < 5; i++) {
        sum += arr[i];
    }

    printf("Sum: %d\n", sum);
    return 0;
}
```

## GLSL (OpenGL Shading Language) 示例

```glsl
#version 330 core

// 顶点着色器
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 color;

out VS_OUTPUT {
    vec3 color;
} output;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main(void) {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    output.color = color;
}
```

## Python 示例

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def calculate_average(numbers):
    """计算数字列表的平均值"""
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)

class Calculator:
    def __init__(self, name):
        self.name = name
        self.history = []

    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

# 使用示例
calc = Calculator("MyCalc")
avg = calculate_average([1, 2, 3, 4, 5])
print(f"Average: {avg}")
```

## JSON 示例

```json
{
  "name": "Knowledge Base",
  "version": "1.0.0",
  "features": [
    "markdown rendering",
    "code highlighting",
    "math support"
  ],
  "config": {
    "theme": "dark",
    "language": "en",
    "fontSize": 14
  }
}
```

## HTML/CSS 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Highlight Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World</h1>
    </div>
</body>
</html>
```

## SQL 示例

```sql
-- 创建表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据
INSERT INTO users (username, email) VALUES
('alice', 'alice@example.com'),
('bob', 'bob@example.com');

-- 查询数据
SELECT * FROM users WHERE created_at > NOW() - INTERVAL 7 DAY;
```

所有支持的编程语言都已启用代码高亮功能！
