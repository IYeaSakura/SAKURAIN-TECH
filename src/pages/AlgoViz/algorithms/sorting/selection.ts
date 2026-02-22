/**
 * 选择排序算法
 * 时间复杂度: O(n²)
 * 空间复杂度: O(1)
 */

import type { AlgorithmDefinition } from '../../types';

export const selectionSortDefinition: AlgorithmDefinition = {
  id: 'selection',
  name: '选择排序',
  category: 'sorting',
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  description: '每次从未排序部分选择最小(或最大)元素，放到已排序部分的末尾。实现简单但效率较低。',
  code: `function selectionSort(arr) {
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    // 在未排序部分找最小值
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }

    // 将最小值交换到已排序部分的末尾
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
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
export const selectionSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            swap(arr[i], arr[minIdx]);
        }
    }
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        }
    }
    return arr;
}`
  },
  {
    language: 'go',
    label: 'Go',
    code: `func selectionSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if arr[j] < arr[minIdx] {
                minIdx = j
            }
        }
        if minIdx != i {
            arr[i], arr[minIdx] = arr[minIdx], arr[i]
        }
    }
}`
  },
  {
    language: 'rust',
    label: 'Rust',
    code: `fn selection_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n-1 {
        let mut min_idx = i;
        for j in i+1..n {
            if arr[j] < arr[min_idx] {
                min_idx = j;
            }
        }
        if min_idx != i {
            arr.swap(i, min_idx);
        }
    }
}`
  },
  {
    language: 'csharp',
    label: 'C#',
    code: `public static void SelectionSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}`
  },
  {
    language: 'matlab',
    label: 'MatLab',
    code: `function arr = selectionSort(arr)
    n = length(arr);
    for i = 1:n-1
        minIdx = i;
        for j = i+1:n
            if arr(j) < arr(minIdx)
                minIdx = j;
            end
        end
        if minIdx ~= i
            temp = arr(i);
            arr(i) = arr(minIdx);
            arr(minIdx) = temp;
        end
    end
end`
  }
];
