/**
 * 桶排序算法 (Bucket Sort)
 * 时间复杂度: 平均 O(n + k)，最坏 O(n²)
 * 空间复杂度: O(n + k)
 * 
 * 特点：
 * - 将数据分到多个桶中
 * - 每个桶内使用其他排序算法（通常是插入排序）
 * - 适用于数据分布均匀的情况
 * - 稳定排序（取决于桶内排序算法）
 */

import type { AlgorithmDefinition } from '../../types';

export const bucketSortDefinition: AlgorithmDefinition = {
  id: 'bucket',
  name: '桶排序',
  category: 'sorting',
  timeComplexity: 'O(n + k) ~ O(n²)',
  spaceComplexity: 'O(n + k)',
  description: '将数据分到多个桶中，每个桶内使用插入排序。适用于数据分布均匀的情况，是稳定排序。',
  code: `function bucketSort(arr) {
  if (arr.length === 0) return arr;
  
  // 找出最大值和最小值
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  
  // 桶的数量
  const bucketCount = Math.floor(Math.sqrt(arr.length)) + 1;
  const bucketSize = Math.ceil((max - min + 1) / bucketCount);
  
  // 创建空桶
  const buckets = Array.from({ length: bucketCount }, () => []);
  
  // 将元素放入桶中
  for (let i = 0; i < arr.length; i++) {
    const bucketIndex = Math.floor((arr[i] - min) / bucketSize);
    buckets[bucketIndex].push(arr[i]);
  }
  
  // 对每个桶进行插入排序
  for (let i = 0; i < buckets.length; i++) {
    insertionSort(buckets[i]);
  }
  
  // 合并所有桶
  let index = 0;
  for (let i = 0; i < buckets.length; i++) {
    for (let j = 0; j < buckets[i].length; j++) {
      arr[index++] = buckets[i][j];
    }
  }
  
  return arr;
}

// 桶内使用的插入排序
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 20, min: 5, max: 50 }
  ]
};

export const bucketSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void bucketSort(int arr[], int n) {
    int max = arr[0], min = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) max = arr[i];
        if (arr[i] < min) min = arr[i];
    }
    
    int bucketCount = (int)sqrt(n) + 1;
    int bucketSize = (max - min) / bucketCount + 1;
    
    // 简化的桶排序实现
    int** buckets = malloc(bucketCount * sizeof(int*));
    int* bucketSizes = calloc(bucketCount, sizeof(int));
    
    // 分配元素到桶
    for (int i = 0; i < n; i++) {
        int idx = (arr[i] - min) / bucketSize;
        // 简化的插入逻辑
    }
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def bucket_sort(arr):
    if not arr:
        return arr
    
    max_val, min_val = max(arr), min(arr)
    bucket_count = int(len(arr) ** 0.5) + 1
    bucket_size = (max_val - min_val) / bucket_count + 1
    
    buckets = [[] for _ in range(bucket_count)]
    
    for num in arr:
        idx = int((num - min_val) / bucket_size)
        buckets[idx].append(num)
    
    for bucket in buckets:
        bucket.sort()
    
    index = 0
    for bucket in buckets:
        for num in bucket:
            arr[index] = num
            index += 1
    return arr`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function bucketSort(arr) {
    if (arr.length === 0) return arr;
    
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const bucketCount = Math.floor(Math.sqrt(arr.length)) + 1;
    const bucketSize = Math.ceil((max - min + 1) / bucketCount);
    
    const buckets = Array.from({ length: bucketCount }, () => []);
    
    for (let num of arr) {
        const idx = Math.floor((num - min) / bucketSize);
        buckets[idx].push(num);
    }
    
    for (let bucket of buckets) {
        bucket.sort((a, b) => a - b);
    }
    
    let index = 0;
    for (let bucket of buckets) {
        for (let num of bucket) {
            arr[index++] = num;
        }
    }
    return arr;
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void bucketSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    int min = Arrays.stream(arr).min().getAsInt();
    int bucketCount = (int) Math.sqrt(arr.length) + 1;
    
    List<List<Integer>> buckets = new ArrayList<>();
    for (int i = 0; i < bucketCount; i++) {
        buckets.add(new ArrayList<>());
    }
    
    for (int num : arr) {
        int idx = (num - min) * (bucketCount - 1) / (max - min);
        buckets.get(idx).add(num);
    }
    
    int index = 0;
    for (List<Integer> bucket : buckets) {
        Collections.sort(bucket);
        for (int num : bucket) {
            arr[index++] = num;
        }
    }
}`
  }
];
