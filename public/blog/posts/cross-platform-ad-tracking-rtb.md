---
title: 跨平台广告追踪的计算广告学原理：从设备指纹到实时竞价的完整技术链路
description: 从一次真实的广告重定向经历出发，深入剖析跨平台广告追踪的完整技术链路，涵盖设备指纹、实时竞价博弈论、CTR/CVR预估模型、联邦学习隐私计算等核心原理。
date: 2026-02-25
author: SAKURAIN
tags: 计算广告, 实时竞价, 设备指纹, 隐私计算, 联邦学习, 推荐系统
cover: /image/logo.webp
featured: false
---

春节假期结束，在回沈阳的路上，我看着春节期间接单赚的零花钱，决定先干点正经事——换新耳机。

我有严重的音乐依赖症。以前在学校上课也得戴着耳机，虽然大三上开始我就基本不去教室了，但耳机始终是体外器官级别的存在。上一份工作在联想，最后离职的原因之一就是开放式办公太吵，天天产品、测试和研发吵架（没错我就是写系统驱动的苦逼研发之一），听歌体验极差，加上我主管认为听歌=摸鱼（事实上听歌时我才是最专注的），干脆辞了。来到现在这家节奏慢工作清闲，薪资还更高的单位，于是我看着用了两年多的索尼WH-1000XM5，又看到XM6国补后才2298元，突然忍不住想要换新。

我在京东对比XM5和XM6的参数，翻来覆去看了三遍频响曲线，没下决心买。切到哔哩哔哩想找个评测看看，结果首页第一条就是京东的广告，硕大的XM6配图，价格正是我刚看的2298元。

我盯着那个广告看了五秒钟。以前碰到这种事也就吐槽一句大数据杀熟，但现在好歹是个算法工程师，得搞清楚这背后的门道——京东和B站这两个八竿子打不着的APP，怎么在秒级时间内串通好的？从设备识别到实时竞价，再到隐私计算，这套系统到底怎么运转的？

这篇博客就从技术原理层面，把这条广告链路完整拆一遍。

## 第一章 设备身份的数学表征与概率匹配

### 1.1 标识符体系的演进与局限

移动广告生态依赖设备标识符实现用户追踪。在iOS生态中，Identifier for Advertising（IDFA）曾是跨应用追踪的核心标识。其数学形式为128位UUID，记为：

$$
\mathcal{I}_{IDFA} \in \{0,1\}^{128}
$$

IDFA的熵为128比特，理论空间大小为 $2^{128}$，冲突概率极低。然而，随着iOS 14.5引入App Tracking Transparency（ATT）框架，用户授权率大幅下降至20%-30%。在拒绝授权场景下，系统返回全零字符串，IDFA失效。

Android生态采用Google Advertising ID（GAID）或国内移动安全联盟推出的OAID，同样面临权限收紧与重置机制。这迫使行业转向**设备指纹（Device Fingerprinting）** 技术，通过可观测的设备属性重建身份标识。

### 1.2 设备指纹的高维向量空间

设备指纹本质是高维特征空间中的点。定义特征提取函数：

$$
\phi: \mathcal{D} \to \mathbb{R}^n
$$

其中 $\mathcal{D}$ 为设备集合，$n$ 为特征维度。具体特征包括：

**硬件特征层**：

- 屏幕物理参数：分辨率 $r_x \times r_y$，像素密度 $ppi$，色深 $d \in \{24, 30, 48\}$（比特）
- 传感器校准数据：加速度计零偏 $\mathbf{b}_a \in \mathbb{R}^3$，陀螺仪刻度因数矩阵 $\mathbf{K}_g \in \mathbb{R}^{3 \times 3}$
- 电池状态：最大容量 $C_{max}$，当前电压 $V_t$，循环次数 $n_{cycle}$

**软件特征层**：

- 系统配置：时区偏移 $\Delta t \in [-12, +14]$，语言列表 $\mathcal{L} = \{l_1, l_2, \ldots, l_m\}$，字体集合 $\mathcal{T} = \{t_1, \ldots, t_k\}$
- 浏览器指纹：Canvas哈希 $h_{canvas}$，WebGL渲染器字符串 $s_{webgl}$，已安装插件集合 $\mathcal{P}$

**网络特征层**：

- IP地址网段：$\text{IP}_{subnet} = \lfloor \text{IP}_{int} / 2^{(32-\text{mask})} \rfloor$
- TCP协议栈指纹：初始TTL值 $ttl_0$，窗口大小 $w_{tcp}$，选项顺序 $\mathcal{O}_{tcp}$

综合特征向量可表示为：

$$
\mathbf{f} = [r_x, r_y, ppi, d, \mathbf{b}_a^\top, \text{vec}(\mathbf{K}_g)^\top, C_{max}, V_t, \Delta t, |\mathcal{L}|, h_{canvas}, \text{IP}_{subnet}, \ldots]^\top \in \mathbb{R}^n
$$

实际系统中 $n$ 可达200-500维。

### 1.3 MinHash与局部敏感哈希

跨平台匹配需在保护隐私的前提下计算设备相似度。对于集合型特征（如字体集合 $\mathcal{T}$），直接传输原始集合存在隐私风险。采用MinHash算法将集合映射为低维签名。

**定义1.1（Jaccard相似度）**
对于两个字体集合 $\mathcal{T}_A, \mathcal{T}_B$，其Jaccard相似度为：

$$
J(\mathcal{T}_A, \mathcal{T}_B) = \frac{|\mathcal{T}_A \cap \mathcal{T}_B|}{|\mathcal{T}_A \cup \mathcal{T}_B|} \in [0,1]
$$

**定义1.2（MinHash签名）**
设 $\pi$ 为全集 $\mathcal{U} = \mathcal{T}_A \cup \mathcal{T}_B$ 上的随机排列，定义哈希函数：

$$
h_{\pi}(\mathcal{T}) = \min_{t \in \mathcal{T}} \pi(t)
$$

**定理1.1（MinHash性质）**
随机排列 $\pi$ 下，MinHash碰撞概率等于Jaccard相似度：

$$
P(h_{\pi}(\mathcal{T}_A) = h_{\pi}(\mathcal{T}_B)) = J(\mathcal{T}_A, \mathcal{T}_B)
$$

**证明**：
考虑任意元素 $x \in \mathcal{U}$。$h_{\pi}(\mathcal{T}_A) = h_{\pi}(\mathcal{T}_B) = x$ 当且仅当：

1. $x \in \mathcal{T}_A \cap \mathcal{T}_B$
2. $\pi(x) < \pi(y)$ 对所有 $y \in (\mathcal{T}_A \cup \mathcal{T}_B) \setminus \{x\}$ 成立

对于特定 $x \in \mathcal{T}_A \cap \mathcal{T}_B$，其在 $\mathcal{T}_A \cup \mathcal{T}_B$ 的 $|\mathcal{T}_A \cup \mathcal{T}_B|$ 个元素中排列最小的概率为 $1/|\mathcal{T}_A \cup \mathcal{T}_B|$。

因此：

$$
\begin{aligned}
P(h_{\pi}(\mathcal{T}_A) = h_{\pi}(\mathcal{T}_B)) &= \sum_{x \in \mathcal{T}_A \cap \mathcal{T}_B} P(\pi(x) \text{ is minimum}) \\
&= |\mathcal{T}_A \cap \mathcal{T}_B| \cdot \frac{1}{|\mathcal{T}_A \cup \mathcal{T}_B|} \\
&= J(\mathcal{T}_A, \mathcal{T}_B)
\end{aligned}
$$

**工程实现**：
使用 $k$ 个独立哈希函数 $\pi_1, \ldots, \pi_k$（通常 $k=128$ 或 $256$），构建签名向量：

$$
\mathbf{s}_A = [h_{\pi_1}(\mathcal{T}_A), \ldots, h_{\pi_k}(\mathcal{T}_A)]^\top \in \mathbb{R}^k
$$

两设备的估计相似度为：

$$
\hat{J}(\mathcal{T}_A, \mathcal{T}_B) = \frac{1}{k} \sum_{i=1}^{k} \mathbb{I}(h_{\pi_i}(\mathcal{T}_A) = h_{\pi_i}(\mathcal{T}_B))
$$

由Hoeffding不等式，估计误差以高概率有界：

$$
P(|\hat{J} - J| \geq \epsilon) \leq 2\exp(-2k\epsilon^2)
$$

取 $k=256, \epsilon=0.05$，误差超过0.05的概率小于 $2e^{-12.8} \approx 2.5 \times 10^{-6}$。

### 1.4 跨平台ID关联的贝叶斯模型

在IDFA不可用场景下，京东与B站需通过设备指纹与辅助信息建立用户关联。定义关联事件 $M$：两平台的设备记录指向同一物理用户。

观测到的特征包括：

- 时间戳接近性：$\Delta t = |t_{jd} - t_{bili}| < \tau$
- IP地址共现：$\text{IP}_{jd} = \text{IP}_{bili}$ 或属于同一C段
- 指纹相似度：$J(\mathbf{f}_{jd}, \mathbf{f}_{bili}) > \theta_J$
- 行为序列相关性：浏览商品与内容标签的余弦相似度 $\cos(\mathbf{v}_{jd}, \mathbf{v}_{bili})$

采用贝叶斯推断计算关联后验概率：

$$
P(M | \mathbf{x}) = \frac{P(\mathbf{x} | M) P(M)}{P(\mathbf{x} | M) P(M) + P(\mathbf{x} | \neg M) P(\neg M)}
$$

其中 $\mathbf{x} = [\Delta t, \mathbb{I}_{IP}, J, \cos]^\top$ 为观测向量。

似然函数 $P(\mathbf{x} | M)$ 建模为多元高斯分布（对连续变量）与独立伯努利分布（对离散变量）的乘积。先验概率 $P(M)$ 基于平台用户重叠度统计，通常在 $10^{-4}$ 至 $10^{-3}$ 量级。

当 $P(M | \mathbf{x}) > 0.9$ 时，系统判定为同一用户，触发重定向广告。

## 第二章 实时竞价系统的博弈论与机制设计

### 2.1 RTB架构的形式化描述

实时竞价（Real-Time Bidding, RTB）是程序化广告的核心交易机制。当用户触发广告展示机会（Impression）时，系统在100毫秒内完成拍卖。

形式化定义：

- **广告位（Slot）** ：$s \in \mathcal{S}$，具有上下文 $c_s$（如B站科技区视频页）
- **买方集合**：$\mathcal{D} = \{D_1, \ldots, D_N\}$，代表DSP（需求方平台）
- **估值函数**：$v_i: \mathcal{U} \times \mathcal{S} \to \mathbb{R}^+$，DSP $D_i$ 对用户 $u$ 在 slot $s$ 的估值
- **出价策略**：$b_i: \mathcal{V} \to \mathbb{R}^+$，将私有估值映射为报价

拍卖机制 $\mathcal{M} = (x, p)$ 包含分配规则 $x$ 与支付规则 $p$。

### 2.2 广义第二高价（GSP）的激励分析

RTB广泛采用GSP（Generalized Second Price）机制。对于单次展示机会：

1. 收集所有DSP的报价 $\mathbf{b} = (b_1, \ldots, b_N)$
2. 按报价排序：$b_{(1)} \geq b_{(2)} \geq \ldots \geq b_{(N)}$
3. 分配：$x_{(1)} = 1$（最高出价者赢得拍卖）
4. 支付：$p_{(1)} = b_{(2)} + \epsilon$，其中 $\epsilon$ 为最小货币单位（如0.01元）

**定义2.1（激励相容性）**
机制是激励相容（Incentive Compatible, IC）的，如果真实报价 $b_i = v_i$ 是每个买方的弱占优策略。

**定义2.2（个体理性）**
机制是个体理性（Individually Rational, IR）的，如果参与者的效用非负：$u_i = v_i - p_i \geq 0$。

**定理2.1（GSP的均衡性质）**
在独立私有价值（IPV）模型下，GSP机制存在贝叶斯纳什均衡，且真实报价构成弱占优策略。

**证明**：
考虑买方 $i$ 的决策问题。设其他买方的报价分布为 $F_{-i}$，最高竞争报价为 $B_{-i}^{(1)} \sim G$。

买方 $i$ 的期望效用函数为：

$$
u_i(b_i, v_i) = \mathbb{E}_{B_{-i}^{(1)}}[(v_i - B_{-i}^{(1)}) \cdot \mathbb{I}(b_i > B_{-i}^{(1)})]
$$

分三种情况讨论：

**情况1**：$b_i > v_i$（高报）

- 若 $B_{-i}^{(1)} < v_i < b_i$：赢得拍卖，支付 $B_{-i}^{(1)}$，效用 $v_i - B_{-i}^{(1)} > 0$，与真实报价相同
- 若 $v_i < B_{-i}^{(1)} < b_i$：赢得拍卖，支付 $B_{-i}^{(1)} > v_i$，效用 $v_i - B_{-i}^{(1)} < 0$，而真实报价会输掉拍卖获得效用0
- 若 $v_i < b_i < B_{-i}^{(1)}$：输掉拍卖，效用0，与真实报价相同

高报可能带来负效用，严格劣于真实报价。

**情况2**：$b_i < v_i$（低报）

- 若 $B_{-i}^{(1)} < b_i < v_i$：赢得拍卖，效用 $v_i - B_{-i}^{(1)} > 0$，与真实报价相同
- 若 $b_i < B_{-i}^{(1)} < v_i$：输掉拍卖，效用0，而真实报价会赢得拍卖获得正效用
- 若 $b_i < v_i < B_{-i}^{(1)}$：输掉拍卖，效用0，与真实报价相同

低报可能错失正效用机会，严格劣于真实报价。

**情况3**：$b_i = v_i$（真实报价）
上述所有风险均不存在。

因此，真实报价 $b_i^* = v_i$ 是弱占优策略。

### 2.3 估值函数的机器学习建模

京东DSP对特定用户的估值 $v$ 取决于点击率（CTR）与转化率（CVR）的预估：

$$
v = \text{CTR} \times \text{CVR} \times \text{GMV} \times \alpha
$$

其中 $\text{GMV}$ 为商品成交客单价，$\alpha$ 为利润率系数。

**CTR预估模型**：

采用逻辑回归（Logistic Regression）作为基线模型。设特征向量 $\mathbf{x} \in \mathbb{R}^d$ 包含：

- 用户侧特征： demographics、历史行为序列的embedding $\mathbf{e}_u$
- 广告侧特征：商品ID、类目、价格、品牌
- 上下文特征：时段、设备类型、网络环境

模型输出：

$$
\text{CTR} = \sigma(\mathbf{w}^\top \mathbf{x} + b) = \frac{1}{1 + \exp(-(\mathbf{w}^\top \mathbf{x} + b))}
$$

参数 $\mathbf{w}$ 通过极大似然估计（MLE）求解。定义交叉熵损失函数：

$$
\mathcal{L}(\mathbf{w}) = -\frac{1}{N} \sum_{i=1}^{N} [y_i \log(\hat{y}_i) + (1-y_i) \log(1-\hat{y}_i)] + \lambda \|\mathbf{w}\|_2^2
$$

其中 $y_i \in \{0,1\}$ 为点击标签，$\hat{y}_i = \sigma(\mathbf{w}^\top \mathbf{x}_i + b)$。

梯度下降更新规则：

$$
\mathbf{w}_{t+1} = \mathbf{w}_t - \eta \nabla_{\mathbf{w}} \mathcal{L}
$$

梯度计算：

$$
\nabla_{\mathbf{w}} \mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i) \mathbf{x}_i + 2\lambda \mathbf{w}
$$

**因子分解机（FM）处理高阶交互**：

CTR预估中，特征间的二阶交互至关重要。例如，"学生"（用户）与"耳机"（商品）的组合具有特定CTR模式。

FM模型引入交互矩阵 $\mathbf{V} \in \mathbb{R}^{d \times k}$，其中 $k \ll d$ 为隐向量维度。模型方程为：

$$
\hat{y} = \sigma\left(w_0 + \sum_{i=1}^{d} w_i x_i + \sum_{i=1}^{d} \sum_{j=i+1}^{d} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j\right)
$$

其中 $\langle \mathbf{v}_i, \mathbf{v}_j \rangle = \sum_{f=1}^{k} v_{i,f} v_{j,f}$。

计算复杂度优化：直接计算二阶项需要 $O(d^2)$ 时间，利用矩阵分解可降至 $O(dk)$：

$$
\sum_{i=1}^{d} \sum_{j=i+1}^{d} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j = \frac{1}{2} \sum_{f=1}^{k} \left[ \left(\sum_{i=1}^{d} v_{i,f} x_i\right)^2 - \sum_{i=1}^{d} v_{i,f}^2 x_i^2 \right]
$$

**深度模型（DeepFM）** ：

结合FM的显式二阶交互与DNN的隐式高阶交互：

$$
\hat{y} = \sigma\left(y_{FM} + y_{DNN}\right)
$$

其中：

$$
y_{FM} = w_0 + \sum w_i x_i + \sum_{i,j} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j \\
y_{DNN} = \text{MLP}(\mathbf{e})
$$

$\mathbf{e}$ 为embedding层输出，MLP结构为：

$$
\mathbf{z}^{(l+1)} = \text{ReLU}(\mathbf{W}^{(l)} \mathbf{z}^{(l)} + \mathbf{b}^{(l)}), \quad l=0,\ldots,L-1
$$

### 2.4 动态出价与预算控制

DSP需在预算约束下最大化总转化价值。设总预算为 $B$，时间 horizon 为 $T$，第 $t$ 次竞拍的估值为 $v_t$，出价 $b_t$，指示变量 $\mathbb{I}_t$ 表示是否赢得拍卖。

优化问题：

$$
\max_{\{b_t\}} \sum_{t=1}^{T} v_t \cdot \mathbb{I}_t(b_t) \quad \text{s.t.} \quad \sum_{t=1}^{T} p_t \cdot \mathbb{I}_t(b_t) \leq B
$$

采用拉格朗日松弛，引入对偶变量 $\lambda$（边际成本）：

$$
\mathcal{L} = \sum_{t=1}^{T} v_t \mathbb{I}_t - \lambda \left(\sum_{t=1}^{T} p_t \mathbb{I}_t - B\right)
$$

最优出价策略为：

$$
b_t^* = \arg\max_{b} \mathbb{E}[(v_t - \lambda p_t) \mathbb{I}_t]
$$

在GSP机制下，$p_t = b_t^{(2)}$（第二高价），因此：

$$
b_t^* = \frac{v_t}{\lambda}
$$

$\lambda$ 通过 pacing 算法动态调整。设剩余预算 $B_{rem}$，剩余时间 $T_{rem}$，当前消耗速率 $r_t$：

$$
\lambda_{t+1} = \lambda_t \cdot \left(1 + \eta \cdot \frac{r_t \cdot T_{rem} - B_{rem}}{B_{rem}}\right)
$$

当消耗过快时，$\lambda$ 增大，降低出价；反之则提高出价。

## 第三章 重定向广告的用户意图建模

### 3.1 行为序列的表征学习

重定向（Retargeting）针对已展示兴趣但未转化的用户。定义用户行为序列 $\mathcal{S} = \{e_1, e_2, \ldots, e_T\}$，其中 $e_t = (a_t, p_t, t_t)$ 包含动作（浏览/加购/收藏）、商品属性、时间戳。

**时间衰减模型**：

历史行为对当前意图的贡献随时间指数衰减。商品 $j$ 的权重：

$$
w_j = \sum_{t: \text{action}_t=j} \exp(-\lambda (t_{now} - t_t))
$$

其中 $\lambda$ 为衰减系数，通常取 $0.001 \sim 0.01$（按秒计）。

**注意力机制（Attention Mechanism）** ：

采用Transformer架构建模行为序列。设商品embedding矩阵 $\mathbf{E} \in \mathbb{R}^{|I| \times d}$，序列 $\mathcal{S}$ 的embedding为 $\mathbf{H} \in \mathbb{R}^{T \times d}$。

自注意力计算：

$$
\text{Attention}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) = \text{softmax}\left(\frac{\mathbf{Q}\mathbf{K}^\top}{\sqrt{d_k}}\right)\mathbf{V}
$$

其中 $\mathbf{Q} = \mathbf{H}\mathbf{W}^Q$, $\mathbf{K} = \mathbf{H}\mathbf{W}^K$, $\mathbf{V} = \mathbf{H}\mathbf{W}^V$。

对于候选广告商品 $c$，使用其embedding $\mathbf{e}_c$ 作为Query，计算与历史行为的注意力权重：

$$
\alpha_t = \frac{\exp(\mathbf{e}_c^\top \mathbf{W}^Q (\mathbf{h}_t \mathbf{W}^K)^\top / \sqrt{d})}{\sum_{\tau=1}^{T} \exp(\mathbf{e}_c^\top \mathbf{W}^Q (\mathbf{h}_\tau \mathbf{W}^K)^\top / \sqrt{d})}
$$

用户兴趣表征：

$$
\mathbf{u} = \sum_{t=1}^{T} \alpha_t \mathbf{h}_t
$$

### 3.2 转化率预估的延迟反馈建模

CVR预估面临延迟反馈问题：用户点击后可能数小时甚至数天才转化。定义点击时刻为 $t_c$，转化时刻为 $t_c + \delta$，观测窗口为 $W$。

若 $\delta > W$，当前标记为未转化（负样本），但未来可能转化。这导致样本选择偏差（SSB）。

**生存分析（Survival Analysis）方法**：

定义转化风险函数（Hazard Function）：

$$
h(t | \mathbf{x}) = \lim_{\Delta t \to 0} \frac{P(t \leq T < t + \Delta t | T \geq t, \mathbf{x})}{\Delta t}
$$

采用Cox比例风险模型：

$$
h(t | \mathbf{x}) = h_0(t) \exp(\boldsymbol{\beta}^\top \mathbf{x})
$$

其中 $h_0(t)$ 为基准风险，$\exp(\boldsymbol{\beta}^\top \mathbf{x})$ 为风险比。

转化概率（累积分布函数）：

$$
F(t | \mathbf{x}) = 1 - \exp\left(-\int_0^t h(s | \mathbf{x}) ds\right) = 1 - S(t | \mathbf{x})
$$

$S(t | \mathbf{x})$ 为生存函数。

在CVR预估中，关注窗口期 $W$ 内的转化率：

$$
\text{CVR} = F(W | \mathbf{x}) = 1 - \exp\left(-H_0(W) \exp(\boldsymbol{\beta}^\top \mathbf{x})\right)
$$

其中 $H_0(W) = \int_0^W h_0(s) ds$ 为累积基准风险。

### 3.3 Look-alike人群扩展

对于重定向受众规模有限的问题，需通过Look-alike扩展相似人群。

**相似度度量**：

定义种子用户集合 $\mathcal{S}$，候选用户 $u$。基于embedding的相似度：

$$
\text{sim}(u, \mathcal{S}) = \frac{1}{|\mathcal{S}|} \sum_{s \in \mathcal{S}} \cos(\mathbf{e}_u, \mathbf{e}_s) = \frac{1}{|\mathcal{S}|} \sum_{s \in \mathcal{S}} \frac{\mathbf{e}_u^\top \mathbf{e}_s}{\|\mathbf{e}_u\| \|\mathbf{e}_s\|}
$$

**图神经网络（GNN）扩展**：

构建用户-商品二分图 $\mathcal{G} = (\mathcal{U} \cup \mathcal{I}, \mathcal{E})$。用户embedding通过图卷积网络（GCN）传播：

$$
\mathbf{h}_u^{(l+1)} = \sigma\left(\sum_{i \in \mathcal{N}(u)} \frac{1}{\sqrt{|\mathcal{N}(u)| |\mathcal{N}(i)|}} \mathbf{W}^{(l)} \mathbf{h}_i^{(l)}\right)
$$

其中 $\mathcal{N}(u)$ 为用户 $u$ 的邻居（交互过的商品），$\sigma$ 为激活函数。

经过 $L$ 层传播，用户表征包含 $L$ 阶邻居信息，实现基于协同过滤的相似用户发现。

## 第四章 隐私计算与联邦学习架构

### 4.1 横向联邦学习（HFL）基础

京东与B站拥有不同特征空间的同一批用户。设京东特征 $\mathbf{x}_A \in \mathbb{R}^{d_A}$，B站特征 $\mathbf{x}_B \in \mathbb{R}^{d_B}$，共同标签 $y$（如是否购买）。

联邦学习目标是联合训练模型 $f_{\theta}$，最小化全局损失：

$$
\min_{\theta} \mathcal{L}(\theta) = \frac{n_A}{n_A + n_B} \mathcal{L}_A(\theta) + \frac{n_B}{n_A + n_B} \mathcal{L}_B(\theta)
$$

其中 $\mathcal{L}_A(\theta) = \frac{1}{n_A} \sum_{i \in \mathcal{D}_A} \ell(f_{\theta}(\mathbf{x}_A^{(i)}), y^{(i)})$。

**FedAvg算法**：

1. 初始化全局模型 $\theta^0$
2. 每轮通信 $r = 1, \ldots, R$：

   - 服务器广播 $\theta^{r-1}$ 给所有参与方
   - 本地更新 $E$ 个epoch：

     $$
     \theta_k^{r} = \theta^{r-1} - \eta \sum_{e=1}^{E} \nabla \mathcal{L}_k(\theta^{r-1, e})
     $$
   - 服务器聚合：

     $$
     \theta^{r} = \sum_{k \in \{A,B\}} \frac{n_k}{n} \theta_k^{r}
     $$

**收敛性分析**：

假设损失函数 $\mathcal{L}_k$ 为 $L$-光滑且 $\mu$-强凸，本地学习率 $\eta \leq \frac{1}{L}$，则：

$$
\mathbb{E}[\mathcal{L}(\theta^R)] - \mathcal{L}^* \leq \frac{\kappa}{\gamma + R} \left(\mathcal{L}(\theta^0) - \mathcal{L}^*\right)
$$

其中 $\kappa = L/\mu$ 为条件数，$\gamma = \frac{\mu}{L^2 \eta}$。

### 4.2 纵向联邦学习（VFL）特征对齐

当双方特征空间不同时（京东有交易数据，B站有观看数据），采用纵向联邦学习。

**实体对齐（Entity Alignment）** ：

通过安全求交（Private Set Intersection, PSI）找到共同用户集合，不泄露非交集用户。

基于Diffie-Hellman密钥交换的PSI协议：

1. 京东选择私钥 $a$，计算 $H(u)^a$ 发送给B站
2. B站选择私钥 $b$，计算 $(H(u)^a)^b = H(u)^{ab}$ 并发送回京东
3. 京东计算 $(H(u)^{ab})^{a^{-1}} = H(u)^b$
4. 双方比对 $H(u)^b$ 与本地计算值，交集为匹配用户

其中 $H$ 为哈希函数，$u$ 为用户标识。

**分裂学习（Split Learning）** ：

模型在网络层分裂。京东负责底层 $\theta_A$（交易特征编码），B站负责底层 $\theta_B$（内容特征编码），共同拥有顶层 $\theta_C$（融合层）。

前向传播：

- 京东计算 $\mathbf{h}_A = f_{\theta_A}(\mathbf{x}_A)$，发送给B站
- B站计算 $\mathbf{h}_B = f_{\theta_B}(\mathbf{x}_B)$
- 融合 $\mathbf{h} = [\mathbf{h}_A; \mathbf{h}_B]$，计算输出 $\hat{y} = f_{\theta_C}(\mathbf{h})$

反向传播：

- B站计算顶层梯度 $\nabla_{\theta_C} \mathcal{L}$ 与 $\nabla_{\mathbf{h}} \mathcal{L}$
- 将 $\nabla_{\mathbf{h}_A}$ 发送给京东
- 各方更新本地参数

### 4.3 同态加密与安全聚合

为防止梯度泄露用户信息，采用同态加密（HE）或安全多方计算（MPC）。

**Paillier同态加密**：

支持加法同态：$E(m_1) \cdot E(m_2) = E(m_1 + m_2)$。

加密梯度 $\mathbf{g}_k$ 发送给服务器，服务器聚合：

$$
E(\mathbf{g}_{global}) = \prod_{k} E(\mathbf{g}_k) = E\left(\sum_{k} \mathbf{g}_k\right)
$$

解密后得到全局梯度，各方无法获取其他方的原始梯度。

**安全聚合（Secure Aggregation）** ：

每方 $k$ 生成随机掩码 $\mathbf{r}_k$，满足 $\sum_k \mathbf{r}_k = 0$（通过密钥协商实现）。

上传 $\mathbf{g}_k + \mathbf{r}_k$。服务器求和：

$$
\sum_k (\mathbf{g}_k + \mathbf{r}_k) = \sum_k \mathbf{g}_k + \sum_k \mathbf{r}_k = \sum_k \mathbf{g}_k
$$

掩码相互抵消，服务器仅获得聚合结果。

### 4.4 差分隐私保护

在模型更新中加入 calibrated noise，提供 $(\epsilon, \delta)$-差分隐私保证。

随机梯度下降（DP-SGD）：

$$
\mathbf{g}_k' = \text{Clip}(\mathbf{g}_k, C) + \mathcal{N}(0, \sigma^2 C^2 \mathbf{I})
$$

其中 $\text{Clip}(\cdot, C)$ 将梯度裁剪至 $L_2$ 范数 $C$ 以内，噪声标准差 $\sigma$ 与隐私预算 $\epsilon$ 通过矩会计（Moments Accountant）方法关联。

隐私损失累积：

$$
\epsilon_{total} = O\left(\sqrt{T \log(1/\delta)} \cdot \frac{1}{n}\right)
$$

其中 $T$ 为训练轮数，$n$ 为样本量。

## 第五章 工程实现与系统架构

### 5.1 实时竞价系统的技术栈

完整的RTB系统包含以下组件：

**SSP（供应方平台）端**：

- **广告请求网关**：处理高并发QPS（每秒查询率），采用Nginx/Envoy负载均衡
- **用户画像服务**：Redis集群存储实时标签，P级数据库存储长期画像
- **竞价引擎**：Java/Go实现，保证P99延迟 < 50ms

**DSP（需求方平台）端**：

- **竞价策略服务**：Python/C++实现CTR/CVR预估模型
- **预算控制服务**：实时计算剩余预算与 pacing 系数
- **创意渲染服务**：动态生成个性化广告素材

**ADX（广告交易平台）** ：

- ** auction orchestrator**：管理竞价流程，执行GSP结算
- ** fraud detection**：基于规则与模型识别作弊流量

### 5.2 特征工程Pipeline

实时特征抽取流程：

```
用户行为日志 (Kafka)
    ↓
Flink流处理作业
    ↓
特征聚合窗口 (Tumbling Window 5min)
    ↓
特征存储 (Redis HBase)
    ↓
模型推理服务 (TensorFlow Serving/Triton)
```

**实时特征示例**：

- ​`user:last_7d_headphone_views`：近7天浏览耳机类目次数
- ​`user:price_sensitivity_index`：历史点击商品的价格分位数均值
- ​`context:hour_of_day`：当前小时（0-23）
- ​`context:device_battery_level`：设备电量（用于判断设备使用场景）

### 5.3 代码实现：简化版DSP竞价核心

```python
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional
import hashlib
import time

@dataclass
class UserProfile:
    device_id: str
    features: Dict[str, float]
    recent_items: List[str]
    timestamp: float

@dataclass
class BidRequest:
    request_id: str
    slot_id: str
    user: UserProfile
    floor_price: float  # CPM底价，单位分
    ad_format: str  # 'feed', 'banner', 'video'

class CTRModel:
    """
    简化的点击率预估模型，基于逻辑回归
    """
    def __init__(self, dim: int):
        self.weights = np.random.normal(0, 0.01, dim)
        self.bias = 0.0

    def sigmoid(self, z: float) -> float:
        return 1.0 / (1.0 + np.exp(-z))

    def predict(self, features: np.ndarray) -> float:
        """
        计算CTR概率
        """
        z = np.dot(self.weights, features) + self.bias
        return self.sigmoid(z)

    def compute_gradient(self,
                        features: np.ndarray,
                        label: int,
                        learning_rate: float = 0.01):
        """
        梯度下降更新（用于离线训练）
        """
        pred = self.predict(features)
        error = pred - label
        self.weights -= learning_rate * error * features
        self.bias -= learning_rate * error

class BudgetController:
    """
    预算控制与Pacing算法
    """
    def __init__(self, total_budget: float, total_hours: int = 24):
        self.total_budget = total_budget
        self.remaining_budget = total_budget
        self.total_hours = total_hours
        self.start_time = time.time()
        self.lambda_pacing = 1.0  # 初始 pacing 系数

    def update_pacing(self, spent_last_hour: float):
        """
        基于消耗速度调整 pacing
        """
        elapsed_hours = (time.time() - self.start_time) / 3600
        remaining_hours = self.total_hours - elapsed_hours

        if remaining_hours <= 0:
            self.lambda_pacing = float('inf')
            return

        expected_spend_rate = self.remaining_budget / remaining_hours
        actual_spend_rate = spent_last_hour

        # 如果消耗过快，增大lambda降低出价；反之减小
        ratio = actual_spend_rate / expected_spend_rate
        self.lambda_pacing *= (1 + 0.1 * (ratio - 1))
        self.lambda_pacing = max(0.1, min(10.0, self.lambda_pacing))

    def get_bid_multiplier(self) -> float:
        """
        返回出价调节系数
        """
        return 1.0 / self.lambda_pacing

class JingdongDSP:
    """
    模拟京东DSP核心逻辑
    """
    def __init__(self, total_budget: float = 1000000.0):
        self.ctr_model = CTRModel(dim=128)
        self.cvr = 0.15  # 假设转化率15%
        self.gmv_per_order = 2300.0  # 客单价
        self.budget_ctrl = BudgetController(total_budget)
        self.retargeting_list = set()  # 重定向人群列表

    def feature_engineering(self, user: UserProfile) -> np.ndarray:
        """
        特征工程：将原始特征转换为模型输入向量
        """
        # 简化的特征构造
        features = np.zeros(128)

        # 基础统计特征
        features[0] = user.features.get('7d_view_count', 0) / 100.0
        features[1] = user.features.get('avg_price_preference', 0) / 5000.0

        # 类目偏好 one-hot（假设耳机类目索引为5）
        if 'headphone' in user.recent_items:
            features[5] = 1.0

        # 时间特征
        hour = time.localtime(user.timestamp).tm_hour
        features[24] = np.sin(2 * np.pi * hour / 24)  # 时间编码

        # 是否重定向用户（关键特征）
        if user.device_id in self.retargeting_list:
            features[30] = 1.0  # 重定向标记
            features[31] = 1.0  # 高意向标记

        return features

    def calculate_valuation(self, user: UserProfile) -> float:
        """
        计算对该用户的估值（期望收益）
        单位：分（CPM）
        """
        features = self.feature_engineering(user)
        ctr = self.ctr_model.predict(features)

        # 重定向用户溢价逻辑
        base_cvr = self.cvr
        if user.device_id in self.retargeting_list:
            base_cvr *= 3.0  # 重定向用户转化率提升3倍

        # 期望GMV = CTR * CVR * 客单价
        expected_gmv = ctr * base_cvr * self.gmv_per_order

        # 按ROI目标折算CPM出价，假设目标ROI为4
        valuation = (expected_gmv / 4) * 100  # 转为分

        return valuation

    def bid(self, request: BidRequest) -> Optional[Dict]:
        """
        参与竞价决策
        """
        # 1. 计算基础估值
        valuation = self.calculate_valuation(request.user)

        # 2. 应用预算控制 pacing
        multiplier = self.budget_ctrl.get_bid_multiplier()
        adjusted_bid = valuation * multiplier

        # 3. 重定向溢价策略（确保高意向用户一定拿下）
        if request.user.device_id in self.retargeting_list:
            # 对重定向用户，愿意支付估值的120%
            adjusted_bid = valuation * 1.2
            print(f"[DSP] 重定向用户 detected: {request.user.device_id}, "
                  f"valuation={valuation:.2f}, bid={adjusted_bid:.2f}")

        # 4. 底价检查
        if adjusted_bid < request.floor_price:
            return None

        # 5. 构造竞价响应
        bid_response = {
            'dsp_id': 'jingdong_dsp_001',
            'bid_price': adjusted_bid,  # CPM，分
            'ad_id': 'jd_xm6_202502',
            'creative_url': 'https://ad.jd.com/creative/xm6_feed.jpg',
            'landing_page': 'https://item.jd.com/100012043978.html',
            'tracking_url': 'https://tracking.jd.com/click?req_id=' + request.request_id
        }

        return bid_response

    def add_to_retargeting_list(self, device_id: str):
        """
        将浏览过商品但未购买的用户加入重定向列表
        """
        self.retargeting_list.add(device_id)
        print(f"[DSP] Added {device_id} to retargeting list, "
              f"current size: {len(self.retargeting_list)}")

class BilibiliSSP:
    """
    模拟B站SSP简化逻辑
    """
    def __init__(self):
        self.dsp_adapters = []
        self.auction_history = []

    def register_dsp(self, dsp: JingdongDSP):
        self.dsp_adapters.append(dsp)

    def run_auction(self, request: BidRequest) -> Optional[Dict]:
        """
        执行GSP拍卖
        """
        print(f"\n[SSP] 收到广告请求: {request.request_id}")
        print(f"[SSP] 用户设备: {request.user.device_id}")
        print(f"[SSP] 底价: {request.floor_price} CPM")

        # 收集所有DSP出价
        bids = []
        for dsp in self.dsp_adapters:
            bid = dsp.bid(request)
            if bid and bid['bid_price'] >= request.floor_price:
                bids.append(bid)

        if not bids:
            print("[SSP] 无有效出价，展示打底广告")
            return None

        # GSP排序
        bids.sort(key=lambda x: x['bid_price'], reverse=True)

        winner = bids[0]
        second_price = bids[1]['bid_price'] if len(bids) > 1 else request.floor_price

        # 结算价 = 第二高价 + 0.01
        settlement_price = second_price + 0.01

        result = {
            'winner_id': winner['dsp_id'],
            'ad_id': winner['ad_id'],
            'winning_bid': winner['bid_price'],
            'settlement_price': settlement_price,
            'creative_url': winner['creative_url']
        }

        print(f"[SSP] 拍卖结果:")
        print(f"  胜出方: {winner['dsp_id']}")
        print(f"  出价: {winner['bid_price']:.2f}")
        print(f"  结算价: {settlement_price:.2f} (GSP)")
        print(f"  广告素材: {winner['ad_id']}")

        self.auction_history.append(result)
        return result

# 模拟运行
if __name__ == "__main__":
    # 初始化
    jd_dsp = JingdongDSP(total_budget=50000.0)
    ssp = BilibiliSSP()
    ssp.register_dsp(jd_dsp)

    # 场景1：普通用户浏览B站
    print("=" * 50)
    print("场景1: 普通用户访问")
    normal_user = UserProfile(
        device_id="user_001",
        features={'7d_view_count': 5, 'avg_price_preference': 1000},
        recent_items=['phone_case', 'charger'],
        timestamp=time.time()
    )
    req1 = BidRequest(
        request_id="req_001",
        slot_id="bilibili_feed_1",
        user=normal_user,
        floor_price=30.0,
        ad_format="feed"
    )
    ssp.run_auction(req1)

    # 场景2：用户先在京东浏览XM6，然后打开B站（重定向场景）
    print("\n" + "=" * 50)
    print("场景2: 重定向用户访问（刚浏览过XM6）")

    # 模拟京东记录用户行为
    retargeting_user_id = "user_002"
    jd_dsp.add_to_retargeting_list(retargeting_user_id)

    # 模拟用户在京东浏览行为（更新特征）
    retargeting_user = UserProfile(
        device_id=retargeting_user_id,
        features={'7d_view_count': 12, 'avg_price_preference': 2500},  # 高频浏览+高客单偏好
        recent_items=['wh-1000xm6', 'sony_headphone', 'noise_cancelling'],
        timestamp=time.time()
    )
    req2 = BidRequest(
        request_id="req_002",
        slot_id="bilibili_feed_1",
        user=retargeting_user,
        floor_price=30.0,
        ad_format="feed"
    )
    ssp.run_auction(req2)
```

### 5.4 系统性能优化

**模型推理优化**：

- **模型量化**：将FP32权重转换为INT8，减少内存占用与计算延迟
- **批处理（Batching）** ：合并多个广告请求的inference，提高GPU利用率
- **缓存策略**：对高频用户特征向量缓存KV结果，减少重复计算

**延迟控制**：

- **超时机制**：DSP响应超时设为100ms，超时后视为放弃竞价
- **异步加载**：用户画像采用异步加载，主流程等待不超过20ms
- **就近部署**：DSP在多个地域部署接入点，网络延迟控制在10ms内

## 尾声

所以说，B站首页的XM6广告是设备指纹匹配、实时竞价胜出与重定向策略共同作用的结果。京东DSP识别出我的高意向特征，在GSP拍卖中支付了溢价以确保曝光。

尽管了解这一机制的商业逻辑，我最终还是没忍住，完成了购买，算法再次取得了胜利。（今天已经在单位戴上我的新耳机听歌了🎶~）

---

**附录：核心符号表**

|符号|含义|
| ------| ----------------|
|$\mathcal{I}_{IDFA}$|iOS广告标识符|
|$J(\cdot, \cdot)$|Jaccard相似度|
|$h_{\pi}(\cdot)$|MinHash函数|
|$b_{(i)}$|第 $i$ 高出价|
|$\sigma(\cdot)$|Sigmoid函数|
|$\text{CTR}$|点击率|
|$\text{CVR}$|转化率|
|$\lambda$|预算pacing系数|
|$\theta$|模型参数|
|$\epsilon, \delta$|差分隐私参数|
