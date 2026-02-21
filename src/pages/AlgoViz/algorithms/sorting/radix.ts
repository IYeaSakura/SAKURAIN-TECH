/**
 * 基数排序算法 (Radix Sort)
 * 时间复杂度: O(d × (n + k))，d为最大位数，k为基数(通常为10)
 * 空间复杂度: O(n + k)
 * 
 * 特点：
 * - 非比较排序
 * - 稳定排序
 * - 按照每一位进行排序（从低位到高位）
 * - 适用于非负整数
 */

import type { AlgorithmDefinition } from '../../types';

export const radixSortDefinition: AlgorithmDefinition = {
  id: 'radix',
  name: '基数排序',
  category: 'sorting',
  timeComplexity: 'O(d × (n + k))',
  spaceComplexity: 'O(n + k)',
  description: '非比较排序算法，按照每一位进行排序（从低位到高位）。适用于非负整数，是稳定排序。',
  code: `function radixSort(arr) {
  if (arr.length === 0) return arr;
  
  // 找出最大值，确定最大位数
  const max = Math.max(...arr);
  
  // 对每一位进行计数排序
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    countingSortByDigit(arr, exp);
  }
  
  return arr;
}

// 根据指定位数进行计数排序
function countingSortByDigit(arr, exp) {
  const n = arr.length;
  const output = new Array(n).fill(0);
  const count = new Array(10).fill(0);
  
  // 统计当前位上每个数字出现的次数
  for (let i = 0; i < n; i++) {
    const digit = Math.floor(arr[i] / exp) % 10;
    count[digit]++;
  }
  
  // 计算累积次数
  for (let i = 1; i < 10; i++) {
    count[i] += count[i - 1];
  }
  
  // 构建输出数组（从后向前，保持稳定性）
  for (let i = n - 1; i >= 0; i--) {
    const digit = Math.floor(arr[i] / exp) % 10;
    output[count[digit] - 1] = arr[i];
    count[digit]--;
  }
  
  // 复制回原数组
  for (let i = 0; i < n; i++) {
    arr[i] = output[i];
  }
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 20, min: 5, max: 50 }
  ]
};

export const radixSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void radixSort(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++)
        if (arr[i] > max) max = arr[i];
    
    for (int exp = 1; max / exp > 0; exp *= 10)
        countingSort(arr, n, exp);
}

void countingSort(int arr[], int n, int exp) {
    int output[n];
    int count[10] = {0};
    
    for (int i = 0; i < n; i++)
        count[(arr[i] / exp) % 10]++;
    
    for (int i = 1; i < 10; i++)
        count[i] += count[i - 1];
    
    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }
    
    for (int i = 0; i < n; i++)
        arr[i] = output[i];
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def radix_sort(arr):
    if not arr:
        return arr
    
    max_val = max(arr)
    exp = 1
    while max_val // exp > 0:
        counting_sort_by_digit(arr, exp)
        exp *= 10
    return arr

def counting_sort_by_digit(arr, exp):
    n = len(arr)
    output = [0] * n
    count = [0] * 10
    
    for num in arr:
        digit = (num // exp) % 10
        count[digit] += 1
    
    for i in range(1, 10):
        count[i] += count[i - 1]
    
    for i in range(n - 1, -1, -1):
        digit = (arr[i] // exp) % 10
        output[count[digit] - 1] = arr[i]
        count[digit] -= 1
    
    for i in range(n):
        arr[i] = output[i]`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function radixSort(arr) {
    if (arr.length === 0) return arr;
    
    const max = Math.max(...arr);
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        countingSortByDigit(arr, exp);
    }
    return arr;
}

function countingSortByDigit(arr, exp) {
    const n = arr.length;
    const output = new Array(n).fill(0);
    const count = new Array(10).fill(0);
    
    for (let i = 0; i < n; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        count[digit]++;
    }
    
    for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }
    
    for (let i = n - 1; i >= 0; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }
    
    for (let i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void radixSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countingSort(arr, exp);
    }
}

static void countingSort(int[] arr, int exp) {
    int n = arr.length;
    int[] output = new int[n];
    int[] count = new int[10];
    
    for (int value : arr) {
        count[(value / exp) % 10]++;
    }
    
    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }
    
    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }
    
    System.arraycopy(output, 0, arr, 0, n);
}`
  }
];
