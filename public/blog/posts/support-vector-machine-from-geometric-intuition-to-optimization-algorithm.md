---
title: 支持向量机（SVM）：从几何直观到优化算法
description: 深入解析支持向量机的几何原理、数学基础和优化算法实现，从直观理解到工程应用的完整指南。
date: 2026-02-28
author: SAKURAIN
tags: 机器学习理论, 优化算法, 深度学习, 神经网络
cover: /image/logo.webp
featured: false
---

## 引言：从分类问题的几何本质谈起

在机器学习的众多分类算法中，支持向量机（Support Vector Machine, SVM）占据着一个独特的位置。它不像决策树那样通过递归分割特征空间来构建分类规则，也不像神经网络那样通过堆叠非线性变换来逼近复杂函数。SVM的核心思想源于一个朴素但深刻的几何观察：**如果要在高维空间中找到区分两类数据的最佳边界，应当寻找使分类间隔（margin）最大的那个超平面**。

这种几何直觉最早由Vapnik和Chervonenkis在20世纪60年代提出，并在90年代通过核方法（kernel methods）的引入而得到极大扩展。即使在深度学习主导当今计算机视觉和自然语言处理领域的背景下，SVM仍然是处理中小规模数据集、特别是特征维度高于样本数量的场景时的首选算法之一。在结构损伤识别、医疗诊断和金融风险评估等领域，SVM因其出色的泛化性能和可解释性而持续发挥作用。

本文将从算法工程师的视角，系统地梳理SVM的理论基础、数学推导和工程实现细节。我们将不仅关注最终的优化公式，更要理解这些公式背后的设计选择，以及如何在实际项目中调优SVM模型。

## 第一部分：几何边际与优化基础

### 1.1 超平面与函数间隔

考虑一个二分类问题，训练集 $S = \{(\mathbf{x}_i, y_i)\}_{i=1}^n$，其中 $\mathbf{x}_i \in \mathbb{R}^d$ 是特征向量，$y_i \in \{-1, +1\}$ 是类别标签。SVM的目标是在 $\mathbb{R}^d$ 空间中找到一个超平面 $\mathbf{w}^T\mathbf{x} + b = 0$，使得所有正类样本位于超平面的一侧，所有负类样本位于另一侧。

![image](/blog/assets/image-20260227100214-qyhvgzf.png)

**图1**：硬间隔SVM的几何解释。最优超平面（黑色实线）最大化到两类支持向量（虚线圈出）的距离。红色箭头表示权重向量 $\mathbf{w}$ 的方向，其与决策边界正交。间隔宽度为 $2/\|\mathbf{w}\|$。

对于给定的超平面参数 $(\mathbf{w}, b)$，样本点 $\mathbf{x}_i$ 到超平面的**函数间隔**（functional margin）定义为：

$$
\hat{\gamma}_i = y_i(\mathbf{w}^T\mathbf{x}_i + b)
$$

函数间隔的符号指示分类是否正确：当 $y_i$ 与 $\mathbf{w}^T\mathbf{x}_i + b$ 同号时，样本被正确分类。函数间隔的绝对值大小反映了置信度——离超平面越远，分类置信度越高。

然而，函数间隔存在一个尺度问题：如果我们将 $\mathbf{w}$ 和 $b$ 同时乘以常数 $k$，函数间隔也会缩放 $k$ 倍，但超平面的几何位置并未改变。为了消除这种歧义，我们引入**几何间隔**（geometric margin）：

$$
\gamma_i = \frac{y_i(\mathbf{w}^T\mathbf{x}_i + b)}{\|\mathbf{w}\|}
$$

几何间隔表示样本点到超平面的欧氏距离。推导如下：设 $\mathbf{x}_0$ 是超平面上距离 $\mathbf{x}_i$ 最近的点，则 $\mathbf{x}_i - \mathbf{x}_0$ 与 $\mathbf{w}$ 平行，可表示为 $\mathbf{x}_i - \mathbf{x}_0 = \lambda \mathbf{w}$。由于 $\mathbf{x}_0$ 在超平面上，满足 $\mathbf{w}^T\mathbf{x}_0 + b = 0$，因此：

$$
\mathbf{w}^T\mathbf{x}_i + b = \mathbf{w}^T(\mathbf{x}_0 + \lambda\mathbf{w}) + b = \lambda\|\mathbf{w}\|^2
$$

于是 $\lambda = (\mathbf{w}^T\mathbf{x}_i + b)/\|\mathbf{w}\|^2$。样本点到超平面的距离为 $\|\mathbf{x}_i - \mathbf{x}_0\| = |\lambda|\|\mathbf{w}\| = |\mathbf{w}^T\mathbf{x}_i + b|/\|\mathbf{w}\|$。结合类别标签 $y_i$，即得到几何间隔的表达式。

### 1.2 最大间隔原则

SVM的基本假设是：**几何间隔越大，模型的泛化能力越强**。这一假设有坚实的理论基础——统计学习理论中的结构风险最小化（SRM）原则表明，分类器的泛化误差与间隔大小密切相关。

基于此，我们希望找到使最小几何间隔最大化的超平面：

$$
\max_{\mathbf{w}, b} \min_{i=1,\ldots,n} \gamma_i = \max_{\mathbf{w}, b} \min_{i=1,\ldots,n} \frac{y_i(\mathbf{w}^T\mathbf{x}_i + b)}{\|\mathbf{w}\|}
$$

这个优化问题可以重写为：

$$
\max_{\mathbf{w}, b} \frac{\hat{\gamma}}{\|\mathbf{w}\|} \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq \hat{\gamma}, \quad \forall i
$$

其中 $\hat{\gamma} = \min_i \hat{\gamma}_i$ 是函数间隔的最小值。如前所述，函数间隔具有尺度不变性，我们可以通过固定 $\hat{\gamma} = 1$ 来消除尺度歧义。这等价于要求所有样本的函数间隔至少为1，且存在某些样本（支持向量）的函数间隔恰好等于1。

于是优化问题转化为：

$$
\max_{\mathbf{w}, b} \frac{1}{\|\mathbf{w}\|} \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1, \quad \forall i
$$

最大化 $1/\|\mathbf{w}\|$ 等价于最小化 $\|\mathbf{w}\|^2/2$（平方运算便于求导，常数因子不影响最优解）。因此，我们得到**硬间隔SVM**（Hard-Margin SVM）的原始优化问题：

$$
\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2 \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1, \quad i = 1,\ldots,n \tag{1}
$$

这是一个凸二次规划（Convex Quadratic Programming, QP）问题：目标函数是严格凸的二次函数，约束条件是一组线性不等式。凸性保证了任何局部最优解都是全局最优解，这是SVM相对于神经网络等模型的理论优势。

## 第二部分：从原始问题到对偶问题

### 2.1 拉格朗日对偶性

直接求解问题(1)在理论上是可行的，但引入对偶问题（dual problem）有几个显著优势：一是可以将问题转化为只涉及内积的形式，为核方法奠定基础；二是对偶问题通常更容易求解，特别是在高维特征空间中；三是对偶解提供了支持向量的明确识别方式。

我们使用拉格朗日乘子法来处理不等式约束。问题(1)的拉格朗日函数为：

$$
\mathcal{L}(\mathbf{w}, b, \boldsymbol{\alpha}) = \frac{1}{2}\|\mathbf{w}\|^2 - \sum_{i=1}^n \alpha_i [y_i(\mathbf{w}^T\mathbf{x}_i + b) - 1] \tag{2}
$$

其中 $\alpha_i \geq 0$ 是拉格朗日乘子。根据拉格朗日对偶性，原始问题等价于：

$$
\min_{\mathbf{w}, b} \max_{\alpha_i \geq 0} \mathcal{L}(\mathbf{w}, b, \boldsymbol{\alpha})
$$

其对偶问题为交换极值顺序：

$$
\max_{\alpha_i \geq 0} \min_{\mathbf{w}, b} \mathcal{L}(\mathbf{w}, b, \boldsymbol{\alpha})
$$

为了求解内层最小化，我们对 $\mathbf{w}$ 和 $b$ 求偏导并令其为零：

$$
\frac{\partial \mathcal{L}}{\partial \mathbf{w}} = \mathbf{w} - \sum_{i=1}^n \alpha_i y_i \mathbf{x}_i = 0 \quad \Rightarrow \quad \mathbf{w} = \sum_{i=1}^n \alpha_i y_i \mathbf{x}_i \tag{3}
$$

$$
\frac{\partial \mathcal{L}}{\partial b} = -\sum_{i=1}^n \alpha_i y_i = 0 \quad \Rightarrow \quad \sum_{i=1}^n \alpha_i y_i = 0 \tag{4}
$$

这两个条件具有深刻的物理意义：最优权重向量 $\mathbf{w}$ 是训练样本的线性组合，只有当 $\alpha_i > 0$ 时，对应的样本 $\mathbf{x}_i$ 才对 $\mathbf{w}$ 有贡献。这些 $\alpha_i > 0$ 的样本正是位于间隔边界上的**支持向量**（support vectors）。

将(3)和(4)代回拉格朗日函数(2)，经过代数运算：

$$
\begin{aligned}
\mathcal{L} &= \frac{1}{2}\|\mathbf{w}\|^2 - \sum_{i=1}^n \alpha_i y_i \mathbf{w}^T\mathbf{x}_i - b\sum_{i=1}^n \alpha_i y_i + \sum_{i=1}^n \alpha_i \\
&= \frac{1}{2}\sum_{i=1}^n\sum_{j=1}^n \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j - \sum_{i=1}^n\sum_{j=1}^n \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j + \sum_{i=1}^n \alpha_i \\
&= \sum_{i=1}^n \alpha_i - \frac{1}{2}\sum_{i=1}^n\sum_{j=1}^n \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j
\end{aligned}
$$

于是得到**对偶优化问题**：

$$
\begin{aligned}
\max_{\boldsymbol{\alpha}} \quad & W(\boldsymbol{\alpha}) = \sum_{i=1}^n \alpha_i - \frac{1}{2}\sum_{i=1}^n\sum_{j=1}^n \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j \\
\text{s.t.} \quad & 0 \leq \alpha_i, \quad i = 1,\ldots,n \\
& \sum_{i=1}^n \alpha_i y_i = 0
\end{aligned} \tag{5}
$$

这是一个二次规划问题，其矩阵形式为：

$$
\min_{\boldsymbol{\alpha}} \frac{1}{2}\boldsymbol{\alpha}^T \mathbf{Q} \boldsymbol{\alpha} - \mathbf{1}^T\boldsymbol{\alpha} \quad \text{s.t.} \quad \mathbf{y}^T\boldsymbol{\alpha} = 0, \quad \boldsymbol{\alpha} \geq \mathbf{0}
$$

其中 $Q_{ij} = y_i y_j \mathbf{x}_i^T\mathbf{x}_j$ 是半正定的，保证问题的凸性。

### 2.2 KKT条件与互补松弛

根据凸优化理论，对于问题(1)和其对偶问题(5)，强对偶性成立（Slater条件满足，因为存在严格可行解）。因此，原始问题和对偶问题的最优值相等，且满足**Karush-Kuhn-Tucker (KKT)条件**：

1. **平稳性（Stationarity）** ：由(3)和(4)给出
2. **原始可行性（Primal Feasibility）** ：$y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1$
3. **对偶可行性（Dual Feasibility）** ：$\alpha_i \geq 0$
4. **互补松弛性（Complementary Slackness）** ：$\alpha_i [y_i(\mathbf{w}^T\mathbf{x}_i + b) - 1] = 0$

互补松弛条件是关键：对于每个样本 $i$，要么 $\alpha_i = 0$（该样本不是支持向量），要么 $y_i(\mathbf{w}^T\mathbf{x}_i + b) = 1$（该样本恰好位于间隔边界上）。这意味着**只有支持向量决定了最终的分类超平面**，其他样本可以被移除而不影响模型。这种稀疏性（sparsity）是SVM的重要特性。

一旦求解得到最优的 $\boldsymbol{\alpha}^*$，我们可以通过(3)恢复 $\mathbf{w}^*$：

$$
\mathbf{w}^* = \sum_{i: \alpha_i^* > 0} \alpha_i^* y_i \mathbf{x}_i
$$

对于偏置 $b^*$，任选一个支持向量 $\mathbf{x}_j$（满足 $0 < \alpha_j^* < C$，在硬间隔情况下即 $\alpha_j^* > 0$），利用 $y_j(\mathbf{w}^{*T}\mathbf{x}_j + b^*) = 1$ 可得：

$$
b^* = y_j - \sum_{i: \alpha_i^* > 0} \alpha_i^* y_i \mathbf{x}_i^T\mathbf{x}_j
$$

为了提高数值稳定性，通常对所有支持向量计算后取平均。

## 第三部分：软间隔与正则化理论

### 3.1 处理线性不可分数据

硬间隔SVM要求数据严格线性可分，这在现实应用中很少见。噪声、异常值或本身非线性的决策边界都会导致优化问题(1)无可行解。为此，引入**软间隔**（Soft-Margin）SVM，允许某些样本违反间隔约束，但会对违反程度施加惩罚。

对每个样本引入**松弛变量**（slack variable）$\xi_i \geq 0$，表示第 $i$ 个样本允许偏离间隔边界的程度。约束条件变为：

$$
y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1 - \xi_i
$$

当 $0 < \xi_i < 1$ 时，样本位于间隔内部但仍被正确分类；当 $\xi_i > 1$ 时，样本被错误分类。

![image](/blog/assets/image-20260227100456-xq11xup.png)

**图2**：正则化参数 $C$ 对软间隔SVM的影响。当 $C$ 较小时（左上图），模型允许更多间隔错误以获得更宽的间隔（高偏差，低方差）；当 $C$ 增大时（右下图），模型对分类错误惩罚加重，间隔变窄，支持向量数量减少。数据显示，$C$ 从0.01增加到100时，间隔宽度从3.131降至1.969，支持向量数从122降至73。

优化目标需要在最大化间隔和最小化分类错误之间权衡：

$$
\min_{\mathbf{w}, b, \boldsymbol{\xi}} \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i=1}^n \xi_i \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1 - \xi_i, \quad \xi_i \geq 0 \tag{6}
$$

其中 $C > 0$ 是惩罚参数，控制对误分类的容忍度。$C \to \infty$ 时退化为硬间隔SVM；$C \to 0$ 时模型允许大量错误以换取最大间隔。

### 3.2 合页损失的视角

问题(6)可以等价地表示为无约束优化问题。注意到约束 $y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1 - \xi_i$ 和 $\xi_i \geq 0$ 等价于 $\xi_i \geq \max(0, 1 - y_i(\mathbf{w}^T\mathbf{x}_i + b))$。由于目标函数要最小化 $\xi_i$，在最优解处必然有：

$$
\xi_i^* = \max(0, 1 - y_i(\mathbf{w}^T\mathbf{x}_i + b)) = [1 - y_i(\mathbf{w}^T\mathbf{x}_i + b)]_+
$$

这正是**合页损失函数**（Hinge Loss）。因此，软间隔SVM等价于以下正则化经验风险最小化问题：

$$
\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i=1}^n [1 - y_i(\mathbf{w}^T\mathbf{x}_i + b)]_+
$$

或者令 $\lambda = 1/(2C)$：

$$
\min_{\mathbf{w}, b} \sum_{i=1}^n [1 - y_i(\mathbf{w}^T\mathbf{x}_i + b)]_+ + \frac{\lambda}{2}\|\mathbf{w}\|^2
$$

这揭示了SVM的本质：**合页损失函数加上L2正则化**。这与逻辑回归（对数损失+L2）或岭回归（平方损失+L2）属于同一框架，只是损失函数不同。

![image](assets/image-20260227105148-5h5z56o.png)

**图3**：左图展示了不同分类损失函数的对比。合页损失（蓝色）在 $z \geq 1$ 时为零，对远离边界的正确分类样本不敏感；在 $z < 1$ 时呈线性增长，对错误分类施加线性惩罚。与逻辑损失（绿色）和指数损失（紫色）相比，合页损失对异常值更鲁棒。右图展示了合页损失的几何解释：位于间隔正确一侧的样本（蓝色区域）损失为零；位于间隔内部（黄色区域）或错误一侧（红色区域）的样本承受正损失。

### 3.3 软间隔的对偶问题

类似于硬间隔情况，我们可以推导软间隔SVM的对偶问题。拉格朗日函数现在包含两组乘子：

$$
\mathcal{L} = \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i=1}^n\xi_i - \sum_{i=1}^n\alpha_i[y_i(\mathbf{w}^T\mathbf{x}_i+b)-1+\xi_i] - \sum_{i=1}^n\mu_i\xi_i
$$

对 $\mathbf{w}$ 和 $b$ 求导得到与(3)(4)相同的条件。对 $\xi_i$ 求导得到：

$$
\frac{\partial \mathcal{L}}{\partial \xi_i} = C - \alpha_i - \mu_i = 0 \quad \Rightarrow \quad 0 \leq \alpha_i \leq C
$$

其中利用了 $\mu_i \geq 0$。这个上界约束 $\alpha_i \leq C$ 是软间隔SVM的关键区别。

最终的对偶问题为：

$$
\begin{aligned}
\max_{\boldsymbol{\alpha}} \quad & \sum_{i=1}^n \alpha_i - \frac{1}{2}\sum_{i,j=1}^n \alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j \\
\text{s.t.} \quad & 0 \leq \alpha_i \leq C, \quad i = 1,\ldots,n \\
& \sum_{i=1}^n \alpha_i y_i = 0
\end{aligned} \tag{7}
$$

KKT条件相应扩展为：

- 若 $\alpha_i = 0$，则 $y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1$（样本在间隔外，分类正确）
- 若 $0 < \alpha_i < C$，则 $y_i(\mathbf{w}^T\mathbf{x}_i + b) = 1$（样本在间隔边界上，支持向量）
- 若 $\alpha_i = C$，则 $y_i(\mathbf{w}^T\mathbf{x}_i + b) \leq 1$（样本在间隔内或被错分）

这三类样本的划分为SMO算法中的工作集选择提供了依据。

## 第四部分：核方法与非线性扩展

### 4.1 特征映射与核技巧

当数据线性不可分时，直接的解决方案是将特征映射到更高维的空间，期望在新空间中线性可分。设映射函数为 $\phi: \mathcal{X} \to \mathcal{H}$，其中 $\mathcal{H}$ 是希尔伯特空间（通常是高维或无限维）。

在高维空间中的SVM优化问题涉及内积 $\langle \phi(\mathbf{x}_i), \phi(\mathbf{x}_j) \rangle$。显式计算 $\phi(\mathbf{x})$ 可能计算代价极高（例如多项式特征或无限维映射）。**核技巧**（Kernel Trick）的关键观察是：在许多情况下，内积 $\langle \phi(\mathbf{x}), \phi(\mathbf{x}') \rangle$ 可以表示为原始空间中的函数 $K(\mathbf{x}, \mathbf{x}')$，而无需显式计算 $\phi$。

**Mercer定理**提供了核函数的有效判据：函数 $K: \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ 是有效的核函数（即存在某个 $\phi$ 使得 $K(\mathbf{x}, \mathbf{x}') = \langle \phi(\mathbf{x}), \phi(\mathbf{x}') \rangle$），当且仅当对于任意有限样本集，核矩阵 $\mathbf{K}$（其中 $K_{ij} = K(\mathbf{x}_i, \mathbf{x}_j)$）是半正定的。

![image](/blog/assets/image-20260227100911-huxg5uz.png)

**图4**：核方法的几何解释。左图：原始输入空间中的同心圆数据是线性不可分的。中图：通过RBF核隐式映射到高维特征空间后，数据变得线性可分，可以用超平面（灰色平面）完美分隔。右图：映射回输入空间，决策边界呈现非线性（黑色曲线），支持向量（绿色虚线圈）位于间隔边界（虚线）上。

### 4.2 常用核函数

**多项式核**（Polynomial Kernel）：

$$
K(\mathbf{x}, \mathbf{x}') = (\gamma \mathbf{x}^T\mathbf{x}' + r)^d
$$

对应于特征空间中的所有 $d$ 阶多项式组合。当 $d=1$ 时退化为线性核。

**径向基函数核/RBF核**（Gaussian Kernel）：

$$
K(\mathbf{x}, \mathbf{x}') = \exp\left(-\gamma\|\mathbf{x} - \mathbf{x}'\|^2\right)
$$

这是最常用的核函数，对应于无限维的特征映射。其非线性能力来源于局部性：相距较远的样本点内积趋近于0，决策边界由局部邻域内的支持向量决定。

**Sigmoid核**：

$$
K(\mathbf{x}, \mathbf{x}') = \tanh(\gamma \mathbf{x}^T\mathbf{x}' + r)
$$

与神经网络中的激活函数类似，但不一定满足Mercer条件（仅对某些参数值有效）。

在实际应用中，RBF核通常是首选，特别是在缺乏领域知识的情况下。多项式核在图像处理等特定领域有时表现更好，但计算成本通常更高。

![image](/blog/assets/image-20260227104646-zgylk7q.png)

**图5**：不同核函数在非线性数据集（moons）上的表现。线性核（左上）由于模型限制，准确率仅82.5%；多项式核（右上）能够捕捉曲线关系，准确率达到87.5%；RBF核（左下，$\gamma=0.7$）展现出最强的非线性拟合能力（88.5%），但也面临过拟合风险；而较小的$\gamma$值（右下，$\gamma=0.2$）产生更平滑的决策边界（86.5%）。实验数据显示支持向量数量从线性核的78个增加到多项式核的87个，反映了模型复杂度的提升。

### 4.3 核矩阵与计算复杂度

使用核函数后，对偶问题(7)中的 $\mathbf{x}_i^T\mathbf{x}_j$ 被替换为 $K(\mathbf{x}_i, \mathbf{x}_j)$。我们需要计算并存储 $n \times n$ 的核矩阵 $\mathbf{K}$，这在 $n$ 很大时（例如 $n > 10^4$）会面临内存瓶颈（需要 $O(n^2)$ 存储空间）。

此外，每次迭代计算决策函数 $f(\mathbf{x}) = \sum_{i=1}^n \alpha_i y_i K(\mathbf{x}_i, \mathbf{x}) + b$ 需要 $O(n)$ 时间。预测阶段同样需要 $O(n_{sv})$ 时间，其中 $n_{sv}$ 是支持向量的数量。这解释了为什么SVM在大规模数据集上训练缓慢，以及为什么模型稀疏性（支持向量比例小）至关重要。

近期的研究通过SGD-based SVMs、GPU加速和并行化等技术来缓解这些计算瓶颈。例如，采用增量优化策略，每次只使用小批量数据更新模型，虽然会引入噪声，但显著提升了可扩展性。

## 第五部分：序列最小优化（SMO）算法

### 5.1 坐标下降与工作集选择

对偶问题(7)是一个带约束的二次规划问题。通用的QP求解器（如内点法）的时间复杂度为 $O(n^3)$，在大规模数据集上不可行。Platt于1998年提出的**序列最小优化**（Sequential Minimal Optimization, SMO）算法通过利用SVM问题的特殊结构，将大规模QP问题分解为一系列最小的子问题，从而实现高效求解。

SMO属于坐标下降（Coordinate Descent）方法。由于等式约束 $\sum \alpha_i y_i = 0$ 的存在，单独更新一个 $\alpha_i$ 会破坏约束。因此，SMO每次选择**两个**拉格朗日乘子 $(\alpha_i, \alpha_j)$ 进行优化，同时保持其他变量固定。这保证了 $\alpha_i^{new} y_i + \alpha_j^{new} y_j = \alpha_i^{old} y_i + \alpha_j^{old} y_j$，满足线性等式约束。

![image](/blog/assets/image-20260227100933-o7hhouz.png)

**图6**：SMO算法的核心组件。左图：对偶问题的可行域是一个盒子 $[0,C] \times [0,C]$，等式约束定义了斜率为 $\pm 1$ 的直线。优化路径（红点）在可行域内移动至最优解（绿星）。中图：KKT条件将样本分为三类，违反这些条件的样本对构成工作集选择的候选。右图：SMO的迭代流程——选择违反KKT条件的样本对，解析求解二维子问题，更新阈值和缓存，直至收敛。

### 5.2 解析解子问题

假设我们选择 $\alpha_1$ 和 $\alpha_2$ 进行优化，记 $s = y_1 y_2$。约束条件为：

$$
\alpha_1 + s\alpha_2 = \alpha_1^{old} + s\alpha_2^{old} = \gamma
$$

以及 $0 \leq \alpha_1, \alpha_2 \leq C$。这定义了 $\alpha_2$ 的取值范围 $[L, H]$：

- 若 $y_1 \neq y_2$：$L = \max(0, \alpha_2^{old} - \alpha_1^{old})$，$H = \min(C, C + \alpha_2^{old} - \alpha_1^{old})$
- 若 $y_1 = y_2$：$L = \max(0, \alpha_1^{old} + \alpha_2^{old} - C)$，$H = \min(C, \alpha_1^{old} + \alpha_2^{old})$

目标函数可表示为关于 $\alpha_2$ 的二次函数：

$$
W(\alpha_2) = \frac{1}{2}K_{11}(\gamma - s\alpha_2)^2 + \frac{1}{2}K_{22}\alpha_2^2 + sK_{12}(\gamma - s\alpha_2)\alpha_2 + \ldots
$$

对 $\alpha_2$ 求导并令其为零，得到无约束最优解：

$$
\alpha_2^{new,unc} = \alpha_2^{old} + \frac{y_2(E_1 - E_2)}{\eta}
$$

其中 $E_i = f(\mathbf{x}_i) - y_i$ 是预测误差，$\eta = K_{11} + K_{22} - 2K_{12}$ 是二阶导数（通常为正值，保证凸性）。

将无约束解裁剪到边界 $[L, H]$ 内：

$$
\alpha_2^{new} = \begin{cases} 
H & \text{if } \alpha_2^{new,unc} > H \\
\alpha_2^{new,unc} & \text{if } L \leq \alpha_2^{new,unc} \leq H \\
L & \text{if } \alpha_2^{new,unc} < L 
\end{cases}
$$

然后根据 $\alpha_1 + s\alpha_2 = \gamma$ 更新 $\alpha_1$。

### 5.3 启发式工作集选择

SMO的效率很大程度上取决于如何选择 $(i, j)$ 对。Platt的原始实现采用两级启发式策略：

**第一层启发式**：遍历整个数据集寻找违反KKT条件的样本。如果找到，选择第二个变量使 $|E_i - E_j|$ 最大化（期望大步长更新）。

**第二层启发式**：如果第一层遍历没有找到合适的变量，则遍历非边界样本（$0 < \alpha_i < C$），这些通常是支持向量。

**第三层启发式**：如果仍无进展，重新遍历整个数据集。

Keerthi等人（2001）提出了改进策略，使用两个阈值参数代替单一阈值，更精确地检测KKT违反情况，显著加速了收敛。现代实现（如LIBSVM）进一步采用了基于梯度信息的二阶工作集选择，通过最大化目标函数增益来选择最优的变量对。

### 5.4 阈值更新与缓存机制

每次更新 $(\alpha_1, \alpha_2)$ 后，需要重新计算偏置 $b$ 和误差缓存 $E_i$。如果新的 $\alpha_1$ 或 $\alpha_2$ 处于边界内（$0 < \alpha_i < C$），可以直接用KKT条件计算 $b$。否则，取两个新值的平均值。

**误差缓存**是SMO的关键优化。$E_i$ 表示样本 $i$ 的当前预测误差。由于大部分 $\alpha_i = 0$，计算 $f(\mathbf{x}_i)$ 只需遍历支持向量。缓存 $E_i$ 避免了重复计算，使每次迭代从 $O(n)$ 降低到 $O(1)$（在支持向量数量固定的情况下）。

对于超大规模数据集（$n > 10^5$），SMO仍可能过慢。此时可采用分块（Chunking）或分解（Decomposition）方法，每次只加载一部分数据到内存；或者使用近似算法，如CVM（Core Vector Machine）或LASVM（增量式SVM）。

## 第六部分：工程实践与调参指南

### 6.1 数据预处理

SVM对特征的尺度非常敏感。如果某个特征的取值范围远大于其他特征，它在核函数计算（特别是RBF核）中会主导距离度量。因此，**标准化（Standardization）或归一化（Normalization）是必需的**：

$$
x' = \frac{x - \mu}{\sigma} \quad \text{或} \quad x' = \frac{x - x_{min}}{x_{max} - x_{min}}
$$

对于稀疏数据（如文本分类中的TF-IDF向量），通常采用线性核并保留稀疏格式，避免 dense 转换带来的内存爆炸。

### 6.2 核函数与超参数选择

**核函数选择**：

- **线性核**：当特征维度 $d$ 很大（$d \gg n$）或数据线性可分时使用。优点：无需调参，可解释性强，支持大规模数据（使用LIBLINEAR等专用库）。
- **RBF核**：默认选择，适用于大多数非线性情况。需要调参 $\gamma$ 和 $C$。
- **多项式核**：适用于图像等具有空间结构的数据，但调参更复杂（涉及 degree、$\gamma$、$r$ 三个参数）。

**参数** **$C$** **的调优**：  
$C$ 控制模型复杂度与训练误差之间的权衡。较小的 $C$ 允许更多间隔错误，产生更宽的间隔（高偏差，低方差）；较大的 $C$ 惩罚错误更严厉，可能导致过拟合。

![image](assets/image-20260227105407-zp78iwd.png)

**图7**：SVM在不同配置下的性能分析。左上：在数字识别数据集上，$C$ 值在 $10^{-2}$ 到 $10^3$ 范围内变化时，训练准确率（蓝色）和验证准确率（红色）的变化。当 $C$ 过小（$< 10^{-2}$）时，模型欠拟合；当 $C$ 足够大（$> 10^{-1}$）时，性能趋于稳定，表明数据近似线性可分。右上：不同核函数的性能对比，RBF和多项式核在简单二分类任务上均达到完美准确率（1.000），但支持向量数量不同（RBF: 24, Poly: 26, Linear: 24, Sigmoid: 20），反映了模型复杂度的差异。

**参数** **$\gamma$** **的调优（RBF核）** ：  
$\gamma$ 定义了单个训练样本的影响范围。大 $\gamma$ 值产生窄的钟形曲线，每个支持向量的影响局部化，可能导致过拟合；小 $\gamma$ 值产生宽的平滑曲线，模型更简单，但可能欠拟合。

**调参策略**：  
通常使用**网格搜索**（Grid Search）或**随机搜索**（Random Search）在验证集上进行交叉验证。搜索范围通常是对数尺度，例如 $C \in \{2^{-5}, 2^{-3}, \ldots, 2^{15}\}$，$\gamma \in \{2^{-15}, 2^{-13}, \ldots, 2^{3}\}$。近年来的研究表明，贝叶斯优化（Bayesian Optimization）和化学反应优化（CRO）等智能算法可以更高效地探索超参数空间，在某些数据集上比网格搜索减少50%的计算时间，同时提升准确率。

### 6.3 类别不平衡问题

当正负样本比例严重失衡（如欺诈检测、疾病诊断）时，标准SVM会偏向多数类。解决方案包括：

1. **类别权重**：为不同类别设置不同的惩罚参数 $C_+$ 和 $C_-$，使得 $C_+ \cdot n_+ \approx C_- \cdot n_-$，其中 $n_+, n_-$ 是样本数量。
2. **重采样**：对少数类进行过采样（SMOTE）或对多数类进行欠采样。
3. **调整决策阈值**：不再使用 $f(\mathbf{x}) = 0$ 作为决策边界，而是根据类别先验概率调整阈值。

在信用卡欺诈检测等高不平衡数据集（欺诈交易<1%）上，使用类别权重调整的SVM配合CRO优化，相比标准网格搜索可以提升10%的F1分数。

### 6.4 计算复杂度与近似方法

SVM的训练复杂度介于 $O(n^2)$ 和 $O(n^3)$ 之间，预测复杂度为 $O(n_{sv} \cdot d)$。当数据集规模超过 $10^5$ 样本时，标准SVM可能变得不切实际。此时可考虑：

- **基于SGD的SVM**：使用随机梯度下降近似求解原始问题，复杂度为 $O(n)$，适合大规模线性SVM。
- **Nyström方法**：通过采样近似核矩阵，将核SVM的复杂度从 $O(n^2)$ 降至 $O(m^2)$，其中 $m \ll n$ 是采样点数。
- **随机傅里叶特征（RFF）** ：通过随机映射近似RBF核，将问题转化为线性SVM求解。

## 第七部分：现代视角与理论局限

### 7.1 SVM与深度学习的关系

在深度学习时代，SVM的角色发生了转变。对于图像分类、语音识别等原始特征高度非结构化的问题，深度神经网络（CNN、Transformer）通过自动学习层级特征表示，已经显著超越了手工设计核函数的SVM。

然而，在以下场景，SVM仍具竞争力：

- **特征工程后的表格数据**：当特征已经过领域专家精心设计（如金融风险指标、医疗化验指标），SVM通常能匹配或超越简单神经网络。
- **小样本学习**：当训练样本极少（$n < 1000$）而特征维度较高时，SVM的正则化机制比深度网络更有效。
- **可解释性要求高的场景**：支持向量和决策边界提供了清晰的分类依据，而深度网络仍是黑盒。

**混合架构**也显示出潜力：使用深度网络（如ResNet、BERT）提取特征，然后在这些高层特征上训练线性SVM，这种"深度学习+浅层分类器"的策略在许多任务上取得了与端到端微调相当的效果，同时训练更稳定。

### 7.2 理论局限与扩展

**多分类扩展**：原始SVM是二分类器。扩展到 $K$ 类通常采用：

- **One-vs-One**：训练 $K(K-1)/2$ 个二分类器，每个区分一对类别，投票决定最终类别。
- **One-vs-Rest**：训练 $K$ 个二分类器，每个区分一类与所有其他类。

**结构化输出SVM**（Structured Output SVM）将SVM框架扩展到输出为结构化对象（如序列、树、图）的场景，在语音识别和自然语言处理中有重要应用。

**概率输出**：标准SVM输出的是硬分类或距离值，而非概率。Platt缩放（Platt Scaling）通过拟合逻辑函数将SVM输出转换为概率估计：

$$
P(y=1|\mathbf{x}) = \frac{1}{1 + \exp(Af(\mathbf{x}) + B)}
$$

其中 $A$ 和 $B$ 通过验证集上的极大似然估计得到。

### 7.3 鲁棒性与对抗样本

近期研究表明，SVM对于对抗样本（adversarial examples）具有一定的鲁棒性，特别是当间隔较大时。然而，在存在数据扰动的情况下，标准SVM可能表现脆弱。为此，研究者提出了**鲁棒SVM**（Robust SVM），通过在训练时考虑输入数据的不确定性集合（uncertainty sets），构建对数据扰动具有抵抗力的优化模型。这类模型通常涉及min-max优化或鲁棒优化技术，计算复杂度更高，但在噪声环境下表现更稳定。

## 结语

支持向量机代表了机器学习史上一个简洁而强大的思想高峰：通过几何直观（最大间隔）和凸优化理论（对偶问题与核方法），构建出既具有坚实数学基础又能在实践中有效工作的算法。从1992年Boser、Guyon和Vapnik提出核技巧，到1998年Platt的SMO算法解决了训练效率瓶颈，再到21世纪各种扩展（如结构化SVM、最小二乘SVM、孪生SVM等），SVM的理论体系已经相当成熟。

在实际项目中选择SVM时，应当理解其背后的权衡：线性与非线性的选择、正则化强度的设定、核参数的调整，都直接影响模型的偏差-方差特性。虽然深度学习在许多领域占据主导，但SVM在处理结构化特征、小样本、高维数据时仍然是一个强有力的基线工具。更重要的是，SVM所体现的最大间隔原则、核方法、对偶表示等概念，已经深深融入机器学习的整体框架，理解SVM就是理解统计学习理论的核心。
