# MySQL性能调优指南

**SakuRain Team 内部数据库开发运维手册**

|版本|日期|修订内容|作者|校对|
| ------| ------------| ----------------------------| -----------------------| --------|
|v1.0|2024-03-11|初始版本|Yuyang|Yuyang|
|v1.1|2024-05-31|改正部分代码问题|Junjie, Chenglian|Yuyang|
|v1.2|2024-06-15|改正部分代码问题|Yuyang|Zihao|
|v2.0|2024-09-27|新增云原生优化章节|Yuyang, Junjie, Zihao|Yuyang|
|v3.0|2024-12-26|补充MySQL 8.4新特性|Chenglian|Zihao|
|v3.1|2025-01-13|增加PlantUML图表和实战案例|Yuyang|Zihao|

---

## 前言

### 文档定位与价值主张

本指南不是MySQL入门手册，而是自主编写的数据库性能优化**工程实践指南**。我们拒绝照搬官方文档的平铺直叙，也反对脱离实际的纸上谈兵。每一个优化建议都源于我们在学习、实验与项目实践中的真实总结与复盘。

团队核心成员Yuyang和Zihao在央企实习期间，曾深入接触并参与过千万级QPS、PB级数据规模的生产环境调优，积累了宝贵的实战经验。我们深知，性能优化没有银弹，只有基于**量化分析**、**场景化决策**和**可验证验证**的系统性工程方法。

### 知识体系架构

本指南采用  **"架构→原理→诊断→优化→验证"**  的闭环思维框架：

1. ​**深度理解**：不止告诉你"怎么做"，更解释"为什么"——从InnoDB页结构到LSN日志链，从优化器成本模型到执行计划解码
2. ​**精准定位**​：拒绝"拍脑袋"优化，通过Performance Schema、sys库、OPTIMIZER\_TRACE构建三位一体的诊断体系
3. ​**场景化决策**：同一慢查询，在OLTP与OLAP场景下的优化路径可能完全相反
4. ​**可验证原则**：任何优化必须在影子环境通过pt-upgrade验证，生产环境灰度发布，确保可回滚

### 目标读者画像

- ​**初级DBA（0-2年）** ：重点掌握第1-5章基础篇，建立" Metrics驱动"的思维习惯，警惕"参数调优"陷阱
- ​**中级DBA（2-5年）** ：深耕第6-10章，精通执行计划分析、索引设计艺术、慢查询闭环治理
- ​**高级DBA/架构师（5年+）** ：主攻第9-15章，驾驭高可用架构、分库分表、云原生与性能测试体系
- ​**后端开发Leader**：理解第3-5章，根治"N+1查询"、"大事务"、"死锁"等应用层顽疾

---

## 第一部分：基础篇 - 理解MySQL核心架构

### 第1章 MySQL体系结构深度解析

#### 1.1 逻辑架构分层详解

MySQL采用经典的分层架构设计，理解各层职责是性能优化的前提。本节将从源码级解读各层实现原理。

##### 1.1.1 连接层(Connection Layer)

连接层是MySQL服务器的最外层，负责客户端连接处理、认证、安全等。我们先通过架构图理解其结构：

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

component "连接层" {
  [连接管理器\n(Connection Manager)] -down-> [线程池\n(Thread Pool)]
  [连接管理器] -down-> [认证模块\n(Auth Module)]
  [认证模块] -down-> [SSL/TLS\n加密层]
  [线程池] -down-> [连接线程\n(Connection Thread)]
  [连接线程] -down-> [会话管理\n(Session Manager)]
}

database "MySQL Server" {
  [连接层] -down-> [服务层]
}

note right of "连接管理器"
  负责accept()客户端连接
  维护max_connections限制
  管理连接队列
end note

note right of "线程池"
  企业版特性
  避免频繁创建/销毁线程
  支持优先级队列
end note

note right of "认证模块"
  支持多种认证插件
  mysql_native_password
  caching_sha2_password (8.0默认)
  LDAP、PAM等企业插件
end note

@enduml
```

**核心组件详解：**

**1. 连接管理器(Connection Manager)**

连接管理器是mysqld进程启动后创建的第一个核心组件，源码位于`sql/conn_handler/`目录。

**工作流程：**

```c
// 伪代码简化版
while (server_running) {
  // 1. select/poll/epoll监听端口
  fd = accept_listen_socket();
  
  // 2. 检查连接限制
  if (connection_count >= max_connections) {
    // 放入连接队列或拒绝
    if (back_log_full) {
      reject_connection();
      continue;
    }
  }
  
  // 3. 创建连接对象(THD)
  THD *thd = create_thd();
  
  // 4. 分配连接线程
  if (thread_cache_size > 0) {
    thread = get_thread_from_cache();
  } else {
    thread = create_new_thread();
  }
  
  // 5. 启动线程处理
  thread->start(handle_one_connection, thd);
}
```

**关键参数配置与调优：**

```sql
-- 最大连接数（动态调整）
SHOW VARIABLES LIKE 'max_connections';      -- 默认151
SET GLOBAL max_connections = 1000;          -- 动态修改

-- 实际建议值计算公式：
-- max_connections = (可用内存 - Global buffers) / 每个线程内存 + 缓冲余量

-- 线程缓存大小（减少创建销毁开销）
SHOW VARIABLES LIKE 'thread_cache_size';    -- 默认-1（自动调整）
SHOW STATUS LIKE 'Threads_cached';          -- 当前缓存线程数
SHOW STATUS LIKE 'Threads_created';         -- 累计创建线程数

-- 优化公式：thread_cache_size = 8 + (max_connections / 100)
-- 例如max_connections=1000，则设为18

-- 线程池参数（企业版）
SHOW VARIABLES LIKE 'thread_pool_size';     -- 线程组数，建议=CPU核心数
SHOW VARIABLES LIKE 'thread_pool_oversubscribe'; -- 每个组线程数，默认3
SHOW VARIABLES LIKE 'thread_pool_max_threads';   -- 最大线程总数

-- 监控指标
SHOW STATUS LIKE 'Threads_connected';       -- 当前连接数
SHOW STATUS LIKE 'Threads_running';         -- 活跃线程数（正在执行查询）
SHOW STATUS LIKE 'Aborted_connects';        -- 连接失败次数
SHOW STATUS LIKE 'Aborted_clients';         -- 客户端异常断开
SHOW STATUS LIKE 'Connection_errors_internal'; -- 内部错误
SHOW STATUS LIKE 'Connection_errors_max_connections'; -- 超限次数
```

**生产环境配置案例：**

某电商平台MySQL配置（64GB内存，32核CPU）：

```ini
[mysqld]
# 连接层配置
max_connections = 2000
thread_cache_size = 28
thread_pool_size = 32          # 企业版启用
thread_pool_oversubscribe = 5

# 超时设置
wait_timeout = 600
interactive_timeout = 600
connect_timeout = 10

# 网络参数
max_allowed_packet = 64M       # 防止大SQL导致内存溢出
net_read_timeout = 30
net_write_timeout = 60
```

**连接异常问题排查：**

**案例：Aborted_clients持续增高**

```bash
# 1. 查看错误日志
tail -f /var/log/mysql/error.log | grep "Aborted connection"

# 常见原因：
# - 客户端程序未正常关闭连接（未调用mysql_close）
# - 连接空闲超时（wait_timeout）
# - 网络不稳定
# - max_allowed_packet太小

# 2. 网络抓包分析
tcpdump -i eth0 port 3306 -w mysql.pcap
# 使用Wireshark分析MySQL协议
```

**解决方案：**

```python
# 应用层代码示例 - 正确管理连接
import pymysql
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    conn = pymysql.connect(host='mysql-server', user='app', password='xxx', db='appdb')
    try:
        yield conn
    finally:
        conn.close()  # 确保连接关闭

# 使用连接池
from dbutils.pooled_db import PooledDB

pool = PooledDB(
    creator=pymysql,
    host='mysql-server',
    mincached=10,
    maxcached=100,
    blocking=True,  # 连接耗尽时等待而非报错
)
```

**2. 认证模块(Auth Module)**

MySQL 8.0默认使用`caching_sha2_password`​，与5.7的`mysql_native_password`有显著区别。

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "客户端" as client
participant "连接层" as conn
database "mysql.user" as userdb

client -> conn: 发起连接
conn -> conn: 检查max_connections
conn -> userdb: 查找用户记录
userdb --> conn: 返回认证插件信息

alt caching_sha2_password
  conn -> client: 发送RSA公钥
  client -> conn: 发送加密密码
  conn -> conn: 验证密码哈希
  conn -> conn: 缓存认证信息（缓存命中跳过后续步骤）
else mysql_native_password
  conn -> client: 发送随机数(scramble)
  client -> conn: 发送加密密码(xor)
  conn -> conn: 验证hash值
end

conn --> client: 认证结果
@enduml
```

**认证性能问题：**

在高并发短连接场景，认证成为性能瓶颈。

**优化方案：**

```sql
-- 1. 使用缓存插件
SET GLOBAL caching_sha2_password_digest_rounds = 5000;  -- 降低回合数（权衡安全性）

-- 2. 切换回native插件（兼容性考虑）
ALTER USER 'appuser'@'%' IDENTIFIED WITH mysql_native_password BY 'password';

-- 3. 使用连接池（根本解决方案）
```

##### 1 **.1.2 服务层(Server Layer)**

服务层是MySQL的核心，包含查询解析、优化、缓存等关键功能。

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

component "服务层" {
  [SQL接口] -down-> [解析器]
  [解析器] -down-> [预处理器]
  [预处理器] -down-> [优化器]
  [优化器] -down-> [执行器]
  
  [查询缓存] -left-> [SQL接口] : 8.0已移除
  
  [解析器] .right.> [THD对象] : 存储解析树
  [优化器] .right.> [THD对象] : 存储执行计划
}

note right of "解析器"
  词法分析(Lexical Analysis)
  语法分析(Syntax Analysis)
  生成解析树(Parse Tree)
end note

note right of "优化器"
  逻辑优化
  物理优化
  成本估算
  生成执行计划
end note

@enduml
```

**1. 解析器(Parser)**

解析器源码位于`sql/sql_parse.cc`​和`sql/sql_yacc.yy`（yacc语法文件）。

**解析流程：**

```c
// 简化流程
void parse_sql(THD *thd, char *sql) {
  // 1. 词法分析
  LEX *lex = thd->lex;
  MYSQLlex(lex);  // 生成token流
  
  // 2. 语法分析
  MYSQLparse(thd);  // yacc语法规则匹配
  
  // 3. 生成解析树
  if (lex->sql_command == SQLCOM_SELECT) {
    parse_select(thd, lex);
  } else if (lex->sql_command == SQLCOM_INSERT) {
    parse_insert(thd, lex);
  }
  // ...
}
```

**性能关键点：**

- 复杂SQL（如深度嵌套子查询）解析开销可达毫秒级
- 解析器使用Bison生成，存在语法冲突问题
- 预解析缓存（Prepared Statement）可跳过解析阶段

**优化建议：**

```sql
-- 使用预处理语句（跳过解析）
PREPARE stmt FROM 'SELECT * FROM users WHERE id = ?';
SET @id = 123;
EXECUTE stmt USING @id;
DEALLOCATE PREPARE stmt;

-- 在应用层使用连接池的预处理缓存
# Python示例
cursor = conn.cursor(prepared=True)
cursor.execute("SELECT * FROM users WHERE id = %s", (123,))  # 自动使用预处理

-- 查看解析耗时
SET profiling = 1;
SELECT * FROM users WHERE id = 1;
SHOW PROFILE FOR QUERY 1;
-- 关注"starting"和"checking permissions"之间的时间
```

**2. 查询优化器(Query Optimizer)**

优化器是性能优化最核心的模块，源码位于`sql/sql_optimizer.cc`。

**优化器工作流程：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

start

:接收解析树;
note right: 来自Parser的THD::lex

fork
  :逻辑优化;
  note right
    * 子查询解关联
    * 外连接转内连接
    * 常量传递
    * 谓词简化
  end note
fork again
  :统计信息收集;
  note right
    * 表行数
    * 索引 cardinality
    * 数据分布直方图(8.0)
  end note
end fork

:物理优化;
note right
  * 访问方法选择
  * JOIN顺序选择
  * 成本评估
end note

:生成执行计划;
note right: 存储在THD::plan

stop
@enduml
```

**关键优化策略：**

**A. 子查询优化**

MySQL 5.6+支持将子查询转换为半连接(Semi-join)。

```sql
-- 原始查询
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

-- 优化器可能转换为：
SELECT users.* FROM users 
SEMI JOIN orders ON users.id = orders.user_id 
WHERE orders.amount > 100;

-- 查看是否转换
EXPLAIN FORMAT=JSON SELECT ...;
-- 关注"semi_join_strategy": "FirstMatch" or "MaterializeLookup"
```

**相关子查询问题：**

```sql
-- 相关子查询（性能极差，避免使用）
SELECT * FROM users u WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.amount > 100
);

-- 优化方案1：改写为JOIN
SELECT DISTINCT u.* FROM users u 
JOIN orders o ON u.id = o.user_id AND o.amount > 100;

-- 优化方案2：使用GROUP_CONCAT（特殊场景）
SELECT u.*, 
       (SELECT GROUP_CONCAT(order_no) FROM orders o WHERE o.user_id = u.id) AS orders
FROM users u;
```

**B. 外连接消除**

```sql
-- 原始
SELECT u.*, o.order_no FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
WHERE o.amount > 100;

-- 优化器转换为内连接（因为WHERE条件过滤了NULL）
SELECT u.*, o.order_no FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE o.amount > 100;

-- 保持外连接语义（如需保留无订单用户）
SELECT u.*, o.order_no FROM users u 
LEFT JOIN orders o ON u.id = o.user_id AND o.amount > 100;
```

**C. 索引合并 vs 索引下推**

```sql
-- 表结构
CREATE TABLE t (a INT, b INT, KEY idx_a (a), KEY idx_b (b));

-- 查询
SELECT * FROM t WHERE a = 1 OR b = 2;

-- 执行策略1：索引合并（Index Merge）
-- 分别扫描idx_a和idx_b，合并结果
EXPLAIN SELECT * FROM t WHERE a = 1 OR b = 2;
-- type: index_merge
-- Extra: Using union(idx_a,idx_b)

-- 执行策略2：复合索引更优
ALTER TABLE t ADD INDEX idx_a_b (a, b);
-- type: ref，性能更好

-- 索引下推（ICP）示例
SELECT * FROM t WHERE a = 1 AND b LIKE 'test%';
-- idx_a_b复合索引，MySQL 5.6+会在引擎层过滤b条件
-- Extra: Using index condition
```

**优化器成本模型：**

MySQL 5.7+引入可插拔成本模型。

```sql
-- 查看Server层成本
SELECT * FROM mysql.server_cost;
+------------------------------+------------+---------------------+---------+-------------+
| cost_name                    | cost_value | last_update         | comment | default_value |
+------------------------------+------------+---------------------+---------+-------------+
| disk_temptable_create_cost   |       NULL | 2024-01-01 00:00:00 |         |        20   |
| disk_temptable_row_cost      |       NULL | 2024-01-01 00:00:00 |         |         0.5 |
| key_compare_cost             |       NULL | 2024-01-01 00:00:00 |         |      0.05   |
| memory_temptable_create_cost |       NULL | 2024-01-01 00:00:00 |         |         1   |
| memory_temptable_row_cost    |       NULL | 2024-01-01 00:00:00 |         |       0.1   |
| row_evaluate_cost            |       NULL | 2024-01-01 00:00:00 |         |       0.1   |
+------------------------------+------------+---------------------+---------+-------------+

-- 查看Engine层成本
SELECT * FROM mysql.engine_cost;
+-----------------+--------+--------------+------------+
| engine_name     | device | cost_name    | cost_value |
+-----------------+--------+--------------+------------+
| default         | 0      | io_block_read_cost |       NULL |
| default         | 0      | memory_block_read_cost |     NULL |
+-----------------+--------+--------------+------------+

-- 修改成本（如SSD环境IO成本低）
UPDATE mysql.engine_cost 
SET cost_value = 0.2  -- 默认1.0
WHERE cost_name = 'io_block_read_cost';
FLUSH OPTIMIZER_COSTS;

-- 查看优化器估算成本
EXPLAIN FORMAT=JSON SELECT * FROM users WHERE id > 100;
-- 关注"cost_info": {"query_cost": "123.45"}
```

**3. 查询缓存(Query Cache) - 已废弃**

MySQL 8.0已移除查询缓存，因其在多核CPU和高并发场景下成为性能瓶颈。取代方案：

```sql
-- 应用层缓存（Redis方案）
# Python示例
import redis
import json

r = redis.Redis()

def get_user(user_id):
    key = f"user:{user_id}"
    # 查询缓存
    data = r.get(key)
    if data:
        return json.loads(data)
    
    # 缓存未命中
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    
    # 写入缓存
    if user:
        r.setex(key, 3600, json.dumps(user))  # 1小时过期
    return user

-- ProxySQL结果集缓存
INSERT INTO mysql_query_rules (rule_id, match_digest, cache_ttl) 
VALUES (1, 'SELECT * FROM users WHERE id = ?', 60000);  -- 60秒缓存
```

##### 1.1.3 引擎层(Storage Engine Layer)

存储引擎负责数据的存储和提取，采用插件式架构。

**InnoDB引擎架构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

component "InnoDB引擎层" {
  [内存结构] -down-> [Buffer Pool]
  [内存结构] -down-> [Change Buffer]
  [内存结构] -down-> [Adaptive Hash Index]
  [内存结构] -down-> [Log Buffer]
  
  [磁盘结构] -down-> [表空间\n(Tablespace)]
  [磁盘结构] -down-> [Redo Log]
  [磁盘结构] -down-> [Undo Log]
  [磁盘结构] -down-> [Doublewrite Buffer]
  
  [后台线程] -down-> [Master Thread]
  [后台线程] -down-> [IO Thread]
  [后台线程] -down-> [Purge Thread]
  [后台线程] -down-> [Page Cleaner Thread]
  
  [Buffer Pool] -right-> [表空间]
  [Log Buffer] -right-> [Redo Log]
  [Change Buffer] -right-> [表空间]
}

note right of "Buffer Pool"
  核心组件，占内存70-80%
  缓存数据页和索引页
  采用LRU+算法
end note

note right of "Change Buffer"
  缓存二级索引变更
  减少随机IO
  合并插入、更新、删除
end note

note right of "Master Thread"
  协调后台工作
  合并Change Buffer
  刷脏页
  清理Undo
end note

@enduml
```

**1. 缓冲池(Buffer Pool)**

缓冲池是InnoDB最重要的内存区域，占内存的50-75%。

**内部结构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

package "Buffer Pool Instance 1" {
  [free list] --> [空闲页]
  [flush list] --> [脏页链表\n按修改时间排序]
  [LRU list] --> [LRU链表\n分young/old区域]
}

package "Buffer Pool Instance 2" {
  [free list]
  [flush list]
  [LRU list]
}

note right of [LRU list]
  3/8为old区
  5/8为young区
   midpoint为分割点
  
  新页插入midpoint
  避免全表扫描污染LRU
end note

@enduml
```

**缓冲池配置：**

```sql
-- 缓冲池大小（动态调整）
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';  -- 默认128MB
SET GLOBAL innodb_buffer_pool_size = 32G;       -- 在线调整（5.7+）

-- 缓冲池实例数（减少锁竞争）
SHOW VARIABLES LIKE 'innodb_buffer_pool_instances';  -- 默认1
-- 建议值：innodb_buffer_pool_size / 1G，最多64

-- 旧块子列表比例
SHOW VARIABLES LIKE 'innodb_old_blocks_pct';  -- old区占比，默认37%
SHOW VARIABLES LIKE 'innodb_old_blocks_time'; -- 页停留时间，默认1000ms

-- 示例：64GB内存服务器
innodb_buffer_pool_size = 48G      -- 75%内存
innodb_buffer_pool_instances = 16  -- 48G/1G=16
innodb_old_blocks_pct = 25         -- 调低old区，减少扫描污染
```

**缓冲池预热：**

大内存实例重启后，缓冲池为空，性能下降。

```sql
-- 启用缓冲池导出
SET GLOBAL innodb_buffer_pool_dump_at_shutdown = ON;
SET GLOBAL innodb_buffer_pool_dump_pct = 25;  -- 导出最热25%的页

-- 启动时加载
SET GLOBAL innodb_buffer_pool_load_at_startup = ON;

-- 手动导出加载
SET GLOBAL innodb_buffer_pool_dump_now = ON;
SET GLOBAL innodb_buffer_pool_load_now = ON;

-- 监控加载进度
SHOW STATUS LIKE 'Innodb_buffer_pool_dump_status';
SHOW STATUS LIKE 'Innodb_buffer_pool_load_status';
SHOW STATUS LIKE 'Innodb_buffer_pool_pages_data';  -- 已加载页数
```

**生产案例：**

某电商数据库(128GB内存)重启后QPS从10万降至2万，缓冲池预热耗时30分钟。

**优化方案：**

```ini
# my.cnf配置
innodb_buffer_pool_dump_at_shutdown = ON
innodb_buffer_pool_load_at_startup = ON
innodb_buffer_pool_dump_pct = 50       # 导出50%热数据
innodb_buffer_pool_load_abort = OFF    # 禁止中途取消
```

**监控缓冲池命中率：**

```sql
-- 查看缓冲池状态
SHOW ENGINE INNODB STATUS\G

-- 计算命中率（理想>99%）
SELECT 
  (1 - Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests) * 100 
  AS hit_rate
FROM (
  SELECT 
    MAX(IF(variable_name = 'innodb_buffer_pool_reads', variable_value, 0)) AS Innodb_buffer_pool_reads,
    MAX(IF(variable_name = 'innodb_buffer_pool_read_requests', variable_value, 0)) AS Innodb_buffer_pool_read_requests
  FROM performance_schema.global_status
  WHERE variable_name IN ('innodb_buffer_pool_reads', 'innodb_buffer_pool_read_requests')
) t;

-- 或使用sys库
SELECT * FROM sys.io_global_by_file_by_bytes WHERE file LIKE '%ibd%';
```

**2. Change Buffer**

Change Buffer缓存非唯一二级索引的变更，减少随机IO。

```sql
-- Change Buffer配置
SHOW VARIABLES LIKE 'innodb_change_buffer_max_size';  -- 占缓冲池比例，默认25%
SHOW VARIABLES LIKE 'innodb_change_buffering';       -- 启用类型，默认all

-- 可选值：
-- all:        缓存插入、删除、更新
-- inserts:    仅插入
-- deletes:    仅删除
-- changes:    插入和删除
-- none:       禁用

-- 监控Change Buffer
SHOW STATUS LIKE 'Innodb_change_buffer%';
-- Innodb_change_buffer_size: 当前大小
-- Innodb_change_buffer_free: 空闲空间
-- Innodb_change_buffer_inserts: 插入操作数
-- Innodb_change_buffer_merges: 合并次数

-- 适用场景：
-- 1. 写密集型应用
-- 2. 大量二级索引
-- 3. 机械硬盘环境（SSD效果不明显）

-- 不适用场景：
-- 1. 读密集型（增加查询开销）
-- 2. 唯一索引（需实时检查）
-- 3. 数据量小（全部缓冲池命中）
```

**3. 自适应哈希索引(Adaptive Hash Index, AHI)**

InnoDB自动为热点页创建哈希索引，加速等值查询。

```sql
-- AHI配置
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index';  -- 默认ON
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index_parts';  -- 分区数，默认8

-- 监控AHI
SHOW ENGINE INNODB STATUS\G
-- 输出示例：
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- 0.00 hash searches/s, 100.00 non-hash searches/s

-- 判断是否生效：hash searches应占10%以上

-- 适用场景：
-- 1. 大量等值查询（WHERE id = ?）
-- 2. 热点数据集中
-- 3. 缓冲池足够大

-- 不适用场景：
-- 1. 范围查询为主
-- 2. 热点数据分散
-- 3. 高并发竞争（锁争用）

-- 高并发优化：增加分区数
SET GLOBAL innodb_adaptive_hash_index_parts = 64;  -- 减少锁竞争
```

**生产案例：**

某社交应用查询用户好友列表，QPS 5万，但AHI使用率仅2%。

**分析：**

```sql
SHOW ENGINE INNODB STATUS\G
-- 0.02 hash searches/s, 50000 non-hash searches/s
-- 热点数据分散（用户ID随机访问）
```

**决策：**

```sql
SET GLOBAL innodb_adaptive_hash_index = OFF;  -- 关闭AHI
-- 节省约1GB内存，降低CPU开销
```

**4. 重做日志缓冲(Redo Log Buffer)**

Redo Log Buffer用于WAL（Write-Ahead Logging）机制。

```sql
-- Redo Log配置
SHOW VARIABLES LIKE 'innodb_log_buffer_size';  -- 默认16MB
SHOW VARIABLES LIKE 'innodb_log_file_size';    -- 单个文件大小，默认48MB
SHOW VARIABLES LIKE 'innodb_log_files_in_group';  -- 文件数，默认2
SHOW VARIABLES LIKE 'innodb_log_group_home_dir';  -- 日志目录

-- 监控
SHOW STATUS LIKE 'Innodb_log%';
-- Innodb_log_waits: 缓冲不足等待次数（应接近0）
-- Innodb_log_write_requests: 日志写入请求
-- Innodb_log_writes: 实际fsync次数

-- 优化建议：
-- 1. innodb_log_file_size = 1-4GB（过大延长恢复时间）
-- 2. innodb_log_buffer_size > 64MB（大事务场景）
-- 3. 使用NVMe SSD（降低fsync延迟）

-- Redo Log刷盘策略
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
-- 1: 每次事务提交fsync（安全，默认）
-- 2: 写入OS缓存，每秒fsync（性能较好，宕机丢1秒）
-- 0: 每秒写入并fsync（性能最好，宕机丢1秒）

-- 核心业务必须设为1，配合半同步复制保证数据安全
```

**生产配置案例：**

```ini
# 64GB内存，业务繁忙
innodb_log_file_size = 2G            # 单个2GB，共4GB
innodb_log_files_in_group = 2
innodb_log_buffer_size = 128M        # 大事务缓冲
innodb_flush_log_at_trx_commit = 1   # 安全优先
```

**5. 后台线程**

**Master Thread (主线程)：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

[*] --> loop

state "主循环" as loop {
  state "每秒操作" as perSecond
  perSecond : 合并Change Buffer
  perSecond : 刷日志到磁盘
  perSecond : 清理后台请求
  
  --
  
  state "每10秒操作" as per10Second
  per10Second : 刷脏页（<70%）
  per10Second : 合并至多5个插入缓冲
  per10Second : 删除无用Undo页
}

state "后台循环" as bg
state "刷新循环" as flush
flush : 刷100个脏页到磁盘
state "暂停" as suspend

loop --> bg : 数据库空闲
bg --> flush : 每10秒
flush --> loop : 完成

loop --> suspend : 关闭信号
suspend --> [*]

@enduml
```

**IO Thread：**

- ​`innodb_read_io_threads`: 读线程，默认4
- ​`innodb_write_io_threads`: 写线程，默认4
- 在SSD环境可调至16-32

**Purge Thread：**   
清理Undo页，避免膨胀。

```sql
SHOW VARIABLES LIKE 'innodb_purge_threads';  -- 默认4
SHOW VARIABLES LIKE 'innodb_purge_batch_size'; -- 每批清理页数
```

**Page Cleaner Thread：**   
刷脏页，避免阻塞用户线程。

```sql
SHOW VARIABLES LIKE 'innodb_page_cleaners';  -- 默认4
```

**监控后台线程：**

```sql
SELECT thread_id, name, type, processlist_state 
FROM performance_schema.threads 
WHERE name LIKE '%io_thread%' OR name LIKE '%purge%';
```

##### 1.1.4 物理层(Physical Layer)

物理层涉及文件系统、磁盘IO等。

**InnoDB文件结构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

folder "数据目录" {
  folder "系统表空间" {
    file "ibdata1" as sys
    file "ibdata2"
  }
  
  folder "独立表空间" {
    file "user.ibd" as user
    file "order.ibd" as order
  }
  
  folder "日志文件" {
    file "ib_logfile0" as log0
    file "ib_logfile1" as log1
    file "mysql-bin.000001" as binlog
  }
  
  folder "其他文件" {
    file "ibtmp1" as tmp
    file "ib_buffer_pool" as bp
    file "mysql.ibd" as mysql
  }
}

note right of sys
  共享表空间
  - InnoDB字典
  - Undo日志（早期版本）
  - Doublewrite Buffer
end note

note right of user
  独立表空间（默认）
  每个表一个.ibd文件
  包含数据和索引
end note

note right of log0
  Redo Log
  循环写入
  固定大小
end note

note right of binlog
  Binlog
  Server层日志
  逻辑日志
end note

@enduml
```

**物理层优化建议：**

1. **文件系统选择**

```bash
# 生产环境推荐XFS（大文件、高并发）
mkfs.xfs -f -i size=1024 /dev/sdb1
mount -t xfs -o noatime,nodiratime,logbufs=8 /dev/sdb1 /data/mysql

# ext4次之（需调优）
mkfs.ext4 -m 0 -i 16384 /dev/sdb1
tune2fs -O has_journal -o journal_data_writeback /dev/sdb1
mount -t ext4 -o noatime,nodiratime,data=writeback /dev/sdb1 /data/mysql

# 绝对避免ext3（性能差）
```

2. **磁盘调度算法**

```bash
# SSD使用noop或none
echo noop > /sys/block/sdb/queue/scheduler

# HDD使用deadline
echo deadline > /sys/block/sdb/queue/queue/scheduler

# 永久生效（grub配置）
GRUB_CMDLINE_LINUX_DEFAULT="... elevator=noop"
```

3. **关闭访问时间更新**

```bash
# /etc/fstab
UUID=xxx /data/mysql xfs defaults,noatime,nodiratime 0 2
```

4. **RAID配置**

```bash
# SSD环境：RAID 1+0（性能与安全平衡）
mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/sd[b-e]1

# HDD环境：RAID 10或RAID 5（带电池保护）
# 务必配置BBU（Battery Backup Unit）
```

5. **NUMA架构优化**

```bash
# 查看NUMA配置
numactl --hardware

# MySQL绑定到单个NUMA节点（避免跨Node）
numactl --cpunodebind=0 --membind=0 /usr/sbin/mysqld

# 或配置innodb_numa_interleave=ON
```

#### 1.2 InnoDB事务与锁机制深度解析

##### 1.2.1 MVCC多版本并发控制

InnoDB通过MVCC实现非锁定读，核心原理：

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

object "数据行记录" {
  trx_id: 100
  roll_pointer: 0x7f8b3c
  data: "原始数据"
}

object "Undo Log 1" {
  trx_id: 99
  roll_pointer: 0x7f8a2b
  data: "旧版本"
}

object "Undo Log 2" {
  trx_id: 98
  roll_pointer: NULL
  data: "更旧版本"
}

"数据行记录" -down-> "Undo Log 1" : roll_pointer
"Undo Log 1" -down-> "Undo Log 2" : roll_pointer

note right of "数据行记录"
  最新版本由活跃事务查看
end note

note right of "Undo Log 2"
  历史版本供ReadView判断可见性
end note

@enduml
```

**MVCC实现机制：**

**1. 隐藏字段**  
每行记录包含3个隐藏字段：

- ​`DB_TRX_ID` (6字节)：最后修改事务ID
- ​`DB_ROLL_PTR` (7字节)：回滚指针，指向Undo记录
- ​`DB_ROW_ID` (6字节)：隐藏主键（无显式主键时）

**2. Undo日志版本链**

```sql
-- 模拟版本链
-- 初始状态
INSERT INTO users (id, name) VALUES (1, 'Alice');  -- trx_id=100

-- 更新1
UPDATE users SET name = 'Bob' WHERE id = 1;  -- trx_id=101
-- Undo记录：DB_TRX_ID=100, name='Alice'

-- 更新2
UPDATE users SET name = 'Charlie' WHERE id = 1;  -- trx_id=102
-- Undo记录1：DB_TRX_ID=101, name='Bob'
-- Undo记录2：DB_TRX_ID=100, name='Alice'（指向上一版本）

-- 查询（trx_id=99，在更新前开始）
SELECT name FROM users WHERE id = 1;
-- 发现DB_TRX_ID=102 > 99，不可见
-- 沿roll_pointer找到trx_id=101，仍不可见
-- 继续找trx_id=100，仍不可见
-- 最终返回空（事务开始前未提交）
```

**3. ReadView可见性判断**

ReadView是事务开始时的"快照"，包含四个关键信息：

- ​`m_ids`：活跃事务ID列表
- ​`min_trx_id`：最小活跃事务ID
- ​`max_trx_id`：预分配事务ID（下一个事务ID）
- ​`creator_trx_id`：创建该ReadView的事务ID

**可见性算法：**

```c
// 简化版
bool is_visible(row, readview) {
  if (row.trx_id == readview.creator_trx_id) {
    return true;  // 自己修改的可见
  }
  if (row.trx_id < readview.min_trx_id) {
    return true;  // 已提交事务修改可见
  }
  if (row.trx_id > readview.max_trx_id) {
    return false;  // 未来事务修改不可见
  }
  if (row.trx_id in readview.m_ids) {
    return false;  // 活跃事务修改不可见
  }
  return true;
}
```

**隔离级别实现：**

```sql
-- REPEATABLE READ（MySQL默认）
-- 事务首次SELECT创建ReadView，后续复用

-- READ COMMITTED
-- 每次SELECT都创建新ReadView

-- 演示案例
-- Session 1
BEGIN;
SELECT * FROM users WHERE id = 1;  -- 创建ReadView，假设name='Alice'

-- Session 2
BEGIN;
UPDATE users SET name = 'Bob' WHERE id = 1;
COMMIT;

-- Session 1再次查询
SELECT * FROM users WHERE id = 1;
-- REPEATABLE READ：返回'Alice'（复用ReadView）
-- READ COMMITTED：返回'Bob'（新建ReadView）
```

**生产问题：长事务导致Undo膨胀**

```sql
-- 场景：备份任务使用mysqldump --single-transaction
-- 导致Undo保留时间过长

-- 监控Undo大小
SELECT 
  (SELECT SUM(data_length) FROM information_schema.tables 
   WHERE table_schema = 'mysql' AND table_name LIKE 'innodb_undo%') AS undo_size_bytes,
  (SELECT SUM(data_length)/1024/1024/1024 FROM information_schema.tables 
   WHERE table_schema = 'mysql' AND table_name LIKE 'innodb_undo%') AS undo_size_gb;

-- 监控History List Length
SHOW ENGINE INNODB STATUS\G
-- ------------
-- TRANSACTIONS
-- ------------
-- Trx id counter 123456789
-- Purge done for trx's n:o < 123456700 undo n:o < 0 state: running
-- History list length 12345  -- 此值应<1000

-- 解决方案
-- 1. 避免长事务
-- 2. 调整Purge线程
SET GLOBAL innodb_purge_threads = 8;
SET GLOBAL innodb_purge_batch_size = 1000;

-- 3. 创建专用Undo表空间
CREATE UNDO TABLESPACE undo_001 ADD DATAFILE 'undo_001.ibu';
```

**Undo表空间管理：**

```sql
-- MySQL 8.0+支持在线管理Undo表空间
-- 1. 创建Undo表空间
CREATE UNDO TABLESPACE undo_002 ADD DATAFILE 'undo_002.ibu';

-- 2. 标记为inactive（停止分配）
ALTER UNDO TABLESPACE undo_002 SET INACTIVE;

-- 3. 等待Purge完成（History list length降至0）

-- 4. 删除表空间
DROP UNDO TABLESPACE undo_002;

-- 查看Undo表空间
SELECT * FROM information_schema.innodb_tablespaces 
WHERE row_format = 'Undo';
```

##### 1.2.2 锁类型与粒度

InnoDB锁机制复杂，是并发性能的关键。

**锁类型矩阵：**

|锁模式|行锁(S)|行锁(X)|意向锁(IS)|意向锁(IX)|
| ------------| ---------| ---------| ------------| ------------|
|行锁(S)|兼容|冲突|兼容|冲突|
|行锁(X)|冲突|冲突|冲突|冲突|
|意向锁(IS)|兼容|冲突|兼容|兼容|
|意向锁(IX)|冲突|冲突|兼容|兼容|

**锁类型详解：**

**1. 共享锁(S)与排他锁(X)**

```sql
-- 共享锁（允许多个事务读，禁止写）
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE;

-- 排他锁（独占）
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- 自动加锁
-- SELECT: 不加锁（MVCC快照读）
-- INSERT: 排他锁
-- UPDATE/DELETE: 排他锁
```

**2. 意向锁(Intention Locks)**

意向锁是表级锁，表明事务要在行上加X或S锁。

```sql
-- 事务1
BEGIN;
SELECT * FROM users WHERE id = 1 FOR UPDATE;
-- 自动在users表加IX锁，id=1行加X锁

-- 事务2
LOCK TABLES users READ;  -- 请求S锁
-- 被阻塞，因为IX与S锁冲突

-- 作用：快速判断表是否可以加S/X锁
-- 避免逐行检查锁冲突
```

**3. 记录锁(Record Locks)**

锁定索引记录，而非数据行。

```sql
-- 测试表
CREATE TABLE test_lock (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  KEY idx_name (name)
);

-- Session 1
BEGIN;
SELECT * FROM test_lock WHERE id = 1 FOR UPDATE;
-- 在id=1的PRIMARY KEY上加X锁

-- Session 2
INSERT INTO test_lock (id, name) VALUES (2, 'test');  -- 成功
UPDATE test_lock SET name = 'new' WHERE id = 1;       -- 被阻塞
```

**4. 间隙锁(Gap Locks)**

锁定索引记录之间的间隙，防止幻读。

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

entity "索引id" {
  * 1
  * 2
  * 5
  * 10
}

entity "间隙" {
  (负无穷, 1)
  (1, 2)
  (2, 5)
  (5, 10)
  (10, 正无穷)
}

note right of "间隙"
  Gap锁锁定这些范围
  防止新纪录插入
end note

@enduml
```

```sql
-- Session 1
BEGIN;
SELECT * FROM users WHERE id BETWEEN 1 AND 5 FOR UPDATE;
-- 在id=1,2,5加X锁
-- 在(1,2), (2,5), (5,10)加Gap锁

-- Session 2
INSERT INTO users (id, name) VALUES (3, 'test');  -- 被阻塞

-- 仅在REPEATABLE READ启用
-- READ COMMITTED不启用Gap锁
```

**5. Next-Key Locks**

记录锁 + 间隙锁，锁定一个范围。

```sql
-- 查询
SELECT * FROM users WHERE id > 10 FOR UPDATE;

-- 锁范围：
-- (10, 正无穷)的Gap锁
-- 所有id>10的Record锁

-- 目的：防止幻读
```

**6. 插入意向锁(Insert Intention Locks)**

特殊的间隙锁，允许兼容的插入操作并发。

```sql
-- Session 1
BEGIN;
SELECT * FROM users WHERE id = 10 FOR UPDATE;
-- 在id=10加X锁

-- Session 2
INSERT INTO users (id, name) VALUES (11, 'test');  -- 成功
-- 因为Session 1未锁定id=11的间隙

-- Session 3
BEGIN;
SELECT * FROM users WHERE id BETWEEN 1 AND 20 FOR UPDATE;
-- 在(1,20)范围加Gap锁

-- Session 4
INSERT INTO users (id, name) VALUES (15, 'test2');  -- 被阻塞
-- 因为Session 3已锁定(1,20)范围
```

**锁监控与排查：**

```sql
-- 查看当前锁
SELECT * FROM performance_schema.data_locks\G

-- 查看锁等待
SELECT * FROM performance_schema.data_lock_waits\G

-- 或使用sys库
SELECT * FROM sys.innodb_lock_waits;

-- 查看锁定的事务
SELECT * FROM information_schema.innodb_trx\G

-- 关键字段：
-- trx_lock_structs: 事务持有的锁数量
-- trx_rows_locked: 事务锁定的行数
-- trx_rows_modified: 事务修改的行数
-- trx_isolation_level: 隔离级别
-- trx_wait_started: 等待开始时间

-- 8.0+查看详细的锁信息
SELECT * FROM performance_schema.data_locks 
WHERE LOCK_STATUS = 'WAITING';
```

**生产案例：死锁分析与解决**

**场景：电商下单扣库存**

```sql
-- 表结构
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  stock INT,
  version BIGINT
);

-- Session 1（用户A）
BEGIN;
UPDATE products SET stock = stock - 1 WHERE id = 101;  -- 锁定id=101

-- Session 2（用户B）
BEGIN;
UPDATE products SET stock = stock - 1 WHERE id = 102;  -- 锁定id=102

-- Session 1
UPDATE products SET stock = stock - 1 WHERE id = 102;  -- 等待Session 2释放id=102

-- Session 2
UPDATE products SET stock = stock - 1 WHERE id = 101;  -- 等待Session 1释放id=101

-- 死锁！InnoDB自动回滚其中一个事务
-- 错误信息：ERROR 1213 (40001): Deadlock found when trying to get lock
```

**死锁分析：**

```sql
-- 1. 查看最近死锁
SHOW ENGINE INNODB STATUS\G
-- ------------------------
-- LATEST DETECTED DEADLOCK
-- ------------------------
-- 2024-01-23 10:00:00 0x7f8b3c
-- *** (1) TRANSACTION:
-- TRANSACTION 123456, ACTIVE 2 sec starting index read
-- mysql tables in use 1, locked 1
-- LOCK WAIT 4 lock struct(s), heap size 1136, 2 row lock(s)
-- MySQL thread id 100, OS thread handle 1231456789, query id 789 localhost root updating
-- UPDATE products SET stock = stock - 1 WHERE id = 102
-- *** (1) HOLDS THE LOCK(S):
-- RECORD LOCKS space id 10 page no 5 n bits 80 index PRIMARY of table `db`.`products` trx id 123456 lock_mode X locks rec but not gap
-- Record lock, heap no 3 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
--  0: len 8; hex 0000000000000065; asc       e;;  -- id=101
--
-- *** (1) WAITING FOR THIS LOCK TO BE GRANTED:
-- RECORD LOCKS space id 10 page no 5 n bits 80 index PRIMARY of table `db`.`products` trx id 123456 lock_mode X locks rec but not gap waiting
-- Record lock, heap no 4 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
--  0: len 8; hex 0000000000000066; asc       f;;  -- id=102
--
-- *** (2) TRANSACTION:
-- TRANSACTION 123457, ACTIVE 2 sec starting index read
-- mysql tables in use 1, locked 1
-- 4 lock struct(s), heap size 1136, 2 row lock(s)
-- MySQL thread id 101, OS thread handle 1231456790, query id 790 localhost root updating
-- UPDATE products SET stock = stock - 1 WHERE id = 101
-- *** (2) HOLDS THE LOCK(S):
-- RECORD LOCKS space id 10 page no 5 n bits 80 index PRIMARY of table `db`.`products` trx id 123457 lock_mode X locks rec but not gap
-- Record lock, heap no 4 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
--  0: len 8; hex 0000000000000066; asc       f;;  -- id=102
--
-- *** (2) WAITING FOR THIS LOCK TO BE GRANTED:
-- RECORD LOCKS space id 10 page no 5 n bits 80 index PRIMARY of table `db`.`products` trx id 123457 lock_mode X locks rec but not gap waiting
-- Record lock, heap no 3 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
--  0: len 8; hex 0000000000000065; asc       e;;  -- id=101
```

**解决方案：**

1. **统一加锁顺序**

```python
# 应用层代码优化
def deduct_stock(user_id, product_ids):
    # 排序产品ID，统一顺序
    product_ids.sort()
    
    for pid in product_ids:
        cursor.execute("UPDATE products SET stock = stock - 1 WHERE id = %s", (pid,))
```

2. **降低隔离级别**

```sql
SET SESSION transaction_isolation = 'READ-COMMITTED';
-- READ-COMMITTED不锁定Gap，减少死锁概率
```

3. **使用乐观锁**

```sql
-- 表结构增加版本号
ALTER TABLE products ADD COLUMN version BIGINT DEFAULT 0;

-- 更新时检查版本
UPDATE products 
SET stock = stock - 1, version = version + 1 
WHERE id = 101 AND version = 123;

-- 应用层重试
if affected_rows == 0:
    # 版本变化，重试
    retry()
```

4. **调整死锁检测**

```sql
-- 关闭死锁检测（高并发场景）
SHOW VARIABLES LIKE 'innodb_deadlock_detect';  -- 默认ON
SET GLOBAL innodb_deadlock_detect = OFF;

-- 依赖超时
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';  -- 默认50秒

-- 权衡：关闭死锁检测可减少CPU消耗，但死锁需等待超时
```

**死锁预防Checklist：**

- [ ] 所有事务按相同顺序访问资源
- [ ] 避免大事务（尽快提交）
- [ ] 使用低隔离级别（READ-COMMITTED）
- [ ] 业务层重试机制
- [ ] 监控`SHOW STATUS LIKE 'innodb_row_lock_%'`

#### 1.3 线程模型与内存管理

##### 1.3.1 线程模型对比

**社区版：One Thread Per Connection**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "客户端" as c1
actor "客户端" as c2
actor "客户端" as c3

c1 -> "线程1" : Query
c2 -> "线程2" : Query
c3 -> "线程3" : Query

"线程1" -down-> "CPU核心1"
"线程2" -down-> "CPU核心2"
"线程3" -down-> "CPU核心3"

note right of c3
  问题：
  1. 高并发时线程数爆炸
  2. 上下文切换开销大
  3. 内存消耗高
  4. CPU缓存命中率低
end note

@enduml
```

**企业版：Thread Pool**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "客户端" as c1
actor "客户端" as c2
actor "客户端" as c3
actor "客户端" as c4

rectangle "线程池" {
  [线程组1] -down-> "工作线程1-1"
  [线程组1] -down-> "工作线程1-2"
  [线程组1] -down-> "工作线程1-3"
  
  [线程组2] -down-> "工作线程2-1"
  [线程组2] -down-> "工作线程2-2"
}

c1 --> [线程组1]
c2 --> [线程组1]
c3 --> [线程组2]
c4 --> [线程组2]

note right of "线程组1"
  每个组一个监听线程
  多个工作线程
  共享优先级队列
end note

@enduml
```

**Thread Pool配置：**

```sql
-- 仅企业版
SHOW VARIABLES LIKE 'thread_pool_size';        -- 线程组数，建议=CPU核心数
SHOW VARIABLES LIKE 'thread_pool_max_threads'; -- 最大线程总数
SHOW VARIABLES LIKE 'thread_pool_oversubscribe'; -- 每组线程数
SHOW VARIABLES LIKE 'thread_pool_idle_timeout'; -- 空闲超时

-- 线程池状态
SELECT * FROM information_schema.tp_thread_stats;
SELECT * FROM information_schema.tp_thread_state;
SELECT * FROM information_schema.tp_group_stats;
```

**社区版模拟线程池：ProxySQL**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "应用" as app

rectangle "ProxySQL" {
  [连接池] -down-> "连接复用"
  [查询缓存] -down-> [路由规则]
  [路由规则] -down-> [读写分离]
}

database "MySQL主库" as master
database "MySQL从库" as slave1
database "MySQL从库" as slave2

app --> [连接池] : 短连接
[连接池] --> master : 长连接
[连接池] --> slave1 : 长连接
[连接池] --> slave2 : 长连接

note right of [连接池]
  后端长连接数：10
  前端短连接数：5000
  连接复用比500:1
end note

@enduml
```

**ProxySQL配置示例：**

```ini
# ProxySQL配置
mysql_servers =
(
    { hostgroup=0, hostname="master.db", port=3306, weight=1 },
    { hostgroup=1, hostname="slave1.db", port=3306, weight=10 },
    { hostgroup=1, hostname="slave2.db", port=3306, weight=10 }
)

mysql_query_rules =
(
    {
        rule_id=1,
        active=1,
        match_digest="^SELECT.*FOR UPDATE",
        destination_hostgroup=0  -- 写操作到主库
    },
    {
        rule_id=2,
        active=1,
        match_digest="^SELECT",
        destination_hostgroup=1  -- 读操作到从库
    }
)

mysql_variables =
{
    threads=4,
    max_connections=10000,
    default_query_delay=0,
    default_query_timeout=36000000,
    have_compress=true,
    poll_timeout=2000,
    interfaces="0.0.0.0:6033"
}
```

##### 1.3.2 内存管理

**MySQL内存构成：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

node "MySQL总内存" {
  node "全局内存" {
    [Buffer Pool] as bp
    [字典缓存] as dc
    [Binlog缓存] as bc
    [线程池缓存] as tp
  }
  
  node "线程内存\n(每个连接)" {
    [sort_buffer] as sb
    [join_buffer] as jb
    [read_buffer] as rb
    [tmp_table] as tt
  }
}

note right of bp
  可配置50-75%内存
  innodb_buffer_pool_size
end note

note right of sb
  每个线程可高达sort_buffer_size
  max_connections * sort_buffer_size
  可能耗尽内存！
end note

@enduml
```

**内存计算公式：**

```
Total Memory = 
  Global Buffers 
  + Thread Buffers * max_connections 
  + Operating System Needed
```

**详细计算：**

```sql
-- Global Buffers
innodb_buffer_pool_size = 40G
key_buffer_size = 0      -- MyISAM表用，InnoDB可设为0
innodb_log_buffer_size = 128M
binlog_cache_size = 1M
max_binlog_cache_size = 1G

-- Thread Buffers
max_connections = 1000
sort_buffer_size = 2M
join_buffer_size = 2M
read_buffer_size = 1M
read_rnd_buffer_size = 1M
tmp_table_size = 32M
max_heap_table_size = 32M

-- 计算
Thread Memory = (2 + 2 + 1 + 1 + 32)M * 1000 = 38GB
Global Memory = 40 + 0.128 + 1 = 41.129GB
Total = 38 + 41 + 4(系统预留) = 83GB  -- 需83GB物理内存
```

**参数调优建议：**

```sql
-- **核心原则：全局内存优先，线程内存保守**

-- 1. sort_buffer_size（排序缓冲）
-- 每个线程分配，大值导致内存耗尽
-- 建议：256KB - 2MB
SHOW VARIABLES LIKE 'sort_buffer_size';  -- 默认256KB
SET GLOBAL sort_buffer_size = 1M;

-- 监控排序情况
SHOW STATUS LIKE 'Sort_merge_passes';  -- 合并排序次数，应<10/秒
SHOW STATUS LIKE 'Sort_disk_files';    -- 磁盘临时文件数

-- 2. join_buffer_size（JOIN缓冲）
-- 当JOIN无索引时被分配
-- 建议：128KB - 1MB
SET GLOBAL join_buffer_size = 512K;

-- 监控
SHOW STATUS LIKE 'Select_full_join';  -- 无索引JOIN次数，应尽量为0

-- 3. tmp_table_size / max_heap_table_size
-- 内存临时表上限，两者应相等
SET GLOBAL tmp_table_size = 32M;
SET GLOBAL max_heap_table_size = 32M;

-- 监控
SHOW STATUS LIKE 'Created_tmp_tables';       -- 内存临时表
SHOW STATUS LIKE 'Created_tmp_disk_tables';  -- 磁盘临时表
-- 比例应<5%

-- 4. read_buffer_size（顺序读缓冲）
-- 全表扫描时分配
SET GLOBAL read_buffer_size = 1M;

-- 5. read_rnd_buffer_size（随机读缓冲）
-- 排序后读取数据时分配
SET GLOBAL read_rnd_buffer_size = 2M;
```

**内存监控工具：**

```bash
# 查看MySQL进程内存
ps -aux | grep mysqld
# RSS: 物理内存
# VSZ: 虚拟内存

# 更详细的内存统计
cat /proc/$(pgrep mysqld)/status
# VmRSS: 常驻内存
# VmPeak: 峰值内存

# pt-mysql-summary
pt-mysql-summary --user=root --password=xxx | grep -A 20 "Memory usage"
```

**OOM(Out of Memory)问题排查：**

**场景：MySQL被Kernel OOM Killer杀死**

```bash
# 查看OOM日志
dmesg | grep -i "oom-killer"
# 或
grep -i "killed process" /var/log/messages

# 输出示例：
# Out of memory: Kill process 12345 (mysqld) score 956 or sacrifice child
# Killed process 12345 (mysqld) total-vm:100G, anon-rss:80G, file-rss:0K

# 原因分析：
# 1. 线程内存配置过大
# 2. 突发高并发连接
# 3. 内存泄漏（极少见）

# 解决方案：
# 1. 配置max_connections合理值
# 2. 降低线程内存参数
# 3. 配置交换空间（不建议，但可防止OOM）
echo "vm.swappiness=10" >> /etc/sysctl.conf

# 4. 配置MySQL OOM防护
echo "-17" > /proc/$(pgrep mysqld)/oom_adj  # -17表示不杀
```

**内存碎片化问题：**

```sql
-- 查看内存碎片
SHOW ENGINE INNODB STATUS\G
-- -------------------------------------
-- BUFFER POOL AND MEMORY
-- -------------------------------------
-- Total memory allocated 54945300480; in additional pool allocated 0
-- Dictionary memory allocated 12345678
-- Buffer pool size   3276800
-- Free buffers       12345
-- Database pages     3212345
-- Old database pages 1186666
-- Modified db pages  12345
-- Pending reads 0
-- Pending writes: LRU 0, flush list 0, single page 0
-- Pages made young 12345678, not young 0

-- 碎片率 = (Free buffers / Buffer pool size) * 100%
-- 应<5%
```

---

### 第2章 存储引擎详解与选型

#### 2.1 InnoDB引擎深度剖析

##### 2.1.1 页结构与管理

**InnoDB页类型：**

|页类型|数值|说明|
| -------------------------| --------| -----------------------|
|FIL_PAGE_TYPE_ALLOCATED|0x0000|未使用页|
|FIL_PAGE_UNDO_LOG|0x0002|Undo日志页|
|FIL_PAGE_INODE|0x0003|索引节点|
|FIL_PAGE_IBUF_FREE_LIST|0x0004|Change Buffer空闲列表|
|FIL_PAGE_IBUF_BITMAP|0x0005|Change Buffer位图|
|FIL_PAGE_TYPE_SYS|0x0006|系统页|
|FIL_PAGE_TYPE_TRX_SYS|0x0007|事务系统|
|FIL_PAGE_TYPE_FSP_HDR|0x0008|表空间头|
|FIL_PAGE_TYPE_XDES|0x0009|扩展描述页|
|FIL_PAGE_TYPE_BLOB|0x000A|BLOB页|
|FIL_PAGE_TYPE_ZBLOB|0x000B|压缩BLOB|
|FIL_PAGE_TYPE_ZBLOB2|0x000C|压缩BLOB2|
|FIL_PAGE_SDI|0x45BD|表字典信息|
|**FIL_PAGE_INDEX**|**0x45BF**|**B+Tree索引页**|

**页内部结构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

rectangle "InnoDB Page (16KB)" {
  [File Header] -down-> [Page Header]
  [Page Header] -down-> [Infimum + Supremum]
  [Infimum + Supremum] -down-> [User Records]
  [User Records] -down-> [Free Space]
  [Free Space] -down-> [Page Directory]
  [Page Directory] -down-> [File Trailer]
  
  [User Records] -left-> [Record Header]
}

note right of [File Header]
  38字节
  - 页号
  - 上一页/下一页
  - 页类型
  - 最后修改LSN
end note

note right of [Page Header]
  56字节
  - 页内记录数
  - 空闲空间偏移
  - 槽数量
end note

note right of [Infimum + Supremum]
  虚拟记录
  限定边界
  用于范围查询
end note

note right of [User Records]
  实际数据
  按主键排序
  单向链表
end note

note right of [Page Directory]
  槽(Slot)目录
  二分查找加速
  每个槽对应4-8条记录
end note

note right of [File Trailer]
  8字节
  页校验和
  防止页断裂
end note

@enduml
```

**页分裂(Page Split)与合并(Merge)：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

object "页A(满)" {
  records: [1, 2, 3, 4, 5, 6, 7, 8]
}

object "插入9" {
  value: 9
}

object "页A(分裂后)" {
  records: [1, 2, 3, 4]
}

object "页B(新)" {
  records: [5, 6, 7, 8, 9]
}

"页A(满)" --> "插入9" : 触发分裂
"插入9" --> "页A(分裂后)" : 保留前半
"插入9" --> "页B(新)" : 移动后半+新记录

note right of "页B(新)"
  分裂代价：
  1. 新增页
  2. 移动记录
  3. 更新父节点
  4. 锁竞争
end note

@enduml
```

**页大小配置：**

```sql
-- 页大小仅在初始化时配置
-- 可选值：4KB, 8KB, 16KB(默认), 32KB, 64KB

-- 配置my.cnf后需重新初始化
[mysqld]
innodb_page_size = 8KB

# 重新初始化数据目录
rm -rf /data/mysql/*
mysqld --initialize --datadir=/data/mysql

-- 不同页大小对比：
-- 4KB
-- 优点：适合SSD，减少写放大
-- 缺点：页数增多，内存占用大
-- 适用：随机IO多的OLTP

-- 16KB
-- 优点：通用，平衡
-- 缺点：SSD写放大
-- 适用：默认选择

-- 64KB
-- 优点：顺序IO优化，减少页数
-- 缺点：浪费空间
-- 适用：OLAP，数据仓库
```

**页压缩：**

```sql
-- 表级压缩（需Barracuda文件格式）
CREATE TABLE compressed_table (
  id BIGINT PRIMARY KEY,
  data VARCHAR(1000)
) ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;  -- 8KB压缩页

-- KEY_BLOCK_SIZE可选：1, 2, 4, 8, 16
-- 越小压缩率越高，但CPU开销越大

-- 监控压缩效果
SELECT 
  TABLE_NAME,
  ROW_FORMAT,
  TABLE_ROWS,
  DATA_LENGTH,
  INDEX_LENGTH,
  DATA_LENGTH + INDEX_LENGTH AS total_bytes,
  COMPRESSED_SIZE
FROM information_schema.innodb_tablespaces_compression
WHERE TABLE_SCHEMA = 'test';

-- 优点：节省磁盘和内存（缓冲池存压缩页）
-- 缺点：增加CPU开销（需解压）
-- 适用：CPU富余，IO瓶颈场景
```

##### 2.1.2 索引组织表(IOT)

InnoDB是索引组织表，数据按主键聚簇存储。

**表空间文件结构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

package "表空间文件 (.ibd)" {
  [Extent 0]
  [Extent 1]
  [Extent N]
  [Segment]
  [Extent 0] -down-> [Segment]
  [Extent 1] -down-> [Segment]
  [Extent N] -down-> [Segment]
}

package "Segment" {
  [叶节点段] as leaf
  [非叶节点段] as nonleaf
  [回滚段] as rollback
}

leaf -down-> [Page 0]
leaf -down-> [Page 1]
leaf -down-> [Page N]

note right of "Segment"
  每个索引2个段：
  1. 非叶节点段
  2. 叶节点段
  
  聚簇索引：叶节点存数据
  二级索引：叶节点存主键
end note

note right of leaf
  Extent：64个连续页
  1MB（16KB*64）
  
  分配单元：
  - 小表：Page
  - 大表：Extent
end note

@enduml
```

**主键设计最佳实践：**

```sql
-- 反例1：无主键
CREATE TABLE no_pk (
  name VARCHAR(50),
  value INT
) ENGINE=InnoDB;
-- InnoDB自动生成6字节ROW_ID作为主键
-- 性能差，无法排序

-- 反例2：UUID主键
CREATE TABLE uuid_pk (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50)
) ENGINE=InnoDB;
-- 随机IO，页频繁分裂
-- 二级索引庞大（叶子节点存36字作为主键）

-- 反例3：业务字段主键
CREATE TABLE business_pk (
  phone CHAR(11) PRIMARY KEY,  -- 手机号
  name VARCHAR(50)
) ENGINE=InnoDB;
-- 手机号可能变更
-- 更新主键导致数据移动

-- 反例4：联合主键顺序不当
CREATE TABLE bad_composite (
  user_id BIGINT,
  order_id BIGINT,
  PRIMARY KEY (order_id, user_id)  -- order_id选择性高，应在前
) ENGINE=InnoDB;

-- 正例：自增整型主键
CREATE TABLE good_pk (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) UNIQUE,  -- 保留UUID用于业务
  name VARCHAR(50)
) ENGINE=InnoDB;
-- 单调递增，顺序插入
-- 二级索引小巧
-- 支持范围查询

-- 正例：分布式ID
-- 使用雪花算法（Snowflake）
CREATE TABLE distributed_pk (
  id BIGINT PRIMARY KEY,  -- 雪花算法生成
  name VARCHAR(50)
) ENGINE=InnoDB;
-- ID趋势递增（毫秒时间戳高位）
-- 避免随机IO
```

**主键性能测试：**

```sql
-- 测试环境：NVMe SSD，64GB内存

-- 测试1：自增ID
CREATE TABLE test_auto (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  data VARCHAR(500)
);

-- 插入1000万条
INSERT INTO test_auto (name, data) VALUES (CONCAT('user', i), REPEAT('x', 500));
-- 耗时：185秒
-- 表空间：8.2GB
-- 缓冲池命中率：99.8%

-- 测试2：UUID
CREATE TABLE test_uuid (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50),
  data VARCHAR(500)
);

-- 插入1000万条
INSERT INTO test_uuid (id, name, data) VALUES (UUID(), CONCAT('user', i), REPEAT('x', 500));
-- 耗时：420秒（慢2.3倍）
-- 表空间：12.5GB（大52%）
-- 缓冲池命中率：87.3%（随机IO导致）
```

**主键更新代价：**

```sql
-- 表结构
CREATE TABLE update_pk (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  KEY idx_name (name)
) ENGINE=InnoDB;

INSERT INTO update_pk VALUES (1, 'Alice');

-- 更新主键
UPDATE update_pk SET id = 100 WHERE id = 1;
-- 操作：
-- 1. 在id=1上加X锁
-- 2. 插入新行id=100
-- 3. 删除旧行id=1
-- 4. 更新idx_name（存储主键值）
-- 5. 写入Undo日志

-- 性能影响：
-- 1. 页分裂概率高
-- 2. 二级索引全部更新
-- 3. 外键级联更新
-- 结论：主键应永不更新
```

**隐式主键陷阱：**

```sql
-- 无主键表
CREATE TABLE implicit_pk (
  a INT,
  b INT,
  c INT,
  UNIQUE KEY uk_a_b (a, b)  -- 非空唯一索引
) ENGINE=InnoDB;

INSERT INTO implicit_pk VALUES (1, 1, 1);

-- 内部实现：
-- InnoDB选择uk_a_b作为聚簇索引
-- 但聚簇索引仍包含6字节ROW_ID（因为二级索引需要）
-- 浪费空间

-- 正确做法：显式定义主键
ALTER TABLE implicit_pk ADD COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST;
```

##### 2.1.3 二级索引设计

二级索引叶子节点存储主键值，而非物理地址。

**二级索引结构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

object "二级索引idx_name" {
  "Alice" -> [主键: 100]
  "Bob" -> [主键: 101]
  "Charlie" -> [主键: 102]
}

object "聚簇索引PRIMARY" {
  [主键: 100] -> [name: Alice, age: 20, ...]
  [主键: 101] -> [name: Bob, age: 25, ...]
  [主键: 102] -> [name: Charlie, age: 30, ...]
}

"二级索引idx_name" -right-> "聚簇索引PRIMARY" : 回表

note right of "二级索引idx_name"
  二级索引包含：
  1. 索引字段值
  2. 主键值
  3. DB_TRX_ID（MVCC）
  4. DB_ROLL_PTR
end note

note right of "聚簇索引PRIMARY"
  聚簇索引包含：
  1. 主键
  2. 所有字段
  3. MVCC字段
end note

@enduml
```

**覆盖索引(Covering Index)：**

当索引包含所有查询字段时，无需回表。

```sql
-- 查询（需要回表）
SELECT name, age FROM users WHERE status = 1;

-- EXPLAIN
EXPLAIN SELECT name, age FROM users WHERE status = 1\G
-- key: idx_status
-- Extra: Using index condition; Using where
-- 需回表获取age字段

-- 优化：创建覆盖索引
ALTER TABLE users ADD INDEX idx_status_name_age (status, name, age);

-- 再次EXPLAIN
EXPLAIN SELECT name, age FROM users WHERE status = 1\G
-- key: idx_status_name_age
-- Extra: Using index  # 覆盖索引，不回表
-- 性能提升：IO减少50-90%

-- 注意：索引字段顺序影响覆盖能力
-- 索引 (status, name, age)
SELECT name, age FROM users WHERE status = 1;  -- 覆盖
SELECT status, age FROM users WHERE name = 'Alice';  -- 不覆盖（缺少name在WHERE）
```

**索引下推(ICP - Index Condition Pushdown)：**

MySQL 5.6+特性，在存储引擎层过滤索引条件。

```sql
-- 表结构
CREATE TABLE icp_test (
  id BIGINT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  idx_name (first_name, last_name)
) ENGINE=InnoDB;

-- 查询
SELECT * FROM icp_test 
WHERE first_name = 'Zhang' AND last_name LIKE '%ming%';

-- MySQL 5.5执行流程：
-- 1. 使用idx_name定位first_name='Zhang'的所有记录
-- 2. 回表获取完整记录
-- 3. Server层过滤last_name LIKE '%ming%'
-- 扫描行数：所有姓Zhang的记录

-- MySQL 5.6+执行流程（ICP启用）：
-- 1. 使用idx_name定位first_name='Zhang'
-- 2. 在引擎层过滤last_name LIKE '%ming%'
-- 3. 仅对匹配的记录回表
-- 扫描行数：仅名为Zhang *ming*的记录

-- EXPLAIN对比
EXPLAIN SELECT * FROM icp_test WHERE first_name = 'Zhang' AND last_name LIKE '%ming%'\G
-- MySQL 5.5 Extra: Using where
-- MySQL 5.6+ Extra: Using index condition

-- 关闭ICP测试
SET optimizer_switch = 'index_condition_pushdown=off';
EXPLAIN SELECT * FROM icp_test WHERE first_name = 'Zhang' AND last_name LIKE '%ming%'\G
-- Extra: Using where

-- 重新开启
SET optimizer_switch = 'index_condition_pushdown=on';
```

**MRR(Multi-Range Read)：**

MySQL 5.6+优化随机回表。

```sql
-- 场景
SELECT * FROM users WHERE status = 1 AND age > 20;

-- 假设有索引(status, age)
-- 传统方式：
-- 1. 找到第一个status=1且age>20的记录
-- 2. 回表
-- 3. 找到下一个，回表
-- 随机IO多

-- MRR方式：
-- 1. 扫描索引，收集所有主键到缓冲区
-- 2. 按主键排序
-- 3. 顺序回表
-- 随机IO转为顺序IO

-- 配置
SHOW VARIABLES LIKE 'optimizer_switch';
-- mrr=on,mrr_cost_based=on

-- 强制MRR
SELECT /*+ MRR(users) */ * FROM users WHERE status = 1 AND age > 20;

-- 监控
SHOW STATUS LIKE 'Mrr%';
-- Mrr_rowid_physical_reads: 物理读取数
```

**索引选择性优化：**

```sql
-- 表：用户表，1000万条
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  gender TINYINT,  -- 0女，1男，选择性0.5
  country VARCHAR(10),  -- 100个国家，选择性0.01
  email VARCHAR(100)  -- 唯一，选择性1.0
) ENGINE=InnoDB;

-- 错误：低选择性字段单独索引
ALTER TABLE users ADD INDEX idx_gender (gender);

-- 查询
EXPLAIN SELECT * FROM users WHERE gender = 1\G
-- type: ref
-- rows: 5000000  -- 预估扫描500万行
-- 实际：优化器可能选择全表扫描

-- 正确：联合索引
ALTER TABLE users DROP INDEX idx_gender;
ALTER TABLE users ADD INDEX idx_country_gender (country, gender);

-- 查询
EXPLAIN SELECT * FROM users WHERE country = 'US' AND gender = 1\G
-- type: ref
-- rows: 50000  -- 扫描5万行，性能提升100倍

-- 计算选择性
SELECT 
  COUNT(DISTINCT gender) / COUNT(*) AS gender_selectivity,
  COUNT(DISTINCT country) / COUNT(*) AS country_selectivity,
  COUNT(DISTINCT email) / COUNT(*) AS email_selectivity
FROM users;
-- gender_selectivity: 0.5000
-- country_selectivity: 0.0100
-- email_selectivity: 1.0000

-- 经验法则：选择性<0.01的字段不适合单独索引
```

**前缀索引与选择性平衡：**

```sql
-- 字段：email VARCHAR(255)，平均长度25字符
-- 完整索引太大

-- 1. 计算前缀选择性
SELECT 
  COUNT(DISTINCT LEFT(email, 5)) / COUNT(*) AS sel5,
  COUNT(DISTINCT LEFT(email, 10)) / COUNT(*) AS sel10,
  COUNT(DISTINCT LEFT(email, 15)) / COUNT(*) AS sel15,
  COUNT(DISTINCT email) / COUNT(*) AS full_sel
FROM users;

-- 结果：
-- sel5: 0.8234
-- sel10: 0.9876
-- sel15: 0.9989
-- full_sel: 1.0

-- 2. 选择合适前缀长度
-- 10字符时选择性>0.99，接近完整索引

-- 3. 创建前缀索引
ALTER TABLE users ADD INDEX idx_email_prefix (email(10));

-- 优点：节省空间（10字符vs255字符）
-- 缺点：无法用于ORDER BY和GROUP BY
-- 适用场景：等值查询、模糊匹配后缀

-- 4. 完整索引+覆盖查询
-- 如果email常用于WHERE和ORDER BY，创建完整索引
ALTER TABLE users ADD INDEX idx_email_full (email);

-- 5. 哈希索引替代
-- 对超长字段（如URL）
ALTER TABLE users ADD COLUMN url_hash BIGINT AS (CRC64(url)) PERSISTENT;
ALTER TABLE users ADD INDEX idx_url_hash (url_hash);

-- 查询
SELECT * FROM users WHERE url_hash = CRC64('https://example.com') AND url = 'https://example.com';
-- 注意：必须加上原始字段判断，避免哈希冲突
```

**冗余索引识别与清理：**

```sql
-- 创建多个索引
ALTER TABLE users ADD INDEX idx_a (a);
ALTER TABLE users ADD INDEX idx_a_b (a, b);
ALTER TABLE users ADD INDEX idx_a_b_c (a, b, c);

-- idx_a是冗余的（被idx_a_b覆盖）
-- idx_a_b是冗余的（被idx_a_b_c覆盖）

-- 使用sys库识别
SELECT * FROM sys.schema_redundant_indexes;

-- 输出：
-- table_schema, table_name, redundant_index_name, dominant_index_name
-- test, users, idx_a, idx_a_b
-- test, users, idx_a_b, idx_a_b_c

-- 删除冗余索引
ALTER TABLE users DROP INDEX idx_a;
ALTER TABLE users DROP INDEX idx_a_b;

-- 未使用索引识别
SELECT * FROM sys.schema_unused_indexes;

-- 注意：生产环境删除前必须：
-- 1. 确认无查询使用（至少30天监控）
-- 2. 备份表结构
-- 3. 在低峰期操作
-- 4. 观察性能指标
```

##### 2.1.4 事务日志系统

事务日志是InnoDB持久性的核心。

**日志系统架构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "客户端" as client

client -down-> "事务开始"
"事务开始" -down-> "生成Redo Log"
"生成Redo Log" -down-> "写入Log Buffer"

rectangle "刷盘时机" {
  "事务提交" -down-> "刷盘"
  "Log Buffer满1/2" -down-> "刷盘"
  "每秒定时" -down-> "刷盘"
}

"刷盘" -down-> [ib_logfile0]
"刷盘" -down-> [ib_logfile1]

[ib_logfile0] .up.> [脏页] : LSN关联
[ib_logfile1] .up.> [脏页] : LSN关联

[脏页] -down-> "检查点"
"检查点" -down-> [ibdata]

note right of "生成Redo Log"
  Redo Log是物理日志
  记录页的具体修改
  幂等性
end note

note right of [ib_logfile0]
  循环写入
  固定大小
  Write-Ahead Logging
end note

@enduml
```

**Redo Log配置与调优：**

```sql
-- 基本配置
SHOW VARIABLES LIKE 'innodb_log_file_size';      -- 单个文件大小
SHOW VARIABLES LIKE 'innodb_log_files_in_group'; -- 文件数量
SHOW VARIABLES LIKE 'innodb_log_group_home_dir'; -- 日志目录

-- 推荐配置（基于写入量）
-- 计算每小时写入量
SELECT VARIABLE_VALUE / 1024 / 1024 / 1024 AS redo_gb_per_hour
FROM performance_schema.global_status
WHERE VARIABLE_NAME = 'INNODB_LOG_WRITES';

-- Redo Log总大小应能容纳1-2小时写入
-- 例如：每小时50GB，则log_file_size=8G，files_in_group=8

-- 监控
SHOW STATUS LIKE 'Innodb_log%';
-- Innodb_log_waits: 缓冲不足等待次数（应=0）
-- Innodb_log_write_requests: 日志请求数
-- Innodb_log_writes: 实际fsync次数

-- 优化案例：发现Innodb_log_waits>0
SET GLOBAL innodb_log_buffer_size = 256M;  -- 增大缓冲
SET GLOBAL innodb_log_file_size = 4G;      -- 增大文件（需重启）

-- 注意：修改log_file_size必须：
-- 1. 正常关闭MySQL
-- 2. 删除旧日志文件
-- 3. 修改配置
-- 4. 启动MySQL（自动创建新日志）
```

**Log Sequence Number (LSN)：**

LSN是日志序列号，用于关联Redo Log和脏页。

```sql
-- 查看LSN
SHOW ENGINE INNODB STATUS\G
-- ---
-- LOG
-- ---
-- Log sequence number          123456789012  -- 当前LSN
-- Log flushed up to            123456789000  -- 已刷盘LSN
-- Pages flushed up to          123456788000  -- 脏页LSN
-- Last checkpoint at           123456787000  -- 检查点LSN

-- LSN关系：
-- Log sequence number >= Log flushed up to >= Pages flushed up to >= Last checkpoint at

-- 计算脏页数量
SELECT 
  (Log_sequence_number - Last_checkpoint_at) / 16 / 1024 AS dirty_mb
FROM (
  SELECT 
    MAX(IF(variable_name = 'Innodb_log_sequence_number', variable_value, 0)) AS Log_sequence_number,
    MAX(IF(variable_name = 'Innodb_checkpoint_age', variable_value, 0)) AS Last_checkpoint_at
  FROM performance_schema.global_status
  WHERE variable_name IN ('Innodb_log_sequence_number', 'Innodb_checkpoint_age')
) t;
-- dirty_mb应<缓冲池10%

-- 监控检查点滞后
SELECT VARIABLE_VALUE AS checkpoint_lag
FROM performance_schema.global_status
WHERE VARIABLE_NAME = 'Innodb_checkpoint_age';
-- 应< log_file_size * 0.75
```

**Undo Log配置：**

```sql
-- MySQL 8.0+ Undo表空间
SHOW VARIABLES LIKE 'innodb_undo_tablespaces';  -- 已废弃，自动管理
SHOW VARIABLES LIKE 'innodb_undo_directory';    -- Undo目录

-- 限制Undo最大大小
SET GLOBAL innodb_max_undo_log_size = 1G;  -- 单个Undo表空间上限

-- Undo purge配置
SHOW VARIABLES LIKE 'innodb_purge_threads';    -- Purge线程数
SHOW VARIABLES LIKE 'innodb_purge_batch_size'; -- 每批清理页数

-- 监控Undo
SELECT 
  SUBSTRING_INDEX(SPACE_NAME, '/', -1) AS undo_tablespace,
  TOTAL_PAGES_USED,
  TOTAL_PAGES_FREE,
  TOTAL_PAGES_USED / (TOTAL_PAGES_USED + TOTAL_PAGES_FREE) AS usage_rate
FROM information_schema.innodb_tablespaces
WHERE SPACE_NAME LIKE '%undo%';
```

##### **2.1.5 刷盘策略**

InnoDB通过多个线程异步刷盘，平衡性能和可靠性。

**刷盘参数详解：**

```sql
-- 1. innodb_flush_method
SHOW VARIABLES LIKE 'innodb_flush_method';
-- 常见值：
-- fsync:        默认，调用fsync()刷盘
-- O_DSYNC:      使用O_SYNC打开日志文件
-- O_DIRECT:     数据文件绕过OS缓存（推荐）
-- O_DIRECT_NO_FSYNC: 8.0+，跳过fsync（依赖硬件写缓存）

-- 推荐配置：
-- HDD: O_DIRECT
-- SSD: O_DIRECT_NO_FSYNC（需确认硬件有电容保护）

-- 2. innodb_flush_log_at_trx_commit
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
-- 1: 每次提交fsync（安全，默认）
-- 2: 提交写OS缓存，每秒fsync（性能较好，宕机丢1秒）
-- 0: 每秒写并fsync（性能最好，宕机丢1秒）

-- 3. innodb_flush_sync
SHOW VARIABLES LIKE 'innodb_flush_sync';  -- 8.0+
-- OFF: 刷盘不受innodb_io_capacity限制（保证事务）
-- ON: 受限制（可能延迟）

-- 4. innodb_flush_neighbors
SHOW VARIABLES LIKE 'innodb_flush_neighbors';
-- 0: 不合并刷相邻页（SSD推荐）
-- 1: 合并同一区（默认）
-- 2: 合并同一区及相邻区（HDD）

-- 5. innodb_io_capacity / innodb_io_capacity_max
SHOW VARIABLES LIKE 'innodb_io_capacity';      -- 默认200，普通磁盘
SHOW VARIABLES LIKE 'innodb_io_capacity_max';  -- 默认2000

-- 推荐值：
-- SATA SSD: io_capacity=2000, io_capacity_max=5000
-- NVMe SSD: io_capacity=5000, io_capacity_max=20000
-- HDD: io_capacity=200, io_capacity_max=500

-- 6. innodb_lru_scan_depth
SHOW VARIABLES LIKE 'innodb_lru_scan_depth';  -- 默认1024
-- Page Cleaner扫描LRU深度
-- 越大刷盘越激进
-- 建议：io_capacity * 0.5
```

**刷盘策略生产配置：**

```ini
# SSD服务器配置
innodb_flush_method = O_DIRECT_NO_FSYNC
innodb_flush_log_at_trx_commit = 1
innodb_flush_sync = OFF
innodb_flush_neighbors = 0
innodb_io_capacity = 8000
innodb_io_capacity_max = 20000
innodb_lru_scan_depth = 4096

# HDD服务器配置
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 1
innodb_flush_sync = ON
innodb_flush_neighbors = 2
innodb_io_capacity = 200
innodb_io_capacity_max = 500
innodb_lru_scan_depth = 200
```

**刷盘监控：**

```sql
-- 监控刷盘活动
SHOW STATUS LIKE 'Innodb_buffer_pool_pages%';
-- Innodb_buffer_pool_pages_total: 总页数
-- Innodb_buffer_pool_pages_dirty: 脏页数
-- Innodb_buffer_pool_pages_flushed: 累计刷盘页数

-- 计算刷盘速率
SELECT 
  variable_value AS flushed_pages
FROM performance_schema.global_status
WHERE variable_name = 'Innodb_buffer_pool_pages_flushed';

-- 每秒刷盘页数
SELECT 
  (curr.value - prev.value) / 60 AS pages_per_sec
FROM (
  SELECT variable_value AS value FROM performance_schema.global_status
  WHERE variable_name = 'Innodb_buffer_pool_pages_flushed' AND ts > NOW() - INTERVAL 60 SECOND
) curr,
(
  SELECT variable_value AS value FROM performance_schema.global_status
  WHERE variable_name = 'Innodb_buffer_pool_pages_flushed' AND ts > NOW() - INTERVAL 120 SECOND
) prev;

-- 监控检查点
SHOW STATUS LIKE 'Innodb_checkpoint%';
-- Innodb_checkpoint_age: 检查点滞后（字节）
```

**Doublewrite Buffer：**

防止页断裂（partial page write），保证页原子性。

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

"脏页" -down-> "Doublewrite Buffer\n(顺序写)"
"Doublewrite Buffer" -down-> "数据文件\n(随机写)"

note right of "Doublewrite Buffer"
  结构：
  1. 内存：2MB（128页）
  2. 系统表空间：2MB
  
  刷盘流程：
  1. 脏页写入Doublewrite Buffer
  2. fsync()保证持久化
  3. 写入数据文件
  4. 崩溃恢复时检查页完整性
end note

note right of "数据文件\n(随机写)"
  页断裂问题：
  16KB页可能分多次写入
  断电导致页损坏
  InnoDB无法恢复
  
  Doublewrite保证：
  写入不完整时从Doublewrite恢复
end note

@enduml
```

```sql
-- Doublewrite配置
SHOW VARIABLES LIKE 'innodb_doublewrite';  -- 默认ON

-- 监控
SHOW STATUS LIKE 'Innodb_dblwr%';
-- Innodb_dblwr_writes: Doublewrite写入次数
-- Innodb_dblwr_pages_written: 写入页数

-- 性能影响：约5-10%性能损失

-- SSD环境是否关闭？
-- 不建议，因为：
-- 1. SSD也可能有partial write
-- 2. 文件系统缓存可能导致问题
-- 3. 可靠性 > 性能

-- 但有些云厂商（如AWS）建议关闭（底层有保护）
SET GLOBAL innodb_doublewrite = OFF;  -- 确认底层有原子写保护
```

#### 2.2 MyISAM引擎与场景

MyISAM已废弃，MySQL 8.0移除该引擎。

**遗留系统迁移方案：**

```sql
-- 查看MyISAM表
SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS
FROM information_schema.TABLES
WHERE ENGINE = 'MyISAM';

-- 在线迁移到InnoDB（5.6+）
ALTER TABLE myisam_table ENGINE=InnoDB, ALGORITHM=INPLACE, LOCK=NONE;

-- 批量迁移脚本
SELECT CONCAT('ALTER TABLE ', TABLE_SCHEMA, '.', TABLE_NAME, ' ENGINE=InnoDB;')
FROM information_schema.TABLES
WHERE ENGINE = 'MyISAM'
  AND TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema');

-- 迁移注意事项：
-- 1. 检查外键约束（MyISAM不支持）
-- 2. 检查全文索引（MySQL 5.6+ InnoDB支持）
-- 3. 检查空间索引（MySQL 5.7+ InnoDB支持）
-- 4. 测试性能（InnoDB写入可能更慢）
-- 5. 调整配置（innodb_buffer_pool_size等）
```

**MyISAM性能特点：**

```sql
-- 读密集型场景，MyISAM可能更快
-- 测试对比

-- MyISAM表
CREATE TABLE myisam_test (
  id INT PRIMARY KEY,
  data VARCHAR(100)
) ENGINE=MyISAM;

-- 写入测试
INSERT INTO myisam_test SELECT ...;  -- 表锁，并发写入差

-- 读取测试
SELECT * FROM myisam_test WHERE id = N;  -- 无MVCC，可能读到脏数据

-- 表锁监控
SHOW STATUS LIKE 'Table_locks%';
-- Table_locks_immediate: 立即获得锁次数
-- Table_locks_waited: 等待锁次数（应=0）
```

**Archive引擎替代MyISAM压缩表：**

```sql
-- 原MyISAM压缩表
CREATE TABLE logs_myisam (
  id INT,
  message TEXT
) ENGINE=MyISAM ROW_FORMAT=COMPRESSED;

-- 替换为Archive
CREATE TABLE logs_archive (
  id INT,
  message TEXT
) ENGINE=ARCHIVE;

-- 优点：
-- 1. 压缩率更高
-- 2. 支持INSERT和SELECT
-- 3. 行级锁

-- 缺点：
-- 1. 不支持索引
-- 2. 不支持UPDATE/DELETE
-- 3. 不支持事务

-- 适用：日志归档、审计数据
```

#### 2.3 其他存储引擎

##### 2.3.1 其他引擎

**Memory引擎：**

```sql
-- 创建内存表
CREATE TABLE memory_table (
  id INT PRIMARY KEY,
  data VARCHAR(100)
) ENGINE=MEMORY;

-- 特点：
-- 1. 表级锁
-- 2. 重启数据丢失
-- 3. 最大受max_heap_table_size限制

-- 替换方案（MySQL 8.0+ TempTable引擎）
SET GLOBAL internal_tmp_mem_storage_engine = 'TempTable';
SET GLOBAL temptable_max_ram = 1G;

-- 或使用Redis替代真正的内存表
```

**CSV引擎：**

```sql
-- 用于数据交换
CREATE TABLE csv_table (
  id INT,
  name VARCHAR(50)
) ENGINE=CSV;

-- 直接编辑CSV文件
echo "1,Alice" >> /data/mysql/db/csv_table.CSV
FLUSH TABLES csv_table;  -- 刷新

-- 注意：
-- 1. 不支持索引
-- 2. 不支持分区
-- 3. 必须所有列NOT NULL
```

**Blackhole引擎：**

```sql
-- 黑洞引擎，不存储数据
CREATE TABLE bh_table (
  id INT,
  message TEXT
) ENGINE=BLACKHOLE;

-- 用途：复制中继
-- Master写入Blackhole表
-- Slave通过binlog复制数据
-- Master不占用存储空间

-- 配置
INSERT INTO bh_table VALUES (1, 'test');  -- 数据丢弃，但写入binlog
```

**Federated引擎：**

```sql
-- 访问远程MySQL表（类似Oracle DBLink）
CREATE TABLE remote_table (
  id INT,
  name VARCHAR(50)
) ENGINE=FEDERATED CONNECTION='mysql://user:pass@remote_host:3306/db/table';

-- 缺点：
-- 1. 性能极差（网络和解析开销）
-- 2. 不支持事务
-- 3. 不支持外键
-- 4. 网络不稳定导致查询失败

-- 替代方案：使用ETL工具或应用层分片
```

##### **2.3.2 第三方引擎**

**TokuDB（Percona Server）：**

```sql
-- 分形树索引，高压缩率，写入优化
CREATE TABLE toku_table (
  id BIGINT PRIMARY KEY,
  data VARCHAR(100)
) ENGINE=TokuDB
  ROW_FORMAT=TOKUDB_LZMA;  -- 压缩算法

-- 特点：
-- 1. 90%写入性能提升
-- 2. 10倍压缩率
-- 3. 在线DDL
-- 4. 支持事务

-- 适用：日志系统、数据仓库

-- 注意：已被Percona列为End of Life，建议使用MyRocks
```

**MyRocks（RocksDB存储引擎）：**

```sql
-- Facebook开发，LSM树结构
-- Percona Server for MySQL 8.0支持

-- 适用场景：
-- 1. 写入密集型
-- 2. 空间敏感
-- 3. 数据持久性要求高

-- 限制：
-- 1. 不支持GIS
-- 2. 不支持空间索引
-- 3. 外键支持有限
```

**Spider（分片引擎）：**

```sql
-- 透明分片
CREATE TABLE shard_table (
  id BIGINT,
  data VARCHAR(100)
) ENGINE=SPIDER
PARTITION BY HASH(id) (
  PARTITION p0 COMMENT = 'host "node1", database "db1", table "t1"',
  PARTITION p1 COMMENT = 'host "node2", database "db1", table "t1"',
  PARTITION p2 COMMENT = 'host "node3", database "db1", table "t1"'
);

-- 优点：对应用透明
-- 缺点：性能开销，跨节点JOIN支持差
-- 替代：应用层分片或TiDB
```

#### 2.4 存储引擎性能对比

**测试环境：**

- CPU: Intel Xeon Platinum 2.5GHz 32核
- 内存: 128GB DDR4
- 磁盘: NVMe SSD 3.2TB
- OS: CentOS 7.9
- MySQL: 8.0.35
- 数据集: 1000万行，每行1KB

**测试脚本：**

```python
import sys
sys.path.append('/root/mysql_test')
from mysql_test import MySQLTest

# 初始化测试
test = MySQLTest(
    host='localhost',
    user='root',
    password='test',
    database='engine_test',
    threads=32,
    duration=300
)

# 测试1：InnoDB
test.create_table('inno_test', 'InnoDB')
test.load_data('inno_test', 10000000)
test.run_oltp('inno_test')

# 测试2：MyISAM
test.create_table('myisam_test', 'MyISAM')
test.load_data('myisam_test', 10000000)
test.run_oltp('myisam_test')
```

**测试结果：**

|引擎|插入(万条/秒)|主键查询(QPS)|范围查询(QPS)|更新(QPS)|删除(QPS)|空间占用(GB)|CPU占用|
| ---------| ---------------| ---------------| ---------------| -----------| -----------| --------------| ---------|
|InnoDB|2.3|120,000|8,500|25,000|22,000|28.5|35%|
|MyISAM|3.1|145,000|10,200|表锁|表锁|24.6|28%|
|Memory|3.8|180,000|12,000|65,000|58,000|0|40%|
|Archive|4.2|不适用(全表)|不适用|N/A|N/A|9.8|25%|

**详细分析：**

1. **InnoDB**

   - 优势：事务安全，并发高，MVCC支持
   - 劣势：空间占用大（MVCC、Undo）
   - 适用：99%的生产场景
2. **MyISAM**

   - 优势：读取快，空间小
   - 劣势：表锁，无事务，易损坏
   - 适用：只读静态数据（MySQL 8.0已移除）
3. **Memory**

   - 优势：速度极快
   - 劣势：数据易失，表锁
   - 适用：临时表、缓存（建议用Redis替代）
4. **Archive**

   - 优势：压缩率最高
   - 劣势：无索引，仅支持INSERT/SELECT
   - 适用：日志归档

**选型决策树：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

start

:业务需求分析;

if (需要事务?) then (是)
  :选择InnoDB;
  stop
else (否)
  if (需要持久化?) then (是)
    if (读多写少?) then (是)
      :可考虑MyISAM(8.0不可用);
    else (否)
      :选择InnoDB;
    endif
  else (否)
    if (数据量小?) then (是)
      :可使用Memory;
    else (否)
      :使用Redis;
    endif
  endif
endif

stop

@enduml
```

---

### 第3章 索引原理与设计艺术

#### 3.1 B+Tree索引结构

##### 3.1.1 B+Tree vs B-Tree

**数据结构对比：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

object "B-Tree" {
  [根节点] -down-> [内部节点1]
  [根节点] -down-> [内部节点2]
  
  [内部节点1] -down-> [叶节点1]
  [内部节点1] -down-> [叶节点2]
  
  [内部节点2] -down-> [叶节点3]
  [内部节点2] -down-> [叶节点4]
  
  [叶节点1] -> [data1]
  [叶节点2] -> [data2]
  [叶节点3] -> [data3]
  [叶节点4] -> [data4]
}

object "B+Tree" {
  [根节点] -down-> [内部节点1]
  [根节点] -down-> [内部节点2]
  
  [内部节点1] -down-> [叶节点1]
  [内部节点1] -down-> [叶节点2]
  
  [内部节点2] -down-> [叶节点3]
  [内部节点2] -down-> [叶节点4]
  
  [叶节点1] -right-> [叶节点2]
  [叶节点2] -right-> [叶节点3]
  [叶节点3] -right-> [叶节点4]
  
  [叶节点1] -> [data1, data2]
  [叶节点3] -> [data3, data4]
}

note right of "B-Tree"
  特点：
  1. 所有节点存数据
  2. 树高度较高
  3. 范围查询需回溯
end note

note right of "B+Tree"
  特点：
  1. 仅叶节点存数据
  2. 树高度更低
  3. 叶节点链表连接
  4. 范围查询高效
end note

@enduml
```

**InnoDB B+Tree实现细节：**

```sql
-- 计算树高度
SELECT 
  b.TABLE_NAME,
  a.INDEX_NAME,
  a.N_PAGES,
  ROUND(LOG(1024, a.N_PAGES), 2) AS tree_height
FROM (
  SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COUNT(*) AS N_PAGES
  FROM information_schema.innodb_buffer_page
  WHERE INDEX_NAME IS NOT NULL
  GROUP BY TABLE_NAME, INDEX_NAME
) a
JOIN information_schema.innodb_tables b 
  ON a.TABLE_NAME = b.NAME;

-- 典型B+Tree高度：
-- 千万级数据：3-4层
-- 亿级数据：4-5层
-- 查询性能：3-5次IO

-- 计算索引大小
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  STAT_VALUE * @@innodb_page_size AS index_size_bytes,
  ROUND(STAT_VALUE * @@innodb_page_size / 1024 / 1024, 2) AS index_size_mb
FROM mysql.innodb_index_stats
WHERE stat_name = 'size';
```

##### **3.1.2 聚簇索引(Clustered Index)**

聚簇索引决定了数据物理存储顺序。

**聚簇索引设计原则：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:设计主键;

if (有自增ID?) then (是)
  :使用BIGINT自增主键;
else (否)
  if (有短唯一键?) then (是)
    :使用唯一键;
  else (否)
    :使用BIGINT自增主键;
  endif
endif

:验证主键是否更新?;

if (会更新?) then (是)
  :修改设计，主键不可变;
else (否)
  :设计完成;
endif

stop

@enduml
```

**聚簇索引与二级索引查询对比：**

```sql
-- 表结构
CREATE TABLE clustered_test (
  id BIGINT PRIMARY KEY,  -- 聚簇索引
  name VARCHAR(50),
  country VARCHAR(10),
  KEY idx_country (country)  -- 二级索引
) ENGINE=InnoDB;

-- 查询1：聚簇索引查询
EXPLAIN SELECT * FROM clustered_test WHERE id = 12345\G
-- type: const
-- rows: 1
-- 只需1次IO

-- 查询2：二级索引查询（需回表）
EXPLAIN SELECT * FROM clustered_test WHERE country = 'US' LIMIT 1\G
-- type: ref
-- rows: 1
-- 需要：
-- 1. 在idx_country找到country='US'的记录（含主键id）
-- 2. 用id回表查询聚簇索引
-- 2次IO

-- 查询3：覆盖索引（不回表）
EXPLAIN SELECT id, country FROM clustered_test WHERE country = 'US'\G
-- type: ref
-- Extra: Using index
-- 索引已包含所有字段，无需回表
-- 1次IO
```

##### **3.1.3 二级索引(Secondary Index)**

二级索引设计是查询优化的关键。

**二级索引页结构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

rectangle "二级索引页" {
  [Page Header] -down-> [记录1]
  [记录1] -down-> [记录2]
  [记录2] -down-> [记录3]
  
  [记录1] -> [country: 'US', id: 100]
  [记录2] -> [country: 'US', id: 101]
  [记录3] -> [country: 'US', id: 102]
  
  [记录1] -down-> [Record Header]
}

note right of [Record Header]
  Record Header包含：
  1. 记录类型
  2. 下一条记录偏移
  3. 可变字段长度
  4. NULL标志位
  5. 记录额外信息
end note

note right of "二级索引页"
  叶子节点包含：
  1. 索引字段值
  2. 主键值
  3. MVCC字段
  
  不存其他列数据
  查询其他列需回表
end note

@enduml
```

**二级索引最佳实践：**

```sql
-- 1. 索引选择性优先
-- 高选择性字段放左边
ALTER TABLE users ADD INDEX idx_email_status (email, status);  -- 正确
ALTER TABLE users ADD INDEX idx_status_email (status, email);  -- 错误（status选择性低）

-- 2. 最左前缀匹配
-- 索引 (a, b, c)
WHERE a = 1 AND b = 2 AND c = 3  -- 完全使用
WHERE a = 1 AND b > 2 AND c = 3  -- 仅使用a,b（范围后失效）

-- 3. 避免索引跳跃
-- 索引 (a, b)
WHERE a IN (1,2,3) AND b = 10;  -- 可能索引跳跃扫描（8.0+）

-- 4. 索引拓展性
-- 预留列
ALTER TABLE users ADD INDEX idx_ext (a, b, c, d);  -- d为预留列
-- 后续WHERE a=1 AND b=2可直接使用，无需重建

-- 5. 分页查询优化
-- 深分页问题
SELECT * FROM users WHERE status = 1 ORDER BY id LIMIT 100000, 10;
-- 优化：延迟关联
SELECT u.* FROM users u 
JOIN (
  SELECT id FROM users WHERE status = 1 ORDER BY id LIMIT 100000, 10
) AS tmp ON u.id = tmp.id;
-- 内层查询覆盖索引，不回表
```

**二级索引与排序：**

```sql
-- 索引不支持反向扫描时，需filesort
SELECT * FROM users WHERE status = 1 ORDER BY id DESC;

-- 8.0+支持倒序索引
ALTER TABLE users ADD INDEX idx_status_id_desc (status, id DESC);

-- 验证
EXPLAIN SELECT * FROM users WHERE status = 1 ORDER BY id DESC\G
-- Extra: Using index; Backward index scan
```

#### 3.2 哈希索引与自适应哈希

##### **3.2.1 Memory引擎哈希索引**

Memory引擎支持显式哈希索引。

```sql
-- 创建哈希索引
CREATE TABLE hash_table (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  KEY USING HASH (name)
) ENGINE = MEMORY;

-- 原理：哈希函数映射到桶
-- 查询：O(1)
-- 不支持：范围查询、排序

-- 哈希冲突处理：链表法
-- 性能：冲突率高时退化为O(n)

-- 监控哈希索引
SELECT 
  TABLE_SCHEMA,
  TABLE_NAME,
  INDEX_NAME,
  SEQ_IN_INDEX,
  COLUMN_NAME
FROM information_schema.STATISTICS
WHERE INDEX_TYPE = 'HASH';

-- 生产建议：仅用于精确查找，数据量<1万
```

##### **3.2.2 InnoDB自适应哈希索引(AHI)**

InnoDB自动为热点页创建哈希索引。

**AHI实现原理：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

object "B+Tree索引" {
  [根节点] -down-> [叶节点1]
  [根节点] -down-> [叶节点2]
  [根节点] -down-> [叶节点3]
}

object "AHI哈希表" {
  [哈希桶1] -> [叶节点1]
  [哈希桶2] -> [叶节点2]
  [哈希桶3] -> [叶节点3]
}

"查询key" -down-> "哈希函数"
"哈希函数" -down-> [哈希桶2]
[哈希桶2] -> [叶节点2] : O(1)访问

note right of "AHI哈希表"
  构建条件：
  1. 页访问频率高
  2. 查询模式单一（等值）
  3. B+Tree深度>=4
  
  自动维护，无需人工干预
end note

@enduml
```

**AHI配置与监控：**

```sql
-- AHI配置
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index';  -- 默认ON
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index_parts';  -- 分区数，默认8

-- 监控AHI使用情况
SHOW ENGINE INNODB STATUS\G
-- 输出示例：
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- Hash table size 34679, node heap has 0 buffer(s)
-- 0.00 hash searches/s, 100000 non-hash searches/s

-- hash searches比例应>10%才算有效
```

**AHI性能测试：**

```sql
-- 测试表
CREATE TABLE ahi_test (
  id BIGINT PRIMARY KEY,
  value BIGINT
) ENGINE=InnoDB;

-- 插入100万条
INSERT INTO ahi_test SELECT i, i FROM numbers WHERE i <= 1000000;

-- 预热查询（触发AHI构建）
SELECT * FROM ahi_test WHERE id = 12345;
SELECT * FROM ahi_test WHERE id = 23456;
...
-- 重复查询使页变热

-- 监控AHI增长
SHOW ENGINE INNODB STATUS\G
-- hash searches/s应从0开始增长

-- 性能对比
-- AHI启用：QPS 15万
-- AHI禁用：QPS 8万
-- 提升：87%
```

**AHI适用场景：**

```sql
-- 场景1：热点数据集中
SELECT * FROM users WHERE id = ?;  -- 用户活跃集中

-- 场景2：等值查询
SELECT * FROM orders WHERE order_no = ?;  -- 精确查找

-- 场景3：B+Tree深度大
-- 千万级表，主键查询4次IO -> AHI优化为1次

-- 不适用场景：
-- 1. 范围查询
SELECT * FROM users WHERE id BETWEEN 1000 AND 2000;

-- 2. 数据热点分散
-- 每个用户只访问自己的数据

-- 3. 小表
-- B+Tree高度<=2，AHI无意义
```

**AHI分区优化：**

```sql
-- 高并发下AHI可能成为瓶颈
SHOW STATUS LIKE 'Innodb_adaptive_hash%';
-- Innodb_adaptive_hash_hash_searches: 哈希查找
-- Innodb_adaptive_hash_non_hash_searches: 非哈希查找
-- Innodb_adaptive_hash_hash_searches_latch: 哈希锁等待

-- 如果哈希锁等待高，增加分区
SET GLOBAL innodb_adaptive_hash_index_parts = 64;  -- 从8增至64

-- 效果：锁冲突分散到64个分区
-- 吞吐量提升30-50%
```

#### 3.3 全文索引与空间索引

##### **3.3.1 全文索引(Full-Text Index)**

MySQL 5.6+ InnoDB支持全文索引。

**全文索引原理：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

object "倒排索引" {
  [词 "MySQL"] -> [doc_id: 1, pos: 5]
  [词 "MySQL"] -> [doc_id: 3, pos: 12]
  [词 "优化"] -> [doc_id: 1, pos: 10]
  [词 "优化"] -> [doc_id: 2, pos: 3]
}

object "全文索引表" {
  [word] VARCHAR(50)
  [doc_id] BIGINT
  [position] INT
}

note right of "倒排索引"
  倒排索引结构：
  1. word：分词结果
  2. doc_id：文档ID
  3. position：位置
  
  查询："MySQL优化"
  1. 查"MySQL"得doc_id: 1,3
  2. 查"优化"得doc_id: 1,2
  3. 取交集得doc_id: 1
  4. 按相关性排序
end note

@enduml
```

**全文索引创建与使用：**

```sql
-- 创建全文索引
CREATE TABLE articles (
  id BIGINT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  FULLTEXT KEY ft_title_content (title, content)
) ENGINE=InnoDB;

-- 配置分词
-- 英文（默认）
SELECT @@innodb_ft_min_token_size;  -- 最小词长，默认3
SELECT @@innodb_ft_max_token_size;  -- 最大词长，默认84
SELECT @@innodb_ft_stopword_file;   -- 停词表

-- 中文（ngram解析器）
SET GLOBAL ngram_token_size = 2;  -- 2个字符（推荐）

-- 创建中文全文索引
CREATE TABLE chinese_articles (
  id BIGINT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  FULLTEXT KEY ft_content (content) WITH PARSER ngram
) ENGINE=InnoDB;

-- 插入数据
INSERT INTO chinese_articles VALUES 
(1, 'MySQL优化指南', 'MySQL数据库性能优化方法');

-- 自然语言搜索
SELECT id, title,
       MATCH(content) AGAINST ('数据库优化') AS relevance
FROM chinese_articles
WHERE MATCH(content) AGAINST ('数据库优化');

-- 布尔模式
SELECT * FROM chinese_articles
WHERE MATCH(content) AGAINST ('+MySQL -Oracle' IN BOOLEAN MODE);

-- 查询扩展
SELECT * FROM chinese_articles
WHERE MATCH(content) AGAINST ('数据库' WITH QUERY EXPANSION);
```

**全文索引优化：**

```sql
-- 1. 停词配置
-- 自定义停词表
CREATE TABLE my_stopwords(value VARCHAR(30)) ENGINE = INNODB;
INSERT INTO my_stopwords VALUES ('的'), ('了'), ('在');

SET GLOBAL innodb_ft_server_stopword_table = 'db/my_stopwords';

-- 2. 最小词长优化
SET GLOBAL innogram_token_size = 2;  -- 中文2-4字符

-- 3. 索引缓存
SHOW VARIABLES LIKE 'innodb_ft_cache_size';  -- 缓存大小

-- 4. 合并索引
-- 多个单列全文索引可合并查询
SELECT * FROM articles
WHERE MATCH(title) AGAINST ('keyword')
   OR MATCH(content) AGAINST ('keyword');

-- 改为复合索引更高效
ALTER TABLE articles DROP INDEX ft_title, DROP INDEX ft_content;
ALTER TABLE articles ADD FULLTEXT INDEX ft_all (title, content);

-- 5. 大数据量优化
-- 千万级以上考虑Elasticsearch
-- MySQL全文索引性能下降明显

-- 6. 监控
SELECT * FROM information_schema.innodb_ft_index_cache;
SELECT * FROM information_schema.innodb_ft_index_table;
```

**生产案例：论坛搜索优化**

```sql
-- 原方案：LIKE搜索
SELECT * FROM posts WHERE content LIKE '%性能优化%';
-- 扫描100万行，耗时5秒

-- 新方案：全文索引
ALTER TABLE posts ADD FULLTEXT INDEX ft_content (content) WITH PARSER ngram;

-- 查询
SELECT * FROM posts WHERE MATCH(content) AGAINST ('性能优化');
-- 返回100行，耗时50ms

-- 相关性优化
SELECT id, title,
       MATCH(content) AGAINST ('性能优化') AS score
FROM posts
WHERE MATCH(content) AGAINST ('性能优化')
ORDER BY score DESC;

-- 结合Ngram优化
SET GLOBAL ngram_token_size = 2;
-- 查询"性能优化"可匹配"性优化"（容错）
```

##### **3.3.2 空间索引(Spatial Index)**

MySQL 5.7+ InnoDB支持空间索引。

**空间数据类型：**

```sql
-- 几何类型
CREATE TABLE geo_test (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  location POINT NOT NULL SRID 4326,  -- WGS84坐标系
  area POLYGON NOT NULL SRID 4326,
  SPATIAL INDEX idx_location (location),
  SPATIAL INDEX idx_area (area)
) ENGINE=InnoDB;

-- SRID必须指定，否则无法创建空间索引
-- 常用SRID：
-- 4326: WGS84（GPS坐标）
-- 3857: Web Mercator（地图投影）

-- 插入数据
INSERT INTO geo_test VALUES (
  1,
  '北京',
  ST_Point(116.40, 39.90, 4326),
  ST_PolygonFromText('POLYGON((...))', 4326)
);
```

**空间查询：**

```sql
-- 查询附近10公里
SELECT * FROM geo_test
WHERE ST_Distance_Sphere(location, ST_Point(116.40, 39.90, 4326)) <= 10000;

-- 优化：使用范围框
SET @lat = 39.90, @lng = 116.40, @dist = 10000;
SET @dlat = @dist / 111000;  -- 1度纬度约111km
SET @dlng = @dist / (111000 * COS(RADIANS(@lat)));

SELECT * FROM geo_test
WHERE ST_Contains(
  ST_MakeEnvelope(
    @lng - @dlng, @lat - @dlat,
    @lng + @dlng, @lat + @dlat,
    4326
  ),
  location
);

-- 使用空间索引
EXPLAIN SELECT * FROM geo_test
WHERE MBRContains(
  ST_GeomFromText('POLYGON((116.3 39.8, 116.5 39.8, 116.5 40.0, 116.3 40.0, 116.3 39.8))', 4326),
  location
)\G
-- type: range
-- key: idx_location
```

**空间索引优化：**

```sql
-- 1. 坐标转换在应用层
-- 避免在SQL中进行大量ST_Transform

-- 2. 网格化分片
-- 将地图划分为固定网格，增加grid_id列
ALTER TABLE geo_test ADD COLUMN grid_id BIGINT;
ALTER TABLE geo_test ADD INDEX idx_grid (grid_id);

-- 查询时先定位网格
SELECT * FROM geo_test
WHERE grid_id IN (123, 124, 125, 133, 134, 135)
  AND ST_Distance_Sphere(location, point) < 1000;

-- 3. 空间索引支持
-- MyISAM支持R-Tree空间索引（5.7前唯一选择）
-- InnoDB 5.7+支持，但功能较弱

-- 4. 大数据量替代
-- 超过1000万条使用PostGIS或MongoDB
```

**生产案例：外卖商家搜索**

```sql
-- 场景：查找用户附近5公里营业商家

-- 原方案：全表扫描
SELECT * FROM merchants
WHERE ST_Distance_Sphere(location, user_point) <= 5000
  AND status = 1;
-- 扫描10万商家，耗时3秒

-- 优化1：范围过滤+空间索引
SET @dist = 5000;
SET @dlat = @dist / 111000;
SET @dlng = @dist / (111000 * COS(RADIANS(@user_lat)));

SELECT * FROM merchants
WHERE MBRContains(
    ST_MakeEnvelope(
      @user_lng - @dlng, @user_lat - @dlat,
      @user_lng + @dlng, @user_lat + @dlat,
      4326
    ),
    location
)
AND status = 1
AND ST_Distance_Sphere(location, user_point) <= 5000;
-- 利用空间索引过滤，耗时50ms

-- 优化2：网格分片
ALTER TABLE merchants ADD COLUMN grid_id BIGINT;
UPDATE merchants SET grid_id = ST_GeoHash(location, 6);  -- 6位网格

-- 查询
SELECT * FROM merchants
WHERE grid_id = ST_GeoHash(user_point, 6)
  AND ST_Distance_Sphere(location, user_point) <= 5000;
-- 耗时10ms
```

#### 3.4 索引设计原则

##### 3.4.1 三星索引原则

三星索引由《Relational Database Index Design and the Optimizers》提出：

**第一星：索引行关联的扫描行数最少**

- WHERE条件匹配索引列
- 等值条件优先
- 范围条件放最后

**第二星：避免排序**

- ORDER BY使用索引
- 排序方向一致

**第三星：覆盖查询**

- 索引包含所有查询列

**三星索引示例：**

```sql
-- 查询
SELECT name, age FROM users 
WHERE status = 1 
  AND create_time > '2024-01-01' 
ORDER BY create_time;

-- 分析：
-- 第一星：status=1，create_time范围过滤
-- 第二星：ORDER BY create_time
-- 第三星：需要name, age

-- 三星索引设计
ALTER TABLE users ADD INDEX idx_status_ctime_name_age (status, create_time, name, age);

-- 验证第一星
EXPLAIN SELECT name, age FROM users WHERE status = 1 AND create_time > '2024-01-01'\G
-- type: range
-- key_len: 使用到status和create_time
-- rows: 精准过滤

-- 验证第二星
EXPLAIN SELECT name, age FROM users WHERE status = 1 ORDER BY create_time\G
-- Extra: Using index  # 无Using filesort

-- 验证第三星
EXPLAIN SELECT name, age FROM users WHERE status = 1\G
-- Extra: Using index  # 覆盖索引

-- 非三星索引对比
ALTER TABLE users ADD INDEX idx_status (status);
EXPLAIN SELECT name, age FROM users WHERE status = 1\G
-- Extra: Using index condition; Using where
-- 需要回表，无第三星
```

**两星索引优化：**

```sql
-- 当无法达到三星时，优先第一、二星
-- 第三星可通过其他方式补偿

-- 查询
SELECT * FROM orders 
WHERE user_id = 10001 
ORDER BY create_time DESC
LIMIT 10;

-- 两星索引
ALTER TABLE orders ADD INDEX idx_user_ctime (user_id, create_time DESC);

-- 第一星：user_id=10001过滤
-- 第二星：ORDER BY create_time DESC
-- 第三星：无（需回表查所有字段）

-- 补偿方案：扩展索引
ALTER TABLE orders ADD INDEX idx_user_ctime_ext (
  user_id, create_time DESC, order_no, status, amount
);
-- 若查询仅需这些字段，则达到三星

-- 或调整查询为覆盖
SELECT order_no, status, amount FROM orders 
WHERE user_id = 10001 
ORDER BY create_time DESC
LIMIT 10;
```

##### **3.4.2 最左前缀原则**

联合索引必须按从左到右顺序使用。

**最左前缀案例：**

```sql
-- 联合索引 (a, b, c)
CREATE TABLE composite_idx (
  a INT,
  b INT,
  c INT,
  INDEX idx_abc (a, b, c)
) ENGINE=InnoDB;

-- 案例1：完全匹配
EXPLAIN SELECT * FROM composite_idx WHERE a = 1 AND b = 2 AND c = 3\G
-- key: idx_abc
-- key_len: 12  -- 使用全部3列

-- 案例2：部分匹配
EXPLAIN SELECT * FROM composite_idx WHERE a = 1 AND b = 2\G
-- key: idx_abc
-- key_len: 8  -- 使用a,b两列

-- 案例3：跳过中间列
EXPLAIN SELECT * FROM composite_idx WHERE a = 1 AND c = 3\G
-- key: idx_abc
-- key_len: 4  -- 仅使用a列
-- Extra: Using index condition  -- c在ICP过滤

-- 案例4：无最左列
EXPLAIN SELECT * FROM composite_idx WHERE b = 2 AND c = 3\G
-- key: NULL  -- 无法使用索引
-- type: ALL  -- 全表扫描

-- 案例5：范围查询
EXPLAIN SELECT * FROM composite_idx WHERE a = 1 AND b > 2 AND c = 3\G
-- key: idx_abc
-- key_len: 8  -- 仅使用a,b，c失效

-- 案例6：IN列表
EXPLAIN SELECT * FROM composite_idx WHERE a IN (1,2) AND b = 3\G
-- key: idx_abc
-- key_len: 12  -- MySQL 5.7+支持索引跳跃扫描

-- 索引跳跃扫描（Index Skip Scan）
SET optimizer_switch = 'skip_scan=on';
EXPLAIN SELECT * FROM composite_idx WHERE b = 2\G
-- type: range
-- Extra: Using index for skip scan  # 遍历a的每个值
```

**索引顺序设计：**

```sql
-- 场景：用户订单查询，常用条件
-- WHERE user_id = ? AND status = ? AND create_time > ?

-- 方案1：(user_id, status, create_time)
-- 优点：完全匹配最左前缀
-- 缺点：status选择性低

-- 方案2：(user_id, create_time, status)
-- 优点：create_time时间范围过滤
-- 缺点：status在ICP过滤

-- 方案3：(create_time, user_id, status)
-- 缺点：无法使用user_id过滤

-- 结论：方案2最优
-- 高选择性列在前
-- 范围查询列放最后

ALTER TABLE orders ADD INDEX idx_user_ctime_status (user_id, create_time, status);
```

##### **3.4.3 索引选择性**

选择性 = 不重复值 / 总行数，越接近1越好。

**选择性计算案例：**

```sql
-- 表：员工表
CREATE TABLE employees (
  emp_id BIGINT PRIMARY KEY,
  gender ENUM('M', 'F'),
  department_id INT,
  email VARCHAR(100),
  phone VARCHAR(20),
  INDEX idx_gender (gender),
  INDEX idx_department (department_id),
  UNIQUE INDEX idx_email (email),
  UNIQUE INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- 计算选择性
SELECT 
  COUNT(DISTINCT gender) / COUNT(*) AS gender_selectivity,
  COUNT(DISTINCT department_id) / COUNT(*) AS dept_selectivity,
  COUNT(DISTINCT email) / COUNT(*) AS email_selectivity,
  COUNT(DISTINCT phone) / COUNT(*) AS phone_selectivity
FROM employees;

-- 典型结果：
-- gender_selectivity: 0.5        -- 低选择性，不适合索引
-- dept_selectivity: 0.05         -- 极低，不适合索引
-- email_selectivity: 1.0         -- 高选择性，适合索引
-- phone_selectivity: 1.0         -- 高选择性，适合索引

-- 低选择性索引效果
EXPLAIN SELECT * FROM employees WHERE gender = 'M'\G
-- type: ALL  -- 优化器选择全表扫描
-- rows: 50万

-- 高选择性索引效果
EXPLAIN SELECT * FROM employees WHERE email = 'john@example.com'\G
-- type: const
-- rows: 1
```

**联合索引选择性与顺序：**

```sql
-- 联合索引中，高选择性列应在前
-- 但需结合实际查询模式

-- 场景：订单查询
-- WHERE user_id = ? AND status = ?

-- 计算选择性
SELECT 
  COUNT(DISTINCT user_id) / COUNT(*) AS user_sel,
  COUNT(DISTINCT status) / COUNT(*) AS status_sel
FROM orders;

-- 结果：user_sel=1, status_sel=0.1

-- 索引设计
-- 方案A：(user_id, status)  -- 符合选择性原则
-- 方案B：(status, user_id)  -- 但status常用于范围查询

-- 决策：方案A
-- 虽然status放后面，但user_id等值过滤后数据量已很小
ALTER TABLE orders ADD INDEX idx_user_status (user_id, status);
```

##### **3.4.4 前缀索引**

对长字符串字段，创建前缀索引。

**前缀索引设计：**

```sql
-- 场景：URL字段VARCHAR(2000)
CREATE TABLE urls (
  id BIGINT PRIMARY KEY,
  url VARCHAR(2000),
  INDEX idx_url (url)  -- 完整索引极大
) ENGINE=InnoDB;

-- 1. 计算前缀选择性
SELECT
  COUNT(DISTINCT LEFT(url, 10)) / COUNT(*) AS sel10,
  COUNT(DISTINCT LEFT(url, 20)) / COUNT(*) AS sel20,
  COUNT(DISTINCT LEFT(url, 50)) / COUNT(*) AS sel50,
  COUNT(DISTINCT LEFT(url, 100)) / COUNT(*) AS sel100,
  COUNT(DISTINCT url) / COUNT(*) AS full_sel
FROM urls;

-- 结果：
-- sel10: 0.65
-- sel20: 0.88
-- sel50: 0.95
-- sel100: 0.98
-- full_sel: 1.0

-- 2. 选择前缀长度
-- 50字符时选择性>0.95，可接受

-- 3. 创建前缀索引
ALTER TABLE urls ADD INDEX idx_url_prefix (url(50));

-- 优点：
-- 1. 节省空间（50字符 vs 2000字符）
-- 2. 提高缓存效率
-- 3. 减少IO

-- 缺点：
-- 1. 无法用于ORDER BY
-- 2. 无法用于GROUP BY
-- 3. 可能降低选择性

-- 优化：组合前缀索引
-- 如果不同URL前50字符相同
ALTER TABLE urls ADD COLUMN url_hash BIGINT AS (CRC64(url)) PERSISTENT;
ALTER TABLE urls ADD INDEX idx_url_hash (url_hash);

-- 查询
SELECT * FROM urls 
WHERE url_hash = CRC64('https://example.com') 
  AND url = 'https://example.com';  -- 必须加原始条件防冲突
```

##### **3.4.5 函数索引（MySQL 8.0）**

```sql
-- 8.0.13+支持函数索引
-- 解决函数操作导致索引失效

-- 场景：按日期查询
SELECT * FROM orders WHERE DATE(create_time) = '2024-01-01';

-- 传统方法无法使用索引
-- 即使create_time有索引

-- 创建函数索引
ALTER TABLE orders ADD INDEX idx_date ( (DATE(create_time)) );

-- 查询自动使用索引
EXPLAIN SELECT * FROM orders WHERE DATE(create_time) = '2024-01-01'\G
-- key: idx_date
-- type: ref

-- 其他函数索引案例
-- JSON字段
ALTER TABLE json_table ADD INDEX idx_json_name ( (JSON_EXTRACT(data, '$.name')) );

-- 计算列
ALTER TABLE products ADD INDEX idx_discounted_price ( (price * 0.9) );

-- 哈希索引
ALTER TABLE longtext_table ADD INDEX idx_hash ( (CRC64(content)) );
```

#### 3.5 索引失效场景与预防

##### **3.5.1 函数操作导致失效**

```sql
-- 表结构
CREATE TABLE func_test (
  id BIGINT PRIMARY KEY,
  create_time DATETIME,
  INDEX idx_ctime (create_time)
) ENGINE=InnoDB;

-- 失效案例
SELECT * FROM func_test WHERE YEAR(create_time) = 2024;  -- 函数操作，索引失效

-- EXPLAIN
EXPLAIN SELECT * FROM func_test WHERE YEAR(create_time) = 2024\G
-- type: ALL
-- Extra: Using where
-- rows: 100万

-- 优化方案1：范围查询
SELECT * FROM func_test 
WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';

-- EXPLAIN
EXPLAIN SELECT * FROM func_test 
WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01'\G
-- type: range
-- key: idx_ctime
-- rows: 10万

-- 优化方案2：函数索引（8.0+）
ALTER TABLE func_test ADD INDEX idx_year ( (YEAR(create_time)) );

-- 查询
EXPLAIN SELECT * FROM func_test WHERE YEAR(create_time) = 2024\G
-- type: ref
-- key: idx_year

-- 常见函数失效案例
-- 字符串函数
SELECT * FROM users WHERE SUBSTRING(name, 1, 3) = '张';  -- 失效
-- 优化：SELECT * FROM users WHERE name LIKE '张%';  -- 有效

-- 数学函数
SELECT * FROM stats WHERE ROUND(value, 2) = 10.00;  -- 失效
-- 优化：SELECT * FROM stats WHERE value BETWEEN 9.995 AND 10.005;

-- 类型转换
SELECT * FROM orders WHERE user_id = '123';  -- 隐式转换
-- 优化：SELECT * FROM orders WHERE user_id = 123;
```

##### **3.5.2 隐式类型转换**

```sql
-- 表结构
CREATE TABLE implicit_cast (
  user_id VARCHAR(50),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

INSERT INTO implicit_cast VALUES ('12345');

-- 失效案例（索引字段类型转换）
SELECT * FROM implicit_cast WHERE user_id = 12345;  -- VARCHAR转换为INT

-- EXPLAIN
EXPLAIN SELECT * FROM implicit_cast WHERE user_id = 12345\G
-- type: ALL
-- Extra: Using where
-- rows: 100万

-- 原因：
-- 优化器无法确定转换后的值范围
-- 必须全表扫描每行转换后比较

-- 正确做法
SELECT * FROM implicit_cast WHERE user_id = '12345';  -- 字符串匹配
-- type: ref
-- rows: 1

-- 连接查询中的隐式转换
-- 表A：user_id INT
-- 表B：user_id VARCHAR(50)

-- 失效
SELECT * FROM A JOIN B ON A.user_id = B.user_id;  -- 隐式转换

-- EXPLAIN
-- type: ALL on B
-- rows: 100万

-- 优化1：修改表结构
ALTER TABLE B MODIFY user_id INT;

-- 优化2：显式转换（仍可能失效）
SELECT * FROM A JOIN B ON A.user_id = CAST(B.user_id AS UNSIGNED);

-- 优化3：应用层保证类型一致
```

##### **3.5.3 负向查询**

```sql
-- 表结构
CREATE TABLE negative_test (
  id BIGINT PRIMARY KEY,
  status TINYINT,  -- 0:无效 1:有效
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- 失效案例
SELECT * FROM negative_test WHERE status != 1;  -- !=通常不走索引

-- EXPLAIN
EXPLAIN SELECT * FROM negative_test WHERE status != 1\G
-- type: ALL
-- rows: 100万

-- 优化1：正向前缀
SELECT * FROM negative_test WHERE status IN (0, 2, 3);

-- 优化2：覆盖索引
ALTER TABLE negative_test ADD INDEX idx_status_id (status, id);
EXPLAIN SELECT id FROM negative_test WHERE status != 1\G
-- type: range
-- key: idx_status_id
-- Extra: Using where; Using index

-- 其他负向操作
SELECT * FROM t WHERE id NOT IN (1, 2, 3);  -- 可能失效
SELECT * FROM t WHERE name NOT LIKE '张%';  -- 失效
SELECT * FROM t WHERE id <> 100;            -- 同!=

-- NOT IN优化
-- 若子查询结果集小，可改写LEFT JOIN
-- 原：SELECT * FROM A WHERE id NOT IN (SELECT id FROM B)
-- 改：SELECT A.* FROM A LEFT JOIN B ON A.id = B.id WHERE B.id IS NULL;
```

##### **3.5.4 OR条件**

```sql
-- 表结构
CREATE TABLE or_test (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100),
  INDEX idx_name (name),
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- 失效案例
SELECT * FROM or_test WHERE name = '张三' OR email = 'zhangsan@example.com';

-- EXPLAIN
EXPLAIN SELECT * FROM or_test WHERE name = '张三' OR email = 'zhangsan@example.com'\G
-- type: ALL
-- rows: 100万
-- Extra: Using union(idx_name,idx_email); Using where

-- 问题：
-- 1. 索引合并（Index Merge Union）效率低
-- 2. 可能回表大量数据

-- 优化1：改写为UNION ALL
SELECT * FROM or_test WHERE name = '张三'
UNION ALL
SELECT * FROM or_test WHERE email = 'zhangsan@example.com' AND name != '张三';

-- EXPLAIN
-- 两个SELECT各用索引，无全表扫描

-- 优化2：IN列表
-- 若OR条件是同字段
SELECT * FROM or_test WHERE name = '张三' OR name = '李四';
-- 改：
SELECT * FROM or_test WHERE name IN ('张三', '李四');

-- 优化3：合并索引
-- 若OR条件经常一起出现
ALTER TABLE or_test ADD INDEX idx_name_email (name, email);

-- 但OR条件无法高效使用复合索引
-- 仍推荐UNION ALL
```

##### **3.5.5 最左前缀中断**

```sql
-- 联合索引 (a, b, c)

-- 失效案例
-- 1. 跳过a列
EXPLAIN SELECT * FROM t WHERE b = 2 AND c = 3\G
-- key: NULL

-- 2. a是范围查询
EXPLAIN SELECT * FROM t WHERE a > 1 AND b = 2\G
-- key: idx_abc
-- key_len: 4  -- 仅用a列

-- 3. a是函数
EXPLAIN SELECT * FROM t WHERE CONCAT(a, '') = '1' AND b = 2\G
-- key: NULL

-- 4. a是表达式
EXPLAIN SELECT * FROM t WHERE a + 1 = 2 AND b = 3\G
-- key: NULL

-- 5. a是隐式转换
EXPLAIN SELECT * FROM t WHERE a = '1' AND b = 2\G
-- key: idx_abc
-- key_len: 4  -- 仅用a列（类型不匹配导致中断）

-- 解决方案：调整索引顺序
-- 若查询模式主要是WHERE b = ? AND c = ?
-- 创建新索引
ALTER TABLE t ADD INDEX idx_bc (b, c);

-- 保留原索引用于其他查询
```

##### **3.5.6 参数优化器限制**

```sql
-- 参数限制导致索引失效

-- 1. 索引字段太长
SHOW VARIABLES LIKE 'max_sort_length';  -- 排序字节限制，默认1024
-- 索引字段超过此长度无法使用

-- 2. JOIN缓冲区太小
SHOW VARIABLES LIKE 'join_buffer_size';  -- 默认256KB
-- 大JOIN可能无法使用索引

-- 3. 索引统计信息过时
-- 优化器认为全表扫描更快

-- 更新统计信息
ANALYZE TABLE t;

-- 4. 强制索引
-- 优化器选择错误时
SELECT * FROM t USE INDEX (idx_name) WHERE name = 'test';

-- 或忽略索引
SELECT * FROM t IGNORE INDEX (idx_name) WHERE id = 1;

-- 5. 优化器SQL改写
-- 子查询可能导致索引失效
-- 改写为JOIN
```

#### 3.6 索引维护与管理

##### 3.6.1 监控索引使用情况

```sql
-- 1. Performance Schema监控
UPDATE performance_schema.setup_instruments SET ENABLED = 'YES', TIMED = 'YES'
WHERE NAME LIKE '%memory/innodb/fts%';

UPDATE performance_schema.setup_consumers SET ENABLED = 'YES';

-- 查看索引IO
SELECT 
  OBJECT_SCHEMA,
  OBJECT_NAME,
  INDEX_NAME,
  COUNT_FETCH,
  SUM_TIMER_FETCH
FROM performance_schema.table_io_waits_summary_by_index_usage
ORDER BY SUM_TIMER_FETCH DESC
LIMIT 20;

-- 2. sys库视图
-- 查看未使用索引
SELECT * FROM sys.schema_unused_indexes;

-- 查看冗余索引
SELECT * FROM sys.schema_redundant_indexes;

-- 查看索引使用情况
SELECT * FROM sys.schema_index_statistics
WHERE table_schema = 'db' AND table_name = 'users';

-- 3. 索引使用统计
SELECT 
  t.TABLE_SCHEMA,
  t.TABLE_NAME,
  t.TABLE_ROWS,
  s.INDEX_NAME,
  s.COLUMN_NAME,
  s.SEQ_IN_INDEX,
  i.CARDINALITY,
  i.CARDINALITY / t.TABLE_ROWS AS selectivity
FROM information_schema.STATISTICS s
JOIN information_schema.TABLES t ON s.TABLE_SCHEMA = t.TABLE_SCHEMA AND s.TABLE_NAME = t.TABLE_NAME
LEFT JOIN information_schema.innodb_index_stats i 
  ON s.TABLE_SCHEMA = i.database_name AND s.TABLE_NAME = i.table_name AND s.INDEX_NAME = i.index_name
WHERE t.TABLE_SCHEMA = 'db'
ORDER BY t.TABLE_NAME, s.INDEX_NAME, s.SEQ_IN_INDEX;

-- 4. 监控慢查询中的索引使用
pt-query-digest /var/log/mysql/slow.log | grep -A 5 "Index usage"
```

**索引使用分析案例：**

```sql
-- 场景：发现idx_status从未使用

-- 步骤1：确认索引信息
SHOW INDEX FROM users WHERE Key_name = 'idx_status'\G

-- 步骤2：分析查询模式
pt-query-digest --review h=localhost,D=slow_query_log,t=global_query_review \
  --history h=localhost,D=slow_query_log,t=global_query_review_history \
  /var/log/mysql/slow.log

-- 发现所有查询都用idx_status_create_time而非idx_status

-- 步骤3：确认冗余
SELECT * FROM sys.schema_redundant_indexes
WHERE redundant_index_name = 'idx_status';

-- 输出：idx_status被idx_status_create_time覆盖

-- 步骤4：删除冗余索引
ALTER TABLE users DROP INDEX idx_status;

-- 步骤5：监控性能（至少7天）
-- 观察慢查询日志、QPS、响应时间
```

##### 3.6.2 索引碎片处理

**碎片产生原因：**

1. 删除、更新导致页稀疏
2. 页分裂导致空间浪费
3. 随机插入导致物理顺序与逻辑顺序不一致

**碎片检测：**

```sql
-- 1. 查看表碎片率
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  DATA_LENGTH,
  INDEX_LENGTH,
  DATA_FREE,
  ROUND(DATA_FREE / (DATA_LENGTH + INDEX_LENGTH) * 100, 2) AS frag_percent
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'db'
  AND DATA_FREE > 0;

-- 碎片率>30%需要处理

-- 2. 查看索引碎片
SELECT * FROM information_schema.innodb_tablespaces
WHERE SPACE_TYPE = 'Single' AND NAME LIKE 'db/%';

-- 3. 使用innodb_space工具
innodb_space -s ibdata1 -T db/users -p 5 page-dump
-- 查看页内记录数和空闲空间

-- 4. Performance Schema监控
SELECT * FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA = 'db' AND OBJECT_NAME = 'users';
```

**碎片整理方法：**

```sql
-- 方法1：OPTIMIZE TABLE（阻塞操作）
OPTIMIZE TABLE users;

-- 执行过程：
-- 1. 创建临时表
-- 2. 拷贝数据（按主键顺序）
-- 3. 重建索引
-- 4. 交换表名
-- 5. 删除旧表

-- 监控进度
SHOW PROCESSLIST;
-- 状态：Repair with keycache

-- 方法2：ALTER TABLE（在线DDL，推荐）
ALTER TABLE users ENGINE=InnoDB, ALGORITHM=INPLACE, LOCK=NONE;

-- 非阻塞，但仍有锁
-- 5.6+支持在线DDL

-- 方法3：mysqldump重建
mysqldump db users > users.sql
mysql db < users.sql

-- 方法4：pt-online-schema-change（无锁）
pt-online-schema-change \
  --alter "ENGINE=InnoDB" \
  D=db,t=users \
  --execute

-- 优点：无锁，业务无感知
-- 缺点：需要额外空间，触发器开销

-- 方法5：MySQL 8.0 instant DDL
ALTER TABLE users ENGINE=InnoDB, ALGORITHM=INSTANT;
-- 仅修改元数据，不实际重建
-- 但无法真正消除碎片
```

**在线DDL最佳实践：**

```sql
-- 1. 评估影响
EXPLAIN ALTER TABLE users ENGINE=InnoDB, ALGORITHM=INPLACE, LOCK=NONE;

-- 2. 监控DDL进度
SELECT * FROM information_schema.processlist 
WHERE info LIKE '%ALTER%';

-- 3. 查看DDL性能
SELECT * FROM performance_schema.events_stages_current;

-- 4. 控制DDL速率（避免IO打满）
SET GLOBAL innodb_max_ddl_threads = 4;  -- DDL线程数
SET GLOBAL innodb_ddl_log_crash_reset = OFF;  -- 崩溃恢复

-- 5. 大表DDL分批
ALTER TABLE big_table ENGINE=InnoDB, ALGORITHM=INPLACE, LOCK=NONE, 
  /* 5.7+ */ MAX_RETRIES=10, RETRY_INTERVAL=30;

-- 6. 取消DDL
KILL <ddl_thread_id>;  -- 只能取消未完成的DDL
```

**生产案例：100GB表碎片整理**

```bash
#!/bin/bash
# 碎片整理脚本

TABLE="db.large_table"
FRAG_THRESHOLD=30

# 检查碎片率
FRAG=$(mysql -e "SELECT ROUND(DATA_FREE / (DATA_LENGTH + INDEX_LENGTH) * 100, 2) FROM information_schema.TABLES WHERE TABLE_SCHEMA='db' AND TABLE_NAME='large_table'" -s)

if (( $(echo "$FRAG > $FRAG_THRESHOLD" | bc -l) )); then
  echo "碎片率 $FRAG%，需要整理"
  
  # 检查主从延迟
  SLAVE_LAG=$(mysql -e "SHOW SLAVE STATUS\G" | grep "Seconds_Behind_Master" | awk '{print $2}')
  
  if [ "$SLAVE_LAG" -lt 60 ]; then
    # 使用pt-online-schema-change
    pt-online-schema-change \
      --alter "ENGINE=InnoDB" \
      D=db,t=large_table \
      --max-load Threads_running=100 \
      --critical-load Threads_running=200 \
      --max-lag 60 \
      --execute
  else
    echo "从库延迟过高，跳过整理"
  fi
else
  echo "碎片率 $FRAG%，无需整理"
fi
```

##### 3.6.3 在线DDL

MySQL 5.6+支持在线DDL，减少锁表时间。

**在线DDL算法：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:开始DDL;

fork
  :ALGORITHM=COPY;
  note right
    传统方式：
    1. 创建临时表
    2. 拷贝数据
    3. 阻塞写入
    4. 交换表名
    5. 删除旧表
    
    全程锁表
  end note
fork again
  :ALGORITHM=INPLACE;
  note right
    原地修改：
    1. 标记元数据
    2. 记录DML到日志
    3. 重建索引（可选）
    4. 应用日志
    5. 提交
    
    部分锁表
  end note
fork again
  :ALGORITHM=INSTANT;
  note right
    瞬间修改（8.0+）：
    1. 仅修改数据字典
    2. 不重建表
    3. 无锁
    
    仅支持部分操作
  end note
end fork

:DDL完成;

stop

@enduml
```

**在线DDL支持矩阵：**

|操作|5.5|5.6|5.7|8.0 INSTANT|
| ------------| -----| -----| -----| -------------|
|添加索引|否|是|是|否|
|删除索引|否|是|是|是|
|添加列|否|是|是|是|
|删除列|否|是|是|否|
|修改列类型|否|否|否|否|
|重命名列|否|是|是|是|
|修改默认值|否|是|是|是|

**在线DDL语法：**

```sql
-- 1. 查看是否支持在线DDL
SELECT VERSION();
-- 5.6+: 大多数操作支持INPLACE

-- 2. 基本语法
ALTER TABLE users ADD COLUMN age INT, ALGORITHM=INPLACE, LOCK=NONE;

-- LOCK参数：
-- NONE:     允许读写（推荐）
-- SHARED:   允许读，阻塞写
-- EXCLUSIVE: 阻塞读写

-- ALGORITHM参数：
-- INPLACE:  原地修改（推荐）
-- COPY:     拷贝表（安全）
-- INSTANT:  瞬间修改（8.0+）

-- 3. 添加索引（无锁）
ALTER TABLE users ADD INDEX idx_status (status), ALGORITHM=INPLACE, LOCK=NONE;

-- 4. 删除索引（瞬间）
ALTER TABLE users DROP INDEX idx_status, ALGORITHM=INSTANT, LOCK=NONE;

-- 5. 添加列（无锁，但注意限制）
ALTER TABLE users ADD COLUMN nickname VARCHAR(50), ALGORITHM=INSTANT, LOCK=NONE;
-- 限制：只能添加在末尾，不能指定AFTER

-- 6. 修改列类型（需要COPY，锁表）
ALTER TABLE users MODIFY COLUMN nickname VARCHAR(100), ALGORITHM=COPY, LOCK=SHARED;

-- 7. 重命名列（无锁）
ALTER TABLE users RENAME COLUMN nickname TO display_name, ALGORITHM=INSTANT, LOCK=NONE;

-- 8. 修改默认值（瞬间）
ALTER TABLE users ALTER COLUMN age SET DEFAULT 18, ALGORITHM=INSTANT, LOCK=NONE;
```

**在线DDL监控：**

```sql
-- 1. 查看DDL进度（5.7+）
SELECT * FROM information_schema.PROCESSLIST 
WHERE INFO LIKE '%ALTER%';

-- 2. Performance Schema监控
SELECT * FROM performance_schema.events_stages_current
WHERE EVENT_NAME LIKE '%alter%';

-- 3. 查看DDL日志（8.0+）
SELECT * FROM mysql.innodb_ddl_log;

-- 4. 监控锁
SELECT * FROM performance_schema.metadata_locks
WHERE OBJECT_TYPE = 'TABLE' AND OBJECT_NAME = 'users';

-- 5. 查看DDL历史
SELECT * FROM mysql.innodb_table_stats 
WHERE table_name = 'users';
```

**在线DDL失败处理：**

```sql
-- 1. DDL失败回滚
ALTER TABLE users ADD COLUMN test INT, ALGORITHM=INPLACE, LOCK=NONE;
-- 若失败，InnoDB自动回滚

-- 2. 手动取消DDL
KILL <ddl_thread_id>;

-- 3. 处理残留临时文件
-- 检查：ls -lh /data/mysql/#sql-*.ibd
-- 删除：DROP TABLE `#mysql50##sql-123`;

-- 4. 崩溃恢复
-- 重启后自动清理
SELECT * FROM mysql.innodb_ddl_log;  -- 查看恢复日志
```

**生产案例：在线添加JSON列**

```sql
-- 场景：用户表需扩展字段
-- 表大小：50GB，QPS: 5000

-- 步骤1：检查支持情况
SELECT @@version;  -- 8.0.25

-- 步骤2：在低峰期执行
ALTER TABLE users 
ADD COLUMN extra_info JSON COMMENT '扩展信息',
ALGORITHM=INSTANT,  -- 8.0+瞬间完成
LOCK=NONE;

-- 步骤3：监控性能
-- 执行时间：<1秒（仅修改元数据）
-- QPS波动：<5%

-- 步骤4：后续添加虚拟列索引
ALTER TABLE users 
ADD COLUMN city VARCHAR(50) AS (JSON_UNQUOTE(JSON_EXTRACT(extra_info, '$.city'))) VIRTUAL,
ADD INDEX idx_city (city),
ALGORITHM=INPLACE,
LOCK=NONE;

-- 步骤5：验证数据
SELECT id, city FROM users LIMIT 10;
```

**在线DDL注意事项：**

1. **空间要求**：INPLACE需要额外空间（约等于索引大小）
2. **IO负载**：DDL期间IO高，避免业务高峰期
3. **复制延迟**：主从架构下，从库同样执行DDL
4. **外键检查**：innodb_fk_checks=0可加速（风险高）
5. **超时设置**：lock_wait_timeout应足够大
6. **测试环境验证**：必须先在测试环境执行

**生产禁忌：**

```sql
-- 严禁在线DDL操作（即使ALGORITHM=INPLACE）：
-- 1. 修改主键
ALTER TABLE users DROP PRIMARY KEY, ADD PRIMARY KEY (new_id);  -- 锁表！

-- 2. 修改列类型（增加长度除外）
ALTER TABLE users MODIFY COLUMN id INT;  -- 需要重建表

-- 3. 字符集转换
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4;  -- 大表锁死

-- 4. 添加全文/空间索引
ALTER TABLE articles ADD FULLTEXT INDEX ft_content (content);  -- 需要建倒排表
```

---

### 第4章 SQL执行计划分析

#### 4.1 EXPLAIN详解

##### 4.1.1 执行计划各列含义

**EXPLAIN输出格式：**

```sql
EXPLAIN {
    FORMAT=TRADITIONAL | JSON | TREE
}
```

**各列详细说明：**

|列名|含义|优化建议|
| ------| --------------------------| --------------------------------------|
|**id**|查询序列号，决定执行顺序|id越大越先执行，相同id从上到下|
|**select_type**|查询类型|关注DERIVED、SUBQUERY|
|**table**|表名/别名|关注派生表|
|**partitions**|分区信息|分区裁剪效果|
|**type**|访问类型|**核心指标**，至少达到range|
|**possible_keys**|可能使用的索引|若为空需建索引|
|**key**|实际使用的索引|NULL表示全表扫描|
|**key_len**|使用的索引长度|判断索引利用程度|
|**ref**|与索引比较的列|const、func、NULL|
|**rows**|估算扫描行数|与实际差距大说明统计信息不准|
|**filtered**|过滤后剩余行百分比|低于10%说明选择性差|
|**Extra**|附加信息|Using filesort/Using temporary需优化|

**id列详解：**

```sql
-- 简单查询
EXPLAIN SELECT * FROM users WHERE id = 1\G
-- id: 1
-- select_type: SIMPLE

-- 子查询
EXPLAIN SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)\G
-- id: 1（主查询）
-- id: 2（子查询）

-- UNION
EXPLAIN SELECT * FROM users WHERE status = 1
UNION
SELECT * FROM users WHERE age > 20\G
-- id: 1（第一个SELECT）
-- id: 2（第二个SELECT）
-- id: NULL（UNION RESULT）

-- 嵌套子查询
EXPLAIN SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
    AND EXISTS (
      SELECT 1 FROM items i WHERE i.order_id = o.id
    )
)\G
-- id: 1（最外层）
-- id: 2（EXISTS子查询）
-- id: 3（最内层EXISTS）
```

**select_type详解：**

```sql
-- SIMPLE：简单查询，无子查询/UNION
EXPLAIN SELECT * FROM users\G
-- select_type: SIMPLE

-- PRIMARY：主查询，最外层
EXPLAIN SELECT * FROM users WHERE id = (
  SELECT MAX(id) FROM orders
)\G
-- select_type: PRIMARY（外层）
-- select_type: SUBQUERY（子查询）

-- UNION：UNION中的第二个及以后
EXPLAIN SELECT * FROM users WHERE status = 1
UNION
SELECT * FROM users WHERE age > 20\G
-- select_type: PRIMARY
-- select_type: UNION

-- DEPENDENT SUBQUERY：相关子查询
EXPLAIN SELECT * FROM users u 
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)\G
-- select_type: PRIMARY
-- select_type: DEPENDENT SUBQUERY（依赖外层）

-- DERIVED：派生表
EXPLAIN SELECT * FROM (
  SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
) AS t WHERE cnt > 10\G
-- select_type: PRIMARY
-- select_type: DERIVED（FROM子句）

-- MATERIALIZED：物化子查询
EXPLAIN SELECT * FROM users u
WHERE u.id IN (SELECT user_id FROM orders WHERE amount > 100)\G
-- id: 1
-- select_type: PRIMARY
-- id: 2
-- select_type: SUBQUERY
-- table: <materialized>（5.6+自动物化）
```

**type列详解（性能从好到差）：**

```sql
-- system：系统表，一行数据
EXPLAIN SELECT * FROM mysql.user WHERE Host = 'localhost' AND User = 'root'\G
-- type: system

-- const：主键/唯一键等值查询
EXPLAIN SELECT * FROM users WHERE id = 1\G
-- type: const
-- rows: 1

-- eq_ref：JOIN中主键/唯一键匹配
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id
WHERE o.id = 1\G
-- type: const on orders
-- type: eq_ref on users

-- ref：非唯一索引等值查询
EXPLAIN SELECT * FROM users WHERE status = 1\G
-- type: ref
-- key: idx_status
-- rows: 1000

-- range：索引范围扫描
EXPLAIN SELECT * FROM users WHERE id BETWEEN 1000 AND 2000\G
-- type: range

-- index：全索引扫描
-- 比ALL稍好，因为索引通常比表小
EXPLAIN SELECT id FROM users;  -- 覆盖索引
-- type: index

-- ALL：全表扫描
EXPLAIN SELECT * FROM users WHERE email LIKE '%test%';
-- type: ALL
-- Extra: Using where
```

**key_len计算：**

```sql
-- key_len表示使用的索引字节数
-- 用于判断是否充分利用索引

-- 表结构
CREATE TABLE key_len_test (
  id BIGINT PRIMARY KEY,  -- 8字节
  name VARCHAR(50),       -- 可变长度
  status TINYINT,         -- 1字节
  create_time DATETIME,   -- 5字节（8.0+）/8字节（5.7）
  INDEX idx_name_status_ctime (name, status, create_time)
) ENGINE=InnoDB;

-- 查询1：使用全部索引
EXPLAIN SELECT * FROM key_len_test 
WHERE name = 'test' AND status = 1 AND create_time = NOW()\G
-- key_len: 8 + 1 + 5 = 14（假设name varchar(50)字符集utf8mb4，实际更长）

-- 精确计算
SELECT 
  CHARACTER_MAXIMUM_LENGTH,
  CHARACTER_OCTET_LENGTH,
  DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_NAME = 'key_len_test' AND COLUMN_NAME = 'name';
-- name: 50字符 * 4字节(utf8mb4) = 200字节

-- 实际key_len = 201 (长度前缀) + 1 + 5 = 207

-- 部分使用
EXPLAIN SELECT * FROM key_len_test WHERE name = 'test'\G
-- key_len: 201  -- 仅用name

EXPLAIN SELECT * FROM key_len_test WHERE name = 'test' AND status = 1\G
-- key_len: 202  -- 用name+status

-- key_len计算公式：
-- 数值类型：tinyint=1, smallint=2, int=4, bigint=8
-- 字符串：字符长度 * 字符集字节数 + 1（长度前缀）
-- datetime：5（5.6+）/8（5.5）
-- NULL：+1（NULL标志位）

-- 重要：key_len越短越好
-- 说明索引利用率高，范围过滤精准
```

**rows与filtered：**

```sql
-- rows是估算值，基于统计信息
-- 可能不准确

-- 对比估算与实际
EXPLAIN SELECT * FROM users WHERE status = 1\G
-- rows: 1000

-- 实际
SELECT COUNT(*) FROM users WHERE status = 1;
-- 5000

-- 差异5倍，说明统计信息过时

-- 更新统计信息
ANALYZE TABLE users;

-- filtered表示WHERE过滤后剩余行百分比
-- filtered = 100表示索引未过滤（选择性差）
-- filtered < 10表示过滤效果好

-- 低filtered示例
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com'\G
-- type: const
-- rows: 1
-- filtered: 100.00

-- 高filtered示例（需要优化）
EXPLAIN SELECT * FROM users WHERE status = 1\G
-- type: ref
-- rows: 500000
-- filtered: 100.00  -- status选择性差，索引效果不佳

-- 优化：扩展索引
ALTER TABLE users ADD INDEX idx_status_created (status, created_at);
-- status过滤后，按created_at排序，filtered会降低
```

**Extra列详解：**

```sql
-- Using index：覆盖索引
EXPLAIN SELECT id, name FROM users WHERE name = 'test'\G
-- Extra: Using index

-- Using where：Server层过滤
EXPLAIN SELECT * FROM users WHERE name = 'test' AND status = 1\G
-- Extra: Using where
-- 可能索引未完全过滤，需Server层检查status

-- Using temporary：使用临时表（需优化）
EXPLAIN SELECT DISTINCT department_id FROM employees\G
-- Extra: Using temporary

EXPLAIN SELECT * FROM orders GROUP BY user_id\G
-- Extra: Using temporary

-- Using filesort：文件排序（需优化）
EXPLAIN SELECT * FROM users ORDER BY name\G
-- Extra: Using filesort

-- Using index condition：索引下推（ICP）
EXPLAIN SELECT * FROM users WHERE name = 'test' AND age > 20\G
-- Extra: Using index condition

-- Using MRR：多范围读优化
EXPLAIN SELECT * FROM users WHERE name > 'A' AND name < 'Z'\G
-- Extra: Using MRR

-- Using join buffer (Block Nested Loop)：JOIN无索引
EXPLAIN SELECT * FROM users u 
LEFT JOIN orders o ON u.nickname = o.remark\G
-- Extra: Using join buffer (Block Nested Loop)

-- Impossible WHERE：不可能条件
EXPLAIN SELECT * FROM users WHERE 1 = 2\G
-- Extra: Impossible WHERE

-- Select tables optimized away：优化器优化
EXPLAIN SELECT MAX(id) FROM users\G
-- Extra: Select tables optimized away
```

##### 4.1.2 JSON格式执行计划

MySQL 5.6+支持JSON格式，信息更丰富。

**JSON格式示例：**

```sql
EXPLAIN FORMAT=JSON
SELECT * FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 1 AND o.amount > 100\G

{
  "query_block": {
    "select_id": 1,
    "cost_info": {
      "query_cost": "1050.50"
    },
    "nested_loop": [
      {
        "table": {
          "table_name": "u",
          "access_type": "ref",
          "possible_keys": ["idx_status"],
          "key": "idx_status",
          "used_key_parts": ["status"],
          "key_length": "1",
          "ref": ["const"],
          "rows_examined_per_scan": 1000,
          "rows_produced_per_join": 1000,
          "filtered": "100.00",
          "cost_info": {
            "read_cost": "50.00",
            "eval_cost": "100.00",
            "prefix_cost": "150.00",
            "data_read_per_join": "500K"
          },
          "used_columns": ["id", "name", "status"]
        }
      },
      {
        "table": {
          "table_name": "o",
          "access_type": "ref",
          "possible_keys": ["idx_user_id", "idx_amount"],
          "key": "idx_user_id",
          "used_key_parts": ["user_id"],
          "key_length": "8",
          "ref": ["u.id"],
          "rows_examined_per_scan": 5,
          "rows_produced_per_join": 5000,
          "filtered": "20.00",
          "cost_info": {
            "read_cost": "5000.00",
            "eval_cost": "100.00",
            "prefix_cost": "1050.50",
            "data_read_per_join": "2M"
          },
          "condition": "(`db`.`o`.`amount` > 100)",
          "used_columns": ["id", "user_id", "amount"]
        }
      }
    ]
  }
}

-- 关键字段：
-- query_cost: 总成本
-- read_cost: IO成本
-- eval_cost: CPU成本
-- rows_examined_per_scan: 扫描行数
-- filtered: 过滤比例
```

**TREE格式（MySQL 8.0）：**

```sql
EXPLAIN FORMAT=TREE
SELECT * FROM users WHERE status = 1 OR age > 20\G

-- Filter: ((users.status = 1) or (users.age > 20))
--   Table scan on users  (cost=1000.00 rows=5000)
-- 或

-- Filter: ((users.status = 1) or (users.age > 20))
--   Index range scan on users using idx_status  (cost=50.00 rows=1000)

-- 更直观展示执行流程
```

**可视化工具：pt-visual-explain**

```bash
# 安装
sudo apt-get install percona-toolkit

# 使用
mysql -e "EXPLAIN SELECT * FROM users" | pt-visual-explain

# 输出：
# JOIN
# +- Filter with WHERE
#    +- Bookmark lookup
#       +- Table
#       |  table          users
#       +- Unique index lookup
#          key            PRIMARY
#          possible_keys  PRIMARY
#          key_len        8
#          ref            const
#          rows           1
```

##### 4.1.3 可视化工具

**pt-visual-explain深度解析：**

```bash
# 示例SQL
EXPLAIN 
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 1
GROUP BY u.id
HAVING order_count > 5
ORDER BY order_count DESC
LIMIT 10\G

# 使用pt-visual-explain
mysql -e "EXPLAIN ..." | pt-visual-explain --dot > query.dot

# 生成Graphviz图表
dot -Tpng query.dot -o query_plan.png

# 输出结构：
# JOIN
# +- GROUP BY and filesort
#    +- Filter with HAVING
#       +- Bookmark lookup
#          +- Table
#          |  table          u
#          +- Index range scan
#             key            idx_status
#             possible_keys  idx_status
#             key_len        1
#             rows           1000
#          +- Table
#          |  table          o
#          +- Index lookup
#             key            idx_user_id
#             possible_keys  idx_user_id
#             key_len        8
#             ref            u.id
```

**MySQL Workbench可视化：**

```sql
-- MySQL Workbench提供图形化执行计划
-- 1. 执行查询
-- 2. 点击"Execution Plan"标签
-- 3. 查看彩色图表
-- 颜色意义：
-- 绿色：高效（const, eq_ref）
-- 黄色：一般（ref, range）
-- 橙色：低效（index, ALL）
-- 红色：警告（filesort, temporary）
```

#### **4.2 执行计划案例分析**

##### 4.2.1 JOIN查询优化

**JOIN算法详解：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:Nested Loop Join (NLJ);
note right
  嵌套循环：
  for r1 in t1:
    for r2 in t2 where t2.key = r1.key:
      output (r1, r2)
End note

:Block Nested Loop Join (BNL);
note right
  块嵌套循环：
  for block in t1:
    load block into join_buffer
    for r2 in t2:
      if t2.key in block:
        output
End note

:Batched Key Access (BKA);
note right
  批量键访问：
  缓存外层表键值
  批量查询内层表索引
  减少随机IO
End note

:Hash Join (8.0+);
note right
  哈希连接：
  构建哈希表（小表）
  扫描大表探测
End note

@enduml
```

**JOIN优化案例：**

```sql
-- 表结构
CREATE TABLE employees (
  emp_id BIGINT PRIMARY KEY,
  dept_id BIGINT,
  name VARCHAR(50),
  INDEX idx_dept (dept_id)
) ENGINE=InnoDB;

CREATE TABLE departments (
  dept_id BIGINT PRIMARY KEY,
  dept_name VARCHAR(50)
) ENGINE=InnoDB;

-- 创建测试数据
INSERT INTO departments VALUES (1, 'Tech'), (2, 'Sales');
INSERT INTO employees 
SELECT i, i%2+1, CONCAT('Emp', i) FROM numbers WHERE i <= 100000;

-- 案例1：小表驱动大表
-- EXPLAIN
EXPLAIN SELECT e.*, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE e.emp_id > 50000\G

-- 输出：
-- id: 1
-- table: d
-- type: ALL
-- rows: 2
-- table: e
-- type: ref
-- key: idx_dept
-- rows: 50000
-- Extra: Using where

-- 分析：优化器选择departments为驱动表（rows=2）

-- 案例2：STRAIGHT_JOIN强制驱动顺序
EXPLAIN SELECT STRAIGHT_JOIN e.*, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE e.emp_id > 50000\G

-- 输出：
-- table: e
-- type: range
-- key: PRIMARY
-- rows: 50000
-- table: d
-- type: eq_ref
-- key: PRIMARY
-- rows: 1

-- 性能对比：
-- 优化器选择：0.3秒
-- STRAIGHT_JOIN：0.1秒（驱动顺序更优）

-- JOIN Buffer优化
-- 无索引时启用BNL
SHOW VARIABLES LIKE 'join_buffer_size';  -- 默认256KB
SET SESSION join_buffer_size = 8M;

-- 启用BKA
SET optimizer_switch = 'batched_key_access=on';
```

**案例3：三表JOIN优化**

```sql
-- 表结构
CREATE TABLE A (id INT PRIMARY KEY, a_val INT, INDEX idx_a (a_val));
CREATE TABLE B (id INT PRIMARY KEY, a_id INT, b_val INT, INDEX idx_a (a_id));
CREATE TABLE C (id INT PRIMARY KEY, b_id INT, c_val INT, INDEX idx_b (b_id));

-- 查询
EXPLAIN SELECT * FROM A
JOIN B ON A.id = B.a_id
JOIN C ON B.id = C.b_id
WHERE A.a_val = 100\G

-- 优化器选择：
-- A: ref (idx_a)
-- B: ref (idx_a)
-- C: ref (idx_b)

-- 性能问题：C表可能查询多次

-- 优化：添加复合索引
ALTER TABLE C ADD INDEX idx_b_id (b_id, id);

-- 或使用Hash Join（8.0+）
SET optimizer_switch = 'hash_join=on';
EXPLAIN FORMAT=TREE SELECT * FROM A
JOIN B ON A.id = B.a_id
JOIN C ON B.id = C.b_id
WHERE A.a_val = 100\G

-- 输出：
-- Inner hash join (B.id = C.b_id)
--   Table scan on C
--   Hash
--     Table scan on B
--     Filter: (B.a_id = A.id)
```

##### **4.2.2 子查询优化**

**子查询类型：**

```sql
-- 1. 标量子查询（返回单行单列）
SELECT name, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;

-- 2. 行子查询（返回单行多列）
SELECT * FROM users WHERE (name, age) = (SELECT name, age FROM vip_users WHERE id = 1);

-- 3. 列子查询（返回多行单列）
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

-- 4. 表子查询（返回多行多列）
SELECT * FROM (SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id) AS t WHERE cnt > 10;
```

**子查询优化策略：**

```sql
-- 反例：相关子查询（性能极差）
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- EXPLAIN输出：
-- DEPENDENT SUBQUERY
-- rows: 1000000
-- 执行次数 = users表行数

-- 优化1：改写JOIN
SELECT DISTINCT u.*
FROM users u
JOIN orders o ON u.id = o.user_id;

-- 性能对比：
-- 原查询：120秒
-- 改写后：0.5秒

-- 优化2：反连接（Anti-join）
-- 查询无订单用户
SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- 改写LEFT JOIN
SELECT u.* FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;

-- 优化3：物化子查询
-- 5.6+自动物化
SELECT * FROM users u
WHERE u.id IN (SELECT user_id FROM orders WHERE amount > 100);

-- 可强制物化
SELECT * FROM users u
WHERE u.id IN (
  SELECT user_id FROM (SELECT user_id FROM orders WHERE amount > 100) AS tmp
);

-- 优化4：派生表合并
-- 5.7+优化器自动合并
SELECT * FROM (
  SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
) AS t WHERE cnt > 10;

-- 等价于
SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id HAVING cnt > 10;
```

**IN vs EXISTS性能对比：**

```sql
-- 场景：orders表1亿，users表1000万

-- IN子查询
EXPLAIN SELECT * FROM users WHERE id IN (
  SELECT user_id FROM orders WHERE create_time > '2024-01-01'
)\G
-- MySQL 5.5：DEPENDENT SUBQUERY，性能极差
-- MySQL 5.6+：MATERIALIZED，物化后转JOIN

-- EXISTS
EXPLAIN SELECT * FROM users u WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.create_time > '2024-01-01'
)\G
-- 仍然是DEPENDENT SUBQUERY

-- 结论：
-- IN + 物化 > EXISTS
-- 大数据量下，改写为JOIN最优

-- JOIN写法
EXPLAIN SELECT u.* FROM users u
JOIN (
  SELECT DISTINCT user_id FROM orders WHERE create_time > '2024-01-01'
) o ON u.id = o.user_id\G
-- type: eq_ref，性能最优
```

##### **4.2.3 UNION vs UNION ALL**

**UNION去重机制：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:UNION;
note right
  1. 创建临时表
  2. 插入第一个SELECT结果
  3. 插入第二个SELECT结果
  4. 去重（唯一性约束）
  5. 返回结果
  6. 删除临时表
end note

:UNION ALL;
note right
  1. 直接合并结果集
  2. 返回结果
end note

@enduml
```

**性能对比：**

```sql
-- 测试表
CREATE TABLE t1 (id INT, name VARCHAR(50));
CREATE TABLE t2 (id INT, name VARCHAR(50));
INSERT INTO t1 SELECT i, CONCAT('t1_', i) FROM numbers WHERE i <= 10000;
INSERT INTO t2 SELECT i, CONCAT('t2_', i) FROM numbers WHERE i <= 10000;

-- 测试1：UNION（去重）
EXPLAIN SELECT * FROM t1 UNION SELECT * FROM t2\G
-- Extra: Using temporary

-- 执行时间
SELECT * FROM t1 UNION SELECT * FROM t2;
-- 1.2秒

-- 测试2：UNION ALL（不去重）
EXPLAIN SELECT * FROM t1 UNION ALL SELECT * FROM t2\G
-- Extra: 无（无临时表）

-- 执行时间
SELECT * FROM t1 UNION ALL SELECT * FROM t2;
-- 0.1秒

-- 性能提升：12倍
```

**业务场景应用：**

```sql
-- 场景：合并有效和高级用户
-- 原：UNION去重
SELECT * FROM users WHERE status = 1
UNION
SELECT * FROM users WHERE level > 10;

-- 优化：UNION ALL + 条件
SELECT * FROM users WHERE status = 1 AND level <= 10
UNION ALL
SELECT * FROM users WHERE level > 10;

-- 前提：确保两组数据无重叠
-- 若status=1和level>10可能重叠，需额外条件
```

#### 4.3 优化器跟踪

##### **4.3.1 optimizer_trace**

optimizer_trace是分析优化器决策的神器。

**使用步骤：**

```sql
-- 1. 开启跟踪
SET optimizer_trace = 'enabled=on';
SET optimizer_trace_features = 'greedy_search=on,range_optimizer=on';
SET optimizer_trace_max_mem_size = 1048576;  -- 1MB

-- 2. 执行查询
SELECT * FROM users WHERE status = 1 AND age > 20 ORDER BY id LIMIT 10;

-- 3. 查看跟踪结果
SELECT * FROM information_schema.OPTIMIZER_TRACE\G
```

**跟踪结果分析：**

```json
{
  "steps": [
    {
      "join_preparation": {
        "select#": 1,
        "steps": [
          {
            "expanded_query": "/* select#1 */ select `users`.`id` AS `id`,`users`.`name` AS `name` from `users` where ((`users`.`status` = 1) and (`users`.`age` > 20)) order by `users`.`id` limit 10"
          }
        ]
      }
    },
    {
      "join_optimization": {
        "select#": 1,
        "steps": [
          {
            "condition_processing": {
              "condition": "WHERE",
              "original_condition": "((`users`.`status` = 1) and (`users`.`age` > 20))",
              "steps": [
                {
                  "transformation": "equality_propagation",
                  "resulting_condition": "((`users`.`status` = 1) and (`users`.`age` > 20))"
                },
                {
                  "transformation": "constant_propagation",
                  "resulting_condition": "((`users`.`status` = 1) and (`users`.`age` > 20))"
                },
                {
                  "transformation": "trivial_condition_removal",
                  "resulting_condition": "((`users`.`status` = 1) and (`users`.`age` > 20))"
                }
              ]
            }
          },
          {
            "substitute_generated_columns": {}
          },
          {
            "table_dependencies": [
              {
                "table": "`users`",
                "row_may_be_null": false,
                "map_bit": 0,
                "depends_on_map_bits": []
              }
            ]
          },
          {
            "ref_optimizer_key_uses": []
          },
          {
            "rows_estimation": [
              {
                "table": "`users`",
                "range_analysis": {
                  "table_scan": {
                    "rows": 1000000,
                    "cost": 200000
                  },
                  "potential_range_indexes": [
                    {
                      "index": "PRIMARY",
                      "usable": false,
                      "cause": "not_applicable"
                    },
                    {
                      "index": "idx_status",
                      "usable": true,
                      "key_parts": ["status", "id"]
                    },
                    {
                      "index": "idx_age",
                      "usable": true,
                      "key_parts": ["age", "id"]
                    },
                    {
                      "index": "idx_status_age",
                      "usable": true,
                      "key_parts": ["status", "age", "id"]
                    }
                  ],
                  "setup_range_conditions": [],
                  "group_index_range": {
                    "chosen": false,
                    "cause": "not_group_by_or_distinct"
                  },
                  "analyzing_range_alternatives": {
                    "range_scan_alternatives": [
                      {
                        "index": "idx_status",
                        "ranges": ["1 <= status <= 1"],
                        "index_dives_for_eq_ranges": true,
                        "rowid_ordered": true,
                        "using_mrr": false,
                        "index_only": false,
                        "rows": 100000,
                        "cost": 40001,
                        "chosen": false,
                        "cause": "cost"
                      },
                      {
                        "index": "idx_age",
                        "ranges": ["20 < age"],
                        "index_dives_for_eq_ranges": true,
                        "rowid_ordered": true,
                        "using_mrr": false,
                        "index_only": false,
                        "rows": 500000,
                        "cost": 200001,
                        "chosen": false,
                        "cause": "cost"
                      },
                      {
                        "index": "idx_status_age",
                        "ranges": ["1 <= status <= 1 AND 20 < age"],
                        "index_dives_for_eq_ranges": true,
                        "rowid_ordered": true,
                        "using_mrr": false,
                        "index_only": false,
                        "rows": 50000,
                        "cost": 20001,
                        "chosen": true
                      }
                    ],
                    "analyzing_roworder_intersect": {
                      "usable": false,
                      "cause": "too_few_roworder_scans"
                    }
                  }
                }
              }
            ]
          },
          {
            "considered_execution_plans": [
              {
                "plan_prefix": [],
                "table": "`users`",
                "best_access_path": {
                  "considered_access_paths": [
                    {
                      "access_type": "scan",
                      "rows": 1e6,
                      "cost": 200000,
                      "chosen": false,
                      "cause": "cost_over_heuristic"
                    },
                    {
                      "access_type": "range",
                      "rows": 50000,
                      "cost": 20001,
                      "chosen": true
                    }
                  ]
                },
                "condition_filtering_pct": 100,
                "rows_for_plan": 50000,
                "cost_for_plan": 20001,
                "chosen": true
              }
            ]
          },
          {
            "attaching_conditions_to_tables": {
              "original_condition": "((`users`.`status` = 1) and (`users`.`age` > 20))",
              "attached_conditions_computation": [],
              "attached_conditions_summary": [
                {
                  "table": "`users`",
                  "attached": "((`users`.`status` = 1) and (`users`.`age` > 20))"
                }
              ]
            }
          },
          {
            "clause_processing": {
              "clause": "ORDER BY",
              "original_clause": "`users`.`id`",
              "items": [
                {
                  "item": "`users`.`id`"
                }
              ],
              "resulting_clause_is_simple": true,
              "resulting_clause": "`users`.`id`"
            }
          },
          {
            "clause_processing": {
              "clause": "GROUP BY",
              "original_clause": "",
              "items": [],
              "resulting_clause_is_simple": true,
              "resulting_clause": ""
            }
          },
          {
            "reconsidering_access_paths_for_index_ordering": {
              "clause": "ORDER BY",
              "steps": [],
              "index_order_summary": {
                "table": "`users`",
                "index_provides_order": true,
                "order_direction": "asc",
                "index": "idx_status_age",
                "plan_changed": false
              }
            }
          },
          {
            "refine_plan": [
              {
                "table": "`users`",
                "pushed_index_condition": "((`users`.`status` = 1) and (`users`.`age` > 20))",
                "table_condition_attached": null,
                "access_type": "range"
              }
            ]
          }
        ]
      }
    },
    {
      "join_execution": {
        "select#": 1,
        "steps": [
          {
            "filesort_information": [
              {
                "direction": "asc",
                "table": "`users`",
                "field": "id"
              }
            ],
            "filesort_priority_queue_optimization": {
              "limit": 10,
              "rows_estimate": 1057,
              "row_size": 8,
              "memory_available": 262144,
              "chosen": true
            },
            "filesort_execution": [
              ""
            ],
            "filesort_summary": {
              "rows": 11,
              "examined_rows": 50000,
              "number_of_tmp_files": 0,
              "sort_buffer_size": 264,
              "sort_mode": "<sort_key, packed_additional_fields>"
            }
          }
        ]
      }
    }
  ]
}
```

**跟踪结果解读：**

- **join_preparation**: SQL解析和改写
- **condition_processing**: 条件优化（等价传递）
- **rows_estimation**: 行数估算（核心）
- **considered_execution_plans**: 执行计划选择
- **attaching_conditions_to_tables**: 条件下推
- **clause_processing**: ORDER BY/GROUP BY处理
- **join_execution**: 执行阶段（排序细节）

**关键决策点：**

- ​`chosen: true`：选中的路径
- ​`cause: "cost"`：因成本更低被选中
- ​`rowid_ordered: true`：结果有序，可用于排序

##### **4.3.2 优化器成本模型**

MySQL 5.7+引入可插拔成本模型。

**成本表结构：**

```sql
-- Server层成本
SELECT * FROM mysql.server_cost;
+------------------------------+------------+---------------------+---------+
| cost_name                    | cost_value | last_update         | comment |
+------------------------------+------------+---------------------+---------+
| disk_temptable_create_cost   |       NULL | 2024-01-01 00:00:00 |         |
| disk_temptable_row_cost      |       NULL | 2024-01-01 00:00:00 |         |
| key_compare_cost             |       NULL | 2024-01-01 00:00:00 |         |
| memory_temptable_create_cost |       NULL | 2024-01-01 00:00:00 |         |
| memory_temptable_row_cost    |       NULL | 2024-01-01 00:00:00 |         |
| row_evaluate_cost            |       NULL | 2024-01-01 00:00:00 |         |
+------------------------------+------------+---------------------+---------+

-- Engine层成本
SELECT * FROM mysql.engine_cost;
+-----------------+--------+--------------+------------+
| engine_name     | device | cost_name    | cost_value |
+-----------------+--------+--------------+------------+
| default         | 0      | io_block_read_cost |       NULL |
| default         | 0      | memory_block_read_cost |     NULL |
+-----------------+--------+--------------+------------+

-- cost_value为NULL时使用默认值：
-- disk_temptable_create_cost = 20
-- disk_temptable_row_cost = 0.5
-- memory_temptable_create_cost = 1
-- memory_temptable_row_cost = 0.1
-- row_evaluate_cost = 0.1
-- io_block_read_cost = 1
-- memory_block_read_cost = 0.25
```

**成本定制案例：**

```sql
-- 场景：NVMe SSD环境，IO成本远低于CPU

-- 1. 降低IO成本
UPDATE mysql.engine_cost
SET cost_value = 0.2  -- 从1.0降到0.2
WHERE cost_name = 'io_block_read_cost';

FLUSH OPTIMIZER_COSTS;

-- 2. 提高CPU成本
UPDATE mysql.server_cost
SET cost_value = 0.2  -- 从0.1升到0.2
WHERE cost_name = 'row_evaluate_cost';

FLUSH OPTIMIZER_COSTS;

-- 3. 查看影响
EXPLAIN FORMAT=JSON SELECT * FROM large_table\G
-- query_cost会从2000降到1500

-- 4. 特定设备配置
-- 区分SSD和HDD
INSERT INTO mysql.engine_cost VALUES ('InnoDB', 1, 'io_block_read_cost', 0.2);
-- device=1表示SSD
```

**成本模型调试：**

```sql
-- 1. 开启成本日志
SET optimizer_trace = 'enabled=on';
SET optimizer_trace_features = 'cost=on';

-- 2. 执行查询并查看
SELECT * FROM information_schema.OPTIMIZER_TRACE\G

-- 3. 分析成本计算
-- 关注cost_info中的read_cost、eval_cost
-- 对比不同索引的成本差异

-- 4. 重置成本
UPDATE mysql.server_cost SET cost_value = NULL;
UPDATE mysql.engine_cost SET cost_value = NULL;
FLUSH OPTIMIZER_COSTS;
```

#### 4.4 实战：优化一个慢查询

**原始查询：**

```sql
-- 业务场景：查询近7天未登录的用户
-- 表结构：users(1000万), login_log(1亿)
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100),
  status TINYINT
) ENGINE=InnoDB;

CREATE TABLE login_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  login_time DATETIME,
  INDEX idx_user_time (user_id, login_time),
  INDEX idx_time (login_time)
) ENGINE=InnoDB;

-- 原始查询
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN login_log ll ON u.id = ll.user_id
WHERE ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND ll.user_id IS NULL;

-- 含义：找出log.login_time在7天内，但log.user_id为NULL的记录
-- 问题：LEFT JOIN + IS NULL反语义
```

**步骤1：EXPLAIN分析**

```sql
EXPLAIN SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN login_log ll ON u.id = ll.user_id
WHERE ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND ll.user_id IS NULL\G

-- 输出：
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY
        table: u
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 10000000
     filtered: 100.00
        Extra: NULL
*************************** 2. row ***************************
           id: 1
  select_type: PRIMARY
        table: ll
   partitions: NULL
         type: ref
possible_keys: idx_user_time,idx_time
          key: idx_user_time
      key_len: 9
          ref: db.u.id
         rows: 1
     filtered: 100.00
        Extra: Using where; Not exists

-- 问题分析：
-- 1. users表全表扫描（type: ALL, rows: 1000万）
-- 2. 对每行users，查询login_log（DEPENDENT）
-- 3. 总复杂度：O(n*m)
```

**步骤2：理解查询意图**

```sql
-- 原始查询意图：找出"7天内未登录"的用户
-- 但LEFT JOIN + IS NULL逻辑错误
-- 实际效果：几乎返回空集

-- 重写为正确语义
SELECT u.id, u.name, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM login_log ll
  WHERE ll.user_id = u.id
    AND ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
);
-- 含义：用户不存在于"最近7天登录记录"中

-- 或者
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN login_log ll 
  ON u.id = ll.user_id 
  AND ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE ll.id IS NULL;
-- 含义：LEFT JOIN后，无匹配login_log的用户
```

**步骤3：优化索引**

```sql
-- login_log已存在idx_user_time
-- 但查询条件login_time > ...可能不够选择性

-- 分析数据分布
SELECT 
  COUNT(*) AS total_log,
  COUNT(CASE WHEN login_time > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS recent_log
FROM login_log;

-- 结果：recent_log / total_log ≈ 5%

-- 优化：idx_user_time足够

-- 用户表需要idx_status（假设有过滤条件）
ALTER TABLE users ADD INDEX idx_status (status);
```

**步骤4：执行计划对比**

```sql
-- 优化后查询
EXPLAIN SELECT u.id, u.name, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM login_log ll
  WHERE ll.user_id = u.id
    AND ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
)\G

-- 输出：
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY
        table: u
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 10000000
     filtered: 100.00
        Extra: Using where
*************************** 2. row ***************************
           id: 2
  select_type: DEPENDENT SUBQUERY
        table: ll
   partitions: NULL
         type: ref
possible_keys: idx_user_time
          key: idx_user_time
      key_len: 9
          ref: db.u.id
         rows: 1
     filtered: 33.33
        Extra: Using where; Using index

-- 仍是DEPENDENT SUBQUERY，性能问题未解决

-- 改写为JOIN
EXPLAIN SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN login_log ll 
  ON u.id = ll.user_id 
  AND ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE ll.id IS NULL\G

-- 输出：
-- table: u
-- type: ALL
-- rows: 10000000
-- table: ll
-- type: ref
-- rows: 1
-- Extra: Using where; Not exists

-- 仍不理想，users全表扫描
```

**步骤5：进一步优化**

```sql
-- 问题：必须扫描所有users，即使大部分有登录记录

-- 优化思路：先找出"7天内登录过的用户"，再反查

-- 步骤5.1：找出活跃用户
CREATE TEMPORARY TABLE active_users AS
SELECT DISTINCT user_id FROM login_log
WHERE login_time > DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 步骤5.2：反查未登录用户
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN active_users au ON u.id = au.user_id
WHERE au.user_id IS NULL;

-- EXPLAIN
-- table: u
-- type: ALL
-- rows: 10000000
-- table: au
-- type: ref
-- rows: 1

-- 性能提升：
-- 原查询：每次子查询扫描login_log（1亿）
-- 新查询：单次扫描login_log，建立临时表
-- 执行时间：从120秒降至5秒

-- 优化5.3：添加索引避免临时表
-- 若active_users结果集小，可用NOT IN
SELECT u.id, u.name, u.email
FROM users u
WHERE u.id NOT IN (
  SELECT user_id FROM login_log
  WHERE login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
);

-- MySQL 5.6+自动物化子查询
```

**步骤6：最终优化方案**

```sql
-- 方案A：JOIN + 聚合（推荐）
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN login_log ll 
  ON u.id = ll.user_id 
  AND ll.login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE ll.id IS NULL
AND u.status = 1  -- 假设只查有效用户
AND u.id BETWEEN 100000 AND 999999;  -- 分批查询

-- 方案B：使用窗口函数（MySQL 8.0+）
WITH user_last_login AS (
  SELECT 
    user_id,
    MAX(login_time) AS last_login
  FROM login_log
  GROUP BY user_id
)
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN user_last_login ull ON u.id = ull.user_id
WHERE (ull.last_login IS NULL OR ull.last_login <= DATE_SUB(NOW(), INTERVAL 7 DAY));

-- 方案C：物化表（定期更新）
-- 创建每日活跃表
CREATE TABLE daily_active_users AS
SELECT DISTINCT user_id, DATE(login_time) AS login_date
FROM login_log;

-- 添加索引
ALTER TABLE daily_active_users ADD INDEX idx_user_date (user_id, login_date);

-- 查询
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN daily_active_users dau 
  ON u.id = dau.user_id 
  AND dau.login_date > CURDATE() - INTERVAL 7 DAY
WHERE dau.user_id IS NULL;
```

**步骤7：性能对比**

|方案|执行时间|消耗资源|适用场景|
| ------------| ----------| ----------| ----------|
|原始查询|120秒|CPU 100%|错误逻辑|
|NOT EXISTS|90秒|CPU 80%|小数据集|
|LEFT JOIN|80秒|CPU 70%|中数据集|
|临时表|5秒|内存2GB|大数据集|
|物化表|0.1秒|磁盘空间|定期查询|

**最终选择：临时表方案（5.7+自动物化）**

```sql
-- 最终SQL
SELECT u.id, u.name, u.email
FROM users u
WHERE u.id NOT IN (
  SELECT user_id FROM login_log
  WHERE login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
)
AND u.status = 1;

-- 执行计划
-- table: users
-- type: ref
-- key: idx_status
-- rows: 100000

-- table: login_log
-- type: range
-- key: idx_time
-- rows: 500000

-- Extra: Using where; Not exists; Materialize

-- 执行时间：2秒
```

**生产上线步骤：**

1. **测试环境验证**：确认功能正确性
2. **性能基准测试**：对比优化前后QPS和RT
3. **慢查询监控**：pt-query-digest观察日志
4. **逐步灰度**：先10%流量，观察24小时
5. **全量上线**：确认无慢查询后全量
6. **监控告警**：设置慢查询阈值告警

---

## 第二部分：查询优化篇 - 让SQL飞起来

### 第5章 SQL语句优化方法论

#### 5.1 慢查询分析流程

##### 5.1.1 慢查询日志配置

**慢查询日志配置模板：**

```ini
# my.cnf配置模板（生产环境）

[mysqld]
# 慢查询日志基础配置
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5  # 0.5秒，可根据业务调整
log_queries_not_using_indexes = OFF  # OFF避免日志爆炸
log_slow_admin_statements = ON  # 记录ALTER等管理语句
log_slow_slave_statements = ON  # 从库记录
log_slow_extra = ON  # 8.0+，记录更多信息
min_examined_row_limit = 1000  # 扫描行数<1000不记录

# 日志轮转
log_slow_verbosity = full
log_slow_rate_type = session
log_slow_rate_limit = 1

# 性能模式（配合慢查询）
performance_schema = ON
performance-schema-instrument = 'statement/%=ON'
performance-schema-instrument = 'stage/%=ON'
```

**动态调整慢查询阈值：**

```sql
-- 高负载时临时降低阈值
SET GLOBAL long_query_time = 0.1;

-- 低峰期提高阈值
SET GLOBAL long_query_time = 2.0;

-- 仅对当前会话生效
SET SESSION long_query_time = 0.1;

-- 查看当前设置
SELECT @@global.long_query_time, @@session.long_query_time;
```

**慢查询日志示例：**

```sql
# Time: 2024-01-23T10:00:00.123456Z
# User@Host: appuser[appuser] @ web-server [10.0.0.5]
# Thread_id: 12345  Schema: ecommerce  QC_hit: No
# Query_time: 1.234567  Lock_time: 0.000123  Rows_sent: 100  Rows_examined: 1000000
# Rows_affected: 0  Bytes_sent: 1234
# Tmp_tables: 1  Tmp_disk_tables: 0  Tmp_table_sizes: 1024000
# Full_scan: Yes  Full_join: No  Tmp_table: Yes  Tmp_table_on_disk: No
# Filesort: Yes  Filesort_on_disk: No  Merge_passes: 0
# InnoDB_IO_r_ops: 1234  InnoDB_IO_r_bytes: 20342304  InnoDB_IO_r_wait: 0.123000
# InnoDB_rec_lock_wait: 0.000000  InnoDB_queue_wait: 0.000000
# InnoDB_pages_distinct: 1234
SET timestamp=1706016000;
SELECT * FROM orders WHERE create_time BETWEEN '2024-01-01' AND '2024-01-31';
```

**日志字段说明：**

|字段|含义|优化建议|
| -----------------| ------------| -------------------|
|Query_time|总执行时间|>1秒需优化|
|Lock_time|锁等待时间|>0.01秒检查锁冲突|
|Rows_examined|扫描行数|应≈Rows_sent|
|Rows_sent|返回行数|过大考虑LIMIT|
|Tmp_tables|内存临时表|>0检查索引|
|Tmp_disk_tables|磁盘临时表|必须优化|
|Full_scan|全表扫描|检查索引|
|Filesort|文件排序|添加ORDER BY索引|

##### **5.1.2 慢查询日志分析工具**

**mysqldumpslow用法：**

```bash
# 安装（MySQL自带）
which mysqldumpslow

# 查看最慢的10条
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log

# 按平均时间排序
mysqldumpslow -a -s at -t 10 /var/log/mysql/slow.log

# 按锁定时间排序
mysqldumpslow -s l -t 10 /var/log/mysql/slow.log

# 按扫描行数排序
mysqldumpslow -s r -t 10 /var/log/mysql/slow.log

# 按执行次数排序
mysqldumpslow -s c -t 10 /var/log/mysql/slow.log

# 过滤特定表
mysqldumpslow -g "orders" /var/log/mysql/slow.log

# 合并多个日志
mysqldumpslow /var/log/mysql/slow.log.1 /var/log/mysql/slow.log.2

# 输出示例：
# Count: 1000  Time=1.23s (1234s)  Lock=0.00s (1s)  Rows=100.0 (100000), appuser[appuser]@web-server
#  SELECT * FROM orders WHERE user_id = N AND create_time > 'S'
```

**pt-query-digest深度分析：**

```bash
# 安装
sudo apt-get install percona-toolkit

# 基本使用
pt-query-digest /var/log/mysql/slow.log > report.txt

# 输出到数据库（便于长期分析）
pt-query-digest \
  --review h=localhost,D=percona,t=query_review \
  --history h=localhost,D=percona,t=query_review_history \
  --no-report \
  --limit=0% \
  /var/log/mysql/slow.log

# 查看报告
cat report.txt

# 报告结构：
# 1. 总体统计（执行次数、时间、分布）
# 2. 响应时间分布直方图
# 3. 查询排名（按总时间）
# 4. 各查询详细分析
```

**pt-query-digest报告解读：**

```bash
# 示例输出片段

# 总体统计
# 150ms user time, 50ms system time, 25.03M rss, 215.30M vsz
# Current date: Mon Jan 23 10:00:00 2024
# Hostname: db-server
# Files: slow.log
# Overall: 10.15k total, 200 unique, 0.15 QPS, 0.02x concurrency _______
# Time range: 2024-01-22 00:00:00 to 2024-01-23 10:00:00
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time          1234s   500ms      5s   121ms   400ms   150ms    90ms
# Lock time            12s    10us   200ms     1ms    10ms     3ms   500us
# Rows sent          50.2k       1     500    5.01   20.00   10.00    2.00
# Rows examine       50.1M       0     10M   5.01k   9.86k   2.00k  100.00
# Query size        1.23M      20     500   128.0   300.0    50.0   100.0

# 查询排名
# Profile
# Rank Query ID           Response time  Calls  R/Call V/M   Item
# ==== ================== ============== ====== ====== ===== =========
#    1 0x123456789ABCDEF    500.1234 40.5%   1000 0.5001  0.02 SELECT orders
#    2 0xABCDEF123456789    300.0456 24.3%    500 0.6001  0.03 SELECT users
#    3 0x987654321FEDCBA    200.0543 16.2%    800 0.2501  0.01 UPDATE inventory

# 排名第一的查询详细分析
# Query 1: 500s, 1000次, 平均0.5s
# SELECT * FROM orders WHERE user_id = ? AND create_time > ?
```

##### **5.1.3 性能模式(Performance Schema)**

**Performance Schema配置：**

```sql
-- 启用Performance Schema
SHOW VARIABLES LIKE 'performance_schema';  -- 默认ON

-- 配置消费者
SELECT * FROM performance_schema.setup_consumers;
UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE '%events_statements%';

-- 配置仪器
SELECT * FROM performance_schema.setup_instruments
WHERE NAME LIKE '%statement/%';
UPDATE performance_schema.setup_instruments SET ENABLED = 'YES', TIMED = 'YES'
WHERE NAME LIKE 'statement/%';

-- 配置内存监控
UPDATE performance_schema.setup_instruments SET ENABLED = 'YES'
WHERE NAME LIKE 'memory/%';
```

**常用性能查询：**

```sql
-- 1. 按执行时间排序的SQL
SELECT 
  SCHEMA_NAME,
  DIGEST_TEXT,
  COUNT_STAR,
  AVG_TIMER_WAIT/1000000000000 AS avg_time_sec,
  SUM_TIMER_WAIT/1000000000000 AS total_time_sec,
  SUM_ROWS_EXAMINED,
  SUM_ROWS_SENT,
  ROUND(SUM_ROWS_EXAMINED / SUM_ROWS_SENT, 2) AS rows_ratio
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME IS NOT NULL
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- 2. 查看具体SQL执行历史
SELECT 
  THREAD_ID,
  SQL_TEXT,
  TIMER_WAIT,
  ROWS_EXAMINED,
  ROWS_SENT,
  CREATED_TMP_TABLES
FROM performance_schema.events_statements_history
WHERE SQL_TEXT LIKE '%orders%'
ORDER BY TIMER_WAIT DESC
LIMIT 100;

-- 3. 等待事件分析（瓶颈）
SELECT 
  EVENT_NAME,
  COUNT_STAR,
  SUM_TIMER_WAIT/1000000000 AS total_wait_ms,
  AVG_TIMER_WAIT/1000000 AS avg_wait_ms
FROM performance_schema.events_waits_summary_global_by_event_name
WHERE COUNT_STAR > 0
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- 4. 文件IO分析
SELECT 
  FILE_NAME,
  COUNT_READ,
  SUM_NUMBER_OF_BYTES_READ,
  COUNT_WRITE,
  SUM_NUMBER_OF_BYTES_WRITE
FROM performance_schema.file_summary_by_instance
ORDER BY SUM_NUMBER_OF_BYTES_READ + SUM_NUMBER_OF_BYTES_WRITE DESC
LIMIT 10;

-- 5. 表锁分析
SELECT 
  OBJECT_SCHEMA,
  OBJECT_NAME,
  COUNT_READ,
  COUNT_WRITE,
  SUM_TIMER_WAIT
FROM performance_schema.table_lock_waits_summary_by_table
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- 6. 元数据锁分析
SELECT 
  OBJECT_TYPE,
  OBJECT_SCHEMA,
  OBJECT_NAME,
  LOCK_TYPE,
  LOCK_DURATION,
  THREAD_ID,
  PROCESSLIST_ID
FROM performance_schema.metadata_locks
WHERE OWNER_THREAD_ID != 0;
```

##### **5.1.4 sys系统库**

sys库简化Performance Schema查询。

**sys库配置：**

```sql
-- 确认sys库存在
SHOW DATABASES LIKE 'sys';

-- 查看视图定义
SELECT * FROM sys.version;
-- 2.0.0

-- 常用视图
SHOW TABLES IN sys;
```

**sys库核心视图：**

```sql
-- 1. 查看最耗时的SQL
SELECT * FROM sys.statement_analysis 
ORDER BY total_latency DESC 
LIMIT 10;

-- 2. 查看全表扫描的SQL
SELECT * FROM sys.statements_with_full_table_scans 
ORDER BY total_latency DESC;

-- 3. 查看使用临时表的SQL
SELECT * FROM sys.statements_with_temp_tables 
ORDER BY total_latency DESC;

-- 4. 查看InnoDB锁等待
SELECT * FROM sys.innodb_lock_waits;

-- 5. 查看索引使用情况
SELECT * FROM sys.schema_index_statistics
WHERE table_schema = 'ecommerce';

-- 6. 查看表统计信息
SELECT * FROM sys.schema_table_statistics
WHERE table_schema = 'ecommerce';

-- 7. 查看冗余索引
SELECT * FROM sys.schema_redundant_indexes;

-- 8. 查看未使用索引
SELECT * FROM sys.schema_unused_indexes;

-- 9. 查看内存使用
SELECT * FROM sys.memory_global_total;
SELECT * FROM sys.memory_by_thread_by_current_bytes;

-- 10. 查看最新错误
SELECT * FROM sys.schema_table_lock_waits;
```

**生产案例：使用sys库定位慢查询**

```sql
-- 步骤1：找出最慢查询
SELECT 
  digest,
  query,
  db,
  exec_count,
  total_latency,
  avg_latency,
  max_latency
FROM sys.statement_analysis
ORDER BY total_latency DESC
LIMIT 1\G

-- 输出：
*************************** 1. row ***************************
         digest: 0x123456789ABCDEF
          query: SELECT o.*, u.name FROM orders o JOIN users u USING (user_id) WHERE o.status = ?
             db: ecommerce
      exec_count: 100000
   total_latency: 3.45h
     avg_latency: 124.20 ms
     max_latency: 5.67 s

-- 步骤2：分析全表扫描
SELECT 
  query,
  rows_examined,
  rows_sent,
  rows_examined / rows_sent AS ratio
FROM sys.statements_with_full_table_scans
WHERE query LIKE '%orders%'\G

-- 步骤3：检查索引
SELECT * FROM sys.schema_index_statistics
WHERE table_name = 'orders';

-- 发现idx_status没有被使用

-- 步骤4：分析原因
EXPLAIN SELECT * FROM orders WHERE status = 1\G
-- type: ALL
-- rows: 100000

-- 原因：status选择性差，只有0/1

-- 步骤5：优化
ALTER TABLE orders ADD INDEX idx_status_create_time (status, create_time);

-- 效果验证
SELECT * FROM sys.statement_analysis
WHERE digest = '0x123456789ABCDEF'\G
-- avg_latency降至5ms
```

#### 5.2 SQL改写技巧

##### 5.2.1 JOIN优化

**JOIN优化原则：**

```sql
-- 1. 小表驱动大表
-- 优化器自动选择，但可手动干预

-- 2. 确保JOIN字段有索引
-- 避免Block Nested Loop

-- 3. 避免笛卡尔积
-- JOIN条件不要漏

-- 4. 使用覆盖索引
-- 减少回表

-- 5. 控制JOIN表数量
-- 不超过5个表
```

**JOIN类型选择：**

```sql
-- INNER JOIN vs LEFT JOIN
-- INNER JOIN可过滤双方数据
-- LEFT JOIN保留左表所有行

-- 案例：查询有订单的用户
SELECT u.* FROM users u INNER JOIN orders o ON u.id = o.user_id;  -- 去重
SELECT u.* FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);  -- 语义相同

-- 案例：查询无订单用户
SELECT u.* FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.id IS NULL;
-- 优于NOT IN（处理NULL更稳健）

-- STRAIGHT_JOIN强制顺序
-- 优化器选择错误时使用
SELECT STRAIGHT_JOIN * FROM small_table s JOIN large_table l ON s.id = l.small_id;

-- 检查JOIN类型
SHOW STATUS LIKE 'Select_full_join';  -- 无索引JOIN，应=0
SHOW STATUS LIKE 'Select_range_check';  -- 索引检查，应=0
```

##### **5.2.2 子查询优化**

**子查询优化法则：**

```sql
-- 法则1：将子查询转为JOIN
-- 反例
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

-- 正例
SELECT DISTINCT u.* FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100;

-- 法则2：派生表合并
-- 5.7+自动合并
SELECT * FROM (SELECT * FROM users WHERE status = 1) AS t;

-- 等价于
SELECT * FROM users WHERE status = 1;

-- 法则3：物化避免重复计算
-- 反例
SELECT 
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
  (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id) AS pay_count
FROM users u;

-- 正例：两次扫描users
SELECT 
  u.*,
  o.cnt AS order_count,
  p.cnt AS pay_count
FROM users u
LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id) o ON u.id = o.user_id
LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM payments GROUP BY user_id) p ON u.id = p.user_id;

-- 法则4：使用LATERAL JOIN（8.0+）
-- 相关子查询优化
SELECT * FROM users u,
LATERAL (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count;

-- 法则5：ANY/ALL优化
-- 反例
SELECT * FROM products WHERE price > ALL (SELECT price FROM products WHERE category_id = 1);

-- 正例
SELECT * FROM products p1 WHERE p1.price > (
  SELECT MAX(price) FROM products p2 WHERE p2.category_id = 1
);
```

##### **5.2.3 UNION优化**

**UNION优化要点：**

```sql
-- 要点1：业务允许时用UNION ALL
-- 反例
SELECT id FROM users WHERE status = 1
UNION
SELECT id FROM users WHERE age > 20;

-- 正例
SELECT id FROM users WHERE status = 1
UNION ALL
SELECT id FROM users WHERE age > 20 AND status != 1;

-- 要点2：条件下推
-- 反例
SELECT * FROM (
  SELECT * FROM orders WHERE status = 1
  UNION ALL
  SELECT * FROM orders WHERE status = 2
) AS t
WHERE create_time > '2024-01-01';

-- 正例
SELECT * FROM orders WHERE status = 1 AND create_time > '2024-01-01'
UNION ALL
SELECT * FROM orders WHERE status = 2 AND create_time > '2024-01-01';

-- 要点3：减少UNION表数量
-- 反例（3个UNION）
SELECT * FROM t1 WHERE type = 1
UNION ALL
SELECT * FROM t2 WHERE type = 1
UNION ALL
SELECT * FROM t3 WHERE type = 1;

-- 正例（合并表或分区表）
SELECT * FROM all_tables WHERE type = 1;
```

##### **5.2.4 GROUP BY优化**

**GROUP BY执行模式：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:GROUP BY执行;

if (索引完全匹配?) then (是)
  :松散索引扫描\n(Loose Index Scan);
  note right
    无需临时表
    只需读取每个组第一行
    极快
  end note
else (否)
  if (索引部分匹配?) then (是)
    :紧凑索引扫描\n(Tight Index Scan);
    note right
      需读取所有行
      需排序或临时表
      较快
    end note
  else (否)
    :临时表+排序\n(Temporary+filesort);
    note right
      最慢
      需创建临时表
      可能磁盘化
    end note
  endif
endif

stop

@enduml
```

**GROUP BY优化案例：**

```sql
-- 测试表
CREATE TABLE sales (
  product_id INT,
  sale_date DATE,
  amount DECIMAL(10,2),
  INDEX idx_product_date (product_id, sale_date)
);

-- 案例1：松散索引扫描
EXPLAIN SELECT product_id, MIN(amount) FROM sales GROUP BY product_id\G
-- type: range
-- Extra: Using index for group-by

-- 案例2：紧凑索引扫描
EXPLAIN SELECT product_id, SUM(amount) FROM sales 
WHERE sale_date > '2024-01-01' GROUP BY product_id\G
-- type: ref
-- Extra: Using where; Using index

-- 案例3：临时表+文件排序
EXPLAIN SELECT product_id, SUM(amount) FROM sales 
GROUP BY product_id ORDER BY SUM(amount)\G
-- type: index
-- Extra: Using index; Using temporary; Using filesort

-- 优化3：去除排序
EXPLAIN SELECT product_id, SUM(amount) FROM sales 
GROUP BY product_id\G
-- Extra: Using index（无filesort）

-- 或创建排序索引
ALTER TABLE sales ADD INDEX idx_product_sum (product_id, amount);
-- 但GROUP BY仍需要SUM()，无法完全避免排序

-- 最终优化：汇总表
CREATE TABLE sales_summary AS
SELECT product_id, SUM(amount) AS total_amount
FROM sales
GROUP BY product_id;

-- 定期刷新
TRUNCATE TABLE sales_summary;
INSERT INTO sales_summary
SELECT product_id, SUM(amount) FROM sales GROUP BY product_id;

-- 查询直接查汇总表
SELECT * FROM sales_summary ORDER BY total_amount;
```

##### **5.2.5 ORDER BY优化**

**ORDER BY执行方式：**

```sql
-- 1. 使用索引（最优）
SELECT * FROM users WHERE status = 1 ORDER BY id;
-- idx_status_id (status, id)

-- 2. 使用索引+反向扫描（8.0+）
SELECT * FROM users WHERE status = 1 ORDER BY id DESC;
-- idx_status_id (status, id DESC)

-- 3. 使用filesort（需优化）
SELECT * FROM users ORDER BY name;
-- Extra: Using filesort

-- Filesort算法：
-- 1. 读取所有匹配行
-- 2. 在sort_buffer中存储排序键和行指针
-- 3. 快速排序
-- 4. 按排序结果读取行

-- 优化参数
SHOW VARIABLES LIKE 'sort_buffer_size';  -- 默认256KB
SET SESSION sort_buffer_size = 4M;

-- 监控
SHOW STATUS LIKE 'Sort_merge_passes';  -- 合并次数
SHOW STATUS LIKE 'Sort_scan';  -- 扫描次数

-- 优化案例
-- 反例
SELECT * FROM users WHERE status = 1 ORDER BY name;

-- 正例1：添加索引
ALTER TABLE users ADD INDEX idx_status_name (status, name);

-- 正例2：覆盖索引
SELECT id, name FROM users WHERE status = 1 ORDER BY name;

-- 正例3：延迟排序（深分页）
-- 原
SELECT * FROM users ORDER BY name LIMIT 100000, 10;

-- 改
SELECT u.* FROM users u
JOIN (
  SELECT id FROM users ORDER BY name LIMIT 100000, 10
) t ON u.id = t.id;
```

#### 5.3 分页优化

##### **5.3.1 LIMIT offset问题**

**深分页原理：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:LIMIT 100000, 10;
note right
  MySQL执行：
  1. 扫描前100000行
  2. 丢弃
  3. 返回10行
  
  代价：O(n+m)
end note

:延迟关联;
note right
  1. 覆盖索引扫描100010个id
  2. 丢弃前100000个id
  3. 用10个id回表
  
  代价：O(n)索引扫描 + O(m)回表
  极大降低
end note

stop

@enduml
```

**深分页测试：**

```sql
-- 测试表：1000万条
CREATE TABLE pagination_test (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50),
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- 插入数据
INSERT INTO pagination_test (name) 
SELECT CONCAT('user', i) FROM numbers WHERE i <= 10000000;

-- 测试不同分页深度
-- 第1页
SELECT * FROM pagination_test ORDER BY name LIMIT 0, 10;
-- 耗时：5ms

-- 第1000页
SELECT * FROM pagination_test ORDER BY name LIMIT 10000, 10;
-- 耗时：50ms
-- rows_examined: 10010

-- 第10000页
SELECT * FROM pagination_test ORDER BY name LIMIT 100000, 10;
-- 耗时：500ms
-- rows_examined: 100010

-- 第100000页
SELECT * FROM pagination_test ORDER BY name LIMIT 1000000, 10;
-- 耗时：5秒
-- rows_examined: 1000010
```

**延迟关联优化：**

```sql
-- 原始查询
SELECT * FROM pagination_test ORDER BY name LIMIT 1000000, 10;
-- 耗时：5秒，rows_examined: 1000010

-- 优化1：延迟关联
SELECT t.* FROM pagination_test t
INNER JOIN (
  SELECT id FROM pagination_test ORDER BY name LIMIT 1000000, 10
) AS tmp ON t.id = tmp.id;
-- 耗时：500ms，提升10倍
-- rows_examined: 1000010（索引） + 10（回表）

-- 优化2：基于位置的分页（要求高连续性）
SELECT * FROM pagination_test 
WHERE id > 1000000 
ORDER BY id 
LIMIT 10;
-- 耗时：1ms
-- 要求：id连续，无删除

-- 优化3：基于时间的分页
SELECT * FROM pagination_test 
WHERE create_time > '2024-01-01 10:00:00'
ORDER BY create_time 
LIMIT 10;

-- 记录最后时间用于下一页
SELECT * FROM pagination_test 
WHERE create_time > '2024-01-01 10:00:10'  -- 上一页最后时间
ORDER BY create_time 
LIMIT 10;

-- 优化4：游标分页（推荐）
-- 客户端保存游标
SELECT * FROM pagination_test 
WHERE (name, id) > ('user1000000', 1000000)
ORDER BY name, id 
LIMIT 10;
-- 性能：O(1)，与偏移无关
```

**ES分页对比：**

```sql
-- MySQL深分页问题本质是顺序扫描
-- 解决方案对比：

-- 方案1：MySQL延迟关联
-- 优点：无需额外组件
-- 缺点：性能仍随深度下降

-- 方案2：Elasticsearch
-- 优点：深分页性能稳定
-- 缺点：数据同步、架构复杂

-- 方案3：范围分片
-- 数据按id或时间分片
-- 每个分片内再分页

-- 推荐：业务层限制分页深度
-- 不提供1000页以后的跳转
-- 仅支持"下一页"
```

##### **5.3.2 分页与COUNT(*)**

**COUNT(*)问题：**

```sql
-- 分页通常需要总条数
SELECT COUNT(*) FROM orders WHERE status = 1;  -- 500万条，耗时3秒

-- 优化1：估算
SHOW TABLE STATUS LIKE 'orders'\G
-- Rows: 5000000（估算值，误差10%）

-- 优化2：缓存
-- 在Redis中缓存总数
SET order_count:status1 5000000 EX 3600;

-- 优化3：延迟计算
-- 首页不显示总数
-- 仅在"最后一页"提示

-- 优化4：搜索引擎
-- Elasticsearch提供快速count
```

##### **5.3.3 游标分页**

**游标分页实现：**

```sql
-- 基于主键游标
-- 第一页
SELECT * FROM users ORDER BY id LIMIT 10;
-- 返回：id 1-10

-- 第二页
SELECT * FROM users WHERE id > 10 ORDER BY id LIMIT 10;
-- 返回：id 11-20

-- 优点：
-- 1. 性能O(1)，无偏移
-- 2. 数据稳定（无重复）
-- 3. 无深分页问题

-- 缺点：
-- 1. 不支持随机跳转
-- 2. 数据删除导致跳过
-- 3. 排序字段必须唯一

-- 多字段游标
-- 支持按时间分页
SELECT * FROM messages 
WHERE (create_time, id) > ('2024-01-01 10:00:00', 1000)
ORDER BY create_time, id 
LIMIT 10;

-- 游标API设计
-- GET /api/users?cursor=eyJpZCI6MTAwMH0&limit=10
-- 返回：{"data": [...], "cursor": "eyJpZCI6MTAxMH0"}

-- 游标加密
-- 避免客户端篡改
-- 使用base64编码JSON
```

#### 5.4 批量操作优化

##### **5.4.1 INSERT优化**

**批量插入性能测试：**

```sql
-- 测试表
CREATE TABLE insert_test (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  value INT,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- 方法1：单条INSERT（最慢）
INSERT INTO insert_test (name, value) VALUES ('test1', 1);
INSERT INTO insert_test (name, value) VALUES ('test2', 2);
...
-- 1000条：10秒

-- 方法2：批量VALUES（推荐）
INSERT INTO insert_test (name, value) VALUES
('test1', 1),
('test2', 2),
...
('test1000', 1000);
-- 1000条：0.5秒
-- 性能提升20倍

-- 方法3：LOAD DATA（最快）
-- 数据文件data.csv
-- test1,1
-- test2,2
LOAD DATA INFILE '/tmp/data.csv' INTO TABLE insert_test
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
(name, value);
-- 1000条：0.1秒
-- 性能提升100倍

-- 方法4：INSERT SELECT
INSERT INTO insert_test (name, value)
SELECT CONCAT('user', i), i FROM numbers WHERE i <= 1000;
-- 性能与方法2相似
```

**批量插入优化配置：**

```sql
-- 1. 关闭自动提交
SET autocommit = 0;
INSERT ...
INSERT ...
COMMIT;

-- 2. 调整日志刷盘
SET GLOBAL innodb_flush_log_at_trx_commit = 2;  -- 批量插入时

-- 3. 增大缓冲池
SET GLOBAL innodb_buffer_pool_size = 2G;  -- 确保数据在内存

-- 4. 关闭唯一性检查
SET UNIQUE_CHECKS = 0;  -- 确保数据唯一，风险高

-- 5. 关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;  -- 风险高

-- 6. 调整批量插入缓冲
SET GLOBAL bulk_insert_buffer_size = 256M;  -- MyISAM

-- 7. 使用多值插入
-- 单条INSERT VALUES值数限制
-- max_allowed_packet / 行大小

-- 8. 线程批量并行
-- 使用LOAD DATA并发
-- mysqlimport --use-threads=4
```

**生产案例：日志导入**

```bash
#!/bin/bash
# 批量导入脚本

BATCH_SIZE=5000
FILE="/data/logs/app.log"

# 预处理
grep "INSERT" $FILE | split -l $BATCH_SIZE - logs_

# 批量LOAD DATA
for f in logs_*; do
  mysql -e "LOAD DATA INFILE '$f' INTO TABLE logs"
done

# 优化：使用mysqlimport
mysqlimport --local --fields-terminated-by=',' \
  --lines-terminated-by='\n' \
  --use-threads=4 \
  db /data/logs/app.log
```

##### **5.4.2 UPDATE/DELETE优化**

**批量更新策略：**

```sql
-- 场景：更新所有用户状态
-- 反例
UPDATE users SET status = 2 WHERE status = 1;  -- 大事务，锁表

-- 正例：分批更新
SET @batch_size = 1000;
SET @affected = 1;

WHILE @affected > 0 DO
  UPDATE users SET status = 2 
  WHERE status = 1 
  LIMIT @batch_size;
  
  SET @affected = ROW_COUNT();
  
  DO SLEEP(0.1);  -- 避免CPU打满
  COMMIT;
END WHILE;

-- Python脚本实现
def batch_update():
    batch_size = 1000
    total_affected = 0
    
    while True:
        cursor.execute(
            "UPDATE users SET status = 2 WHERE status = 1 LIMIT %s", 
            (batch_size,)
        )
        affected = cursor.rowcount
        total_affected += affected
        
        conn.commit()
        
        if affected < batch_size:
            break

-- 优化：主键范围分批
UPDATE users SET status = 2 
WHERE id BETWEEN 1 AND 1000 AND status = 1;

UPDATE users SET status = 2 
WHERE id BETWEEN 1001 AND 2000 AND status = 1;
```

**批量删除优化：**

```sql
-- 场景：删除过期日志
-- 表：logs，1亿条，需删除3个月前数据

-- 反例
DELETE FROM logs WHERE create_time < DATE_SUB(NOW(), INTERVAL 3 MONTH);
-- 问题：
-- 1. 大事务，Undo膨胀
-- 2. 锁表时间长
-- 3. 主从延迟

-- 正例：分批删除
DELETE FROM logs 
WHERE create_time < DATE_SUB(NOW(), INTERVAL 3 MONTH)
LIMIT 10000;

-- 循环执行直到影响行数为0

-- 优化：分区表
-- 按时间分区，直接DROP PARTITION
ALTER TABLE logs DROP PARTITION p202310;

-- 秒删，无开销
```

##### **5.4.3 并行批量操作**

**多线程批量插入：**

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import MySQLdb
import csv

def load_batch(filename):
    conn = MySQLdb.connect(host='localhost', user='root', db='test')
    cursor = conn.cursor()
    
    with open(filename, 'r') as f:
        reader = csv.reader(f)
        data = list(reader)
        
        # 批量插入
        cursor.executemany(
            "INSERT INTO big_table (col1, col2, col3) VALUES (%s, %s, %s)",
            data
        )
        conn.commit()
    
    cursor.close()
    conn.close()
    return f"{filename}: {len(data)} rows"

# 分割文件
# split -l 50000 large.csv batch_

# 并行加载
files = ['batch_aa', 'batch_ab', 'batch_ac', 'batch_ad']
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = {executor.submit(load_batch, f): f for f in files}
    
    for future in as_completed(futures):
        print(future.result())

# 性能：4线程比单线程快2.5倍
```

##### **5.4.4 批量优化参数**

```ini
# my.cnf批量优化
[mysqld]
# 增大允许包大小
max_allowed_packet = 1G

# 增大日志缓冲
innodb_log_buffer_size = 256M

# 调整刷盘策略
innodb_flush_log_at_trx_commit = 2  # 批量导入时

# 关闭双写缓冲
innodb_doublewrite = OFF  # 确认底层有保护

# 关闭binlog（从库导入）
sql_log_bin = OFF

# 增大JOIN缓冲
join_buffer_size = 256M

# 增大排序缓冲
sort_buffer_size = 32M
```

#### 5.5 临时表优化

##### **5.5.1 临时表类型**

**内存临时表 vs 磁盘临时表：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:查询需要临时表?;

if (满足条件?) then (是)
  :创建内存临时表\n(MEMORY引擎);
  note right
    1. 表结构在内存
    2. 数据在内存
    3. 表级锁
    4. 受tmp_table_size限制
  end note
  
  if (超过限制?) then (是)
    :转为磁盘临时表\n(MyISAM或InnoDB);
    note right
      1. 性能急剧下降
      2. 磁盘IO
      3. 必须避免
    end note
  endif
else (否)
  :无需临时表;
endif

stop

@enduml
```

**临时表触发场景：**

```sql
-- 1. GROUP BY无索引
EXPLAIN SELECT status, COUNT(*) FROM users GROUP BY status\G
-- Extra: Using temporary

-- 2. ORDER BY与GROUP BY不同
EXPLAIN SELECT status, COUNT(*) FROM users GROUP BY status ORDER BY COUNT(*)\G
-- Extra: Using temporary; Using filesort

-- 3. DISTINCT + ORDER BY
EXPLAIN SELECT DISTINCT status FROM users ORDER BY name\G
-- Extra: Using temporary; Using filesort

-- 4. UNION
EXPLAIN SELECT * FROM t1 UNION SELECT * FROM t2\G
-- Extra: Using temporary

-- 5. 派生表
EXPLAIN SELECT * FROM (SELECT * FROM users) AS t\G
-- 5.5: 有temporary
-- 5.7+: 优化掉

-- 6. 多表UPDATE
EXPLAIN UPDATE users u, orders o SET u.total = o.sum ...
-- 使用temporary
```

##### **5.5.2 优化临时表**

**优化策略：**

```sql
-- 策略1：增大内存限制
SET GLOBAL tmp_table_size = 64M;      -- 内存临时表上限
SET GLOBAL max_heap_table_size = 64M; -- 必须与tmp_table_size一致

-- 监控
SHOW STATUS LIKE 'Created_tmp_tables';
SHOW STATUS LIKE 'Created_tmp_disk_tables';

-- 计算磁盘临时表比例
SELECT 
  Created_tmp_disk_tables / Created_tmp_tables AS disk_ratio
FROM (
  SELECT 
    MAX(IF(VARIABLE_NAME='Created_tmp_disk_tables', VARIABLE_VALUE, 0)) AS Created_tmp_disk_tables,
    MAX(IF(VARIABLE_NAME='Created_tmp_tables', VARIABLE_VALUE, 0)) AS Created_tmp_tables
  FROM performance_schema.global_status
  WHERE VARIABLE_NAME IN ('Created_tmp_disk_tables', 'Created_tmp_tables')
) t;
-- disk_ratio应<5%

-- 策略2：优化查询避免临时表
-- 案例：GROUP BY
SELECT status, COUNT(*) FROM users GROUP BY status;

-- 优化：添加索引
ALTER TABLE users ADD INDEX idx_status (status);

-- 再次EXPLAIN
EXPLAIN SELECT status, COUNT(*) FROM users GROUP BY status\G
-- Extra: Using index（无temporary）

-- 策略3：使用覆盖索引
-- 案例：ORDER BY
SELECT id, name FROM users ORDER BY name;

-- 优化
ALTER TABLE users ADD INDEX idx_name (name, id);
-- Extra: Using index（无filesort）

-- 策略4：分解复杂查询
-- 原：复杂JOIN + GROUP BY
-- 改：先JOIN存入临时表，再GROUP BY

-- 策略5：MySQL 8.0 TempTable引擎
SET GLOBAL internal_tmp_mem_storage_engine = 'TempTable';
SET GLOBAL temptable_max_ram = 1G;
SET GLOBAL temptable_use_mmap = ON;  -- 超出内存使用mmap
```

**生产案例：临时表优化**

```sql
-- 场景：报表查询
SELECT 
  u.country,
  DATE(o.create_time) AS order_date,
  COUNT(*) AS order_count,
  SUM(o.amount) AS total_amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.create_time BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY u.country, DATE(o.create_time);

-- EXPLAIN
-- Extra: Using temporary; Using filesort

-- 优化步骤：
-- 1. 添加复合索引
ALTER TABLE orders ADD INDEX idx_user_time (user_id, create_time);
ALTER TABLE users ADD INDEX idx_country (country);

-- 2. 使用覆盖索引
ALTER TABLE orders ADD INDEX idx_user_time_amount (user_id, create_time, amount);

-- 3. 分解查询
CREATE TEMPORARY TABLE tmp_order_stats AS
SELECT 
  u.country,
  DATE(o.create_time) AS order_date,
  o.amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.create_time BETWEEN '2024-01-01' AND '2024-01-31';

-- 添加索引
ALTER TABLE tmp_order_stats ADD INDEX idx_country_date (country, order_date);

-- 二次聚合
SELECT 
  country,
  order_date,
  COUNT(*) AS order_count,
  SUM(amount) AS total_amount
FROM tmp_order_stats
GROUP BY country, order_date;

-- 性能：从10秒降至2秒
```

---

### 第6章 高级查询优化技术

#### 6.1 视图与派生表优化

##### 6.1.1 视图合并(View Merging)

视图合并是优化器将视图定义合并到外层查询的优化。

```sql
-- 创建视图
CREATE VIEW v_active_users AS
SELECT * FROM users WHERE status = 1;

-- 查询视图
SELECT id, name FROM v_active_users WHERE age > 20;

-- MySQL 5.5执行：
-- 1. 物化视图（创建临时表）
-- 2. 在临时表上查询
-- Extra: Using temporary

-- MySQL 5.7+执行：
-- 优化器改写为：
SELECT id, name FROM users WHERE status = 1 AND age > 20;
-- Extra: Using where

-- 查看是否合并
EXPLAIN SELECT id, name FROM v_active_users WHERE age > 20\G
-- 5.5: table: <derived2>
-- 5.7: table: users

-- 强制物化
CREATE ALGORITHM = TEMPTABLE VIEW v_users AS
SELECT * FROM users;

-- 或
SELECT /*+ NO_MERGE(v) */ * FROM v_active_users v WHERE age > 20;

-- 视图合并限制：
-- 1. 包含GROUP BY/DISTINCT不合并
-- 2. 包含UNION不合并
-- 3. 包含LIMIT不合并
-- 4. 包含子查询可能不合并
```

**视图性能测试：**

```sql
-- 测试表：100万用户
CREATE TABLE users_test (id BIGINT, status TINYINT, age INT, name VARCHAR(50));

-- 创建视图
CREATE VIEW v_test AS SELECT * FROM users_test WHERE status = 1;

-- 测试1：简单查询
-- 5.5：0.5秒（物化）
-- 5.7：0.05秒（合并）

-- 测试2：复杂视图（含GROUP BY）
CREATE VIEW v_complex AS
SELECT status, COUNT(*) AS cnt FROM users_test GROUP BY status;

-- 查询
SELECT * FROM v_complex WHERE cnt > 1000;
-- 5.5/5.7：均无法合并，需物化
```

##### **6.1.2 派生表优化**

派生表（FROM子查询）优化策略。

```sql
-- 反例：派生表无索引
EXPLAIN SELECT * FROM (
  SELECT * FROM users WHERE status = 1
) AS t WHERE id = 100\G
-- 5.5: type: ALL on <derived2>，扫描所有行

-- 优化：添加索引
ALTER TABLE users ADD INDEX idx_status (status);

-- 5.6+优化：derived_with_keys
SET optimizer_switch = 'derived_with_keys=on';

-- 查询
EXPLAIN SELECT * FROM (
  SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
) AS t WHERE user_id = 100\G
-- type: ref
-- key: <auto_key0>（自动创建索引）

-- 手动优化：物化表加索引
CREATE TEMPORARY TABLE tmp_order_stats AS
SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id;

ALTER TABLE tmp_order_stats ADD PRIMARY KEY (user_id);

SELECT * FROM tmp_order_stats WHERE user_id = 100;
```

**派生表合并条件：**

```sql
-- 可合并
SELECT * FROM (SELECT * FROM users) AS t;

-- 不可合并（MySQL 5.7+除外）
SELECT * FROM (SELECT * FROM users LIMIT 10) AS t;
SELECT * FROM (SELECT DISTINCT status FROM users) AS t;
SELECT * FROM (SELECT * FROM users UNION SELECT * FROM old_users) AS t;

-- 控制合并
SET optimizer_switch = 'derived_merge=on';  -- 默认ON
SET optimizer_switch = 'derived_merge=off'; -- 强制物化
```

#### 6.2 公用表表达式(CTE)

窗口函数通过单次扫描实现跨行计算，避免了自连接或子查询带来的多次表访问。在MySQL 8.0中，窗口函数的执行效率较5.7版本有数量级提升，但仍需理解其内存使用模型和索引依赖关系。

**执行机制与内存模型**

窗口函数的本质是在排序后的结果集上维护一个滑动帧（Frame）。以`ROW_NUMBER()`​为例，MySQL执行器会为每个`PARTITION`​分配独立的内存结构，缓存分区数据并执行标记操作。这一过程高度依赖`sort_buffer_size`​和`read_rnd_buffer_size`的配置。

**场景：查询每个用户的最新订单**

```sql
-- 低效实现：相关子查询导致N+1访问
SELECT o1.* FROM orders o1
WHERE o1.create_time = (
  SELECT MAX(create_time) FROM orders o2 WHERE o2.user_id = o1.user_id
) AND o1.user_id BETWEEN 10000 AND 20000;
-- 执行特性：对orders表全量扫描，每个用户触发一次子查询
```

**窗口函数重构后：**

```sql
WITH ranked_orders AS (
  SELECT *, 
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY create_time DESC
    ) AS rn,
    COUNT(*) OVER (PARTITION BY user_id) AS order_cnt
  FROM orders
  WHERE user_id BETWEEN 10000 AND 20000
  -- 谓词下推：先过滤用户范围，减少分区计算量
)
SELECT order_id, user_id, create_time, amount, order_cnt
FROM ranked_orders
WHERE rn = 1;
```

实际执行中，若`idx_user_time(user_id, create_time)`​存在，优化器会优先使用索引有序性，避免`filesort`​。此时`EXPLAIN`​中`Extra`​显示为`Using index`​，而非`Using index; Using filesort`。

##### 6.2.1 标准CTE

标准CTE的核心价值在于拆解复杂逻辑。当SQL包含多层嵌套子查询时，使用CTE可将业务语义显性化。

**典型重构场景：**

原始嵌套查询：

```sql
-- 传统写法：三层嵌套，调试困难
SELECT region, AVG(month_total) 
FROM (
  SELECT region, MONTH(order_date) AS m, SUM(amount) AS month_total
  FROM orders JOIN users USING (user_id)
  WHERE YEAR(order_date) = 2024
  GROUP BY region, m
) AS monthly_stats
GROUP BY region;
```

CTE重构后：

```sql
WITH valid_orders AS (
  SELECT * FROM orders 
  WHERE YEAR(order_date) = 2024
),
regional_monthly AS (
  SELECT u.region, MONTH(o.order_date) AS month, SUM(o.amount) AS total
  FROM valid_orders o JOIN users u ON o.user_id = u.user_id
  GROUP BY u.region, month
)
SELECT region, AVG(total) AS avg_monthly_sales
FROM regional_monthly
GROUP BY region;
```

这种重构并未改变执行计划，但将"数据清洗→聚合计算→最终统计"三段式逻辑清晰呈现。在慢查询日志中，每段CTE可独立注释与调试。

**多CTE的依赖关系：**

CTE支持顺序依赖，后定义的CTE可引用已定义的CTE，但禁止循环引用：

```sql
WITH 
  base_data AS (
    SELECT product_id, sales_qty, sale_date FROM sales_2024
  ),
  daily_stats AS (
    SELECT product_id, SUM(sales_qty) AS day_total
    FROM base_data
    GROUP BY product_id, DATE(sale_date)
  ),
  top_products AS (
    SELECT product_id, AVG(day_total) AS avg_daily
    FROM daily_stats
    GROUP BY product_id
    HAVING avg_daily > 100
  )
SELECT * FROM top_products;
```

注意：`daily_stats`​引用`base_data`​是合法的前向依赖，但若`base_data`​反过来引用`top_products`则会产生语法错误。

##### 6.2.2 递归CTE

递归CTE并非简单的循环调用，而是基于迭代引擎的半连接操作。理解其执行原理对性能调优至关重要。

**执行模型拆解：**

以组织架构查询为例：

```sql
WITH RECURSIVE org_path AS (
  -- 锚点查询：仅执行一次
  SELECT emp_id, name, manager_id, 
         CAST(name AS CHAR(200)) AS path,
         0 AS depth
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- 递归查询：反复执行直至无新数据
  SELECT e.emp_id, e.name, e.manager_id,
         CONCAT(org_path.path, ' > ', e.name),
         org_path.depth + 1
  FROM employees e
  INNER JOIN org_path ON e.manager_id = org_path.emp_id
)
SELECT * FROM org_path LIMIT 100;
```

MySQL内部执行流程：

1. **初始化**：执行锚点查询，结果写入临时表`rec_tmp`
2. **迭代**：将`rec_tmp`​与`employees`​表做JOIN，新结果追加回`rec_tmp`
3. **终止**：当某次迭代返回0行，或达到`cte_max_recursion_depth`限制时停止

**关键参数监控：**

生产环境建议开启递归监控：

```sql
-- 查看当前递归深度限制（默认1000）
SHOW VARIABLES LIKE 'cte_max_recursion_depth';

-- 查看递归执行统计
SHOW STATUS LIKE 'Cte_recursion%';
-- Cte_recursion_executions：递归查询执行次数
-- Cte_recursion_iterations：总迭代次数

-- 对大数据集临时提升深度
SET SESSION cte_max_recursion_depth = 5000;
```

**深度限制的风险：**

过高的递归深度可能导致栈溢出或性能灾难。建议结合业务约束条件使用：

```sql
WITH RECURSIVE limited_org AS (
  SELECT emp_id, manager_id, 0 AS depth
  FROM employees WHERE emp_id = 10001
  
  UNION ALL
  
  SELECT e.emp_id, e.manager_id, limited_org.depth + 1
  FROM employees e
  JOIN limited_org ON e.manager_id = limited_org.emp_id
  WHERE limited_org.depth < 20  -- 显式深度约束
)
SELECT * FROM limited_org;
```

##### 6.2.3 性能陷阱与规避策略

**陷阱1：多次物化**

当CTE在查询中被引用多次，MySQL可能重复物化：

```sql
WITH sales_data AS (
  SELECT * FROM sales WHERE year = 2024
)
SELECT * 
FROM sales_data t1 
JOIN sales_data t2 ON t1.product_id = t2.product_id;
```

此时`sales_data`大概率被扫描两次。通过EXPLAIN可验证：若CTE定义后出现"MATERIALIZED"提示，则存在重复计算。

**规避方案**：对多次重用的大数据量CTE，改用临时表：

```sql
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_sales AS
SELECT * FROM sales WHERE year = 2024;

SELECT * FROM tmp_sales t1 JOIN tmp_sales t2 USING (product_id);
```

临时表的优势在于：

- 可添加索引：`ALTER TABLE tmp_sales ADD INDEX idx_prod(product_id);`
- 统计信息更准确，优化器选择更优
- 在同一会话中可多次复用

**陷阱2：递归CTE的索引缺失**

递归查询性能高度依赖JOIN字段的索引：

```sql
-- 无索引场景：每次迭代全表扫描
WITH RECURSIVE bad_example AS (...)
SELECT e.* FROM employees e JOIN bad_example ON e.manager_id = bad_example.emp_id;

-- 优化后：确保manager_id有索引
CREATE INDEX idx_mgr ON employees(manager_id);
```

可通过`SHOW PROFILE FOR QUERY`观察递归部分的扫表次数。

**陷阱3：过度复杂的CTE嵌套**

虽然CTE可嵌套定义，但深度超过3层后，优化器可能产生次优计划：

```sql
-- 不推荐：多层CTE嵌套
WITH c1 AS (...),
     c2 AS (SELECT * FROM c1 JOIN ...),
     c3 AS (SELECT * FROM c2 WHERE ...),
     c4 AS (SELECT * FROM c3 GROUP BY ...)
SELECT * FROM c4;

-- 推荐：合并逻辑，减少嵌套
WITH optimized AS (
  SELECT ...
  FROM large_table
  WHERE ... -- 将c2、c3条件合并
  GROUP BY ... -- 将c4聚合提前
)
SELECT * FROM optimized;
```

##### 6.2.4 版本差异与兼容性

**MySQL 5.7的局限性：**

若环境仍为5.7版本，需使用派生表模拟CTE（可读性较差）：

```sql
-- 5.7模拟CTE：需反复定义子查询
SELECT * FROM (
  SELECT region, AVG(total) FROM (
    SELECT region, SUM(amount) AS total FROM orders GROUP BY region, MONTH(order_date)
  ) AS monthly
) AS final;
```

**8.0+的优化器改进：**

8.0.29版本后，CTE支持`MERGE`​与`MATERIALIZED`优化器提示：

```sql
WITH cte AS (
  SELECT * FROM large_table WHERE status = 1
)
SELECT /*+ MERGE(cte) */ * FROM cte JOIN other_table USING (id);
-- 强制合并CTE到主查询，避免物化
```

**MariaDB的差异：**

MariaDB的CTE实现源自MySQL 5.7，但在10.6+版本支持`WITH RECURSIVE`​且允许在递归部分使用`LIMIT`：

```sql
-- MariaDB 10.6+ 支持（MySQL不支持）
WITH RECURSIVE r AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM r LIMIT 100
)
SELECT * FROM r;
```

##### 6.2.5 生产环境最佳实践

**场景1：数据血缘分析**

递归CTE适合追踪数据依赖链：

```sql
WITH RECURSIVE data_lineage AS (
  SELECT table_name, source_table, 0 AS level
  FROM metadata_tables WHERE table_name = 'dws_sales_summary'
  
  UNION ALL
  
  SELECT m.table_name, m.source_table, dl.level + 1
  FROM metadata_tables m
  JOIN data_lineage dl ON m.table_name = dl.source_table
)
SELECT REPEAT('  ', level) || table_name AS hierarchy
FROM data_lineage
ORDER BY level DESC;
```

**场景2：增量数据提取**

利用递归CTE模拟窗口函数（兼容旧版本）：

```sql
-- 获取每个用户的连续购买区间
WITH RECURSIVE user_sessions AS (
  SELECT user_id, purchase_date AS start_date, purchase_date AS end_date
  FROM purchases
  WHERE purchase_date = '2024-01-01'
  
  UNION ALL
  
  SELECT p.user_id, 
         CASE WHEN p.purchase_date = us.end_date + INTERVAL 1 DAY 
              THEN us.start_date ELSE p.purchase_date END,
         p.purchase_date
  FROM purchases p
  JOIN user_sessions us ON p.user_id = us.user_id
  WHERE p.purchase_date > us.end_date
)
SELECT user_id, MIN(start_date) AS session_start, MAX(end_date) AS session_end
FROM user_sessions
GROUP BY user_id, start_date;
```

**监控与告警：**

建议对递归CTE增加执行时长监控：

```sql
-- 在应用层设置超时
SET SESSION MAX_EXECUTION_TIME = 5000; -- 5秒超时

WITH RECURSIVE risky_query AS (...)
SELECT * FROM risky_query;
```

**禁止场景：**

CTE并非万能，以下场景应避免：

1. **需要跨会话共享结果**：CTE生命周期仅当前查询
2. **超大结果集多次引用**：优先考虑临时表+索引
3. **递归深度不可控**：如社交网络的六度人脉查询，需配合业务限制条件

#### 6.3 窗口函数优化

窗口函数通过单次表扫描实现跨行计算，将传统自连接或子查询的多次随机IO转化为顺序处理，在分析型查询场景中性能优势显著。MySQL 8.0引入窗口函数后，优化器对其支持持续完善，但实际性能表现高度依赖索引设计与内存配置。

**核心执行逻辑：**

窗口函数的计算分为三个阶段：分区（Partitioning）、排序（Ordering）、帧计算（Frame Evaluation）。以`ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY create_time)`​为例，执行器会先按照`user_id`​分组，每组内按`create_time`排序，最后遍历排序后的结果集分配行号。整个过程在内存中完成，若缓冲区不足则退化为磁盘临时表，性能骤降。

##### 6.3.1 索引依赖与执行计划解读

窗口函数能否利用索引有序性是性能分水岭。某社交平台曾出现用户行为分析查询耗时从0.3秒暴涨至45秒的案例，根源正是索引缺失导致全表排序。

**索引覆盖验证：**

```sql
CREATE TABLE user_behavior (
  user_id BIGINT NOT NULL,
  event_time DATETIME NOT NULL,
  event_type VARCHAR(20),
  INDEX idx_user_time (user_id, event_time)
) ENGINE=InnoDB;

-- 查询用户最近三次登录记录
EXPLAIN FORMAT=JSON
SELECT * FROM (
  SELECT 
    event_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time DESC) AS rn
  FROM user_behavior
  WHERE event_type = 'login'
) t WHERE rn <= 3;

-- 在optimizer_trace中观察
SET optimizer_trace = 'enabled=on';
SELECT * FROM information_schema.OPTIMIZER_TRACE\G
```

若索引有效，`EXPLAIN`​输出中`Extra`​显示`Using index`​，表示无需额外排序。若出现`Using index; Using filesort`​，说明索引未能覆盖排序需求。此时需检查`PARTITION BY`​与`ORDER BY`​字段是否与索引前缀完全匹配。对于`(user_id, event_time)`​索引，查询条件必须包含`user_id`的等值过滤，否则索引有序性无法利用。

**无索引场景的成本估算：**

无索引时，MySQL会分配`sort_buffer_size`​内存进行外部排序。若单分区数据量超过缓冲区，将触发磁盘合并排序。一次处理百万级订单的排行计算曾消耗12GB临时磁盘空间，导致实例IO饱和。监控此类问题需关注`slow_query_log`​中的`Rows_examined`​与`Filesort`标记。

##### 6.3.2 内存使用监控与调优

窗口函数的内存消耗与分区数量、每分区行数成正比。生产环境中，批量作业处理全量用户数据时极易触发OOM。

**实时内存监控：**

```sql
-- 查看当前会话窗口函数内存占用
SELECT 
  thread_id,
  current_allocated,
  high_allocated
FROM sys.memory_by_thread_by_current_bytes
WHERE thread_id = PS_THREAD_ID(CONNECTION_ID())
  AND event_name = 'memory/sql/Window::read_frame_buffer';

-- 全局监控：找出内存消耗TOP查询
SELECT 
  DIGEST_TEXT,
  SUM_CREATED_TMP_TABLES,
  SUM_SORT_ROWS,
  AVG_TIMER_WAIT / 1000000000 AS avg_time_ms
FROM performance_schema.events_statements_summary_by_digest
WHERE DIGEST_TEXT LIKE '%OVER%'
ORDER BY SUM_SORT_ROWS DESC 
LIMIT 10;
```

​`SUM_CREATED_TMP_TABLES`指标直接反映窗口函数是否退化为磁盘计算。对于频繁出现的查询，若该值持续增长，需考虑以下优化手段：

**参数调优实践：**

```sql
-- 对特定会话临时增大排序缓冲区（不推荐全局设置）
SET SESSION sort_buffer_size = 32 * 1024 * 1024; -- 32MB
SET SESSION read_rnd_buffer_size = 8 * 1024 * 1024; -- 8MB

-- 对超大分区查询，限制结果集范围
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
  FROM orders
  WHERE create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) -- 时间裁剪
) t WHERE rn <= 10;
```

某金融风控系统通过将`srt_buffer_size`从2MB调整为16MB，使月度账单计算耗时从180秒降至25秒。但需注意，会话级调整会影响连接内存占用，高并发场景下可能导致物理内存不足。

##### 6.3.3 性能对比与场景选择

窗口函数并非万能。在某电商平台订单去重场景中，误用窗口函数反而导致性能劣化。

**典型场景量化测试：**

测试表结构：`orders`​表5000万行，`(user_id, create_time)`有索引。

**场景一：查询每个用户最新订单（结果集小）**

```sql
-- 方案A：窗口函数
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY create_time DESC) AS rn
  FROM orders
  WHERE create_time >= '2024-01-01'
) t WHERE rn = 1;
-- 执行时间：1.2秒，扫描500万行

-- 方案B：关联子查询（5.7兼容）
SELECT o1.* FROM orders o1
INNER JOIN (
  SELECT user_id, MAX(create_time) AS max_time
  FROM orders
  WHERE create_time >= '2024-01-01'
  GROUP BY user_id
) o2 ON o1.user_id = o2.user_id AND o1.create_time = o2.max_time;
-- 执行时间：2.1秒，两次索引扫描
```

窗口函数胜出，因其仅需一次索引扫描。

**场景二：查询所有订单排名（结果集大）**

```sql
-- 不推荐：返回全量数据，窗口计算冗余
SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
FROM orders;

-- 推荐：将计算移出SQL，应用层处理
SELECT user_id, order_id, amount FROM orders;
-- 应用内存中分配rn，避免数据库排序压力
```

当查询返回行数超过总数据量30%时，窗口函数排序成本高于应用层处理。

##### 6.3.4 复杂Frame定义与性能陷阱

​`ROWS BETWEEN`​和`RANGE BETWEEN`定义了计算窗口帧，不当使用会导致内存爆炸。

**帧类型选择：**

```sql
-- 滑动平均：计算最近7天移动均值
SELECT 
  user_id,
  event_date,
  amount,
  AVG(amount) OVER (
    PARTITION BY user_id
    ORDER BY event_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS moving_avg
FROM transactions;

-- 若使用RANGE代替ROWS
AVG(amount) OVER (
  PARTITION BY user_id
  ORDER BY event_date
  RANGE BETWEEN INTERVAL 6 DAY PRECEDING AND CURRENT ROW
)
```

​`RANGE`​模式下，MySQL需动态维护日期区间内的所有行，内存结构更复杂。对5000万行交易表测试，`ROWS`​版本耗时12秒，而`RANGE`版本因频繁内存重分配耗时58秒。

**隐式帧的代价：**

未显式定义帧时，默认`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`​。某报表系统因遗漏帧定义，导致`SUM()`计算不必要的全分区累积，内存消耗超过50GB。正确做法是明确帧范围：

```sql
-- 错误：隐式全分区累积
SUM(salary) OVER (PARTITION BY dept_id ORDER BY emp_id) AS cum_sum

-- 正确：明确范围
SUM(salary) OVER (PARTITION BY dept_id ORDER BY emp_id 
                  ROWS UNBOUNDED PRECEDING) AS cum_sum
```

##### 6.3.5 版本演进与降级兼容

MySQL 5.7缺乏窗口函数支持，迁移至8.0时需评估改写成本。

**5.7模拟方案：**

使用用户变量模拟`ROW_NUMBER()`：

```sql
-- 5.7兼容写法（性能差，仅作临时方案）
SET @row_number = 0;
SET @user_id = NULL;

SELECT 
  user_id, amount,
  @row_number := IF(@user_id = user_id, @row_number + 1, 1) AS rn,
  @user_id := user_id
FROM orders
ORDER BY user_id, create_time DESC;
```

该方案依赖排序顺序，且无法利用索引，生产环境数据量超过百万即不可用。迁移8.0后应优先重构此类查询。

**8.0各版本优化差异：**

- 8.0.14：支持窗口函数使用常量作为帧边界
- 8.0.20：优化器可下推窗口函数后的LIMIT，减少计算量
- 8.0.28：修复深分区场景内存泄漏问题

建议生产环境至少使用8.0.28及以上版本，以获得稳定性能。升级后需重新验证关键查询的执行计划，确保无性能回退。

#### 6.4 派生条件下推（Derived Condition Pushdown）

派生条件下推是MySQL 8.0.22引入的关键优化特性，它将外层查询的谓词条件穿透派生表边界，直接作用于底层基表。这一优化避免了派生表的全量物化，将计算下推至存储引擎层，对复杂报表查询的性能提升可达数量级。

**核心优化逻辑：**

在8.0.22之前，派生表（子查询在FROM子句中）被视为黑盒。外层WHERE条件需等待派生表计算完成后才能应用，导致大量无效计算。下推机制通过语义等价变换，将外层条件与派生表内部条件合并，使存储引擎提前过滤数据页，减少扫描量。

##### 6.4.1 执行原理与改写规则

优化器的改写并非简单拼接WHERE条件，而是遵循严格的语义等价原则。以实际生产环境的订单宽表查询为例：

```sql
-- 业务场景：查询高价值已完成订单
SELECT order_id, amount, user_level
FROM (
  SELECT 
    o.order_id,
    o.amount,
    u.user_level,
    o.status
  FROM orders o
  JOIN users u ON o.user_id = u.user_id
  WHERE o.create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
) AS derived_table
WHERE derived_table.status = 'completed' 
  AND derived_table.amount > 10000;
```

8.0.22+优化器改写为：

```sql
SELECT o.order_id, o.amount, u.user_level
FROM orders o
JOIN users u ON o.user_id = u.user_id
WHERE o.create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND o.status = 'completed'
  AND o.amount > 10000;
```

**改写生效条件：**

1. 派生表必须是简单查询，不含`UNION / LIMIT / AGGREGATION`
2. 外层条件不能引用派生表中的聚合函数结果
3. 派生表字段在外层无表达式包裹（如`WHERE derived_table.amount * 1.1 > 10000`会阻断下推）
4. 派生表不是递归CTE

**失败案例：**

某ERP系统的库存查询因不符合条件导致下推失败：

```sql
-- 无法下推：派生表含LIMIT
SELECT * FROM (
  SELECT product_id, stock_qty FROM inventory ORDER BY update_time DESC LIMIT 1000
) t WHERE stock_qty < 10;

-- 无法下推：条件在聚合结果上
SELECT * FROM (
  SELECT user_id, SUM(amount) AS total_amount FROM orders GROUP BY user_id
) t WHERE total_amount > 10000;

-- 无法下推：条件含非确定性函数
SELECT * FROM (
  SELECT * FROM orders WHERE create_time >= NOW() - INTERVAL 1 DAY
) t WHERE amount > RAND() * 10000;
```

##### 6.4.2 性能量化分析与生产案例

某电商平台商品分析系统在升级至8.0.28后，大促期间的慢查询量从每小时2000次降至50次，核心优化正是派生条件下推。

**测试环境配置：**

- 实例规格：16核64GB
- 数据集：`orders`​表8000万行，`order_items`表2亿行
- 索引结构：`idx_status_create(status, create_time)`​、`idx_amount(amount)`

**场景：高金额待发货订单统计**

```sql
-- 原始查询（8.0.21）
SELECT COUNT(*) 
FROM (
  SELECT order_id, amount, status 
  FROM orders 
  WHERE create_time >= '2024-11-11 00:00:00'
) t 
WHERE status = 'pending' AND amount > 5000;
```

执行分析：

- 无下推时：扫描`create_time`范围内350万行，物化临时表后过滤剩12万行
- 执行耗时：3.8秒
- 临时表大小：2.1GB

**优化后（8.0.28）：**

```sql
-- 执行计划显示Using pushed condition
EXPLAIN FORMAT=JSON
SELECT ...;
-- 在json_output["query_block"]["table"]["pushed_condition"]中可查看下推条件
```

执行分析：

- 下推后：直接扫描复合条件12万行
- 执行耗时：0.4秒
- 无临时表生成

**性能提升幅度测算公式：**

提升倍数 ≈ (派生表返回行数 × 每行处理成本) / (下推后返回行数 × 每行处理成本)

当派生表返回行数是最终结果的10倍以上时，提升通常超过5倍。但需注意，若派生表本身过滤性极强（下推前后扫描行数接近），优化效果有限。

##### 6.4.3 版本演进与升级陷阱

**8.0.22的初始实现缺陷：**

早期版本仅支持简单派生表，且对`OR`条件处理不完善：

```sql
-- 8.0.22无法下推OR条件
SELECT * FROM (
  SELECT * FROM orders WHERE status = 'paid'
) t WHERE amount > 1000 OR user_level = 'VIP';

-- 需改写为UNION才能下推
SELECT * FROM (
  SELECT * FROM orders WHERE status = 'paid' AND amount > 1000
  UNION
  SELECT * FROM orders WHERE status = 'paid' AND user_level = 'VIP'
) t;
```

**8.0.29的增强支持：**

从8.0.29开始，支持派生表含`ORDER BY`时的条件重排：

```sql
-- 8.0.29+可下推（早期版本阻塞）
SELECT * FROM (
  SELECT * FROM orders WHERE status = 'completed' ORDER BY create_time DESC
) t WHERE amount > 5000 AND create_time >= '2024-01-01';
```

**升级回退风险：**

某系统从5.7升级至8.0.26后，部分报表查询出现性能回退。排查发现，这些查询依赖派生表的隐式排序（无`ORDER BY`但依赖子查询顺序），而下推改变了执行顺序。

**规避方案：**

1. 显式添加`ORDER BY`确保排序稳定
2. 查询级关闭下推：`SET SESSION optimizer_switch='derived_condition_pushdown=off'`
3. 对关键查询使用`NO_DERIVED_CONDITION_PUSHDOWN` HINT（8.0.30+支持）

```sql
-- 查询级禁用下推
SELECT /*+ NO_DERIVED_CONDITION_PUSHDOWN(t) */ * 
FROM (SELECT * FROM orders WHERE status = 1) t 
WHERE amount > 100;
```

##### 6.4.4 诊断与验证方法论

**确认下推是否生效：**

```sql
-- 方法1：EXPLAIN查看Extra列
EXPLAIN 
SELECT * FROM (SELECT * FROM orders WHERE status = 1) t WHERE amount > 100\G
-- 期望输出：Extra: Using where; Using pushed condition (t.amount > 100)

-- 方法2：optimizer_trace深度分析
SET optimizer_trace="enabled=on";
SELECT * FROM (SELECT * FROM orders WHERE status = 1) t WHERE amount > 100;
SELECT * FROM INFORMATION_SCHEMA.OPTIMIZER_TRACE\G

-- 在trace中搜索"condition_pushdown"，查看动作记录
-- "transformation": {
--   "select#": 2,
--   "transformations_to_derived_table": ["condition_pushdown"]
-- }
```

**性能对比测试：**

使用`BENCHMARK()`函数或手动压测：

```sql
-- 关闭下推对比
SET SESSION optimizer_switch = 'derived_condition_pushdown=off';
SELECT SQL_NO_CACHE * FROM ...; -- 记录耗时

SET SESSION optimizer_switch = 'derived_condition_pushdown=on';
SELECT SQL_NO_CACHE * FROM ...; -- 记录耗时

-- 或利用慢查询日志
SET long_query_time = 0;
-- 执行两次查询，慢日志中可看到精确耗时差异
```

**监控指标：**

关注`performance_schema`中的派生表相关指标：

```sql
SELECT 
  OBJECT_SCHEMA,
  OBJECT_NAME,
  COUNT_FETCH,
  SUM_TIMER_FETCH
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_NAME LIKE '%derived%'
ORDER BY SUM_TIMER_FETCH DESC;
```

若派生表IO等待在升级后显著下降，说明下推生效。

##### 6.4.5 生产环境最佳实践

**适用场景清单：**

优先在以下场景启用并验证：

1. **报表查询**：多层派生表嵌套，外层有过滤条件
2. **权限视图**：视图定义复杂，查询时带用户ID过滤
3. **ETL清洗**：CTE或派生表做转换，下游有过滤
4. **分页查询**：派生表计算总记录数，外层限制时间范围

**禁用场景：**

```sql
-- 1. 派生表含GROUP BY且外层条件在聚合结果上
-- 无法下推，应改用HAVING或子查询
SELECT * FROM (
  SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
) t WHERE cnt > 10; -- 无法下推

-- 改为
SELECT user_id, COUNT(*) AS cnt FROM orders 
GROUP BY user_id HAVING cnt > 10;

-- 2. 需要保留派生表顺序供后续处理
-- 关闭下推或显式ORDER BY
SELECT * FROM (
  SELECT * FROM orders WHERE status = 1 ORDER BY id LIMIT 100
) t WHERE amount > 100;
-- 下推会破坏LIMIT的顺序语义
```

**升级后验证流程：**

1. **基准测试**：升级前记录派生表查询的`EXPLAIN`与执行耗时
2. **灰度验证**：升级后对比执行计划，确认`Using pushed condition`出现
3. **监控告警**：监控慢查询日志中派生表相关SQL的耗时分布
4. **回滚预案**：准备会话级关闭下推的变更脚本，应对性能回退

某物流系统在升级至8.0.32后，发现派生条件下推与`Index Condition Pushdown`​存在交互Bug，导致特定条件下推后索引失效。最终通过`NO_DERIVED_CONDITION_PUSHDOWN` HINT临时规避，等待官方补丁。此案例说明新特性需经过生产流量充分验证。

#### 6.5 索引跳过扫描（Skip Scan）

索引跳过扫描是MySQL 8.0.13引入的优化策略，用于解决复合索引首列未出现在WHERE条件时的索引失效问题。当复合索引首列基数较低时，Skip Scan可将全表扫描转化为多次索引Range扫描，在特定数据分布下性能提升显著。

**执行机制与成本模型：**

传统索引使用遵循最左前缀原则，查询`WHERE b = 2`​无法利用索引`(a,b)`​。Skip Scan通过枚举首列`a`​的所有值，构造`a = const AND b = 2`​的Range扫描，最后合并结果。这一机制将单次全表扫描替换为N次索引查找，N即首列`a`的取值个数。

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:传统索引扫描;
note right
  WHERE b = 2
  索引(a,b)
  
  无法使用索引，全表扫描
end note

:索引跳过扫描;
note right
  WHERE b = 2
  索引(a,b)
  
  1. 遍历a的每个值
  2. 对每个a，在b中查找=2
  3. 合并结果
  
  代价：N个range查询
  适用：a的取值少
end note

stop

@enduml
```

该图描述了Skip Scan的核心思想：当首列`a`​的取值数N较小时，N次索引查找的成本远低于全表扫描。但`a`的取值超过一定阈值后，多次Range扫描的累积成本会超过全表扫描，此时优化器会放弃Skip Scan。

##### 6.5.1 适用场景量化分析

Skip Scan的收益取决于首列基数与数据量的比值。经验法则：首列选择性低于1%且查询过滤性较强时，优化效果显著。

**数据分布判断：**

```sql
-- 评估索引(a,b)是否适合Skip Scan
SELECT 
  COUNT(DISTINCT a) AS a_cardinality,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT a) / COUNT(*) AS a_selectivity,
  COUNT(DISTINCT b) / COUNT(*) AS b_selectivity
FROM your_table;

-- 当a_selectivity < 0.01（a取值少于100个）且b_selectivity在0.1-0.5之间时，Skip Scan收益最大
```

某零售企业的商品库存表`inventory`​包含索引`(warehouse_id, sku_id)`​，其中`warehouse_id`​仅5个取值，`sku_id`​有50万个。查询特定SKU的库存分布时，`WHERE sku_id = 12345`利用Skip Scan仅扫描5个Range，而非全表500万行，查询耗时从2.3秒降至0.03秒。

**执行计划识别：**

```sql
-- 验证Skip Scan是否生效
EXPLAIN FORMAT=JSON
SELECT * FROM inventory WHERE sku_id = 12345;

-- 在json_output["rows_estimate"]["range"]["skip_scan"]节点可看到：
-- "skip_scan": {
--   "type": "skip_scan",
--   "depth": 1,
--   "prefix_exhaustive": false,
--   "prefix_ranges": 5
-- }
```

若`EXPLAIN`​中`Extra`​列显示`Using index for skip scan`​，说明优化器已选择该路径。此时`type`​列为`range`​，但`key_len`可能短于索引全长，仅覆盖前缀列。

##### 6.5.2 生产环境验证与调优

某金融交易表`ticker_data`​包含索引`(symbol, trade_time)`，symbol约8000个取值，日均写入500万行。查询特定时间点的全市场快照时，Skip Scan的性能表现直接决定下游风控系统的响应速度。

**压力测试案例：**

```sql
CREATE TABLE ticker_data (
  symbol VARCHAR(10) NOT NULL,
  trade_time DATETIME NOT NULL,
  price DECIMAL(10,2),
  volume BIGINT,
  INDEX idx_symbol_time (symbol, trade_time)
) ENGINE=InnoDB;

-- 模拟查询：查找2024-01-15 14:30:00所有股票的价格
EXPLAIN ANALYZE
SELECT /*+ SKIP_SCAN(td idx_symbol_time) */ *
FROM ticker_data td
WHERE trade_time = '2024-01-15 14:30:00';
```

​`ANALYZE`输出显示：

- 实际执行时间：0.18秒
- 扫描行数：8000次索引查找，共读取2.4万行
- 对比全表扫描：需读取2.1亿行，超时600秒

**参数调优实践：**

Skip Scan受`range_optimizer_max_mem_size`限制，用于控制Range组合的最大内存消耗。默认值1536000字节约支持1000个组合。

```sql
-- 查看当前阈值
SHOW GLOBAL VARIABLES LIKE 'range_optimizer_max_mem_size';

-- 对超大数据集临时调整（不推荐全局设置）
SET SESSION range_optimizer_max_mem_size = 10 * 1024 * 1024; -- 10MB

-- 监控Range扫描次数
SELECT * FROM performance_schema.events_statements_summary_by_digest
WHERE DIGEST_TEXT LIKE '%SKIP_SCAN%'
ORDER BY SUM_TIMER_WAIT DESC;
```

当首列取值超过`range_optimizer_max_mem_size`限制时，优化器会静默回退至全表扫描。某日志表查询因日期分区列在索引首位，取值达3650个，触发内存限制导致Skip Scan失效。调整参数后，查询从600秒降至4秒。

##### 6.5.3 不适用场景与优化器决策

Skip Scan并非万能，不当使用会导致性能劣化。理解其不适用场景对调优至关重要。

**高选择性首列：**

当首列`a`​的取值超过1000个时，多次Range扫描的累积成本可能超过全表扫描。某用户表索引`(region, user_id)`​，region有2000个取值，查询`WHERE user_id = 10001`时使用Skip Scan需扫描2000次，成本高于全表顺序IO。

**优化器决策逻辑：**

MySQL通过`cost_model`评估两种路径成本：

- 全表扫描成本：`N_page * IO_BLOCK_READ_COST + N_row * ROW_EVALUATE_COST`
- Skip Scan成本：`a_cardinality * (index_height + fanout) + N_row * ROW_EVALUATE_COST`

当Skip Scan成本 > 全表扫描成本 × 1.1时，优化器放弃该策略。可通过`EXPLAIN`验证：

```sql
-- 强制对比两种执行方式
SELECT * FROM skip_scan_test WHERE b = 50; -- 优化器自动选择
SELECT /*+ SKIP_SCAN(t idx_a_b) */ * FROM skip_scan_test t WHERE b = 50; -- 强制Skip Scan
SELECT /*+ NO_SKIP_SCAN(t idx_a_b) */ * FROM skip_scan_test t WHERE b = 50; -- 强制全表扫描
```

若强制HINT后耗时反而增加，说明优化器决策正确，应检查数据分布是否发生变化。

**复合条件限制：**

当查询包含首列范围查询时，Skip Scan无法生效：

```sql
-- 无法使用Skip Scan
SELECT * FROM skip_scan_test WHERE a > 2 AND b = 50;

-- 可改写为UNION（代价高）
SELECT * FROM skip_scan_test WHERE a = 3 AND b = 50
UNION ALL
SELECT * FROM skip_scan_test WHERE a = 4 AND b = 50;
```

此类场景应考虑反转索引列顺序，创建`(b, a)`索引以满足查询模式。

##### 6.5.4 索引设计配合

Skip Scan的有效性依赖索引物理结构。在设计阶段有意控制首列基数，可为后续查询优化预留空间。

**设计范式：**

某SaaS平台的租户表设计：

```sql
-- 原始索引：tenant_id选择性过高
INDEX idx_tenant_user (tenant_id, user_id)

-- 改写：增加低选择性的业务类型列
ALTER TABLE user_actions DROP INDEX idx_tenant_user;
ALTER TABLE user_actions ADD INDEX idx_type_tenant_user (action_type, tenant_id, user_id);
-- action_type仅有3个取值（page_view, click, purchase）

-- 查询跨租户的某类行为时，可利用Skip Scan
SELECT * FROM user_actions WHERE action_type = 'click' AND user_id = 10001;
```

通过将低选择性列前置，使多种查询模式都能受益。

**索引维护成本：**

Skip Scan虽提升查询性能，但不会增加索引维护成本。然而，为支持该特性而刻意调整索引列顺序，可能影响其他查询。需使用`pt-index-usage`​或MySQL 8.0的`schema_table_index_statistics`评估索引全局使用率：

```sql
SELECT 
  table_name,
  index_name,
  rows_selected,
  rows_inserted
FROM performance_schema.table_index_statistic
WHERE table_name = 'skip_scan_test'
ORDER BY rows_selected DESC;
```

若调整列顺序后，其他高频查询的索引命中率下降10%以上，需重新权衡设计。

##### 6.5.5 版本演进与Bug规避

**8.0.13-8.0.18的局限性：**

早期版本Skip Scan存在稳定性问题。某系统在8.0.16遇到Bug#30528850：当派生表使用Skip Scan时，结果集可能出现重复行。临时规避方案为：

```sql
-- 禁用该查询的Skip Scan
SELECT /*+ NO_SKIP_SCAN(t idx_a_b) */ * FROM (... derived_table ...) t WHERE b = 50;
```

**8.0.19+的增强：**

8.0.19支持`ORDER BY`​与Skip Scan配合，优化器能正确计算排序成本。之前的版本中，`ORDER BY b`会阻断Skip Scan选择。

**升级验证清单：**

1. **执行计划回归测试**：对比升级前后`EXPLAIN`​输出，确保关键查询`Extra`​仍包含`Using index for skip scan`
2. **慢查询日志分析**：筛选`Full_scan`​标记的查询，检查是否因`range_optimizer_max_mem_size`限制导致Skip Scan失效
3. **负载测试**：使用`sysbench`​模拟高并发Skip Scan查询，监控`Handler_read_key`​与`Handler_read_next`指标，确保无性能回退

某互联网公司在升级至8.0.30后，发现历史数据查询因统计信息过期导致Skip Scan成本估算错误。通过`ANALYZE TABLE`更新直方图后，优化器重新选择Skip Scan，查询性能恢复。

**生产环境监控建议：**

在Prometheus监控体系中增加自定义Exporter，抓取`information_schema.INNODB_METRICS`​中的`index_skip_scan_count`指标，量化Skip Scan使用频率。若该值在总查询中占比低于1%，可能意味着索引设计未充分利用此优化特性。

### 第7章 特殊查询场景优化

#### 7.1 模糊查询优化

##### **7.1.1 LIKE查询优化**

**LIKE性能分析：**

```sql
-- 前缀匹配（走索引）
EXPLAIN SELECT * FROM users WHERE name LIKE '张%'\G
-- type: range
-- key: idx_name

-- 后缀匹配（可能走索引）
EXPLAIN SELECT * FROM users WHERE name LIKE '%三'\G
-- type: index（全文扫描索引）
-- 或ALL（全表扫描）

-- 包含匹配（不走索引）
EXPLAIN SELECT * FROM users WHERE name LIKE '%三%'\G
-- type: ALL

-- 前缀索引优化
ALTER TABLE users ADD INDEX idx_name_rev (REVERSE(name));

-- 查询反转
SELECT * FROM users WHERE REVERSE(name) LIKE REVERSE('%三');
-- 转换后缀为前缀
```

**全文索引替代LIKE：**

```sql
-- 创建全文索引
CREATE TABLE articles (
  id BIGINT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  FULLTEXT KEY ft_content (content)
) ENGINE=InnoDB;

-- 查询
SELECT * FROM articles WHERE MATCH(content) AGAINST ('关键词');

-- vs LIKE
SELECT * FROM articles WHERE content LIKE '%关键词%';
-- 全表扫描，性能差

-- 全文索引优势：
-- 1. 分词
-- 2. 倒排索引
-- 3. 相关性排序
-- 4. 布尔搜索
-- 5. 扩展搜索

-- 限制：
-- 1. 最小词长（默认4）
-- 2. 停词表
-- 3. 50%阈值（MyISAM）
-- 4. 仅支持CHAR/VARCHAR/TEXT
```

##### **7.1.2 全文索引高级用法**

**中文分词优化：**

```sql
-- ngram配置
SET GLOBAL ngram_token_size = 2;  -- 2个字符

-- 创建索引
CREATE TABLE chinese_docs (
  id BIGINT PRIMARY KEY,
  content TEXT,
  FULLTEXT KEY ft_content (content) WITH PARSER ngram
) ENGINE=InnoDB;

-- 查询
SELECT * FROM chinese_docs WHERE MATCH(content) AGAINST ('数据库');

-- 搜索模式
-- 自然语言模式（默认）
SELECT * FROM chinese_docs 
WHERE MATCH(content) AGAINST ('MySQL 优化' IN NATURAL LANGUAGE MODE);

-- 布尔模式
SELECT * FROM chinese_docs
WHERE MATCH(content) AGAINST ('+MySQL -Oracle' IN BOOLEAN MODE);
-- + 必须存在
-- - 必须不存在
-- > 相关性增加
-- < 相关性减少
-- * 前缀通配
-- " " 短语搜索

-- 查询扩展
SELECT * FROM chinese_docs
WHERE MATCH(content) AGAINST ('数据库' WITH QUERY EXPANSION);
-- 先精确匹配"数据库"
-- 再匹配包含精确结果中词的文档

-- 停词表配置
-- 查看停词
SELECT * FROM information_schema.innodb_ft_default_stopword;

-- 自定义停词表
CREATE TABLE my_stopwords(value VARCHAR(30)) ENGINE=InnoDB;
INSERT INTO my_stopwords VALUES ('的'), ('了'), ('在');

SET GLOBAL innodb_ft_server_stopword_table = 'db/my_stopwords';

-- 最小词长配置
SET GLOBAL innodb_ft_min_token_size = 2;  -- 默认3
SET GLOBAL innodb_ft_max_token_size = 10;  -- 最大10

-- 重建全文索引
ALTER TABLE chinese_docs DROP INDEX ft_content;
ALTER TABLE chinese_docs ADD FULLTEXT INDEX ft_content (content) WITH PARSER ngram;

-- 监控全文索引
SELECT * FROM information_schema.innodb_ft_index_cache;
SELECT * FROM information_schema.innodb_ft_index_table;

-- 性能提升：LIKE '%关键词%' vs MATCH
-- LIKE：10秒
-- MATCH：0.1秒
-- 提升：100倍
```

**全文索引弊端：**

```sql
-- 1. 写入性能下降
-- 每次INSERT需更新倒排索引
-- 测试：写入性能下降30%

-- 2. 空间占用
-- 索引大小约为数据大小的50%

-- 3. 50%阈值
-- MyISAM中，若词在50%以上文档出现，视为停用词
-- InnoDB无此限制

-- 4. 不支持中文分词（ngram有限）
-- 推荐专业搜索引擎：
-- Elasticsearch（支持IK分词）
-- MeiliSearch
-- Sphinx
```

**全文索引生产案例：**

```sql
-- 场景：文章搜索

-- 原：LIKE查询
SELECT * FROM articles 
WHERE title LIKE '%MySQL优化%' OR content LIKE '%MySQL优化%';
-- 耗时：5秒，全表扫描

-- 新：全文索引
ALTER TABLE articles ADD FULLTEXT INDEX ft_title_content (title, content) WITH PARSER ngram;

-- 查询
SELECT 
  id, title,
  MATCH(title, content) AGAINST ('MySQL优化') AS relevance
FROM articles
WHERE MATCH(title, content) AGAINST ('MySQL优化')
ORDER BY relevance DESC
LIMIT 20;

-- 耗时：50ms，走索引

-- 高亮显示（8.0+）
SELECT 
  id,
  title,
  MATCH(title, content) AGAINST ('MySQL优化') AS relevance,
  TRIM(SUBSTRING_INDEX(
    SUBSTRING_INDEX(content, '优化', 1), 
    'MySQL', -1
  )) AS snippet
FROM articles
WHERE MATCH(title, content) AGAINST ('MySQL优化');
```

#### 7.2 JSON查询优化

##### **7.2.1 虚拟列与索引**

**JSON性能问题：**

```sql
-- 表结构
CREATE TABLE json_table (
  id BIGINT PRIMARY KEY,
  profile JSON
) ENGINE=InnoDB;

-- 查询（无法使用索引）
EXPLAIN SELECT * FROM json_table WHERE profile->>'$.name' = '张三'\G
-- type: ALL
-- 扫描所有行，JSON_EXTRACT逐行解析

-- 解决方案：虚拟列 + 索引
ALTER TABLE json_table 
ADD COLUMN name VARCHAR(50) AS (profile->>'$.name'),  -- 虚拟列
ADD INDEX idx_name (name);

-- 查询改写
SELECT * FROM json_table WHERE name = '张三';

-- EXPLAIN
-- type: ref
-- key: idx_name

-- 性能提升：
-- 原查询：10秒
-- 优化后：10ms
```

##### **7.2.2 多值索引**

MySQL 8.0.17+支持多值索引。

```sql
-- 场景：JSON数组查询
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  tags JSON,
  INDEX idx_tags ((CAST(tags AS UNSIGNED ARRAY)))  -- 多值索引
) ENGINE=InnoDB;

-- 插入数据
INSERT INTO products VALUES (1, '[1, 5, 10]');

-- 查询
SELECT * FROM products WHERE JSON_CONTAINS(tags, '5');

-- EXPLAIN
-- type: range
-- key: idx_tags

-- 支持函数
-- JSON_CONTAINS
-- MEMBER OF
-- JSON_OVERLAPS

-- 性能对比：
-- 无索引：全表扫描，1秒
-- 多值索引：索引扫描，10ms
```

##### **7.2.3 JSON性能最佳实践**

```sql
-- 1. 避免大JSON（>64KB）
-- 拆分为多行

-- 2. 常用字段提取为虚拟列
ALTER TABLE json_table 
ADD COLUMN user_name VARCHAR(50) AS (profile->>'$.name'),
ADD COLUMN user_age INT AS (profile->>'$.age'),
ADD INDEX idx_user_name (user_name),
ADD INDEX idx_user_age (user_age);

-- 3. 使用JSON_VALID约束
ALTER TABLE json_table 
ADD CONSTRAINT chk_profile CHECK (JSON_VALID(profile));

-- 4. 更新部分字段
UPDATE json_table 
SET profile = JSON_SET(profile, '$.age', 26)
WHERE id = 1;
-- 优于：全量更新JSON

-- 5. 监控JSON大小
SELECT 
  id,
  LENGTH(profile) AS json_bytes,
  LENGTH(profile) / 1024 AS json_kb
FROM json_table
ORDER BY json_bytes DESC
LIMIT 10;
```

#### 7.3 地理空间查询优化

##### **7.3.1 空间索引创建**

```sql
-- 创建空间索引表
CREATE TABLE locations (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100),
  coordinates POINT NOT NULL SRID 4326,
  area POLYGON NOT NULL SRID 4326,
  SPATIAL INDEX idx_coordinates (coordinates),
  SPATIAL INDEX idx_area (area)
) ENGINE=InnoDB;

-- 插入数据
INSERT INTO locations VALUES (
  1,
  '北京市',
  ST_Point(116.40, 39.90, 4326),
  ST_GeomFromText('POLYGON((116.0 39.6, 116.8 39.6, 116.8 40.2, 116.0 40.2, 116.0 39.6))', 4326)
);

-- 常见错误
-- 1. 未指定SRID
CREATE TABLE wrong (
  location POINT,
  SPATIAL INDEX idx_location (location)
);  -- 创建失败，必须指定SRID

-- 2. SRID不匹配
INSERT INTO locations (coordinates) VALUES (ST_Point(116, 39, 0));
-- 错误：SRID 0与4326不匹配
```

##### **7.3.2 空间查询函数**

```sql
-- 距离查询
-- 点与点距离
SELECT * FROM locations
WHERE ST_Distance_Sphere(coordinates, ST_Point(116.41, 39.91, 4326)) <= 1000;
-- 单位：米

-- 点与点距离（平面）
SELECT * FROM locations
WHERE ST_Distance(coordinates, ST_Point(116.41, 39.91, 4326)) <= 0.01;
-- 单位：度（SRID 4326）

-- 包含查询
SELECT * FROM locations
WHERE ST_Contains(area, ST_Point(116.40, 39.90, 4326));

-- 相交查询
SELECT * FROM locations
WHERE ST_Intersects(area, 
  ST_GeomFromText('POLYGON(...)', 4326)
);

-- 边界框查询
SELECT * FROM locations
WHERE MBRContains(
  ST_MakeEnvelope(116.0, 39.6, 116.8, 40.2, 4326),
  coordinates
);
```

##### **7.3.3 性能优化**

**空间索引优化案例：**

```sql
-- 场景：查找附近10公里商家

-- 反例：直接距离查询
SELECT * FROM merchants
WHERE ST_Distance_Sphere(location, @user_point) <= 10000;
-- 无法使用空间索引，全表扫描

-- 正例1：范围框过滤+索引
SET @lat = 39.90, @lng = 116.40, @dist = 10000;
SET @dlat = @dist / 111000;
SET @dlng = @dist / (111000 * COS(RADIANS(@lat)));

SELECT * FROM merchants
WHERE MBRContains(
    ST_MakeEnvelope(@lng-@dlng, @lat-@dlat, @lng+@dlng, @lat+@dlat, 4326),
    location
)
AND ST_Distance_Sphere(location, ST_Point(@lng, @lat, 4326)) <= @dist;

-- EXPLAIN：
-- type: range
-- key: idx_location
-- Extra: Using where

-- 正例2：Geohash网格化
-- 添加Geohash列
ALTER TABLE merchants ADD COLUMN geohash VARCHAR(12);
UPDATE merchants SET geohash = ST_GeoHash(location, 6);

-- 查询附近
SELECT * FROM merchants
WHERE geohash = ST_GeoHash(@user_point, 6)
  AND ST_Distance_Sphere(location, @user_point) <= @dist;

-- 正例3：空间分区
-- 按省份分区
CREATE TABLE merchants_geo (
  id BIGINT,
  location POINT,
  province_id INT
) ENGINE=InnoDB
PARTITION BY LIST(province_id) (
  PARTITION p0 VALUES IN (1),
  PARTITION p1 VALUES IN (2),
  ...
);

-- 查询时指定分区
SELECT * FROM merchants_geo PARTITION (p1)
WHERE MBRContains(...);

-- 性能对比：
-- 直接距离：10秒
-- 范围框+索引：100ms
-- Geohash：50ms
-- 空间分区：20ms
```

##### **7.3.4 PostGIS替代方案**

MySQL空间功能有限，PostGIS是专业选择。

```sql
-- PostGIS优势
-- 1. 200+空间函数
-- 2. R-Tree GIST索引
-- 3. 支持3D、4D
-- 4. 空间连接
-- 5. 地理处理

-- MySQL迁移PostGIS方案
-- 1. 数据导出
mysqldump -t -c geo_db locations > locations.sql

-- 2. 转换格式
-- 修改SQL语法

-- 3. PostGIS导入
psql geo_db -c "CREATE EXTENSION postgis;"
psql geo_db < locations.sql

-- 4. 查询改写
-- MySQL: SELECT * FROM locations WHERE ST_Distance_Sphere(...) <= 1000
-- PostGIS: SELECT * FROM locations WHERE ST_DWithin(..., 1000)
```

#### 7.4 树形结构查询

##### **7.4.1 邻接表模型**

传统设计，父ID关联。

```sql
-- 表结构
CREATE TABLE categories_adj (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  parent_id BIGINT,
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB;

-- 数据
INSERT INTO categories_adj VALUES
(1, '电子产品', NULL),
(2, '手机', 1),
(3, '笔记本', 1),
(4, '苹果手机', 2),
(5, '华为手机', 2);

-- 查询直接子节点
SELECT * FROM categories_adj WHERE parent_id = 1;  -- 手机、笔记本

-- 查询所有后代（需递归）
-- MySQL 8.0+ CTE
WITH RECURSIVE sub_tree AS (
  SELECT * FROM categories_adj WHERE id = 1
  UNION ALL
  SELECT c.* FROM categories_adj c
  JOIN sub_tree s ON c.parent_id = s.id
)
SELECT * FROM sub_tree;

-- 性能：O(n)，每层一次查询
-- 缺点：深层查询效率低
```

##### **7.4.2 路径枚举模型**

存储完整路径。

```sql
CREATE TABLE categories_path (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  path VARCHAR(255)  -- 路径字符串，如1/2/4
) ENGINE=InnoDB;

INSERT INTO categories_path VALUES
(4, '苹果手机', '1/2/4'),
(5, '华为手机', '1/2/5');

-- 查询所有后代
SELECT * FROM categories_path WHERE path LIKE '1/2%';
-- 走索引

-- 查询所有祖先
SELECT * FROM categories_path 
WHERE '1/2/4' LIKE CONCAT(path, '%');

-- 优点：查询简单
-- 缺点：
-- 1. 路径长度限制
-- 2. 更新需维护所有子节点
-- 3. 路径校验复杂
-- 4. 性能随深度下降
```

##### **7.4.3 闭包表模型**

单独存储祖先-后代关系。

```sql
CREATE TABLE categories (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE category_tree (
  ancestor BIGINT,
  descendant BIGINT,
  depth INT,  -- 深度
  PRIMARY KEY (ancestor, descendant),
  INDEX idx_descendant (descendant),
  INDEX idx_depth (depth)
) ENGINE=InnoDB;

-- 插入节点
INSERT INTO categories VALUES (1, '电子产品');
INSERT INTO category_tree VALUES (1, 1, 0);  -- 自关联

-- 插入子节点
INSERT INTO categories VALUES (2, '手机');
-- 插入所有祖先关系
INSERT INTO category_tree 
SELECT t.ancestor, 2, t.depth + 1
FROM category_tree t
WHERE t.descendant = 1
UNION ALL
SELECT 2, 2, 0;

-- 查询所有后代
SELECT c.* FROM categories c
JOIN category_tree t ON c.id = t.descendant
WHERE t.ancestor = 1 AND t.depth > 0;

-- 查询所有祖先
SELECT c.* FROM categories c
JOIN category_tree t ON c.id = t.ancestor
WHERE t.descendant = 4 AND t.depth > 0;

-- 查询直接子节点
SELECT c.* FROM categories c
JOIN category_tree t ON c.id = t.descendant
WHERE t.ancestor = 1 AND t.depth = 1;

-- 优点：查询灵活
-- 缺点：插入复杂，需维护关系
```

##### **7.4.4 嵌套集合模型**

使用左右值存储树。

```sql
CREATE TABLE categories_nested (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  lft BIGINT,
  rgt BIGINT
) ENGINE=InnoDB;

-- 插入数据（需预计算左右值）
INSERT INTO categories_nested VALUES
(1, '电子产品', 1, 10),
(2, '手机', 2, 5),
(3, '笔记本', 6, 9),
(4, '苹果手机', 3, 4);

-- 查询所有后代
SELECT * FROM categories_nested 
WHERE lft BETWEEN 2 AND 5;  -- 手机的后代

-- 查询所有祖先
SELECT * FROM categories_nested 
WHERE lft < 3 AND rgt > 4;  -- 苹果手机的祖先

-- 查询子树大小
SELECT (rgt - lft - 1) / 2 AS children_count
FROM categories_nested 
WHERE id = 2;

-- 优点：
-- 1. 查询高效
-- 2. 无需递归

-- 缺点：
-- 1. 插入/更新复杂（需调整所有节点）
-- 2. 不适合频繁写入
```

**模型对比总结：**

|模型|查询子树|查询祖先|插入|更新|适用场景|
| ----------| ----------| ----------| ----------| ----------| ----------|
|邻接表|O(n)|O(n)|O(1)|O(1)|写入频繁|
|路径枚举|O(1)|O(1)|O(1)|O(n)|查询频繁|
|闭包表|O(1)|O(1)|O(log n)|O(log n)|读写均衡|
|嵌套集合|O(1)|O(1)|O(n)|O(n)|静态树|

**生产建议：**

```sql
-- 推荐：邻接表 + CTE递归（MySQL 8.0+）
-- 简单，性能可接受

-- 次选：闭包表
-- 查询性能最佳，插入稍复杂

-- 不推荐：嵌套集合
-- 更新性能差

-- 大数据量：专用图数据库（Neo4j）
```

---

## 第三部分：配置调优篇 - 让硬件发挥极致

### 第8章 MySQL参数调优指南

#### 8.1 内存参数调优

##### **8.1.1 InnoDB缓冲池调优**

缓冲池是性能最关键的内存区域。

**缓冲池配置黄金法则：**

```ini
# 公式：innodb_buffer_pool_size = 系统内存 * 0.75
# 示例：64GB内存服务器
innodb_buffer_pool_size = 48G

# 实例数：innodb_buffer_pool_instances = 缓冲池大小 / 1G
innodb_buffer_pool_instances = 16

# 旧块比例：减少全表扫描污染
innodb_old_blocks_pct = 25  # 默认37%，可调低

# 旧块时间：新页进入old区停留时间
innodb_old_blocks_time = 1000  # 默认1000ms
```

**缓冲池监控指标：**

```sql
-- 1. 命中率（理想>99%）
SELECT 
  (1 - Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests) * 100 AS hit_rate
FROM (
  SELECT 
    MAX(IF(VARIABLE_NAME='Innodb_buffer_pool_reads', VARIABLE_VALUE, 0)) AS Innodb_buffer_pool_reads,
    MAX(IF(VARIABLE_NAME='Innodb_buffer_pool_read_requests', VARIABLE_VALUE, 0)) AS Innodb_buffer_pool_read_requests
  FROM performance_schema.global_status
  WHERE VARIABLE_NAME IN ('Innodb_buffer_pool_reads', 'Innodb_buffer_pool_read_requests')
) t;

-- 2. 脏页比例（应<75%）
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_pages_dirty';  -- 脏页数
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_pages_total';  -- 总页数

-- 计算
SELECT 
  Innodb_buffer_pool_pages_dirty / Innodb_buffer_pool_pages_total * 100 AS dirty_pct
FROM (
  SELECT 
    MAX(IF(VARIABLE_NAME='Innodb_buffer_pool_pages_dirty', VARIABLE_VALUE, 0)) AS Innodb_buffer_pool_pages_dirty,
    MAX(IF(VARIABLE_NAME='Innodb_buffer_pool_pages_total', VARIABLE_VALUE, 0)) AS Innodb_buffer_pool_pages_total
  FROM performance_schema.global_status
) t;

-- 3. 缓冲池状态
SHOW ENGINE INNODB STATUS\G
-- Buffer pool size   321536  -- 页数（16KB/页）
-- Free buffers       1024    -- 空闲页
-- Database pages     320000
-- Old database pages 118000
-- Modified db pages  1200    -- 脏页

-- 4. 使用sys库
SELECT * FROM sys.memory_global_total;
SELECT * FROM sys.memory_by_host_by_current_bytes;
```

**缓冲池动态调整：**

```sql
-- MySQL 5.7+支持在线调整
SET GLOBAL innodb_buffer_pool_size = 32 * 1024 * 1024 * 1024;  -- 32GB

-- 监控调整进度
SHOW STATUS LIKE 'Innodb_buffer_pool_resize_status';
-- 输出：Resizing buffer pool from 48.0G to 32.0G (126075 pages).

-- 调整完成
SHOW STATUS LIKE 'Innodb_buffer_pool_resize_status';
-- 输出：Completed resizing buffer pool at 240123 10:00:00.

-- 注意：调整期间性能可能下降
-- 建议在低峰期操作
```

##### **8.1.2 其他内存区域调优**

```ini
# 1. InnoDB日志缓冲
# 大事务场景增大
innodb_log_buffer_size = 128M  # 默认16M

# 2. 排序缓冲（每个线程）
# 增大可减少filesort磁盘临时文件
sort_buffer_size = 4M  # 默认256K

# 3. JOIN缓冲（每个线程）
# BNL使用
join_buffer_size = 4M  # 默认256K

# 4. 读缓冲（每个线程）
# 全表扫描使用
read_buffer_size = 2M  # 默认128K

# 5. 随机读缓冲（每个线程）
# ORDER BY优化
read_rnd_buffer_size = 4M  # 默认256K

# 6. 临时表内存限制
tmp_table_size = 64M  # 默认16M
max_heap_table_size = 64M  # 必须与tmp_table_size一致

# 7. 表缓存
table_open_cache = 10000  # 根据表数量调整
table_definition_cache = 5000  # 表定义缓存

# 8. MyISAM缓冲（如使用）
key_buffer_size = 256M  # MyISAM索引缓冲

# 9. 线程缓存
thread_cache_size = 100  # 线程复用

# 10. 查询缓存（8.0已移除）
query_cache_type = OFF
query_cache_size = 0

# 11. 二进制日志缓冲（主库）
binlog_cache_size = 4M
max_binlog_cache_size = 1G

# 12. 线程池内存（企业版）
thread_pool_size = 16
```

**内存使用上限计算：**

```sql
-- 计算公式
max_memory = 
  innodb_buffer_pool_size
  + key_buffer_size
  + innodb_log_buffer_size
  + max_connections * (
      sort_buffer_size 
      + join_buffer_size 
      + read_buffer_size 
      + read_rnd_buffer_size 
      + thread_stack
    )
  + tmp_table_size * 最大临时表数
  + binlog_cache_size * max_connections
  + 其他（如performance_schema）

-- 示例计算（64GB内存）
-- innodb_buffer_pool_size: 48G
-- key_buffer_size: 0
-- innodb_log_buffer_size: 0.128G
-- max_connections: 2000
-- sort_buffer_size: 4M
-- join_buffer_size: 4M
-- read_buffer_size: 2M
-- read_rnd_buffer_size: 4M
-- thread_stack: 0.256M

-- 线程内存 = 2000 * (4 + 4 + 2 + 4 + 0.256)≈ 28G
-- 临时表 = 64M * 50 = 3G
-- Binlog = 4M * 2000 = 8G

-- 总计 = 48 + 0.128 + 28 + 3 + 8 + 2(预留) ≈ 89G > 64G
-- 需调整参数！

-- 调整后：
-- sort_buffer_size: 1M
-- join_buffer_size: 1M
-- read_buffer_size: 0.5M
-- read_rnd_buffer_size: 1M
-- 线程内存 = 2000 * (1 + 1 + 0.5 + 1 + 0.256)≈ 7.5G
-- 总计 = 48 + 0.128 + 7.5 + 3 + 8 + 2 ≈ 68G ≈ 64G（安全）
```

#### 8.2 IO参数调优

```ini
# 1. InnoDB刷盘方法
# O_DIRECT：绕过OS缓存（推荐SSD）
# O_DIRECT_NO_FSYNC：跳过fsync（8.0+，需硬件保护）
innodb_flush_method = O_DIRECT

# 2. 日志刷盘策略
# 1: 每次提交fsync（安全，默认）
# 2: 写缓存，每秒fsync（性能较好）
innodb_flush_log_at_trx_commit = 1  # 主库
innodb_flush_log_at_trx_commit = 2  # 从库/非核心

# 3. Redo Log大小
innodb_log_file_size = 2G  # 每个文件，建议1-4G
innodb_log_files_in_group = 2  # 文件数

# 4. IO容量（SSD设为最大）
innodb_io_capacity = 2000  # SATA SSD
innodb_io_capacity = 8000  # NVMe SSD
innodb_io_capacity_max = 4000  # 最大IO

# 5. 脏页比例（控制刷盘频率）
innodb_max_dirty_pages_pct = 75  # 默认75
innodb_max_dirty_pages_pct_lwm = 0  # 低水位线，0表示禁用

# 6. 刷盘相邻页
innodb_flush_neighbors = 0  # SSD设为0
# innodb_flush_neighbors = 2  # HDD设为2

# 7. LRU扫描深度
innodb_lru_scan_depth = 4096  # 默认1024，控制刷盘力度

# 8. 双写缓冲
innodb_doublewrite = ON  # 默认ON，SSD不建议关闭

# 9. 页面检查点
innodb_fast_shutdown = 0  # 完全刷盘，启动快

# 10. 预读
innodb_read_ahead_threshold = 56  # 顺序读触发预读
```

**IO监控指标：**

```sql
-- 1. 慢查询中的IO
SHOW STATUS LIKE 'Innodb_data%';
-- Innodb_data_reads: 读请求数
-- Innodb_data_writes: 写请求数
-- Innodb_data_read: 读字节数
-- Innodb_data_written: 写字节数

-- 2. 文件I/O延迟
SELECT * FROM performance_schema.file_summary_by_instance
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

-- 3. 表空间IO
SELECT * FROM sys.io_global_by_file_by_bytes;

-- 4. Checkpoint滞后
SHOW STATUS LIKE 'Innodb_checkpoint_age';
-- 应< innodb_log_file_size * 0.75

-- 5. 脏页比例
SHOW STATUS LIKE 'Innodb_buffer_pool_pages_dirty';
```

#### 8.3 并发参数调优

```ini
# 1. 最大连接数
max_connections = 2000
# 计算公式：(可用内存 - Global buffers) / 线程内存

# 2. 线程缓存
thread_cache_size = 100  # 8 + max_connections // 100

# 3. 表缓存
table_open_cache = 10000
table_open_cache_instances = 16  # 8.0+

# 4. 元数据锁缓存
metadata_locks_cache_size = 1024  # 默认1024，增大减少锁竞争

# 5. InnoDB并发控制
innodb_thread_concurrency = 32  # 限制InnoDB线程数，0表示不限制
innodb_read_io_threads = 16
innodb_write_io_threads = 16

# 6. 事务隔离级别
transaction_isolation = READ-COMMITTED  # 减少锁

# 7. 死锁检测
innodb_deadlock_detect = ON  # 默认ON
innodb_lock_wait_timeout = 50  # 秒

# 8. 自旋锁
innodb_sync_spin_loops = 30  # 自旋次数
innodb_spin_wait_delay = 6   # 延迟

# 9. 自增锁
innodb_autoinc_lock_mode = 2  # 交错模式，性能最好（8.0默认）
# 1: 连续模式（5.7默认）
# 0: 传统模式

# 10. 回滚段
innodb_rollback_segments = 128  # 8.0+默认128

# 11. Purge线程
innodb_purge_threads = 4  # 4-8个
innodb_purge_batch_size = 1000

# 12. Page Cleaner
innodb_page_cleaners = 4  # 与purge_threads一致
```

**并发监控：**

```sql
-- 1. 连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Threads_running';
SHOW STATUS LIKE 'Aborted_connects';

-- 2. 线程池（若使用）
SELECT * FROM information_schema.TP_THREAD_STATE;

-- 3. 锁等待
SELECT * FROM performance_schema.data_lock_waits;

-- 4. InnoDB状态
SHOW ENGINE INNODB STATUS\G
-- 查看：
-- History list length: 应<1000
-- Pending normal aio reads: 应=0
-- Pending aio writes: 应=0
```

#### 8.4 网络参数调优

```ini
# 1. 最大包大小
max_allowed_packet = 1G  # 大SQL/大BLOB

# 2. 连接超时
connect_timeout = 10
wait_timeout = 600  # 600秒，减少空闲连接
interactive_timeout = 600

# 3. 网络缓冲区
net_buffer_length = 16K
max_connections = 2000

# 4. 网络IO超时
net_read_timeout = 30
net_write_timeout = 60

# 5. 命名管道（Windows）
skip_networking = 0  # 0启用网络，1禁用

# 6. SSL
ssl_ca = /etc/mysql/ca.pem
ssl_cert = /etc/mysql/server-cert.pem
ssl_key = /etc/mysql/server-key.pem

# 7. 压缩协议
slave_compressed_protocol = 1  # 主从压缩

# 8. 性能模式网络监控
performance_schema_max_socket_instances = 1000
performance_schema_max_socket_classes = 10
```

#### 8.5 查询优化器参数

```ini
# 1. 优化器开关
optimizer_switch = 'index_merge=on,index_merge_union=on,index_merge_sort_union=on,index_merge_intersection=on,engine_condition_pushdown=on,index_condition_pushdown=on,mrr=on,mrr_cost_based=on,block_nested_loop=on,batched_key_access=off,materialization=on,semijoin=on,loosescan=on,firstmatch=on,duplicateweedout=on,subquery_materialization_cost_based=on,use_index_extensions=on,condition_fanout_filter=on,derived_merge=on,use_invisible_indexes=off,skip_scan=on,hash_join=on,subquery_to_derived=off,prefer_ordering_index=on,hypergraph_optimizer=off,derived_condition_pushdown=on'

# 2. 优化器索引提示
# 可通过SQL HINT控制，不建议全局

# 3. 成本模型
# 已在第4章详述

# 4. 统计信息
innodb_stats_auto_recalc = ON  # 自动更新
innodb_stats_persistent = ON   # 持久化统计信息
innodb_stats_persistent_sample_pages = 20  # 采样页数（可增大）

# 5. 直方图（8.0+）
# 手动创建
ANALYZE TABLE orders UPDATE HISTOGRAM ON amount WITH 256 BUCKETS;

# 6. 最大JOIN表数
# max_join_size = 1000000  # 限制行数
# max_join_tables = 100    # 限制表数

# 7. 子查询深度
# max_allowed_packet 影响
```

#### 8.6 安全与日志参数

```ini
# 1. 错误日志
log_error = /var/log/mysql/error.log
log_error_verbosity = 2  # 1错误, 2错误+警告, 3+info
log_timestamps = SYSTEM   # 使用系统时间

# 2. 通用查询日志（生产关闭）
general_log = OFF
general_log_file = /var/log/mysql/mysql.log

# 3. 慢查询日志（已详述）

# 4. 二进制日志
server_id = 1
log_bin = /data/mysql/mysql-bin
binlog_format = ROW  # 推荐ROW模式
binlog_row_image = FULL
max_binlog_size = 1G
binlog_expire_logs_seconds = 604800  # 7天

# 5. 中继日志（从库）
relay_log = /data/mysql/relay-bin
relay_log_recovery = ON
relay_log_purge = ON

# 6. 审计日志（企业版）
audit_log_policy = ALL
audit_log_file = /var/log/mysql/audit.log
audit_log_format = JSON

# 7. 密码策略（8.0+）
validate_password.policy = MEDIUM
validate_password.length = 8
validate_password.mixed_case_count = 1
validate_password.number_count = 1
validate_password.special_char_count = 1
```

---

## 第四部分：架构设计篇 - 构建高性能MySQL集群

### 第9章 高可用架构设计

#### 9.1 主从复制架构

##### **9.1.1 复制原理**

**复制架构图：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "客户端" as client

client -> "Master" : 写入
client -> "Master" : 读取

"Master" -down-> "Binlog Dump线程" : 读取binlog

"Binlog Dump线程" -> "Slave IO线程" : 传输binlog

"Slave IO线程" -down-> "Relay Log" : 写入

"Relay Log" -down-> "SQL线程" : 读取

"SQL线程" -down-> "Slave" : 执行SQL

client -> "Slave" : 读取（只读）

note right of "Master"
  binlog_format = ROW
  sync_binlog = 1
  innodb_flush_log_at_trx_commit = 1
end note

note right of "Slave"
  read-only = ON
  super-read-only = ON
  延迟监控：Seconds_Behind_Master
end note

note left of "Relay Log"
  中继日志：
  1. IO线程写入
  2. SQL线程执行
  3. 执行完删除
end note

@enduml
```

**复制配置：**

```ini
# Master配置
[mysqld]
server_id = 1
log_bin = /data/mysql/mysql-bin
binlog_format = ROW
binlog_row_image = FULL
sync_binlog = 1
innodb_flush_log_at_trx_commit = 1

# 复制账号
CREATE USER 'repl'@'10.0.0.%' IDENTIFIED BY 'repl_pass';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'10.0.0.%';

# Slave配置
[mysqld]
server_id = 2
relay_log = /data/mysql/relay-bin
read_only = ON
super_read_only = ON
relay_log_recovery = ON

# 连接Master
CHANGE MASTER TO
  MASTER_HOST='master.db',
  MASTER_USER='repl',
  MASTER_PASSWORD='repl_pass',
  MASTER_PORT=3306,
  MASTER_AUTO_POSITION=1;

START SLAVE;

# 监控延迟
SHOW SLAVE STATUS\G
-- Seconds_Behind_Master: 0
-- Slave_IO_Running: Yes
-- Slave_SQL_Running: Yes
```

**复制拓扑：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

node "主从链式" {
  [Master1] -> [Slave1] -> [Slave2]
}

node "主从星型" {
  [Master2] -> [Slave3]
  [Master2] -> [Slave4]
  [Master2] -> [Slave5]
}

node "级联复制" {
  [Master3] -> [Slave6] -> [Slave7]
}

node "双主" {
  [MasterA] <-> [MasterB]
}

@enduml
```

**复制延迟监控：**

```sql
-- 传统方法（不推荐）
SHOW SLAVE STATUS\G
-- Seconds_Behind_Master: 0
-- 问题：当IO线程卡住时，此值仍为0

-- 推荐：对比GTID
SELECT 
  MASTER_GTID_WAIT('', 1);  -- 等待1秒

-- 监控脚本
SELECT 
  (SELECT COUNT(*) FROM performance_schema.global_status 
   WHERE VARIABLE_NAME = 'Executed_Gtid_Set') AS master_gtid,
  (SELECT COUNT(*) FROM performance_schema.global_status 
   WHERE VARIABLE_NAME = 'Retrieved_Gtid_Set') AS slave_gtid;

-- 计算延迟
SELECT 
  TIMESTAMPDIFF(SECOND, MAX(ts), NOW()) AS lag_seconds
FROM (
  SELECT 
    UNIX_TIMESTAMP(now()) - (
      SELECT MAX(UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 0 SECOND)))
      FROM performance_schema.replication_applier_status
    ) AS ts
) t;

-- 使用pt-heartbeat
pt-heartbeat --master master.db --table percona.heartbeat --daemonize
-- 在从库检查
SELECT (UNIX_TIMESTAMP() - UNIX_TIMESTAMP(ts)) AS lag
FROM percona.heartbeat;
```

##### **9.1.2 半同步复制**

传统复制是异步的，主库提交后立即返回，不等待从库接收。

**半同步复制保证至少一个从库接收：**

```ini
# Master配置
[mysqld]
plugin_load = "semisync_master.so"
rpl_semi_sync_master_enabled = 1
rpl_semi_sync_master_timeout = 1000  # 1秒超时，退化为异步
rpl_semi_sync_master_wait_for_slave_count = 1  # 等待从库数

# Slave配置
[mysqld]
plugin_load = "semisync_slave.so"
rpl_semi_sync_slave_enabled = 1

# 监控
SHOW STATUS LIKE 'Rpl_semi_sync%';
-- Rpl_semi_sync_master_status: ON
-- Rpl_semi_sync_master_clients: 1
-- Rpl_semi_sync_master_yes_tx: 已确认事务数
-- Rpl_semi_sync_master_no_tx: 超时事务数
```

**半同步复制架构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "客户端" as client

client -> "Master" : COMMIT

"Master" -> "Master" : 等待ACK

"group 至少一个从库" {
  "Binlog Dump" -> "Slave1" : 传输binlog
  "Binlog Dump" -> "Slave2" : 传输binlog
  
  "Slave1" -> "Slave1" : 写入Relay Log
  "Slave2" -> "Slave2" : 写入Relay Log
  
  "Slave1" --> "Master" : ACK
  "Slave2" --> "Master" : ACK（可选）
}

"Master" -> "Master" : Commit OK

"Master" --> client : 返回成功

note right of "Master"
  rpl_semi_sync_master_timeout
  超时后转为异步
  避免从库故障导致主库阻塞
end note

@enduml
```

##### **9.1.3 GTID复制**

GTID（Global Transaction ID）简化复制管理。

```ini
# Master配置
[mysqld]
gtid_mode = ON
enforce_gtid_consistency = ON
binlog_gtid_simple_recovery = ON

# Slave配置
[mysqld]
gtid_mode = ON
enforce_gtid_consistency = ON
relay_log_info_repository = TABLE
master_info_repository = TABLE
relay_log_recovery = ON

# CHANGE MASTER使用GTID
CHANGE MASTER TO
  MASTER_HOST='master.db',
  MASTER_USER='repl',
  MASTER_PASSWORD='repl_pass',
  MASTER_AUTO_POSITION=1;

# GTID优势：
# 1. 自动定位，无需binlog位置
# 2. 故障切换简单
# 3. 检测复制冲突
# 4. 多源复制

# 监控GTID
SHOW GLOBAL VARIABLES LIKE 'gtid_executed';
SHOW GLOBAL VARIABLES LIKE 'gtid_purged';
SELECT * FROM mysql.gtid_executed;

# 跳过错误事务
SET GTID_NEXT='aaa-bbb-ccc-ddd:123';  -- 错误事务的GTID
BEGIN; COMMIT;  -- 空事务
SET GTID_NEXT='AUTOMATIC';
```

##### **9.1.4 多源复制**

从库从多个主库复制。

```ini
# Slave配置
[mysqld]
master_info_repository = TABLE
relay_log_info_repository = TABLE

# 配置第一个主库
CHANGE MASTER TO
  MASTER_HOST='master1.db',
  MASTER_USER='repl',
  MASTER_PASSWORD='repl_pass',
  MASTER_AUTO_POSITION=1
FOR CHANNEL 'master1';

# 配置第二个主库
CHANGE MASTER TO
  MASTER_HOST='master2.db',
  MASTER_USER='repl',
  MASTER_PASSWORD='repl_pass',
  MASTER_AUTO_POSITION=1
FOR CHANNEL 'master2';

# 启动指定通道
START SLAVE FOR CHANNEL 'master1';
START SLAVE FOR CHANNEL 'master2';

# 监控
SHOW SLAVE STATUS FOR CHANNEL 'master1'\G
SHOW SLAVE STATUS FOR CHANNEL 'master2'\G

# 应用场景：
# 1. 合库（多个分库汇总）
# 2. 数据分析
```

##### **9.1.5 级联复制**

从库作为其他从库的主库。

```ini
# Master
[mysqld]
log_bin = /data/mysql/mysql-bin
server_id = 1

# Slave1（级联节点）
[mysqld]
server_id = 2
log_bin = /data/mysql/mysql-bin  # 必须开启binlog
log_slave_updates = ON  # 关键：记录从库更新

# Slave2（叶子节点）
[mysqld]
server_id = 3

# 应用场景：
# 1. 多机房复制
# 2. 缓解主库压力
```

#### 9.2 MGR（MySQL Group Replication）

MGR提供高一致性、高可用方案。

**MGR架构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

node "MGR集群" {
  [Primary] - [node1]
  [Primary] - [node2]
  [Primary] - [node3]
  
  [node1] <-> [node2] : Paxos通信
  [node2] <-> [node3] : Paxos通信
  [node3] <-> [node1] : Paxos通信
}

"客户端" -> [Primary] : 写入
"客户端" -> [node1] : 读取
"客户端" -> [node2] : 读取
"客户端" -> [node3] : 读取

note right of [Primary]
  单主模式：仅主可写
  多主模式：所有节点可写（8.0+）
  
  基于Paxos协议
  多数派提交
  自动故障转移
end note

@enduml
```

**MGR配置：**

```ini
# 所有节点配置
[mysqld]
# MGR插件
plugin_load_add = 'group_replication.so'

# 唯一标识
server_id = 1
gtid_mode = ON
enforce_gtid_consistency = ON
binlog_format = ROW
binlog_checksum = NONE  # MGR要求NONE

# InnoDB配置
master_info_repository = TABLE
relay_log_info_repository = TABLE
transaction_write_set_extraction = XXHASH64

# MGR配置
group_replication_group_name = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
group_replication_start_on_boot = off
group_replication_local_address = "10.0.0.1:33061"
group_replication_group_seeds = "10.0.0.1:33061,10.0.0.2:33061,10.0.0.3:33061"
group_replication_bootstrap_group = off
group_replication_recovery_use_ssl = ON

# 单主模式
group_replication_single_primary_mode = ON
group_replication_enforce_update_everywhere_checks = OFF

# 流控
group_replication_flow_control_mode = "QUOTA"
```

**MGR管理：**

```sql
-- 安装插件
INSTALL PLUGIN group_replication SONAME 'group_replication.so';

-- 启动MGR
-- 第一个节点（引导）
SET GLOBAL group_replication_bootstrap_group=ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group=OFF;

-- 其他节点加入
START GROUP_REPLICATION;

-- 查看状态
SELECT * FROM performance_schema.replication_group_members;
-- ONLINE: 正常
-- RECOVERING: 同步中
-- OFFLINE: 离线

-- 查看主节点
SELECT * FROM performance_schema.replication_group_members 
WHERE MEMBER_ROLE = 'PRIMARY';

-- 切换主节点（单主模式）
SELECT group_replication_set_as_primary('member_uuid');

-- 添加新成员
SET GLOBAL group_replication_group_seeds = '10.0.0.1:33061,10.0.0.2:33061,10.0.0.3:33061,10.0.0.4:33061';
-- 在新增节点启动
START GROUP_REPLICATION;

-- 移除成员
-- 1. 停止实例
STOP GROUP_REPLICATION;
-- 2. 在其他成员执行
SELECT group_replication_remove_member('member_uuid');
```

**MGR故障转移：**

```sql
-- 自动故障转移
-- 主节点宕机，其余节点选举新主
-- 选举规则：
-- 1. 最老的节点
-- 2. 版本兼容
-- 3. 权重（group_replication_member_weight）

-- 手动切换（计划维护）
-- 1. 将主设为OFFLINE
STOP GROUP_REPLICATION;

-- 2. 在新主节点执行
SELECT group_replication_switch_to_single_primary_mode('new_master_uuid');

-- 3. 原主重新加入
START GROUP_REPLICATION;
```

**MGR约束：**

1. **事务限制**：

   - 不支持外键级联
   - 事务大小<2GB
   - 不能显式锁表（LOCK TABLES）
2. **DDL限制**：

   - DDL会阻塞所有节点
   - 建议在低峰期执行
3. **性能**：

   - 写入延迟增加（多数派提交）
   - 跨数据中心延迟更大

#### 9.3 InnoDB Cluster

InnoDB Cluster = MGR + MySQL Router + MySQL Shell

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "应用程序" as app

"MySQL Router" -down-> "Primary节点" : 路由
"MySQL Router" -down-> "Secondary节点1" : 路由
"MySQL Router" -down-> "Secondary节点2" : 路由

"InnoDB Cluster" {
  [Primary节点] <-> [Secondary节点1]
  [Primary节点] <-> [Secondary节点2]
  [Secondary节点1] <-> [Secondary节点2]
}

app -> "MySQL Router" : 透明连接

note right of "MySQL Router"
  自动故障转移
  读写分离
  负载均衡
end note

@enduml
```

**InnoDB Cluster部署：**

```bash
# 使用MySQL Shell
mysqlsh

# 创建集群
dba.createCluster('myCluster', {
  'memberSslMode': 'REQUIRED',
  'gtidSetIsComplete': true
});

# 添加实例
cluster.addInstance('root@10.0.0.2:3306', {
  'memberWeight': 50
});

# 查看状态
cluster.status();

# 创建Router用户
cluster.setupRouterAccount('router_user');

# 启动Router
mysqlrouter --bootstrap root@10.0.0.1:3306
# 自动生成配置文件

# Router配置（/etc/mysqlrouter/mysqlrouter.conf）
[routing:primary]
bind_address = 0.0.0.0:6446
destinations = 10.0.0.1:3306,10.0.0.2:3306,10.0.0.3:3306
routing_strategy = first-available  # 主库

[routing:secondary]
bind_address = 0.0.0.0:6447
destinations = 10.0.0.1:3306,10.0.0.2:3306,10.0.0.3:3306
routing_strategy = round-robin  # 从库

# 应用连接
# 写入：mysql -h127.0.0.1 -P6446
# 读取：mysql -h127.0.0.1 -P6447
```

#### 9.4 几种高可用方案对比

|方案|数据一致性|故障切换|性能影响|复杂度|成本|适用场景|
| -------------------| ------------| ----------------| ----------| --------| ------| ----------------|
|主从+VIP|异步/延迟|手动/脚本|低|低|低|读写分离、备份|
|主从+MHA|异步|自动（秒级）|低|中|中|中小规模|
|主从+Orchestrator|异步|自动（秒级）|低|中|低|中小规模|
|半同步复制|近同步|手动|中|低|低|一致性要求较高|
|MGR|强一致|自动（毫秒级）|中|高|中|高可用核心系统|
|InnoDB Cluster|强一致|自动（毫秒级）|中|高|中|云原生、自动化|
|Galera|强一致|自动（毫秒级）|高|高|中|多写场景|

**MHA方案示例：**

```bash
# MHA（Master High Availability）配置
# master_ip_failover脚本自动切换VIP

# 安装
yum install mha4mysql-manager mha4mysql-node

# 配置
cat /etc/mha/app1.cnf
[server default]
user=root
password=xxx
ssh_user=root
repl_user=repl
repl_password=repl_pass
ping_interval=1

[server1]
hostname=10.0.0.1
candidate_master=1

[server2]
hostname=10.0.0.2
candidate_master=1

[server3]
hostname=10.0.0.3
no_master=1

# 启动MHA
masterha_manager --conf=/etc/mha/app1.cnf

# 故障检测
masterha_check_status --conf=/etc/mha/app1.cnf
```

**InnoDB Cluster生产实践：**

```bash
# 3节点MGR集群（单主模式）

# 节点1-3配置（/etc/my.cnf）
[mysqld]
# MGR基础配置
plugin_load_add='group_replication.so'
server_id=1  # 各节点不同
gtid_mode=ON
enforce_gtid_consistency=ON
binlog_format=ROW
binlog_checksum=NONE
master_info_repository=TABLE
relay_log_info_repository=TABLE
transaction_write_set_extraction=XXHASH64

# MGR组配置
group_replication_group_name="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
group_replication_start_on_boot=off
group_replication_local_address="10.0.0.1:33061"  # 各节点不同
group_replication_group_seeds="10.0.0.1:33061,10.0.0.2:33061,10.0.0.3:33061"
group_replication_bootstrap_group=off
group_replication_single_primary_mode=ON

# 启动第一个节点
mysql> SET GLOBAL group_replication_bootstrap_group=ON;
mysql> START GROUP_REPLICATION;
mysql> SET GLOBAL group_replication_bootstrap_group=OFF;

# 启动其他节点
mysql> START GROUP_REPLICATION;

# 验证
mysql> SELECT MEMBER_HOST, MEMBER_STATE, MEMBER_ROLE 
       FROM performance_schema.replication_group_members;
+----------------+--------------+---------------+
| MEMBER_HOST    | MEMBER_STATE | MEMBER_ROLE   |
+----------------+--------------+---------------+
| 10.0.0.1       | ONLINE       | PRIMARY       |
| 10.0.0.2       | ONLINE       | SECONDARY     |
| 10.0.0.3       | ONLINE       | SECONDARY     |
+----------------+--------------+---------------+

# 安装Router
mysqlrouter --bootstrap root@10.0.0.1:3306 --directory /etc/mysqlrouter

# 启动Router
systemctl start mysqlrouter

# 应用连接
# 写入：mysql -h 10.0.0.100 -P 6446 -u app -p
# 读取：mysql -h 10.0.0.100 -P 6447 -u app -p

# 故障测试：kill主库
kill -9 <master_pid>

# 查看状态
mysql> SELECT * FROM performance_schema.replication_group_members;
-- 新主自动选举，10秒内完成

# Router自动切换
-- 应用无感知，连接保持
```

---

## 第五部分：监控告警篇 - 洞察数据库状态

### 第10章 监控体系构建

#### 10.1 监控指标设计

**监控金字塔：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "业务用户" as user

node "黄金指标（SLO）" {
  [QPS] -down-> [延迟P99]
  [延迟P99] -down-> [错误率]
}

node "系统指标" {
  [CPU] -down-> [内存]
  [内存] -down-> [磁盘IO]
  [磁盘IO] -down-> [网络]
}

node "数据库指标" {
  [连接数] -down-> [查询性能]
  [查询性能] -down-> [锁等待]
  [锁等待] -down-> [复制延迟]
}

node "应用指标" {
  [慢查询] -down-> [死锁]
  [死锁] -down-> [错误日志]
}

user --> "黄金指标"
"黄金指标" --> "系统指标"
"系统指标" --> "数据库指标"
"数据库指标" --> "应用指标"

note right of user
  业务只关注：
  可用性、延迟、错误
end note

note left of "应用指标"
  DBA关注：
  慢查询、死锁、复制
end note

@enduml
```

**核心监控指标：**

|层级|指标项|告警阈值|采集频率|备注|
| ------| -----------------| --------------| ----------| ----------------------|
|**业务**|可用性|<99.95%|1分钟|实例可访问|
||P99延迟|>100ms|10秒|99%分位|
||错误率|>0.1%|1分钟|执行错误|
|**系统**|CPU使用率|>80%|10秒|持续5分钟|
||内存使用率|>85%|10秒|OOM风险|
||磁盘IOPS|>80%|10秒|IO瓶颈|
||磁盘空间|>85%|1分钟|预留15%|
|**MySQL**|QPS/TPS|波动>30%|10秒|业务波动|
||Threads_running|>50|10秒|活跃线程|
||慢查询数|>10/分钟|1分钟|long_query_time|
||复制延迟|>30秒|10秒|从库落后|
||锁等待时间|>1秒|10秒|Innodb_row_lock_time|
||死锁次数|>1/分钟|1分钟|需告警|
|**InnoDB**|缓冲池命中率|<95%|10秒|性能下降|
||脏页比例|>75%|10秒|刷盘压力|
||Checkpoint滞后|>90%日志大小|10秒|恢复时间|
|**复制**|IO线程状态|不为Yes|10秒|立即告警|
||SQL线程状态|不为Yes|10秒|立即告警|
||复制延迟趋势|持续增长|10秒|延迟恶化|

#### 10.2 监控工具选型

**监控工具对比：**

```markdown
| 工具 | 类型 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|----------|
| **Prometheus** | 开源 | 生态完善，灵活查询 | 需自建，配置复杂 | 中大规模 |
| **Zabbix** | 开源 | 功能全面，成熟 | 资源占用高，界面老旧 | 传统企业 |
| **OpenFalcon** | 开源 | 轻量，中文支持 | 社区活跃度下降 | 互联网 |
| **PMM** | 开源 | MySQL专用，开箱即用 | 功能相对单一 | MySQL为主 |
| **DataDog** | 商业 | 功能强大，SaaS | 费用高 | 云原生 |
| **New Relic** | 商业 | APM+DB一体化 | 费用高 | 全链路 |
| **阿里云监控** | 云厂商 | 集成度高，免运维 | 厂商锁定 | 云上 |
| **腾讯云监控** | 云厂商 | 集成度高，免运维 | 厂商锁定 | 云上 |
```

**Prometheus + Grafana方案：**

```yaml
# docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  mysqld-exporter:
    image: prom/mysqld-exporter:latest
    environment:
      DATA_SOURCE_NAME: "root:password@(mysql:3306)/"
    ports:
      - "9104:9104"
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
```

**prometheus.yml配置：**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mysql'
    static_configs:
      - targets: ['mysqld-exporter:9104']
    scrape_interval: 5s
        
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 10s
```

**关键告警规则：**

```yaml
# rules.yml
groups:
- name: mysql.rules
  rules:
  - alert: MySQLDown
    expr: mysql_up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "MySQL实例 {{ $labels.instance }} 宕机"
      
  - alert: MySQLSlowQuery
    expr: rate(mysql_global_status_slow_queries[5m]) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "MySQL慢查询增多 (>10/秒)"
      
  - alert: MySQLReplicationLag
    expr: mysql_slave_lag_seconds > 30
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "MySQL复制延迟 > 30秒"
      
  - alert: MySQLHighConnections
    expr: mysql_global_status_threads_connected > 1800  # 90% max_connections
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "MySQL连接数过高"
```

#### 10.3 慢查询监控

**慢查询告警流程：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

:慢查询发生;

:写入slow_log;

if (执行时间>阈值?) then (是)
  :触发告警;
  :聚合分析\npt-query-digest;
  
  if (是否新查询?) then (是)
    :创建告警单\nJIRA/禅道;
    :指派DBA;
  else (否)
    :更新已有告警\n重复次数+1;
  endif
  
  :发送通知\n钉钉/邮件;
else (否)
  :正常;
endif

stop

@enduml
```

**慢查询自动化处理：**

```python
#!/usr/bin/env python
# analyze_slow_log.py

import subprocess
from datetime import datetime
import pymysql

# 分析慢查询
def analyze_slow_log():
    cmd = [
        'pt-query-digest',
        '--review', 'h=localhost,D=percona,t=query_review',
        '--history', 'h=localhost,D=percona,t=query_review_history',
        '--no-report',
        '--limit=0%',
        '/var/log/mysql/slow.log'
    ]
    subprocess.run(cmd)
    
    # 查询新增慢查询
    conn = pymysql.connect(host='localhost', user='root', db='percona')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT checksum, fingerprint, sample
        FROM query_review
        WHERE first_seen > NOW() - INTERVAL 1 HOUR
    """)
    
    new_queries = cursor.fetchall()
    
    for query in new_queries:
        # 创建告警
        create_alert(query[0], query[1], query[2])
    
    conn.close()

def create_alert(checksum, fingerprint, sample):
    # 调用JIRA API
    # 发送钉钉通知
    # 记录到ELK
    pass

if __name__ == '__main__':
    analyze_slow_log()
```

#### 10.4 复制监控

```bash
#!/bin/bash
# 复制延迟监控脚本

MASTER_HOST="master.db"
SLAVE_HOST="slave.db"

# 获取主库GTID
MASTER_GTID=$(mysql -h$MASTER_HOST -urepl -prepl_pass -e "SHOW MASTER STATUS\G" | grep "Executed_Gtid_Set" | awk '{print $2}')

# 获取从库GTID
SLAVE_GTID=$(mysql -h$SLAVE_HOST -urepl -prepl_pass -e "SHOW SLAVE STATUS\G" | grep "Retrieved_Gtid_Set" | awk '{print $2}')

# 计算延迟
DELAY=$(mysql -h$SLAVE_HOST -urepl -prepl_pass -e "
    SELECT ( 
        SELECT COUNT(1) FROM mysql.gtid_executed 
        WHERE GTID_SUBSET('$MASTER_GTID', CONCAT(source_uuid, ':', interval_start, '-', interval_end))
    ) - (
        SELECT COUNT(1) FROM mysql.gtid_executed 
        WHERE GTID_SUBSET('$SLAVE_GTID', CONCAT(source_uuid, ':', interval_start, '-', interval_end))
    ) AS delay;
" | tail -1)

# 告警阈值
if [ "$DELAY" -gt 100 ]; then
    echo "复制延迟过高: $DELAY" | mail -s "MySQL Alert" dba@company.com
fi
```

#### 10.5 性能基线管理

**基线构建：**

```sql
-- 步骤1：收集一周数据
-- 每天同一时段采样

CREATE TABLE baseline_metrics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  metric_name VARCHAR(100),
  metric_value DECIMAL(20,2),
  sample_time DATETIME,
  INDEX idx_sample (metric_name, sample_time)
) ENGINE=InnoDB;

-- 步骤2：计算基线
INSERT INTO baseline_metrics
SELECT 
  'qps' AS metric_name,
  SUM(COUNT_STAR) / 60 AS metric_value,
  DATE_FORMAT(END_EVENT_TIME, '%Y-%m-%d %H:%i:00') AS sample_time
FROM performance_schema.events_statements_summary_by_digest
WHERE END_EVENT_TIME > NOW() - INTERVAL 1 WEEK
GROUP BY DATE_FORMAT(END_EVENT_TIME, '%Y-%m-%d %H:%i:00');

-- 步骤3：计算P50, P95, P99
SELECT 
  metric_name,
  AVG(metric_value) AS avg_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) AS p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) AS p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) AS p99
FROM baseline_metrics
WHERE metric_name = 'qps'
GROUP BY metric_name;

-- 步骤4：告警规则
-- 当前值 > 基线P95 且 > 2 * 基线均值
SELECT 
  current.qps,
  base.p95,
  base.avg_qps
FROM (
  SELECT SUM(COUNT_STAR) / 60 AS qps
  FROM performance_schema.events_statements_summary_by_digest
  WHERE END_EVENT_TIME > NOW() - INTERVAL 1 MINUTE
) current,
(
  SELECT 
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) AS p95,
    AVG(metric_value) AS avg_qps
  FROM baseline_metrics
  WHERE metric_name = 'qps'
) base
WHERE current.qps > base.p95 AND current.qps > 2 * base.avg_qps;
```

#### 10.6 告警策略设计

**告警分层：**

```markdown
**P0 - 紧急（立即处理）**
- MySQL实例宕机
- 主从复制中断
- 磁盘空间满
- OOM kill
- 数据文件损坏

**P1 - 严重（30分钟内）**
- 复制延迟>30秒
- 慢查询>1000/分钟
- 连接数>90% max_connections
- 死锁>10/分钟
- 缓冲池命中率<90%

**P2 - 警告（2小时内）**
- CPU>80%持续5分钟
- 磁盘IO>80%持续5分钟
- 慢查询>100/分钟
- 临时表磁盘化>10%
- 锁等待>5秒/分钟

**P3 - 信息（24小时内）**
- 备份失败
- 表空间增长异常
- 慢查询新增TOP5
- 索引使用率<10%
```

**告警收敛：**

```python
# 告警收敛逻辑
class AlertManager:
    def __init__(self):
        self.alert_cache = {}
        self.cooldown = 300  # 5分钟冷却
    
    def should_alert(self, alert_id, level):
        now = time.time()
        
        # 检查冷却期
        if alert_id in self.alert_cache:
            last_time, last_level = self.alert_cache[alert_id]
            if now - last_time < self.cooldown:
                # 升级告警不受冷却
                if self.is_escalated(level, last_level):
                    return True
                return False
        
        self.alert_cache[alert_id] = (now, level)
        return True
    
    def is_escalated(self, current, previous):
        # P2->P1, P1->P0
        levels = {'P3': 0, 'P2': 1, 'P1': 2, 'P0': 3}
        return levels[current] > levels[previous]
```

**告警通知渠道：**

```markdown
**钉钉/企业微信**
- P0：@所有人 + 电话
- P1：@值班DBA
- P2：群消息
- P3：日报汇总

**邮件**
- P0：DBA组 + 架构师 + 业务负责人
- P1：DBA组
- P2：值班DBA
- P3：不发邮件

**电话/短信**
- P0：DBA on-call
- P1：重要业务DBA
```

---

## 第六部分：特殊场景篇 - 应对极限挑战

### 第11章 大数据量优化

#### 11.1 分库分表策略

**分片策略选择：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

start

:数据量评估;

if (单表>1000万?) then (是)
  if (写入>1万/秒?) then (是)
    :水平分片(Sharding);
  else (否)
    :垂直分库;
  endif
else (否)
  :单机优化;
endif

if (业务关联复杂?) then (是)
  :优先垂直分库;
else (否)
  :优先水平分片;
endif

:分片键选择;

if (均匀分布?) then (是)
  if (查询带分片键?) then (是)
    :Hash取模;
  else (否)
    :Range分片;
  endif
else (否)
  :Range分片或List分片;
endif

:分片数(2^n);

stop

@enduml
```

**水平分片实现：**

```sql
-- 方案1：Proxy中间件（推荐）
-- ShardingSphere
-- MyCat
-- Vitess

-- 方案2：应用层分片
-- 分片逻辑在DAO层

-- 方案3：分区表（单实例内）
CREATE TABLE orders_2024 (
  order_id BIGINT,
  user_id BIGINT,
  create_time DATETIME
) 
PARTITION BY HASH(user_id)
PARTITIONS 16;

-- 分片键选择原则：
-- 1. 高基数（如用户ID）
-- 2. 查询常带（如WHERE user_id=?）
-- 3. 分布均匀

-- 分片数：2^n（如16, 32, 64）
-- 便于扩容

-- 示例：用户表分片
-- 分片键：user_id
-- 分片算法：user_id % 16
-- DB_0: user_id % 16 = 0
-- DB_1: user_id % 16 = 1
-- ...
```

**分片后查询优化：**

```sql
-- 1. 分片键查询（最优）
SELECT * FROM users WHERE user_id = 12345;
-- 路由到DB_5 (12345 % 16 = 5)

-- 2. 非分片键查询（困难）
SELECT * FROM users WHERE email = 'user@example.com';
-- 需广播到所有分片，并行查询，聚合结果

-- 3. JOIN查询（最困难）
SELECT u.*, o.order_no
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE u.user_id = 12345;
-- 同分片JOIN（共库共表）性能最佳

-- 4. 分页查询
SELECT * FROM users ORDER BY create_time LIMIT 100000, 10;
-- 每个分片查询LIMIT 100010，汇总后排序，取10条
-- 性能极差，必须避免

-- 解决方案：业务层限制分页深度
-- 或基于时间分片

-- 5. 聚合查询
SELECT COUNT(*) FROM users;
-- 每个分片COUNT，汇总

-- 6. 全局表
-- 小表（如字典表）每个分片全量复制
CREATE TABLE dict_status (
  status_code TINYINT,
  status_name VARCHAR(50)
) ENGINE=InnoDB;
-- 在每个分片创建
```

**分库分表中间件：**

```yaml
# ShardingSphere配置
dataSources:
  ds0:
    url: jdbc:mysql://192.168.0.1:3306/db
    username: root
    password: root
  ds1:
    url: jdbc:mysql://192.168.0.2:3306/db
    username: root
    password: root

shardingRule:
  tables:
    users:
      actualDataNodes: ds$->{0..1}.users_$->{0..7}
      databaseStrategy:
        inline:
          shardingColumn: user_id
          algorithmExpression: ds$->{user_id % 2}
      tableStrategy:
        inline:
          shardingColumn: user_id
          algorithmExpression: users_$->{user_id % 8}
  defaultDataSourceName: ds0
  defaultTableStrategy:
    none:
```

#### 11.2 分区表应用

**分区类型对比：**

```sql
-- 1. RANGE分区（按时间）
CREATE TABLE logs (
  id BIGINT,
  log_time DATETIME
)
PARTITION BY RANGE (YEAR(log_time)) (
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025)
);

-- 优点：时间范围查询快
-- 缺点：热点分区

-- 2. HASH分区（按ID）
CREATE TABLE users (
  user_id BIGINT,
  name VARCHAR(50)
)
PARTITION BY HASH(user_id)
PARTITIONS 16;

-- 优点：分布均匀
-- 缺点：范围查询需全分区扫描

-- 3. LIST分区（按地区）
CREATE TABLE orders (
  order_id BIGINT,
  region VARCHAR(20)
)
PARTITION BY LIST COLUMNS (region) (
  PARTITION p_north VALUES IN ('北京', '天津'),
  PARTITION p_south VALUES IN ('广东', '广西'),
  PARTITION p_east VALUES IN ('上海', '浙江')
);

-- 4. KEY分区（MySQL哈希）
-- 类似HASH，使用MySQL哈希函数

-- 5. COLUMNS分区（多列）
CREATE TABLE sales (
  year INT,
  month INT
)
PARTITION BY RANGE COLUMNS(year, month) (
  PARTITION p0 VALUES LESS THAN (2023, 12),
  PARTITION p1 VALUES LESS THAN (2024, 6),
  PARTITION p2 VALUES LESS THAN (2024, 12)
);

-- 6. 子分区（复合分区）
CREATE TABLE big_table (
  id BIGINT,
  create_time DATETIME
)
PARTITION BY RANGE (YEAR(create_time))
SUBPARTITION BY HASH (id)
SUBPARTITIONS 4 (
  PARTITION p2020 VALUES LESS THAN (2021),
  PARTITION p2021 VALUES LESS THAN (2022)
);
```

**分区管理：**

```sql
-- 添加分区
ALTER TABLE logs ADD PARTITION (
  PARTITION p2025 VALUES LESS THAN (2026)
);

-- 删除分区
ALTER TABLE logs DROP PARTITION p2022;

-- 清空分区
ALTER TABLE logs TRUNCATE PARTITION p2023;

-- 重建分区
ALTER TABLE logs REORGANIZE PARTITION p2024 INTO (
  PARTITION p2024q1 VALUES LESS THAN (2024, 4),
  PARTITION p2024q2 VALUES LESS THAN (2024, 7),
  PARTITION p2024q3 VALUES LESS THAN (2024, 10),
  PARTITION p2024q4 VALUES LESS THAN (2025)
);

-- 交换分区（8.0+）
-- 与表交换数据
ALTER TABLE logs EXCHANGE PARTITION p2023 WITH TABLE logs_2023;

-- 查看分区
SELECT 
  PARTITION_NAME, 
  TABLE_ROWS, 
  DATA_LENGTH,
  INDEX_LENGTH
FROM information_schema.PARTITIONS
WHERE TABLE_NAME = 'logs';

-- 分区裁剪优化
EXPLAIN SELECT * FROM logs WHERE log_time >= '2024-01-01';
-- Extra: Partitioned table: p2024
-- 仅扫描p2024分区
```

**分区与分片结合：**

```sql
-- 两层架构
-- 1. 水平分片（Proxy中间件）
-- 2. 每个分片内分区（Range/Hash）

-- 示例：订单表
-- 分片：user_id % 16
-- 分区：YEAR(create_time)

CREATE TABLE orders_shard_0 (
  order_id BIGINT,
  user_id BIGINT,
  create_time DATETIME
)
PARTITION BY RANGE (YEAR(create_time)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025)
);

-- 优点：
-- 1. 分片解决数据量
-- 2. 分区解决查询性能

-- 缺点：
-- 1. 管理复杂
-- 2. 扩容困难
```

#### 11.3 冷热数据分离

**冷热数据识别：**

```sql
-- 热数据：近3个月，活跃查询
-- 温数据：3-6个月，偶尔查询
-- 冷数据：>6个月，极少查询

-- 识别冷数据
SELECT 
  DATE(create_time) AS dt,
  COUNT(*) AS cnt
FROM orders
WHERE create_time < DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY dt
ORDER BY cnt ASC
LIMIT 10;

-- 冷数据特征：
-- 1. 写入后无更新
-- 2. 查询频率低
-- 3. 可归档
```

**冷热分离方案：**

```sql
-- 方案1：分区表 + 不同存储
-- p2023冷数据 -> 慢速磁盘（SATA）
-- p2024热数据 -> 高速磁盘（NVMe）

-- MySQL 8.0支持表空间指定目录
ALTER TABLE logs PARTITION p2023 
TABLESPACE = innodb_slow_disk;

-- 方案2：双表架构
-- 热表：orders_hot（近3个月）
-- 冷表：orders_cold（历史）

-- 写入热表
INSERT INTO orders_hot VALUES (...);

-- 定期迁移
INSERT INTO orders_cold
SELECT * FROM orders_hot
WHERE create_time < DATE_SUB(NOW(), INTERVAL 3 MONTH);

DELETE FROM orders_hot
WHERE create_time < DATE_SUB(NOW(), INTERVAL 3 MONTH);

-- 查询时合并
SELECT * FROM orders_hot WHERE user_id = 123
UNION ALL
SELECT * FROM orders_cold WHERE user_id = 123;

-- 方案3：归档到归档库
-- MySQL Archive引擎
CREATE TABLE orders_2023_archive (
  ...
) ENGINE=ARCHIVE;

-- 迁移数据
INSERT INTO orders_2023_archive
SELECT * FROM orders_2023
WHERE create_time < '2024-01-01';

-- 查询时Union
-- 或应用层路由

-- 方案4：TiDB/TiFlash
-- HTAP方案，自动冷热分离
-- 热数据放TiKV（行存）
-- 冷数据放TiFlash（列存）
```

**冷数据压缩：**

```sql
-- InnoDB表压缩
CREATE TABLE orders_cold (
  order_id BIGINT,
  data JSON
) 
ROW_FORMAT = COMPRESSED
KEY_BLOCK_SIZE = 8;

-- 压缩率：50%
-- CPU开销：10%

-- 监控压缩
SELECT 
  TABLE_NAME,
  ROW_FORMAT,
  TABLE_ROWS,
  DATA_LENGTH,
  COMPRESSED_SIZE,
  (1 - COMPRESSED_SIZE / DATA_LENGTH) * 100 AS compression_ratio
FROM information_schema.innodb_tablespaces
WHERE TABLE_NAME = 'orders_cold';

-- MyRocks引擎（SST压缩）
-- 压缩率：70%
-- 写入性能优
```

#### 11.4 归档策略

**归档方案：**

```bash
# 1. pt-archiver（在线归档）
pt-archiver \
  --source h=localhost,D=ecommerce,t=orders \
  --dest h=archive_host,D=ecommerce,t=orders_archive \
  --where "create_time < DATE_SUB(NOW(), INTERVAL 1 YEAR)" \
  --progress 10000 \
  --limit 1000 \
  --txn-size 1000 \
  --no-delete \
  --statistics

# 参数说明：
--source: 源表
--dest: 目标表
--where: 归档条件
--limit: 每批归档行数
--txn-size: 每批事务大小
--no-delete: 归档后不删除
--statistics: 打印统计

# 2. 定时归档脚本
#!/bin/bash
#!/bin/bash
# archive_orders.sh

ARCHIVE_DATE=$(date -d "1 year ago" +%Y-%m-%d)

mysql -e "CREATE TABLE IF NOT EXISTS orders_archive_${ARCHIVE_DATE} LIKE orders;"

pt-archiver \
  --source h=localhost,D=ecommerce,t=orders \
  --dest h=archive_host,D=ecommerce,t=orders_archive_${ARCHIVE_DATE} \
  --where "create_time < '${ARCHIVE_DATE}'" \
  --progress 100000 \
  --limit 5000 \
  --txn-size 5000 \
  --purge  # 归档后删除源数据

# 3. 分区自动归档（8.0+）
ALTER TABLE logs EXCHANGE PARTITION p2023 WITH TABLE logs_archive_2023;

# 分区归档优势：
# 1. 瞬间完成（元数据操作）
# 2. 无IO影响
# 3. 原子操作

# 4. 归档库方案
# 独立归档实例（低配机器）
# 压缩表（ARCHIVE引擎）
# 查询低频历史数据
```

**归档数据查询：**

```sql
-- 方式1：连接归档库
-- 应用层切换数据源

-- 方式2：FEDERATED引擎（不推荐）
CREATE TABLE orders_archive_fed (
  ...
) ENGINE=FEDERATED CONNECTION='mysql://archive_user@archive_host/ecommerce/orders_archive';

-- 方式3：ES/Hive
-- 归档到Elasticsearch
-- 或Hive数据仓库
```

### 第12章 高并发优化

#### 12.1 连接池优化

**连接池配置：**

```ini
# HikariCP配置
spring:
  datasource:
    hikari:
      maximum-pool-size: 50  # 核心公式
      minimum-idle: 10       # 保持的最小连接
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
      
# 连接池大小公式：
# connections = (核心数 * 2) + 有效磁盘数
# 例如：32核 + 1个NVMe = 32*2 + 1 = 65

# 最大连接数应< MySQL max_connections的80%
```

**连接池监控：**

```java
// HikariCP指标暴露
HikariConfig config = new HikariConfig();
MetricsTrackerFactory metricsTrackerFactory = new PrometheusMetricsTrackerFactory();
config.setMetricsTrackerFactory(metricsTrackerFactory);

// 关键指标
// hikaricp_connections_active: 活跃连接
// hikaricp_connections_idle: 空闲连接
// hikaricp_connections_pending: 等待线程数
```

**连接泄漏检测：**

```ini
# 开启泄漏检测
leakDetectionThreshold=60000  # 60秒

# 日志输出
# Connection leak detection triggered for connection com.mysql.jdbc.JDBC4Connection@xxx

# 修复：确保close
try (Connection conn = dataSource.getConnection()) {
    // use connection
} // auto close
```

#### 12.2 热点数据优化

**热点行更新：**

```sql
-- 场景：秒杀库存
CREATE TABLE seckill (
  sku_id BIGINT PRIMARY KEY,
  stock INT,
  version BIGINT
) ENGINE=InnoDB;

-- 反例：直接扣减
UPDATE seckill SET stock = stock - 1 WHERE sku_id = 1001;
-- 大量线程竞争，锁等待严重

-- 优化1：拆行
CREATE TABLE seckill_split (
  sku_id BIGINT,
  bucket INT,  -- 分桶
  stock INT,
  PRIMARY KEY (sku_id, bucket)
) ENGINE=InnoDB;

-- 订单路由到不同桶
UPDATE seckill_split 
SET stock = stock - 1 
WHERE sku_id = 1001 AND bucket = MOD(order_id, 16);

-- 查询总库存
SELECT SUM(stock) FROM seckill_split WHERE sku_id = 1001;

-- 优化2：异步队列
-- Redis预扣库存
-- MySQL最终扣减

-- 优化3：版本号乐观锁
UPDATE seckill 
SET stock = stock - 1, version = version + 1
WHERE sku_id = 1001 AND version = 123;

-- 失败重试
-- 性能提升10倍
```

**热点数据缓存：**

```sql
-- 场景：用户余额
-- 频繁查询和更新

-- 方案1：Redis缓存
-- 读：Redis -> Miss -> MySQL -> 回填Redis
-- 写：Redis + MySQL

-- 方案2：MySQL内存表
CREATE TABLE user_balance_cache (
  user_id BIGINT PRIMARY KEY,
  balance DECIMAL(10,2)
) ENGINE=MEMORY;

-- 定时同步
INSERT INTO user_balance_cache
SELECT user_id, balance FROM user_balance
ON DUPLICATE KEY UPDATE balance = VALUES(balance);

-- 方案3：MySQL二级缓存
-- ProxySQL结果集缓存
INSERT INTO mysql_query_rules (rule_id, active, match_digest, cache_ttl) 
VALUES (1, 1, 'SELECT balance FROM user_balance WHERE user_id = ?', 5000);
```

#### **12.3 乐观锁与悲观锁**

**悲观锁（FOR UPDATE）：**

```sql
-- 场景：并发扣库存
BEGIN;
SELECT stock FROM products WHERE id = 1001 FOR UPDATE;
-- 其他事务阻塞

UPDATE products SET stock = stock - 1 WHERE id = 1001;
COMMIT;

-- 优点：简单
-- 缺点：并发低
-- 适用：并发<100
```

**乐观锁（版本号）：**

```sql
-- 表结构
CREATE TABLE products_optimistic (
  id BIGINT,
  stock INT,
  version BIGINT,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- 查询 + 更新
SELECT stock, version FROM products_optimistic WHERE id = 1001;
-- 返回：stock=100, version=5

UPDATE products_optimistic 
SET stock = stock - 1, version = version + 1
WHERE id = 1001 AND version = 5;

-- 判断影响行数
-- 1：更新成功
-- 0：版本变化，需重试

-- 优点：无锁，并发高
-- 缺点：需重试逻辑
-- 适用：高并发>1000

-- 重试逻辑
def deduct_stock(product_id, quantity):
    retries = 3
    for i in range(retries):
        cursor.execute("SELECT stock, version FROM products WHERE id = %s", (product_id,))
        stock, version = cursor.fetchone()
        
        cursor.execute(
            "UPDATE products SET stock = stock - %s, version = version + 1 "
            "WHERE id = %s AND version = %s",
            (quantity, product_id, version)
        )
        
        if cursor.rowcount == 1:
            conn.commit()
            return True
        
        conn.rollback()
    
    return False  # 重试失败
```

#### **12.4 秒杀场景优化**

**秒杀架构：**

```plantuml
@startuml
skinparam defaultFontName "Microsoft YaHei"

actor "用户" as user
actor "攻击者" as bot

"WAF/CDN" -down-> "Nginx" : 请求限流

"Nginx" -down-> "Lua脚本" : 检查秒杀开关

"Lua脚本" -down-> "Redis" : 预扣库存
"Lua脚本" -down-> "Redis" : 黑名单

"Redis" -down-> "Kafka" : 订单消息

"Kafka" -down-> "订单服务" : 消费

"订单服务" -down-> "MySQL" : 最终扣库存

bot --> "WAF/CDN" : 99%请求拦截
user --> "WAF/CDN" : 正常请求

note right of Redis
  关键：
  1. 预扣库存，快速失败
  2. 黑名单过滤
  3. Lua脚本保证原子性
end note

note right of Kafka
  削峰填谷
  异步处理
end note

@enduml
```

**秒杀实现：**

```lua
-- Redis Lua脚本
local stock_key = KEYS[1]
local user_key = KEYS[2]
local user_id = ARGV[1]
local quantity = ARGV[2]

-- 检查是否已购买
if redis.call("SISMEMBER", user_key, user_id) == 1 then
    return -1  -- 已购买
end

-- 扣库存
local stock = redis.call("DECRBY", stock_key, quantity)
if stock < 0 then
    redis.call("INCRBY", stock_key, quantity)  -- 回滚
    return 0  -- 库存不足
end

-- 标记已购买
redis.call("SADD", user_key, user_id)
return 1  -- 成功
```

**MySQL最终扣减：**

```sql
-- 避免热点，使用分桶
CREATE TABLE seckill_bucket (
  sku_id BIGINT,
  bucket_no INT,
  stock INT,
  PRIMARY KEY (sku_id, bucket_no)
) ENGINE=InnoDB;

-- 定时任务同步Redis到MySQL
INSERT INTO seckill_bucket (sku_id, bucket_no, stock)
SELECT 
  sku_id,
  bucket,
  SUM(stock) as stock
FROM (
  SELECT sku_id, MOD(order_id, 16) as bucket, stock
  FROM seckill_redis_sync
) t
GROUP BY sku_id, bucket
ON DUPLICATE KEY UPDATE stock = VALUES(stock);

-- 日终对账
-- 比对Redis与MySQL库存
```

---

## 第七部分：运维实践篇 - 生产环境最佳实践

### 第13章 日常运维操作

#### 13.1 部署规范

**目录结构规范：**

```bash
/data/mysql/
├── mysql-3306/
│   ├── data/          # 数据目录
│   ├── binlog/        # 二进制日志
│   ├── relaylog/      # 中继日志
│   ├── log/           # 日志（error, slow）
│   ├── tmp/           # 临时文件
│   └── backup/        # 备份
├── mysql-3307/
│   └── .../
└── scripts/           # 运维脚本
    ├── backup.sh
    ├── monitor.sh
    └── restore.sh
```

**安装脚本：**

```bash
#!/bin/bash
# 自动化安装MySQL 8.0

VERSION="8.0.35"
PORT=3306
DATA_DIR="/data/mysql/mysql-${PORT}"

# 1. 创建用户
groupadd mysql
useradd -r -g mysql -s /bin/false mysql

# 2. 创建目录
mkdir -p ${DATA_DIR}/{data,binlog,relaylog,log,tmp,backup}
chown -R mysql:mysql /data/mysql

# 3. 下载并解压
wget https://cdn.mysql.com/Downloads/MySQL-8.0/mysql-${VERSION}-linux-glibc2.12-x86_64.tar.xz
tar -xf mysql-${VERSION}-linux-glibc2.12-x86_64.tar.xz -C /usr/local/
ln -s /usr/local/mysql-${VERSION} /usr/local/mysql

# 4. 初始化
/usr/local/mysql/bin/mysqld --initialize-insecure \
  --user=mysql \
  --basedir=/usr/local/mysql \
  --datadir=${DATA_DIR}/data

# 5. 配置文件
cat > /etc/my-${PORT}.cnf <<EOF
[mysqld]
port = ${PORT}
datadir = ${DATA_DIR}/data
socket = /tmp/mysql-${PORT}.sock
pid-file = /data/mysql/mysql-${PORT}/mysql.pid

# InnoDB
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 1

# 日志
log_error = ${DATA_DIR}/log/error.log
slow_query_log = ON
slow_query_log_file = ${DATA_DIR}/log/slow.log
long_query_time = 1

# 二进制日志
server_id = 1
log_bin = ${DATA_DIR}/binlog/mysql-bin
binlog_format = ROW
expire_logs_days = 7
EOF

# 6. Systemd服务
cat > /etc/systemd/system/mysql@${PORT}.service <<EOF
[Unit]
Description=MySQL Server ${PORT}
After=network.target

[Service]
User=mysql
Group=mysql
ExecStart=/usr/local/mysql/bin/mysqld --defaults-file=/etc/my-${PORT}.cnn
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# 7. 启动
systemctl enable mysql@${PORT}
systemctl start mysql@${PORT}

# 8. 安全配置
echo "ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';" > /tmp/secure.sql
/usr/local/mysql/bin/mysql -S /tmp/mysql-${PORT}.sock < /tmp/secure.sql

echo "MySQL ${PORT} installed successfully!"
```

#### 13.2 升级最佳实践

**升级路径：**

```markdown
5.5 -> 5.6 -> 5.7 -> 8.0
必须逐版本升级，不可跳跃

8.0.25 -> 8.0.26 -> 8.0.35
小版本可直接升级
```

**升级前准备：**

```bash
# 1. 完整备份
mysqldump --all-databases --single-transaction --master-data=2 > full_backup.sql

# 2. 备份配置文件
cp /etc/my.cnf /etc/my.cnf.backup.$(date +%Y%m%d)

# 3. 检查兼容性
mysqlsh -e "util.checkForServerUpgrade()" --target-version=8.0.35

# 4. 数据量评估
du -sh /data/mysql/data

# 5. 回滚方案准备
# 准备回退版本的二进制包

# 6. 业务低峰期操作
# 凌晨2-4点
```

**In-Place升级步骤：**

```bash
# 1. 停止旧实例
systemctl stop mysql

# 2. 解压新版本
tar -xf mysql-8.0.35-linux-glibc2.12-x86_64.tar.xz -C /usr/local/
ln -snf /usr/local/mysql-8.0.35 /usr/local/mysql

# 3. 启动新版本（自动升级数据字典）
/usr/local/mysql/bin/mysqld --user=mysql &
# 观察日志：Upgrading data dictionary

# 4. 运行mysql_upgrade（5.7->8.0需要）
/usr/local/mysql/bin/mysql_upgrade -uroot -p

# 5. 检查系统表
mysql -e "CHECK TABLE mysql.user FOR UPGRADE;"
mysql -e "REPAIR TABLE mysql.user;"  # 如有错误

# 6. 重启
systemctl restart mysql

# 7. 验证
mysql -e "SELECT VERSION();"
mysql -e "SHOW GLOBAL STATUS LIKE 'Uptime';"
```

**逻辑升级（推荐）：**

```bash
# 1. 部署新版本实例
# 端口3307，空数据
systemctl start mysql@3307

# 2. 逻辑导出导入
mysql-5.7/bin/mysqldump -S /tmp/mysql-3306.sock --all-databases > full.sql

mysql-8.0/bin/mysql -S /tmp/mysql-3307.sock < full.sql

# 3. 切换VIP/域名
# 从3306切换到3307

# 4. 观察业务
# 至少1小时

# 5. 停止旧实例
systemctl stop mysql@3306

# 优点：
# - 可回滚（原实例保留）
# - 数据文件更干净
# - 避免升级失败

# 缺点：
# - 需要双倍空间
# - 时间较长
```

**升级后验证：**

```sql
-- 1. 版本检查
SELECT VERSION();

-- 2. 性能基准测试
-- sysbench测试
sysbench oltp_read_write --mysql-host=localhost --mysql-port=3306 \
  --mysql-user=root --mysql-password=xxx \
  --tables=10 --table-size=100000 prepare

sysbench oltp_read_write --time=60 --threads=32 run

-- 3. SQL兼容性检查
-- 8.0移除的功能：
-- - 查询缓存
-- - PASSWORD()函数
-- - group_concat_max_len默认值改变

-- 4. 应用日志检查
-- 是否有SQL报错

-- 5. 监控指标对比
-- QPS、延迟、错误率
```

#### 13.3 备份恢复策略

**备份类型：**

```sql
-- 1. 逻辑备份（mysqldump）
# 优点：跨版本，可读，单表恢复
# 缺点：慢，锁表（若不使用--single-transaction）
# 适用：小库（<100GB），迁移

mysqldump --all-databases --single-transaction --master-data=2 \
  --routines --triggers --events > full_backup_$(date +%Y%m%d).sql

-- 2. Xtrabackup物理备份
# 优点：热备，快，支持流式
# 缺点：不能跨大版本
# 适用：大库（>100GB），日常备份

# 全备
xtrabackup --backup --user=root --password=xxx \
  --target-dir=/data/backup/full_$(date +%Y%m%d)

# 增量备份
xtrabackup --backup --user=root --password=xxx \
  --target-dir=/data/backup/inc_$(date +%Y%m%d) \
  --incremental-basedir=/data/backup/full_base

-- 3. 快照备份（LVM/ZFS）
# 优点：秒级
# 缺点：需文件系统支持
# 适用：云环境

# LVM快照
lvcreate --size 10G --snapshot --name mysql_snap /dev/vg0/lv_mysql

# 挂载备份
mount /dev/vg0/mysql_snap /mnt/backup

-- 4. Binlog备份
# 实时备份binlog
mysqlbinlog --read-from-remote-server --raw \
  --stop-never host=master.db binlog.000001
```

**备份恢复测试：**

```bash
#!/bin/bash
# 每日恢复测试

BACKUP_DIR="/data/backup"
TEST_DIR="/data/restore_test"

# 1. 随机选择备份
BACKUP_FILE=$(ls $BACKUP_DIR/*.sql | shuf -n 1)

# 2. 恢复测试实例
systemctl start mysql@test

# 3. 恢复
mysql -S /tmp/mysql-test.sock < $BACKUP_FILE

# 4. 校验
TABLES=$(mysql -S /tmp/mysql-test.sock -e "SELECT COUNT(*) FROM information_schema.TABLES" -s)
CHECKSUM=$(mysql -S /tmp/mysql-test.sock -e "CHECKSUM TABLE test.user" -s | awk '{print $2}')

# 5. 报告
echo "Restore test completed: $BACKUP_FILE, Tables: $TABLES, Checksum: $CHECKSUM"

# 6. 清理
systemctl stop mysql@test
rm -rf $TEST_DIR/*
```

#### 13.4 应急预案

**常见故障场景：**

```markdown
**场景1：主库宕机**

1. 确认主库无法恢复
   - 检查硬件、系统、MySQL进程
   - 若5分钟内无法恢复，启动切换

2. 选择新主库
   - 查看从库延迟：SHOW SLAVE STATUS
   - 选择延迟最小（<60秒）的从库

3. 故障切换（MHA/Orchestrator自动执行）
   ‍```bash
   # 手动执行
   # 1. 在新主库停止复制
   STOP SLAVE;
   RESET MASTER;
   
   # 2. 应用其他从库
   STOP SLAVE;
   CHANGE MASTER TO MASTER_HOST='new_master';
   START SLAVE;
```

4. 通知业务

   - 更新DNS/VIP
   - 重启连接池
5. 数据补齐

   - 若主库可恢复，导出增量数据
   - 在新主库导入

**场景2：从库延迟过高**

1. 定位原因

   - SHOW SLAVE STATUS
   - 检查：SQL线程是否在跑
   - 检查：是否有大事务
2. 解决方案

   - 若SQL线程慢：增大并行复制

     ```sql
     SET GLOBAL slave_parallel_workers = 8;
     ```
   - 若IO线程慢：检查网络

     ```bash
     pt-heartbeat --check
     ```
   - 若大事务：拆分

     ```bash
     pt-query-digest --since '1 hour ago' --type binlog
     ```
3. 止损

   - 业务读流量切换到其他从库
   - 若无法恢复，重建从库

**场景3：磁盘满**

1. 紧急清理

   ```bash
   # 清理binlog
   PURGE BINARY LOGS BEFORE '2024-01-01';

   # 删除临时文件
   find /tmp -name "*mysql*" -type f -mtime +7 -delete
   ```
2. 扩容

   - 云盘：在线扩容
   - 物理盘：LVM扩容
3. 数据迁移

   ```bash
   # 移动数据文件
   ALTER TABLE large_table DATA DIRECTORY = '/new_disk/data';
   ```
4. 归档旧数据

   ```bash
   pt-archiver --purge --where "create_time < DATE_SUB(NOW(), INTERVAL 1 YEAR)"
   ```

**场景4：CPU 100%**

1. 定位进程

   ```bash
   top -Hp $(pgrep mysqld)
   ```
2. 查看活跃线程

   ```sql
   SELECT * FROM performance_schema.threads WHERE THREAD_OS_ID IN (...);
   ```
3. 查找慢查询

   ```bash
   pt-query-digest --processlist h=localhost
   ```
4. *kill或优化*

   ```sql
   -- 杀掉耗时SQL
   SELECT CONCAT('KILL ',id,';') FROM INFORMATION_SCHEMA.PROCESSLIST 
   WHERE TIME > 100 AND COMMAND = 'Query';
   ```
5. 限流

   ```ini
   # 限制并发
   max_connections = 100
   ```

**场景5：内存不足**

1. 查看内存使用

   ```bash
   ps -aux | grep mysqld
   ```
2. 紧急释放

   ```sql
   -- 释放缓冲池
   SET GLOBAL innodb_buffer_pool_size = 1G;
   ```
3. 重启（最后手段）

   ```bash
   systemctl restart mysql
   ```
4. 分析原因

   - 检查thread内存配置
   - 检查连接数
   - 检查大查询

**场景6：误删数据**

1. 停止写入

   ```bash
   # 主库设为只读
   SET GLOBAL read_only = ON;
   ```
2. 评估影响

   - 删除时间
   - 数据量
   - 业务影响
3. 恢复方案

   - 闪回（binlog2sql）

     ```bash
     # 生成反向SQL
     python binlog2sql.py --flashback -B --start-datetime='2024-01-23 10:00:00' -d db -t table
     ```
   - 从备份恢复

     ```bash
     # 找到最近的备份
     # 恢复到新实例
     # 导出误删数据
     # 导入生产库
     ```
4. 事后复盘

   - 权限管控
   - 操作审计
   - SQL审核

```

---

## 第八部分：高级主题篇 - 驾驭未来

### 第14章 MySQL 8.x新特性

#### 14.1 原子DDL

MySQL 8.0支持DDL原子性，失败自动回滚。

‍```sql
-- MySQL 5.7
DROP TABLE t1, t2;  -- t1存在，t2不存在
-- 结果：t1被删除，错误：t2不存在
-- 无法保证原子性

-- MySQL 8.0
DROP TABLE t1, t2;  -- t1存在，t2不存在
-- 结果：两个表都未删除，报错
-- DDL原子性保证

-- 原理：
-- DDL操作写入数据字典（DD）
-- 失败时回滚DD
-- 保证操作的ACID
```

**原子DDL范围：**

```sql
-- 支持的DDL：
-- CREATE TABLE, ALTER TABLE, DROP TABLE
-- RENAME TABLE, TRUNCATE TABLE
-- CREATE INDEX, DROP INDEX
-- CREATE DATABASE, DROP DATABASE

-- InnoDB表操作是原子的
-- MyISAM表不是
```

### 第14章 MySQL 8.x新特性

MySQL 8.0是MySQL历史上最大版本跃迁，带来超过300项改进。本章聚焦生产环境最实用的8大特性，助你在升级后快速获得性能红利。

#### 14.1 原子DDL（Atomic DDL）

传统MySQL的"半失败DDL"是DBA的噩梦：一张大表加字段中途失败，可能留下一个不可用的"半成品表"，业务中断数小时。8.0引入的原子DDL基于数据字典事务，彻底解决这一顽疾。

​**核心原理**：所有DDL操作在写入数据字典（Data Dictionary）前先记录Undo日志，失败时完整回滚元数据变更，确保DDL要么完全成功，要么不影响原表。

​**生产案例**：某电商在5.7环境对500GB订单表加索引，执行2小时后因磁盘空间不足失败，表被锁死无法访问，只能花4小时从备份重建。升级到8.0后同样操作失败，表秒级自动回退到可用状态，业务零中断。

**使用对比：**

```sql
-- MySQL 5.7：DDL失败导致表损坏
mysql> ALTER TABLE orders ADD INDEX idx_amount (amount);
ERROR 1114 (HY000): The table 'orders' is full
-- 结果：orders表被锁定，无法访问

-- MySQL 8.0：DDL失败自动回滚
mysql> ALTER TABLE orders ADD INDEX idx_amount (amount);
ERROR 1114 (HY000): The table 'orders' is full
-- 结果：orders表立即恢复可用，无锁

-- 验证原子性
mysql> CHECK TABLE orders;
+------------+-------+----------+----------+
| Table      | Op    | Msg_type | Msg_text |
+------------+-------+----------+----------+
| test.orders| check | status   | OK       |
+------------+-------+----------+----------+
```

​**支持的DDL操作**：

- CREATE/DROP/ALTER TABLE（InnoDB）
- CREATE/DROP INDEX
- RENAME TABLE
- TRUNCATE TABLE
- CREATE/DROP DATABASE

​**限制**：

- MyISAM表（仍非原子）
- FEDERATED、CSV等引擎

   涉及非事务性存储过程的DDL

​**监控原子DDL状态**：

```sql
-- 查看DDL日志
SELECT * FROM mysql.innodb_ddl_log 
WHERE thread_id = CONNECTION_ID();

-- DDL失败时自动清理
-- 无需人工干预

-- 监控回滚事件
SHOW GLOBAL STATUS LIKE 'Innodb_ddl%';
-- Innodb_ddl_operations	1234
-- Innodb_ddl_recovery_rollback	0  -- 回滚次数
```

​**最佳实践**：

1. 大表DDL前务必使用`pt-online-schema-change`​或`gh-ost`，即使8.0原子DDL能回滚，长时间锁表仍会影响业务
2. 对核心业务表，DDL操作选择在凌晨低峰期，配合`MAX_EXECUTION_TIME`限制执行时长
3. 定期清理`mysql.innodb_ddl_log`表，避免残留日志堆积

#### 14.2 降序索引

```sql
-- MySQL 5.7
CREATE INDEX idx_name ON users (name ASC);
SELECT * FROM users ORDER BY name DESC;
-- Extra: Backward index scan（反向扫描）
-- 性能略差

-- MySQL 8.0
CREATE INDEX idx_name_desc ON users (name DESC);

SELECT * FROM users ORDER BY name DESC;
-- Extra: Using index
-- 性能提升10%

-- 混合排序
CREATE INDEX idx_status_ctime_desc ON orders (status, create_time DESC);

SELECT * FROM orders WHERE status = 1 ORDER BY create_time DESC;
-- 索引完全匹配，无filesort
```

#### 14.3 自设直方图

```sql
-- 创建直方图
ANALYZE TABLE orders UPDATE HISTOGRAM ON amount WITH 256 BUCKETS;

-- 查看直方图
SELECT * FROM information_schema.COLUMN_STATISTICS
WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'amount';

-- 优化器使用直方图
-- 估算范围查询选择性更准确

EXPLAIN SELECT * FROM orders WHERE amount BETWEEN 1000 AND 2000;
-- 8.0: 估算更准确

-- 删除直方图
ANALYZE TABLE orders DROP HISTOGRAM ON amount;
```

#### 14.4 JSON增强

```sql
-- JSON聚合函数
SELECT 
  user_id,
  JSON_ARRAYAGG(order_no) AS order_nos,
  JSON_OBJECTAGG('amount', amount) AS amounts
FROM orders
GROUP BY user_id;

-- JSON表函数
SELECT * FROM JSON_TABLE(
  '[{"a":1,"b":"x"},{"a":2,"b":"y"}]',
  '$[*]' COLUMNS(
    col_a INT PATH '$.a',
    col_b VARCHAR(10) PATH '$.b'
  )
) AS jt;

-- JSON模式验证
CREATE TABLE json_validate (
  data JSON,
  CHECK (JSON_SCHEMA_VALID('{"type": "object", "properties": {"name": {"type": "string"}}}', data))
);
```

#### 14.5 CTE和窗口函数增强

```sql
-- CTE更新
WITH users_to_update AS (
  SELECT user_id FROM orders WHERE amount > 1000
)
UPDATE users SET status = 'VIP' WHERE id IN (SELECT user_id FROM users_to_update);

-- 递归CTE增强
-- 支持更多递归场景
```

#### 14.6 资源组（Resource Groups）

限制特定SQL的资源使用。

```sql
-- 查看资源组
SELECT * FROM information_schema.resource_groups;

-- 创建资源组
CREATE RESOURCE GROUP slow_queries
  TYPE = USER
  VCPU = 2-3
  THREAD_PRIORITY = 5;

-- 将慢查询分配到资源组
SET RESOURCE GROUP slow_queries FOR 123;  -- thread_id

-- 查询自动分配
CREATE RESOURCE GROUP reporting
  TYPE = USER
  VCPU = 4-7
  THREAD_PRIORITY = 10;

-- SQL指定资源组
SELECT /*+ RESOURCE_GROUP(reporting) */ * FROM large_table;

-- 监控
SELECT * FROM performance_schema.threads WHERE RESOURCE_GROUP = 'slow_queries';
```

### 第15章 云原生MySQL

#### 15.1 RDS for MySQL

**阿里云RDS配置：**

```bash
# 1. 创建RDS实例
aliyuncli rds CreateDBInstance \
  --RegionId cn-beijing \
  --Engine MySQL \
  --EngineVersion 8.0 \
  --DBInstanceClass mysql.x4.large.2c \
  --DBInstanceStorage 500 \
  --PayType Postpaid

# 2. 设置参数
aliyuncli rds ModifyParameter \
  --DBInstanceId rm-xxx \
  --Parameters "{ \"innodb_buffer_pool_size\": \"3221225472\"}"

# 3. 创建只读实例
aliyuncli rds CreateReadOnlyDBInstance \
  --DBInstanceId rm-xxx \
  --RegionId cn-beijing

# 4. 监控
aliyuncli rds DescribeDBInstancePerformance \
  --DBInstanceId rm-xxx \
  --Key "MySQL_QPSTPS,MySQL_ComDML"
```

**RDS最佳实践：**

```sql
-- 1. 参数优化
-- RDS提供参数模板
-- 根据实例规格自动优化

-- 2. 存储扩容
-- 在线无感扩容
-- 最大支持32TB

-- 3. 备份策略
-- 自动备份保留7-30天
-- 可恢复到任意时间点

-- 4. 监控告警
-- 云监控集成
-- 自定义告警规则

-- 5. 只读实例
-- 读流量自动分发
-- 延迟<1秒
```

#### 15.2 Kubernetes部署

**MySQL Operator：**

```yaml
# 1. 安装Operator
kubectl apply -f https://github.com/mysql/mysql-operator/releases/download/8.0.32/mysql-operator.yaml

# 2. 创建MySQL集群
apiVersion: mysql.oracle.com/v2
kind: InnoDBCluster
metadata:
  name: mysql-cluster
spec:
  instances: 3
  router:
    instances: 1
  secretName: mysql-passwords
  tlsUseSelfSigned: true
  version: "8.0.32"
  
# 3. 创建Secret
kubectl create secret generic mysql-passwords \
  --from-literal=rootUser=root \
  --from-literal=rootHost=% \
  --from-literal=rootPassword='P@ssw0rd!'

# 4. 访问
kubectl get svc mysql-cluster
```

**Helm部署：**

```bash
# 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami

# 安装MySQL
helm install my-mysql bitnami/mysql \
  --set auth.rootPassword=rootpassword \
  --set primary.persistence.size=100Gi \
  --set metrics.enabled=true

# 高可用模式
helm install my-mysql-ha bitnami/mysql \
  --set architecture=replication \
  --set secondary.replicaCount=2
```

#### 15.3 Serverless MySQL

```sql
-- AWS Aurora Serverless
-- 自动扩容缩容
-- 按请求计费

-- 适用场景：
-- 1. 开发测试环境
-- 2. 低频应用
-- 3. 突发流量

-- 不适用：
-- 1. 持续高负载
-- 2. 低延迟要求
-- 3. 长连接

-- 冷启动问题：
-- 闲置后首次请求延迟1-10秒
-- 解决方案：定期keepalive
```

### 第16章 性能测试

#### 16.1 Sysbench测试

**安装：**

```bash
curl -s https://packagecloud.io/install/repositories/akopytov/sysbench/script.rpm.sh | sudo bash
sudo yum install sysbench -y
```

**OLTP测试：**

```bash
# 1. 准备数据
sysbench oltp_read_write \
  --mysql-host=localhost \
  --mysql-port=3306 \
  --mysql-user=root \
  --mysql-password=xxx \
  --mysql-db=sbtest \
  --tables=10 \
  --table-size=1000000 \
  --report-interval=10 \
  prepare

# 2. 运行测试
sysbench oltp_read_write \
  --mysql-host=localhost \
  --mysql-port=3306 \
  --mysql-user=root \
  --mysql-password=xxx \
  --mysql-db=sbtest \
  --tables=10 \
  --table-size=1000000 \
  --threads=32 \
  --time=600 \
  --report-interval=10 \
  run > sysbench_result.log

# 3. 清理
sysbench oltp_read_write \
  --mysql-host=localhost \
  --mysql-port=3306 \
  --mysql-user=root \
  --mysql-password=xxx \
  cleanup
```

**结果解读：**

```bash
SQL statistics:
    queries performed:
        read:                            5600000  -- 读查询
        write:                           1600000  -- 写查询
        other:                           800000   -- 其他
        total:                           8000000
    transactions:                        400000   (400.00 per sec.)  -- TPS
    queries:                             8000000  (8000.00 per sec.)  -- QPS
    read/write requests:                 7200000  (7200.00 per sec.)
    other operations:                    800000   (800.00 per sec.)

General statistics:
    total time:                          600.0000s
    total number of events:              400000

Latency (ms):
         min:                                    2.50
         avg:                                   80.00
         max:                                  500.00
         95th percentile:                      150.00
         sum:                             32000000.00

Threads fairness:
    events (avg/stddev):           12500.0000/100.00
    execution time (avg/stddev):   80.0000/5.00
```

**自定义测试：**

```bash
# 自定义SQL文件
cat > test.lua <<EOF
function event()
   db_query("SELECT * FROM users WHERE id = ".. sb_rand(1, 1000000))
end
EOF

sysbench --mysql-host=localhost --mysql-port=3306 \
  --mysql-user=root --mysql-password=xxx \
  --time=300 --threads=16 \
  --report-interval=10 \
  --db-driver=mysql \
  --events=1000000 \
  test.lua run
```

#### 16.2 TPCC测试

```bash
# 安装tpcc-mysql
git clone https://github.com/Percona-Lab/tpcc-mysql.git
cd tpcc-mysql/src && make

# 建库
mysql -e "CREATE DATABASE tpcc;"

# 准备数据
./tpcc_load localhost tpcc root password 10

# 运行测试
./tpcc_start -hlocalhost -d tpcc -u root -p password \
  -w 10 -c 32 -r 10 -l 3600 -i 10 > tpcc_result.log

# 结果
10, 32, 3600, 2000, 2000
-- warehouses, connections, time, tpmC, tpmTOTAL
```

#### 16.3 自定义压测平台

```python
# load_test.py
import mysql.connector
import time
from concurrent.futures import ThreadPoolExecutor

def execute_query(query, conn_params):
    conn = mysql.connector.connect(**conn_params)
    cursor = conn.cursor()
    start = time.time()
    cursor.execute(query)
    cursor.fetchall()
    end = time.time()
    conn.close()
    return end - start

def load_test():
    queries = [
        "SELECT * FROM orders WHERE user_id = 12345",
        "SELECT * FROM users WHERE email = 'test@example.com'",
        "INSERT INTO logs (message) VALUES ('test')",
    ]
    
    conn_params = {
        'host': 'localhost',
        'user': 'root',
        'password': 'xxx',
        'database': 'ecommerce'
    }
    
    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = []
        for _ in range(10000):
            query = random.choice(queries)
            future = executor.submit(execute_query, query, conn_params)
            futures.append(future)
        
        latencies = [f.result() for f in futures]
    
    # 计算P99
    latencies.sort()
    p99 = latencies[int(len(latencies) * 0.99)]
    avg = sum(latencies) / len(latencies)
    
    print(f"QPS: {10000/3600:.2f}")
    print(f"Avg Latency: {avg*1000:.2f}ms")
    print(f"P99 Latency: {p99*1000:.2f}ms")

if __name__ == '__main__':
    load_test()
```

---

## 附录

### 附录A：参数速查表

```ini
# 生产环境推荐参数（64GB内存，16核CPU）

[mysqld]
# 基础
port = 3306
datadir = /data/mysql/data
socket = /tmp/mysql.sock

# 内存
innodb_buffer_pool_size = 48G
innodb_buffer_pool_instances = 16
innodb_log_buffer_size = 128M
sort_buffer_size = 2M
join_buffer_size = 2M
read_buffer_size = 1M
read_rnd_buffer_size = 2M
tmp_table_size = 64M
max_heap_table_size = 64M
thread_cache_size = 100

# InnoDB
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 1
innodb_log_file_size = 2G
innodb_log_files_in_group = 2
innodb_io_capacity = 8000
innodb_io_capacity_max = 20000
innodb_old_blocks_pct = 25
innodb_max_dirty_pages_pct = 75
innodb_purge_threads = 4
innodb_page_cleaners = 4

# 复制
server_id = 1
log_bin = /data/mysql/binlog/mysql-bin
binlog_format = ROW
sync_binlog = 1
expire_logs_days = 7
gtid_mode = ON
enforce_gtid_consistency = ON
master_info_repository = TABLE
relay_log_info_repository = TABLE

# 日志
log_error = /data/mysql/log/error.log
slow_query_log = ON
slow_query_log_file = /data/mysql/log/slow.log
long_query_time = 0.5
log_queries_not_using_indexes = OFF

# 连接
max_connections = 2000
max_connect_errors = 100000
connect_timeout = 10
wait_timeout = 600
interactive_timeout = 600
max_allowed_packet = 1G

# 安全
validate_password.policy = MEDIUM
skip_name_resolve = ON
```

### 附录B：常用脚本

**一键诊断脚本：**

```bash
#!/bin/bash
# mysql_health_check.sh

HOST="localhost"
PORT="3306"
USER="root"
PASS="xxx"

echo "======== MySQL Health Check ========"
echo "Host: $HOST"
echo "Time: $(date)"

echo -e "\n[1] Uptime"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "SHOW GLOBAL STATUS LIKE 'Uptime';"

echo -e "\n[2] Connections"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "
SELECT 
  VARIABLE_VALUE AS max_connections,
  (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Threads_connected') AS current_connections,
  ROUND((SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Threads_connected') / VARIABLE_VALUE * 100, 2) AS usage_percent
FROM performance_schema.global_variables
WHERE VARIABLE_NAME='max_connections';
"

echo -e "\n[3] Buffer Pool Hit Rate"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "
SELECT 
  ROUND((1 - Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests) * 100, 2) AS hit_rate
FROM (
  SELECT 
    MAX(IF(VARIABLE_NAME='Innodb_buffer_pool_reads', VARIABLE_VALUE, 0)) AS Innodb_buffer_pool_reads,
    MAX(IF(VARIABLE_NAME='Innodb_buffer_pool_read_requests', VARIABLE_VALUE, 0)) AS Innodb_buffer_pool_read_requests
  FROM performance_schema.global_status
  WHERE VARIABLE_NAME IN ('Innodb_buffer_pool_reads', 'Innodb_buffer_pool_read_requests')
) t;
"

echo -e "\n[4] Replication Lag"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "SHOW SLAVE STATUS\G" | grep "Seconds_Behind_Master"

echo -e "\n[5] Slow Queries"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "
SELECT COUNT(*) AS slow_query_count 
FROM performance_schema.events_statements_summary_by_digest 
WHERE AVG_TIMER_WAIT > 500000000000;  -- >0.5秒
"

echo -e "\n[6] Top 5 Tables Size"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "
SELECT TABLE_SCHEMA, TABLE_NAME, 
       ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
       ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC
LIMIT 5;
"

echo -e "\n[7] Lock Waits"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "
SELECT COUNT(*) AS lock_waits
FROM performance_schema.data_lock_waits;
"

echo -e "\n[8] Deadlocks"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "
SHOW ENGINE INNODB STATUS\G" | grep "LATEST DETECTED DEADLOCK

echo -e "\n[9] Recommendations"
mysql -h$HOST -P$PORT -u$USER -p$PASS -e "SELECT * FROM sys.sys_config;"
```

**备份恢复脚本：**

```bash
#!/bin/bash
# backup_rotate.sh

BACKUP_DIR="/data/backup"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d)

# 全量备份
xtrabackup --backup --user=root --password=xxx \
  --stream=xbstream --compress | \
  ssh backup_server "cat > $BACKUP_DIR/full_$DATE.xbstream"

# 删除旧备份
find $BACKUP_DIR -name "full_*" -mtime +$RETENTION_DAYS -delete

# 备份校验
ssh backup_server "xbstream -x < $BACKUP_DIR/full_$DATE.xbstream -C /data/restore_test"
ssh backup_server "xtrabackup --prepare --target-dir=/data/restore_test"
```

**性能压测脚本：**

```bash
#!/bin/bash
# benchmark.sh

MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASS="password"

# 1. 准备数据
sysbench oltp_read_write \
  --mysql-host=$MYSQL_HOST \
  --mysql-port=$MYSQL_PORT \
  --mysql-user=$MYSQL_USER \
  --mysql-password=$MYSQL_PASS \
  --mysql-db=sbtest \
  --tables=10 \
  --table-size=1000000 \
  --threads=32 \
  --report-interval=10 \
  prepare

# 2. 运行测试
sysbench oltp_read_write \
  --mysql-host=$MYSQL_HOST \
  --mysql-port=$MYSQL_PORT \
  --mysql-user=$MYSQL_USER \
  --mysql-password=$MYSQL_PASS \
  --mysql-db=sbtest \
  --tables=10 \
  --table-size=1000000 \
  --threads=32 \
  --time=300 \
  --report-interval=10 \
  run > benchmark_result_$(date +%Y%m%d_%H%M%S).log

# 3. 清理
sysbench oltp_read_write \
  --mysql-host=$MYSQL_HOST \
  --mysql-port=$MYSQL_PORT \
  --mysql-user=$MYSQL_USER \
  --mysql-password=$MYSQL_PASS \
  --mysql-db=sbtest \
  cleanup

# 4. 生成报告
GNU_TIME_FORMAT="real %e, user %U, sys %S, cpu %P"
TIMEFORMAT=$GNU_TIME_FORMAT
time sysbench ... 2>&1 | tee benchmark_result.log
```

### 附录C：故障排查索引

|故障现象|排查命令|解决方案|参考章节|
| ---------------| ----------| ---------------------------------| ----------|
|MySQL无法启动|​`journalctl -u mysql`|检查数据目录权限、配置文件|1.3.1|
|连接数满|​`SHOW PROCESSLIST`|增大max_connections，优化连接池|1.1.1|
|慢查询|​`pt-query-digest`|优化索引，改写SQL|5.1|
|复制中断|​`SHOW SLAVE STATUS`|跳过错误，重新同步|9.1.1|
|复制延迟|​`pt-heartbeat`|并行复制，优化大事务|9.1.1|
|死锁|​`SHOW ENGINE INNODB STATUS`|统一加锁顺序，缩短事务|1.2.2|
|磁盘满|​`du -sh /data/mysql/*`|清理binlog，删除旧数据|13.4|
|CPU高|​`top -Hp $(pgrep mysqld)`|优化慢查询，增加索引|4.4|
|内存不足|​`ps -aux \| grep mysqld`|降低缓冲池，减少连接数|1.3.2|
|索引失效|​`EXPLAIN`|避免函数操作，检查数据类型|3.5|
|表损坏|​`CHECK TABLE`|​`REPAIR TABLE`或从备份恢复|2.3|
|主键溢出|​`SELECT MAX(id) > 2^31`|改为BIGINT|2.1.2|
|长事务|​`SELECT * FROM innodb_trx`|尽快提交，设置超时|1.2.1|

### 附录D：术语表

|术语|全称|解释|
| --------| -----------------------------------------------| ----------------|
|ACID|Atomicity, Consistency, Isolation, Durability|事务特性|
|MVCC|Multi-Version Concurrency Control|多版本并发控制|
|WAL|Write-Ahead Logging|预写日志|
|ICP|Index Condition Pushdown|索引下推|
|MRR|Multi-Range Read|多范围读|
|B+Tree|Balanced Tree|平衡树索引|
|CTE|Common Table Expression|公用表表达式|
|GTID|Global Transaction ID|全局事务ID|
|MGR|MySQL Group Replication|MySQL组复制|
|DDL|Data Definition Language|数据定义语言|
|DML|Data Manipulation Language|数据操作语言|
|QPS|Queries Per Second|每秒查询数|
|TPS|Transactions Per Second|每秒事务数|
|P99|99th Percentile|99%分位延迟|
|IO|Input/Output|输入输出|
|IOPS|Input/Output Operations Per Second|每秒IO操作数|
|NUMA|Non-Uniform Memory Access|非统一内存访问|
|AHI|Adaptive Hash Index|自适应哈希索引|
|LSN|Log Sequence Number|日志序列号|

### 附录E：参考资源

**官方文档：**

- MySQL官方文档：https://dev.mysql.com/doc/
- MySQL运维手册：https://dev.mysql.com/doc/refman/en/
- Percona博客：https://www.percona.com/blog/

**工具：**

- Percona Toolkit：https://www.percona.com/software/database-tools/percona-toolkit
- Sysbench：https://github.com/akopytov/sysbench
- ProxySQL：https://proxysql.com/
- MySQL Shell：https://dev.mysql.com/doc/mysql-shell/en/

**社区：**

- MySQL官方论坛：https://forums.mysql.com/
- Stack Overflow：https://stackoverflow.com/questions/tagged/mysql
- 中国MySQL用户组：https://www.mysqlusergroup.net/

**书籍：**

- 《高性能MySQL》（第三版）
- 《MySQL技术内幕：InnoDB存储引擎》
- 《MySQL运维内参》

**认证：**

- Oracle Certified Professional, MySQL 8.0 Database Administrator
- MySQL 8.0 for Database Administrators Ed 3

---

**SakuRain Team**  
 *"让每一行SQL都发挥到极致"*
