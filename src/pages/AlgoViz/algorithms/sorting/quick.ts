/**
 * 快速排序算法
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(log n)
 */

import type { AlgorithmDefinition } from '../../types';

export const quickSortDefinition: AlgorithmDefinition = {
  id: 'quick',
  name: '快速排序',
  category: 'sorting',
  timeComplexity: 'O(n log n)',
  spaceComplexity: 'O(log n)',
  description: '选择基准元素，将数组分为小于和大于基准的两部分，递归排序。平均情况下效率最高的比较排序算法。',
  code: `function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    // 获取分区点
    const pivotIndex = partition(arr, left, right);
    
    // 递归排序左半部分
    quickSort(arr, left, pivotIndex - 1);
    
    // 递归排序右半部分
    quickSort(arr, pivotIndex + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  // 选择最右元素作为基准
  const pivot = arr[right];
  let i = left - 1;
  
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  // 将基准放到正确位置
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 20, min: 5, max: 50 }
  ]
};

// 代码模板
export const quickSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void quickSort(int arr[], int left, int right) {
    if (left < right) {
        int pivot = partition(arr, left, right);
        quickSort(arr, left, pivot - 1);
        quickSort(arr, pivot + 1, right);
    }
}

int partition(int arr[], int left, int right) {
    int pivot = arr[right];
    int i = left - 1;
    for (int j = left; j < right; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[right];
    arr[right] = temp;
    return i + 1;
}`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `void quickSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int pivot = partition(arr, left, right);
        quickSort(arr, left, pivot - 1);
        quickSort(arr, pivot + 1, right);
    }
}

int partition(vector<int>& arr, int left, int right) {
    int pivot = arr[right];
    int i = left - 1;
    for (int j = left; j < right; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[right]);
    return i + 1;
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void quickSort(int[] arr, int left, int right) {
    if (left < right) {
        int pivot = partition(arr, left, right);
        quickSort(arr, left, pivot - 1);
        quickSort(arr, pivot + 1, right);
    }
}

public static int partition(int[] arr, int left, int right) {
    int pivot = arr[right];
    int i = left - 1;
    for (int j = left; j < right; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[right];
    arr[right] = temp;
    return i + 1;
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => x < pivot);
    const middle = arr.filter(x => x === pivot);
    const right = arr.filter(x => x > pivot);
    return [...quickSort(left), ...middle, ...quickSort(right)];
}`
  }
];
