---
title: 《机器学习》（下）：深入理论的密林
description: 探讨周志华教授《机器学习》后半部分的核心理论，包括特征选择与稀疏学习、计算学习理论（PAC框架、VC维）、半监督学习等进阶主题。
date: 2026-02-10
author: SAKURAIN
tags: 机器学习理论, 深度学习, 神经网络
cover: /image/logo.webp
featured: true
---

## 引言：现代人工智能的古典根基

上篇我们漫步于机器学习的基础原野，从NFL定理的哲学启示到SVM的优化之美，从神经网络的梯度下降到集成学习的群体智慧。现在，让我们踏入这本书更为深邃的后半部分——这里不再是直观的算法流程，而是严密的理论证明、复杂的概率推断和抽象的数学建模。

序言的"为了使尽可能多的读者通过本书对机器学习有所了解，作者试图尽可能少地使用数学知识。然而，少量的概率、统计、代数、优化、逻辑知识似乎不可避免。"这句话在2026年的语境下显得愈发意味深长——当深度学习框架封装了越来越多的数学细节，当调参工程师们只需几行代码就能训练出庞然大物，这些"不可避免"的基础知识反而成了区分"调包侠"与"研究者"的分水岭。我记得第一次翻开第十二章计算学习理论时，面对满页的VC维和Rademacher复杂度，我曾天真地以为这些只是过时的理论装饰，直到我在研究大模型泛化性能时，才猛然意识到这些公式正是解释"为什么过度参数化的神经网络不会过拟合"的钥匙。

第11至16章是周志华教授为有志于研究机器学习的读者准备的"进阶试炼"，它们将带我们进入特征选择的稀疏世界、计算学习理论的严密殿堂、半监督学习的博弈空间、概率图模型的结构迷宫，以及强化学习的序贯决策之境。这里的公式更加密集，推导更为繁复，概念也愈发抽象。但请相信，正如我在无数个深夜中体会到的那样，当你终于推导出PAC学习框架下的泛化界，当你理解了压缩感知为什么能用如此少的测量重构信号，当你亲手实现第一个Q学习智能体时，那种穿透数学迷雾见到本质的快感，正是机器学习研究最纯粹的奖赏。让我们从特征选择的稀疏世界开始，一步步走向强化学习的序贯决策之境。

‍

## 第十一章：特征选择与稀疏学习——奥卡姆剃刀的现代演绎

当特征维度高达千万级（如基因组数据、文本 bag-of-words）时，"维度灾难"不再是抽象概念，而是实实在在的计算噩梦。更棘手的是，高维数据中往往存在大量冗余特征和噪声特征，它们不仅会增加学习过程的计算开销，还可能诱导模型学到错误的模式。特征选择（Feature Selection）正是应对这一挑战的利器，它试图从给定的特征集合中选择出最相关、最具判别性的特征子集。

### 11.1 子集搜索与评价

特征选择本质上是一个组合优化问题。给定 $d$ 个特征，可能的特征子集数量为 $2^d$，这是一个指数级复杂度的问题。当 $d$ 较大时，穷举所有子集是不可能的。因此，我们需要启发式搜索策略。

**前向搜索（Forward Search）** 是一种贪心策略：初始时特征子集为空集，每次选择当前最优的特征加入子集，直到满足停止条件（如特征数达到预设阈值或性能不再提升）。其时间复杂度为 $O(d^2)$。

**后向搜索（Backward Search）** 则相反：从完整特征集开始，每次剔除最差的特征，直到满足停止条件。

**双向搜索（Bidirectional Search）** 则同时进行前向和后向搜索，当两者搜索空间相交时停止。

特征子集的评价通常基于信息增益、卡方统计量或分类器的交叉验证性能。

### 11.2 $L_1$ 正则化与稀疏性

嵌入式（Embedded）特征选择将特征选择过程与学习器训练过程融为一体，两者在同一个优化过程中完成。岭回归（Ridge Regression）和LASSO（Least Absolute Shrinkage and Selection Operator）是最典型的嵌入式方法。

考虑线性回归的优化目标，加入正则化项：

$$
\min_{\mathbf{w}} \sum_{i=1}^m (y_i - \mathbf{w}^\top \mathbf{x}_i)^2 + \lambda \|\mathbf{w}\|_p^p
$$

当 $p=2$ 时，即为岭回归，其解为：

$$
\mathbf{w}_{ridge} = (\mathbf{X}^\top \mathbf{X} + \lambda \mathbf{I})^{-1} \mathbf{X}^\top \mathbf{y}
$$

岭回归的解总是稠密的（dense），即 $\mathbf{w}$ 的各分量通常都不为零。

当 $p=1$ 时，即为LASSO：

$$
\min_{\mathbf{w}} \sum_{i=1}^m (y_i - \mathbf{w}^\top \mathbf{x}_i)^2 + \lambda \|\mathbf{w}\|_1
$$

其中 $\|\mathbf{w}\|_1 = \sum_{i=1}^d |w_i|$。

**为什么** **$L_1$** **范数能产生稀疏解？**  这可以从优化问题的几何直观来理解。在二维情况下，$L_2$ 正则化的约束区域是一个圆，而 $L_1$ 正则化的约束区域是一个菱形（ diamond）。目标函数的等高线与约束区域的交点往往出现在菱形的顶点处，这意味着某些坐标分量为零。

更严格的分析需要使用次梯度（subgradient）。由于绝对值函数 $|w_i|$ 在 $w_i=0$ 处不可导，我们定义其次梯度为 $\partial |w_i| = \text{sign}(w_i)$（当 $w_i \neq 0$）或 $[-1, 1]$（当 $w_i = 0$）。

LASSO的优化条件为：

$$
2\mathbf{X}^\top (\mathbf{X}\mathbf{w} - \mathbf{y}) + \lambda \mathbf{s} = \mathbf{0}
$$

其中 $\mathbf{s}$ 是 $\mathbf{w}$ 的次梯度向量。

当 $\lambda$ 足够大时，某些 $w_i$ 会被精确地压缩至零，从而实现了特征选择。

### 11.3 压缩感知基础

压缩感知（Compressed Sensing）是稀疏学习中最激动人心的理论突破之一。它挑战了传统的奈奎斯特采样定理，证明在满足一定条件下，远少于奈奎斯特采样定理要求的样本就足以精确重构稀疏信号。

**稀疏信号假设**：假设信号 $\mathbf{x} \in \mathbb{R}^d$ 是 $k$-稀疏的，即 $\|\mathbf{x}\|_0 \leq k$，其中 $\|\mathbf{x}\|_0$ 表示非零元素的个数（$L_0$ 范数）。

**测量矩阵**：我们通过线性测量获得观测值 $\mathbf{y} = \mathbf{\Phi} \mathbf{x}$，其中 $\mathbf{\Phi} \in \mathbb{R}^{m \times d}$ 是测量矩阵，$m \ll d$。

问题变为：如何从欠定方程组 $\mathbf{y} = \mathbf{\Phi} \mathbf{x}$ 中恢复出 $k$-稀疏信号 $\mathbf{x}$？

理论上，这可以通过求解 $L_0$ 最小化问题：

$$
\min_{\mathbf{x}} \|\mathbf{x}\|_0 \quad \text{s.t.} \quad \mathbf{y} = \mathbf{\Phi} \mathbf{x}
$$

但 $L_0$ 最小化是NP-hard问题。压缩感知理论的惊人发现是：在某些条件下，$L_1$ 最小化等价于 $L_0$ 最小化：

$$
\min_{\mathbf{x}} \|\mathbf{x}\|_1 \quad \text{s.t.} \quad \mathbf{y} = \mathbf{\Phi} \mathbf{x}
$$

**限制等距性（Restricted Isometry Property, RIP）** 是压缩感知理论的核心概念。测量矩阵 $\mathbf{\Phi}$ 满足 $k$-阶RIP，如果存在常数 $\delta_k \in (0,1)$ 使得对所有 $k$-稀疏向量 $\mathbf{x}$ 有：

$$
(1 - \delta_k) \|\mathbf{x}\|_2^2 \leq \|\mathbf{\Phi} \mathbf{x}\|_2^2 \leq (1 + \delta_k) \|\mathbf{x}\|_2^2
$$

直观上，RIP保证了测量矩阵 $\mathbf{\Phi}$ 几乎保持了所有 $k$-稀疏信号的欧氏距离。

Candès和Tao证明了：如果测量矩阵 $\mathbf{\Phi}$ 满足 $2k$-阶RIP且 $\delta_{2k} < \sqrt{2} - 1$，则 $L_1$ 最小化的解等于 $L_0$ 最小化的解。

高斯随机矩阵、伯努利随机矩阵和部分傅里叶矩阵等都以极高概率满足RIP条件。

压缩感知的重构算法包括基追踪（Basis Pursuit）、匹配追踪（Matching Pursuit）和正交匹配追踪（OMP）等。OMP是一种贪心算法，其基本思想是迭代地选择与当前残差最相关的原子（测量矩阵的列），直到残差足够小或达到预设的稀疏度。

## 第十二章：计算学习理论——PAC框架下的学习极限

如果说前面的章节告诉我们"如何学习"，那么计算学习理论（Computational Learning Theory）则告诉我们"什么是可学习的"以及"需要多少样本才能学到"。这是机器学习中最具理论深度的章节，它用严密的数学语言刻画了学习的本质。

### 12.1 PAC学习框架

**概率近似正确（Probably Approximately Correct, PAC）** 学习理论由Valiant于1984年提出，为学习问题提供了形式化定义。

设 $\mathcal{X}$ 为样本空间，$\mathcal{Y}$ 为标记空间，$D$ 是 $\mathcal{X}$ 上的未知概率分布，目标概念 $c: \mathcal{X} \to \mathcal{Y}$ 属于概念类 $\mathcal{C}$。学习算法 $\mathfrak{L}$ 从训练集 $D$ 中学习假设 $h: \mathcal{X} \to \mathcal{Y}$。

**泛化误差**定义为：

$$
E(h; D) = P_{\mathbf{x} \sim D}(h(\mathbf{x}) \neq c(\mathbf{x}))
$$

**PAC辨识（PAC Identify）** ：对 $0 < \epsilon, \delta < 1$，所有 $c \in \mathcal{C}$ 和分布 $D$，若存在学习算法 $\mathfrak{L}$，其输出假设 $h \in \mathcal{H}$ 满足：

$$
P(E(h; D) \leq \epsilon) \geq 1 - \delta
$$

则称学习算法 $\mathfrak{L}$ 能从假设空间 $\mathcal{H}$ 中PAC辨识概念类 $\mathcal{C}$。

这里的 $\epsilon$ 称为**精度参数（accuracy parameter）** ，$\delta$ 称为**置信参数（confidence parameter）** 。PAC学习的含义是：以至少 $1-\delta$ 的概率，学习到一个误差不超过 $\epsilon$ 的假设。

**样本复杂度**：满足PAC条件所需的最小训练样本数 $m$。对于有限假设空间，有以下重要定理：

**定理**：令 $\mathcal{H}$ 为有限假设空间，$D$ 为从分布 $D$ 上独立同分布采样得到的包含 $m$ 个样本的训练集。若 $h$ 在训练集 $D$ 上的经验误差 $\hat{E}(h) = 0$，且

$$
m \geq \frac{1}{\epsilon} (\ln |\mathcal{H}| + \ln \frac{1}{\delta})
$$

则以至少 $1-\delta$ 的概率，$E(h) \leq \epsilon$。

证明基于Hoeffding不等式和联合界（Union Bound）。对任意 $h \in \mathcal{H}$，若 $E(h) > \epsilon$，则 $h$ 在 $m$ 个独立同分布样本上都预测正确的概率小于 $(1-\epsilon)^m \leq e^{-m\epsilon}$。

对所有 $h \in \mathcal{H}$ 取并集：

$$
P(\exists h \in \mathcal{H}: E(h) > \epsilon \land \hat{E}(h) = 0) \leq |\mathcal{H}| e^{-m\epsilon}
$$

令其小于等于 $\delta$，解得 $m \geq \frac{1}{\epsilon} (\ln |\mathcal{H}| + \ln \frac{1}{\delta})$。

### 12.2 VC维与泛化界

对于无限假设空间，需要用**VC维（Vapnik-Chervonenkis Dimension）** 来刻画复杂度。

**打散（Shattering）** ：若假设空间 $\mathcal{H}$ 能实现样本集 $D$ 上所有可能的标记组合（即对 $D$ 中样本的任意一种标记方式，都存在 $h \in \mathcal{H}$ 能够将其正确分类），则称 $\mathcal{H}$ 能打散 $D$。

**VC维**：假设空间 $\mathcal{H}$ 的VC是能被 $\mathcal{H}$ 打散的最大样本集的大小，记为 $\text{VC}(\mathcal{H})$。

例如，二维平面上的线性分类器的VC维为3（能被任意三个不共线的点打散，但不能打散所有四个点的配置）。

基于VC维的泛化误差界：以至少 $1-\delta$ 的概率，对所有 $h \in \mathcal{H}$ 有：

$$
E(h) \leq \hat{E}(h) + \sqrt{\frac{8d \ln \frac{2em}{d} + 8 \ln \frac{4}{\delta}}{m}}
$$

其中 $d = \text{VC}(\mathcal{H})$。这个不等式揭示了模型复杂度（VC维）、训练样本数 $m$ 和泛化误差之间的权衡。

**Rademacher复杂度**提供了另一种刻画假设空间复杂度的方法，它考虑了数据分布本身，通常比基于VC维的界更紧致，但计算更复杂。

## 第十三章：半监督学习——利用无标签数据的智慧

在现实应用中，获取标记数据往往成本高昂（需要人工标注），而未标记数据则廉价易得。半监督学习（Semi-Supervised Learning, SSL）正是研究如何利用大量未标记数据辅助少量标记数据进行学习的范式。这看似违反直觉——没有标签的数据如何帮助学习？周志华教授在本章揭示了其中的奥秘。

### 13.1 生成式方法

生成式方法假设数据由某种潜在的生成模型产生，通过估计模型参数来使用未标记数据。

考虑高斯混合模型（Gaussian Mixture Model, GMM）。假设数据来自 $N$ 个高斯分布的混合：

$$
p(\mathbf{x}) = \sum_{i=1}^N \alpha_i \cdot p(\mathbf{x} | \boldsymbol{\mu}_i, \mathbf{\Sigma}_i)
$$

其中 $\alpha_i$ 是混合系数，$\sum_{i=1}^N \alpha_i = 1$。

对于半监督学习，我们假设每个高斯分量对应一个类别。给定标记样本 $D_l = \{(\mathbf{x}_j, y_j)\}_{j=1}^l$ 和未标记样本 $D_u = \{\mathbf{x}_j\}_{j=l+1}^{l+u}$，最大化后验概率：

$$
LL(D_l \cup D_u) = \sum_{j=1}^l \ln \left( \sum_{i=1}^N \alpha_i \cdot p(\mathbf{x}_j | \boldsymbol{\mu}_i, \mathbf{\Sigma}_i) \cdot p(y_j | \Theta = i, \mathbf{x}_j) \right) + \sum_{j=l+1}^{l+u} \ln \left( \sum_{i=1}^N \alpha_i \cdot p(\mathbf{x}_j | \boldsymbol{\mu}_i, \mathbf{\Sigma}_i) \right)
$$

其中 $p(y_j | \Theta = i, \mathbf{x}_j)$ 是标记样本属于第 $i$ 个高斯分量的概率。

由于含有隐变量（未标记样本的类别），通常使用EM算法求解：

**E步**：根据当前模型参数，计算未标记样本属于各高斯分量的后验概率 $\gamma_{ji} = p(\Theta = i | \mathbf{x}_j)$；

**M步**：基于E步的结果，更新模型参数 $\alpha_i, \boldsymbol{\mu}_i, \mathbf{\Sigma}_i$。

未标记数据的作用体现在E步中，它们通过影响高斯分量的参数估计，帮助模型更好地捕捉数据分布的真实结构。

### 13.2 半监督SVM

半监督支持向量机（Semi-Supervised SVM, S3VM）是SVM在半监督场景下的扩展，试图找到能将两类有标记样本分开，且穿过数据低密度区域的划分超平面。

**TSVM（Transductive SVM）** 是S3VM的著名实现。优化目标为：

$$
\min_{\mathbf{w}, b, \hat{\mathbf{y}}} \frac{1}{2} \|\mathbf{w}\|^2 + C_l \sum_{i=1}^l \xi_i + C_u \sum_{j=l+1}^{l+u} \xi_j
$$

$$
\text{s.t.} \quad y_i(\mathbf{w}^\top \mathbf{x}_i + b) \geq 1 - \xi_i, \quad i = 1, \ldots, l
$$

$$
\hat{y}_j(\mathbf{w}^\top \mathbf{x}_j + b) \geq 1 - \xi_j, \quad \xi_j \geq 0, \quad j = l+1, \ldots, l+u
$$

其中 $\hat{\mathbf{y}} = (\hat{y}_{l+1}, \ldots, \hat{y}_{l+u})$ 是未标记样本的伪标记，$C_l$ 和 $C_u$ 分别是有标记和未标记样本的惩罚参数。

这是一个混合整数规划问题（因为 $\hat{y}_j \in \{-1, +1\}$），是NP-hard的。通常采用局部搜索或启发式方法近似求解，如先仅用标记样本训练SVM，然后用该模型预测未标记样本的伪标记，再选择置信度高的未标记样本加入训练集重新训练。

### 13.3 图半监督学习

图半监督学习将数据视为图的节点，样本间的相似度视为边的权重，将标记传播视为在图上的扩散过程。

构建图 $G = (V, E)$，其中节点集 $V = \{\mathbf{x}_1, \ldots, \mathbf{x}_l, \mathbf{x}_{l+1}, \ldots, \mathbf{x}_{l+u}\}$，边权重矩阵 $\mathbf{W}$ 通常基于高斯核定义：

$$
W_{ij} = \exp\left(-\frac{\|\mathbf{x}_i - \mathbf{x}_j\|^2}{2\sigma^2}\right)
$$

定义 $(l+u) \times (l+u)$ 对角矩阵 $\mathbf{D}$，其对角元素 $D_{ii} = \sum_{j=1}^{l+u} W_{ij}$。

标记传播的基本假设是**流形假设（manifold assumption）** ：相似的样本应具有相似的标记。定义能量函数：

$$
E(\mathbf{f}) = \frac{1}{2} \sum_{i,j=1}^{l+u} W_{ij} (f_i - f_j)^2 = \mathbf{f}^\top (\mathbf{D} - \mathbf{W}) \mathbf{f} = \mathbf{f}^\top \mathbf{L} \mathbf{f}
$$

其中 $\mathbf{L} = \mathbf{D} - \mathbf{W}$ 是图拉普拉斯矩阵（Graph Laplacian），$\mathbf{f} = (f_1, \ldots, f_{l+u})^\top$ 是预测标记函数。

优化目标是使能量函数最小化，同时约束有标记样本的预测与真实标记一致：

$$
\min_{\mathbf{f}} \mathbf{f}^\top \mathbf{L} \mathbf{f} \quad \text{s.t.} \quad f_i = y_i, \quad i = 1, \ldots, l
$$

通过求解线性方程组可得闭式解。标记传播算法（Label Propagation）和标记扩散算法（Label Spreading）是这类方法的代表。

---

## 第十四章：概率图模型——结构化的概率推断

概率图模型（Probabilistic Graphical Models）是机器学习中最强大的框架之一，它用图结构表示变量间的依赖关系，将概率推断与图论、优化理论紧密结合。贝叶斯网（Bayesian Networks）和马尔可夫随机场（Markov Random Fields）是两大主要类型。

### 14.1 贝叶斯网

贝叶斯网用有向无环图（DAG）表示变量间的依赖关系。图中每个节点对应一个随机变量，边表示变量间的直接影响。每个节点关联一个条件概率表（CPT）或条件概率密度函数 $P(x_i | \text{pa}_i)$，其中 $\text{pa}_i$ 是节点 $x_i$ 的父节点集。

根据贝叶斯网的局部马尔可夫性（每个变量在给定其父节点条件下，独立于其非后代节点），联合概率分布可分解为：

$$
P(x_1, \ldots, x_n) = \prod_{i=1}^n P(x_i | \text{pa}_i)
$$

**结构学习**是从数据中学习最优的DAG结构，通常使用评分函数（如BIC、AIC）结合搜索算法（如爬山法、禁忌搜索）或约束方法（基于条件独立性检验）。

**推断**（Inference）是指在已知某些变量取值（证据）的条件下，计算其他变量的后验概率。精确推断方法包括变量消去（Variable Elimination）和信念传播（Belief Propagation）。对于复杂网络，需要使用近似推断方法如MCMC采样和变分推断。

### 14.2 隐马尔可夫模型

隐马尔可夫模型（Hidden Markov Model, HMM）是结构最简单的动态贝叶斯网，广泛用于时序数据建模（如语音识别、自然语言处理）。

HMM包含两组变量：**状态变量** $\{y_1, y_2, \ldots, y_n\}$（隐变量）和**观测变量** $\{x_1, x_2, \ldots, x_n\}$。状态变量构成马尔可夫链，即 $y_t$ 仅依赖于 $y_{t-1}$；观测变量 $x_t$ 仅依赖于当前状态 $y_t$。

模型参数包括：

- **状态转移概率**：$A = [a_{ij}]$，其中 $a_{ij} = P(y_{t+1} = s_j | y_t = s_i)$
- **观测概率**：$B = [b_{ij}]$，其中 $b_{ij} = P(x_t = o_j | y_t = s_i)$
- **初始状态概率**：$\boldsymbol{\pi} = (\pi_1, \ldots, \pi_N)$，其中 $\pi_i = P(y_1 = s_i)$

HMM的三个基本问题：

1. **评估问题**：给定模型 $\lambda = (A, B, \boldsymbol{\pi})$ 和观测序列 $\mathbf{x}$，计算 $P(\mathbf{x} | \lambda)$。使用**前向算法（Forward Algorithm）** 高效求解，时间复杂度 $O(N^2 T)$。

前向概率定义为 $\alpha_t(i) = P(x_1, \ldots, x_t, y_t = s_i | \lambda)$，递推公式：

$$
\alpha_{t+1}(j) = \left[\sum_{i=1}^N \alpha_t(i) a_{ij}\right] b_{jx_{t+1}}
$$

2. **解码问题**：给定模型和观测序列，求最可能的状态序列 $\mathbf{y}^* = \arg\max_{\mathbf{y}} P(\mathbf{y} | \mathbf{x}, \lambda)$。使用**维特比算法（Viterbi Algorithm）** ，是一种动态规划算法。

定义 $\delta_t(i) = \max_{y_1, \ldots, y_{t-1}} P(y_1, \ldots, y_{t-1}, y_t = s_i, x_1, \ldots, x_t | \lambda)$，递推：

$$
\delta_{t+1}(j) = \max_{1 \leq i \leq N} [\delta_t(i) a_{ij}] \cdot b_{jx_{t+1}}
$$

3. **学习问题**：给定观测序列，估计模型参数。使用**Baum-Welch算法**，是EM算法在HMM中的特例。

### 14.3 条件随机场

条件随机场（Conditional Random Field, CRF）是给定输入随机变量 $\mathbf{X}$ 条件下，输出随机变量 $\mathbf{Y}$ 的条件概率分布模型，其形式为无向图。

线性链CRF是最常用的形式，用于标注问题（如命名实体识别、词性标注）。给定输入序列 $\mathbf{x}$，输出序列 $\mathbf{y}$ 的条件概率为：

$$
P(\mathbf{y} | \mathbf{x}) = \frac{1}{Z(\mathbf{x})} \exp\left(\sum_{j} \sum_{i=1}^{n-1} \lambda_j t_j(y_{i+1}, y_i, \mathbf{x}, i) + \sum_{k} \sum_{i=1}^n \mu_k s_k(y_i, \mathbf{x}, i)\right)
$$

其中：

- $t_j$ 是转移特征函数，刻画相邻标记间的转移关系
- $s_k$ 是状态特征函数，刻画观测对标记的影响
- $\lambda_j, \mu_k$ 是参数
- $Z(\mathbf{x})$ 是归一化因子（配分函数）

$$
Z(\mathbf{x}) = \sum_{\mathbf{y}} \exp\left(\sum_{j} \sum_{i=1}^{n-1} \lambda_j t_j(y_{i+1}, y_i, \mathbf{x}, i) + \sum_{k} \sum_{i=1}^n \mu_k s_k(y_i, \mathbf{x}, i)\right)
$$

CRF的参数估计通常使用L-BFGS等拟牛顿法或随机梯度下降最大化对数似然。推断（解码）使用维特比算法。

与HMM相比，CRF是判别式模型，不需要建模观测序列的分布，可以使用任意复杂的特征函数，且能刻画标记间的长距离依赖关系。

## 第十五章：规则学习——符号主义的光辉

在连接主义（神经网络）和统计学习盛行的今天，规则学习（Rule Learning）代表了符号主义人工智能的传统。它试图从数据中学习出一组可解释的"如果-那么"规则，这些规则对人类而言是直观且可理解的。

### 15.1 序贯覆盖

规则学习的基本策略是**序贯覆盖（Sequential Covering）** ：逐条归纳规则，每条规则覆盖尽可能多的当前正例，同时排除反例，然后移除被覆盖的正例，重复该过程直到所有正例被覆盖或满足停止条件。

对于第 $k$ 类，序贯覆盖算法流程如下：

1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;生成第 $k$ 类的规则集 $R_k = \emptyset$
2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;生成第 $k$ 类的训练集 $D_k$（正例为第 $k$ 类样本，反例为其他类样本）
3&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**while** $D_k \neq \emptyset$ **do**
4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;从 $D_k$ 中学习一条规则 $r$
5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$R_k = R_k \cup \{r\}$
6&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;从 $D_k$ 中移除被 $r$ 覆盖的样本
7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**end while**

**自顶向下（Top-down）** 策略从空规则开始，逐步添加原子命题（特化）；**自底向上（Bottom-up）** 策略从具体样本开始，逐步删除原子命题（泛化）。自顶向下搜索空间大但抗噪声能力强，自底向上搜索空间小但容易受噪声影响。

### 15.2 剪枝优化

规则学习同样需要剪枝来防止过拟合。预剪枝在规则生成过程中进行，如设定最小支持度、最小置信度或最大规则长度；后剪枝在规则生成后进行，常用的方法包括：

- **减错剪枝（Reduced Error Pruning）** ：将验证集上性能提升作为剪枝准则
- **RIPPER算法**：使用MDL（Minimum Description Length）准则进行剪枝

规则质量的度量通常使用**准确率（Accuracy）** 、**覆盖率（Coverage）** 、**支持度（Support）** 和**置信度（Confidence）** 等指标。

### 15.3 一阶规则学习

命题规则学习（如关联规则挖掘）处理的是属性-值对，表达能力有限。一阶规则学习（First-Order Rule Learning）使用一阶逻辑（谓词逻辑），可以表达对象间的关系，是归纳逻辑程序设计（Inductive Logic Programming, ILP）的核心。

一阶规则形式为：

$$
p(X, Y) \leftarrow q(X, Z) \land r(Z, Y)
$$

表示"如果 $q(X,Z)$ 和 $r(Z,Y)$ 成立，则 $p(X,Y)$ 成立"。

**FOIL（First-Order Inductive Learner）** 算法是最著名的一阶规则学习算法。它采用自顶向下的贪心策略，在规则生长过程中使用**FOIL增益**来选择最优的文字（Literal）加入规则体：

$$
\text{FOIL\_Gain} = \hat{m}_+ \times \left(\log_2 \frac{\hat{m}_+}{\hat{m}_+ + \hat{m}_-} - \log_2 \frac{m_+}{m_+ + m_-}\right)
$$

其中 $m_+, m_-$ 是添加文字前规则覆盖的正反例数，$\hat{m}_+, \hat{m}_-$ 是添加后的数目。

ILP系统能够从样例中归纳出递归规则、列表处理程序等复杂概念，但其计算复杂度远高于命题规则学习。

## 第十六章：强化学习——序贯决策的艺术

强化学习（Reinforcement Learning, RL）是机器学习中最接近人类学习方式的范式。与监督学习需要正确标签、无监督学习无需标签不同，强化学习通过**试错（Trial and Error）** 与环境交互，通过延迟的奖励信号学习最优行为策略。这是AlphaGo、ChatGPT等大模型的核心技术之一。

### 16.1 马尔可夫决策过程

强化学习的数学框架是**马尔可夫决策过程（Markov Decision Process, MDP）** 。MDP由五元组 $M = \langle \mathcal{X}, \mathcal{A}, P, R, \gamma \rangle$ 定义：

- $\mathcal{X}$：状态空间
- $\mathcal{A}$：动作空间
- $P: \mathcal{X} \times \mathcal{A} \times \mathcal{X} \to [0,1]$：状态转移概率，$P(x' | x, a)$ 表示在状态 $x$ 执行动作 $a$ 后转移到状态 $x'$ 的概率
- $R: \mathcal{X} \times \mathcal{A} \times \mathcal{X} \to \mathbb{R}$：奖励函数
- $\gamma \in [0,1)$：折扣因子，用于计算累积奖励

**马尔可夫性**：下一状态仅依赖于当前状态和动作，与历史无关：

$$
P(x_{t+1} | x_t, a_t, x_{t-1}, a_{t-1}, \ldots, x_0, a_0) = P(x_{t+1} | x_t, a_t)
$$

**策略（Policy）**  $\pi$ 是从状态到动作的映射，可以是确定性策略 $\pi(x) = a$ 或随机性策略 $\pi(a | x) = P(a | x)$。

**状态值函数** $V^\pi(x)$ 表示从状态 $x$ 出发，遵循策略 $\pi$ 的期望累积奖励：

$$
V^\pi(x) = \mathbb{E}_\pi\left[\sum_{t=0}^{\infty} \gamma^t r_{t+1} | x_0 = x\right]
$$

**动作值函数** $Q^\pi(x, a)$ 表示在状态 $x$ 执行动作 $a$ 后，遵循策略 $\pi$ 的期望累积奖励：

$$
Q^\pi(x, a) = \mathbb{E}_\pi\left[\sum_{t=0}^{\infty} \gamma^t r_{t+1} | x_0 = x, a_0 = a\right]
$$

**贝尔曼方程（Bellman Equation）** 是强化学习的核心，它建立了值函数的自洽关系：

$$
V^\pi(x) = \sum_{a} \pi(a | x) \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma V^\pi(x')]
$$

$$
Q^\pi(x, a) = \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma \sum_{a'} \pi(a' | x') Q^\pi(x', a')]
$$

**最优值函数** $V^*$ 和 $Q^*$ 定义为所有策略中值函数的最大值：

$$
V^*(x) = \max_\pi V^\pi(x), \quad Q^*(x, a) = \max_\pi Q^\pi(x, a)
$$

最优值函数满足**贝尔曼最优方程**：

$$
V^*(x) = \max_a \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma V^*(x')]
$$

$$
Q^*(x, a) = \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma \max_{a'} Q^*(x', a')]
$$

### 16.2 动态规划方法

当MDP模型已知（即 $P$ 和 $R$ 已知）时，可以使用动态规划方法求解最优策略。

**策略迭代（Policy Iteration）** ：

1. **策略评估（Policy Evaluation）** ：给定策略 $\pi$，迭代计算值函数直到收敛：

$$
V_{k+1}(x) = \sum_{a} \pi(a | x) \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma V_k(x')]
$$

2. **策略改进（Policy Improvement）** ：基于当前值函数，贪婪地改进策略：

$$
\pi'(x) = \arg\max_a \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma V^\pi(x')]
$$

反复迭代直至策略不再改变。

**值迭代（Value Iteration）** 直接迭代最优贝尔曼方程：

$$
V_{k+1}(x) = \max_a \sum_{x'} P(x' | x, a) [R(x, a, x') + \gamma V_k(x')]
$$

值迭代是策略评估和策略改进的结合，实践中通常比策略迭代更快收敛。

### 16.3 免模型方法：蒙特卡罗与时序差分

在大多数实际问题中，MDP模型未知（即不知道精确的状态转移概率），只能通过与环境交互采样 $(x, a, r, x')$ 序列。此时需要使用**免模型（Model-Free）** 方法。

**蒙特卡罗方法（Monte Carlo, MC）** 通过采样完整的回合（Episode）来估计值函数。对于状态 $x$，收集所有经过 $x$ 的回合的累积奖励，取平均作为 $V(x)$ 的估计。

$$
V(x) \approx \frac{1}{N} \sum_{i=1}^N G_i
$$

其中 $G_i$ 是第 $i$ 个回合从 $x$ 开始的累积奖励。MC方法是无偏的，但方差大，且必须等回合结束才能更新。

**时序差分学习（Temporal-Difference Learning, TD）** 结合了动态规划和蒙特卡罗的思想，可以在线学习，无需等待回合结束。

最简单的TD学习（TD(0)）：

$$
V(x) \leftarrow V(x) + \alpha [r + \gamma V(x') - V(x)]
$$

其中 $\alpha$ 是学习率，$r + \gamma V(x')$ 是当前奖励与下一状态值函数的折扣和，作为 $V(x)$ 的估计目标（**TD目标**），$r + \gamma V(x') - V(x)$ 称为**TD误差**。

**SARSA算法**（State-Action-Reward-State-Action）是on-policy的TD控制算法：

$$
Q(x, a) \leftarrow Q(x, a) + \alpha [r + \gamma Q(x', a') - Q(x, a)]
$$

其中 $a'$ 是在状态 $x'$ 根据当前策略选择的动作。

**Q学习（Q-Learning）** 是off-policy算法，直接估计最优动作值函数：

$$
Q(x, a) \leftarrow Q(x, a) + \alpha [r + \gamma \max_{a'} Q(x', a') - Q(x, a)]
$$

Q学习是 Watkins 于1989年提出的，是深度强化学习（如DQN）的基础。

### 16.4 值函数逼近

前面讨论的方法都假设状态空间是有限的（或较小），可以用表格存储每个状态的值函数。当状态空间连续或非常大时（如围棋的 $19\times 19$ 棋盘，图像输入），必须使用**值函数逼近（Function Approximation）** 用参数化函数（如线性函数、神经网络）近似值函数。

$$
V(x; \mathbf{w}) \approx V^\pi(x) \quad \text{或} \quad Q(x, a; \mathbf{w}) \approx Q^\pi(x, a)
$$

使用梯度下降最小化均方误差：

$$
J(\mathbf{w}) = \mathbb{E}_\pi[(V^\pi(x) - V(x; \mathbf{w}))^2]
$$

$$
\nabla_{\mathbf{w}} J(\mathbf{w}) = -2(V^\pi(x) - V(x; \mathbf{w})) \nabla_{\mathbf{w}} V(x; \mathbf{w})
$$

对于TD学习，使用TD目标代替真实值函数 $V^\pi(x)$：

$$
\mathbf{w} \leftarrow \mathbf{w} + \alpha [r + \gamma V(x'; \mathbf{w}) - V(x; \mathbf{w})] \nabla_{\mathbf{w}} V(x; \mathbf{w})
$$

当使用深度神经网络作为函数逼近器时，就得到了**深度Q网络（Deep Q-Network, DQN）** ，这是深度强化学习的里程碑。DQN使用经验回放（Experience Replay）和目标网络（Target Network）来稳定训练：

- **经验回放**：将交互样本 $(x, a, r, x')$ 存储在回放缓冲区，随机采样进行训练，打破样本间的相关性
- **目标网络**：使用单独的网络计算TD目标，定期更新，减少训练震荡

损失函数为：

$$
L(\mathbf{w}) = \mathbb{E}_{(x,a,r,x') \sim D} \left[\left(r + \gamma \max_{a'} Q(x', a'; \mathbf{w}^-) - Q(x, a; \mathbf{w})\right)^2\right]
$$

其中 $\mathbf{w}^-$ 是目标网络的参数，定期从主网络复制。

## 终章：理论与实践的辩证——三年后的回望

合上这本四百多页的厚重教材，从NFL定理到深度Q网络，从VC维到图半监督学习，周志华教授为我们勾勒出了一幅机器学习的全景图。这本书的价值不仅在于它涵盖的知识广度，更在于它建立的**理论直觉**。

在深度学习狂飙突进的今天，有人质疑这些经典理论是否还有价值。我的回答是：这些理论是锚。当你在海量的神经网络架构、纷繁的优化技巧、层出不穷的Transformer变种中迷失时，回到第12章的PAC学习框架，你会记得模型的泛化能力终究受限于样本复杂度和假设空间复杂度；回到第5章的反向传播推导，你会理解梯度消失的本质是激活函数导数的连乘；回到第16章的贝尔曼方程，你会明白大语言模型中的RLHF（基于人类反馈的强化学习）依然遵循着策略梯度的基本原理。

《机器学习》的每一章都是一座桥梁，连接着朴素的算法直觉与严谨的数学证明。它教会我，好的研究者既要能写出流畅的Python代码，也要能推导SVM的对偶形式；既要理解ResNet的残差连接，也要明白 boosting 的指数损失函数设计原理。

如果你正在读这本书，且感到吃力，请坚持。那些公式不是障碍，而是阶梯。当你终于亲手推导出BP算法的梯度更新公式，当你第一次在纸上解出LASSO的软阈值解，当你用Python实现一个简单的Q学习智能体在迷宫中找到出口时，你会体会到一种智识上的愉悦——这是机器学习作为一门科学最纯粹的奖赏。

三年前，这本书为我打开了人工智能的大门；今天，它依然是我书架上最常翻阅的参考书。在这个大模型日新月异的时代，基础知识的学习似乎变得"不够时髦"，但请相信，**基础不牢，地动山摇**。周志华教授的《机器学习》正是帮你筑牢基础的基石。

愿你在公式的海洋中找到属于自己的航向，在算法的森林中发现独特的路径。毕竟，正如NFL定理告诉我们的：没有 universally best 的算法，但有最适合你的学习方法。

 **（全文完）**

---

*本文作者为人工智能领域探索者，理论知识如有纰漏，欢迎指正。*
