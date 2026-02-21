/**
 * 冒泡排序算法
 * 时间复杂度: O(n²)
 * 空间复杂度: O(1)
 */

import type { AlgorithmDefinition } from '../../types';

export const bubbleSortDefinition: AlgorithmDefinition = {
  id: 'bubble',
  name: '冒泡排序',
  category: 'sorting',
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  description: '通过重复遍历数组，比较相邻元素并交换位置，使较大元素逐渐"冒泡"到数组末尾。简单但效率较低，适合教学演示。',
  code: `function bubbleSort(arr) {
  const n = arr.length;
  
  // 外层循环控制遍历轮数
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    
    // 内层循环进行相邻比较
    for (let j = 0; j < n - i - 1; j++) {
      // 比较相邻元素
      if (arr[j] > arr[j + 1]) {
        // 交换位置
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    
    // 如果本轮没有交换，说明已经有序
    if (!swapped) break;
  }
  
  return arr;
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 15, min: 5, max: 50 },
    { name: 'range', type: 'number', default: 100, min: 10, max: 1000 }
  ]
};

// 代码模板
export const bubbleSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}`
  },
  {
    language: 'go',
    label: 'Go',
    code: `func bubbleSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        for j := 0; j < n-i-1; j++ {
            if arr[j] > arr[j+1] {
                arr[j], arr[j+1] = arr[j+1], arr[j]
            }
        }
    }
}`
  },
  {
    language: 'rust',
    label: 'Rust',
    code: `fn bubble_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n-1 {
        for j in 0..n-i-1 {
            if arr[j] > arr[j+1] {
                arr.swap(j, j+1);
            }
        }
    }
}`
  },
  {
    language: 'csharp',
    label: 'C#',
    code: `public static void BubbleSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
  },
  {
    language: 'matlab',
    label: 'MatLab',
    code: `function arr = bubbleSort(arr)
    n = length(arr);
    for i = 1:n-1
        for j = 1:n-i
            if arr(j) > arr(j+1)
                temp = arr(j);
                arr(j) = arr(j+1);
                arr(j+1) = temp;
            end
        end
    end
end`
  }
];
