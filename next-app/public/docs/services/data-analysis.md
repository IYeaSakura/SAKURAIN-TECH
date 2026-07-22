# 数据分析系统

## 架构概览

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE

left to right direction

package "数据采集层" {
    [Scrapy爬虫] as Scrapy
    [Kafka生产者] as KafkaProd
}

package "流处理层" {
    [Flink集群] as Flink
    [Kafka消费者] as KafkaCons
}

package "存储层" {
    database "ClickHouse" as CH
    database "Redis" as Redis
}

package "展示层" {
    [Vue3前端] as Vue3
    [ECharts图表] as Charts
}

Scrapy --> KafkaProd
KafkaProd --> KafkaCons
KafkaCons --> Flink
Flink --> CH
Flink --> Redis
CH --> Vue3
Redis --> Vue3
Vue3 --> Charts

@enduml
```

## 数据流

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE

participant "数据源" as Source
participant "Kafka" as Kafka
participant "Flink" as Flink
participant "ClickHouse" as CH
participant "前端" as UI

Source -> Kafka: 推送原始数据
activate Kafka

Kafka -> Flink: 消费消息
activate Flink

Flink -> Flink: 清洗/聚合
Flink -> CH: 写入OLAP

CH -> UI: 查询分析结果
UI -> UI: ECharts渲染

@enduml
```

## 核心功能

### 1. 实时流处理

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment

env = StreamExecutionEnvironment.get_execution_environment()
t_env = StreamTableEnvironment.create(env)

# 定义Kafka源表
t_env.execute_sql("""
    CREATE TABLE user_events (
        user_id STRING,
        event_type STRING,
        event_time TIMESTAMP(3),
        properties STRING
    ) WITH (
        'connector' = 'kafka',
        'topic' = 'user-events',
        'properties.bootstrap.servers' = 'kafka:9092',
        'format' = 'json'
    )
""")

# 实时聚合统计
t_env.execute_sql("""
    CREATE TABLE event_stats (
        event_type STRING,
        event_count BIGINT,
        window_start TIMESTAMP(3)
    ) WITH (
        'connector' = 'clickhouse',
        'url' = 'clickhouse://localhost:8123',
        'table-name' = 'event_stats'
    )
""")

t_env.execute_sql("""
    INSERT INTO event_stats
    SELECT 
        event_type,
        COUNT(*) as event_count,
        TUMBLE_START(event_time, INTERVAL '1' MINUTE) as window_start
    FROM user_events
    GROUP BY 
        event_type,
        TUMBLE(event_time, INTERVAL '1' MINUTE)
""")
```

### 2. 亿级数据查询

```sql
-- ClickHouse 优化查询示例
SELECT 
    toStartOfHour(event_time) as hour,
    event_type,
    count() as cnt,
    uniqExact(user_id) as uv
FROM user_events
WHERE event_date >= today() - 7
GROUP BY hour, event_type
ORDER BY hour DESC
LIMIT 1000
```

## 性能指标

| 场景 | 性能 | 说明 |
|------|------|------|
| 数据摄入 | 100,000 条/秒 | Kafka + Flink |
| 聚合查询 | <1 秒 | 亿级数据 |
| 明细查询 | <0.5 秒 | 百万级数据 |
| 存储压缩 | >5:1 | 列式存储 |

## 部署架构

```plantuml
@startuml
!theme plain
skinparam backgroundColor #FEFEFE

package "Kubernetes集群" {
    
    package "Flink Namespace" {
        [JobManager] as JM
        [TaskManager] as TM1
        [TaskManager] as TM2
        JM --> TM1
        JM --> TM2
    }
    
    package "Storage Namespace" {
        [ClickHouse Shard1] as CH1
        [ClickHouse Shard2] as CH2
        [Redis Master] as RedisM
        [Redis Replica] as RedisR
        CH1 ~~ CH2 : 复制
        RedisM --> RedisR : 主从
    }
    
    package "App Namespace" {
        [API Server] as API
        [Frontend] as FE
    }
}

cloud "External" {
    [Kafka Cluster] as Kafka
}

Kafka --> JM
TM1 --> CH1
TM2 --> CH2
API --> CH1
API --> RedisM
FE --> API

@enduml
```
